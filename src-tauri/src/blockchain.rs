use serde::{Deserialize, Serialize};

const GAP_LIMIT: u32 = 20;

#[derive(Debug, Serialize, Deserialize)]
pub struct AddressStats {
    pub address: String,
    pub balance_sats: u64,
    pub tx_count: u64,
}

pub async fn fetch_address_stats(address: &str) -> Result<AddressStats, String> {
    let url = format!("https://blockstream.info/api/address/{}", address);
    
    let response: serde_json::Value = reqwest::get(&url)
        .await
        .map_err(|e| format!("Request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;
    
    let chain_stats = response.get("chain_stats")
        .ok_or("Missing chain_stats")?;
    
    let funded: u64 = chain_stats.get("funded_txo_sum")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    
    let spent: u64 = chain_stats.get("spent_txo_sum")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    
    let tx_count: u64 = chain_stats.get("tx_count")
        .and_then(|v| v.as_u64())
        .unwrap_or(0);
    
    Ok(AddressStats {
        address: address.to_string(),
        balance_sats: funded.saturating_sub(spent),
        tx_count,
    })
}

pub async fn scan_addresses_with_gap_limit(
    addresses_fn: impl Fn(u32, u32) -> Result<Vec<String>, String>,
    _chain: u32, // 0 = receiving, 1 = change
) -> Result<u64, String> {
    let mut total: u64 = 0;
    let mut consecutive_empty = 0;
    let mut index = 0;
    
    while consecutive_empty < GAP_LIMIT {
        let addresses = addresses_fn(index, 1)?;
        let address = addresses.first().ok_or("No address derived")?;
        
        let stats = fetch_address_stats(address).await?;
        
        if stats.tx_count > 0 {
            total += stats.balance_sats;
            consecutive_empty = 0;
        } else {
            consecutive_empty += 1;
        }
        
        index += 1;
        
        // Safety limit to prevent infinite loops
        if index > 1000 {
            break;
        }
    }
    
    Ok(total)
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Transaction {
    pub txid: String,
    pub amount_sats: i64, // positive = received, negative = sent
    pub fee_sats: u64,
    pub confirmed: bool,
    pub block_height: Option<u64>,
    pub timestamp: Option<u64>,
}

pub async fn fetch_address_transactions(address: &str) -> Result<Vec<Transaction>, String> {
    let url = format!("https://blockstream.info/api/address/{}/txs", address);
    
    let txs: Vec<serde_json::Value> = reqwest::get(&url)
        .await
        .map_err(|e| format!("Request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("JSON parse failed: {}", e))?;
    
    let mut transactions = Vec::new();
    
    for tx in txs {
        let txid = tx.get("txid")
            .and_then(|v| v.as_str())
            .unwrap_or_default()
            .to_string();
        
        let fee_sats = tx.get("fee")
            .and_then(|v| v.as_u64())
            .unwrap_or(0);
        
        let status = tx.get("status").cloned().unwrap_or_default();
        let confirmed = status.get("confirmed")
            .and_then(|v| v.as_bool())
            .unwrap_or(false);
        let block_height = status.get("block_height")
            .and_then(|v| v.as_u64());
        let timestamp = status.get("block_time")
            .and_then(|v| v.as_u64());
        
        // Calculate amount for this address
        let mut received: i64 = 0;
        let mut sent: i64 = 0;
        
        if let Some(vout) = tx.get("vout").and_then(|v| v.as_array()) {
            for output in vout {
                if let Some(scriptpubkey_address) = output.get("scriptpubkey_address").and_then(|v| v.as_str()) {
                    if scriptpubkey_address == address {
                        received += output.get("value").and_then(|v| v.as_i64()).unwrap_or(0);
                    }
                }
            }
        }
        
        if let Some(vin) = tx.get("vin").and_then(|v| v.as_array()) {
            for input in vin {
                if let Some(prevout) = input.get("prevout") {
                    if let Some(scriptpubkey_address) = prevout.get("scriptpubkey_address").and_then(|v| v.as_str()) {
                        if scriptpubkey_address == address {
                            sent += prevout.get("value").and_then(|v| v.as_i64()).unwrap_or(0);
                        }
                    }
                }
            }
        }
        
        let amount_sats = received - sent;
        
        transactions.push(Transaction {
            txid,
            amount_sats,
            fee_sats,
            confirmed,
            block_height,
            timestamp,
        });
    }
    
    Ok(transactions)
}