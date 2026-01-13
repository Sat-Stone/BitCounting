use serde::{Deserialize, Serialize};
use sqlx::SqlitePool;

mod bitcoin_utils;
mod blockchain;
mod db;
mod crypto;
mod encrypted_db;

use crate::crypto::PasswordStrength;

use tauri::Manager;

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct Entity {
    id: i64,
    name: String,
    entity_type: String,
    parent_id: Option<i64>,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct Wallet {
    id: i64,
    name: String,
    xpub: String,
    wallet_type: String,
    entity_id: i64,
}

#[derive(Debug, serde::Serialize)]
struct WalletWithOwner {
    id: i64,
    name: String,
    xpub: String,
    wallet_type: String,
    entity_id: i64,
    owner_name: String,
    owner_type: String,
}

#[derive(Debug, serde::Serialize, serde::Deserialize, sqlx::FromRow)]
struct StoredTransaction {
    id: i64,
    wallet_id: i64,
    txid: String,
    amount_sats: i64,
    fee_sats: i64,
    confirmed: bool,
    block_height: Option<i64>,
    timestamp: Option<i64>,
    category: Option<String>,
    note: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, sqlx::FromRow)]
struct TransactionWithDetails {
    id: i64,
    wallet_id: i64,
    txid: String,
    amount_sats: i64,
    fee_sats: i64,
    fee_fiat: Option<f64>,
    fee_fiat_currency: Option<String>,
    confirmed: bool,
    block_height: Option<i64>,
    timestamp: Option<i64>,
    category: Option<String>,
    note: Option<String>,
    fiat_value: Option<f64>,
    fiat_currency: Option<String>,
    currency: Option<String>,
    wallet_name: String,
    owner_name: String,
}

#[derive(Debug, serde::Serialize, sqlx::FromRow)]
struct Category {
    id: i64,
    name: String,
    is_system: bool,
}

// Entity commands

#[tauri::command]
async fn get_entities(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Entity>, String> {
    let entities = sqlx::query_as::<_, Entity>(
        "SELECT id, name, entity_type, parent_id FROM entities ORDER BY entity_type, name"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(entities)
}

#[tauri::command]
async fn add_family_member(
    pool: tauri::State<'_, SqlitePool>,
    name: String,
) -> Result<Entity, String> {
    let result = sqlx::query(
        "INSERT INTO entities (name, entity_type) VALUES (?, 'family')"
    )
    .bind(&name)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    let id = result.last_insert_rowid();
    
    Ok(Entity {
        id,
        name,
        entity_type: "family".to_string(),
        parent_id: None,
    })
}

#[tauri::command]
async fn add_business(
    pool: tauri::State<'_, SqlitePool>,
    name: String,
    parent_id: Option<i64>,
) -> Result<Entity, String> {
    let result = sqlx::query(
        "INSERT INTO entities (name, entity_type, parent_id) VALUES (?, 'business', ?)"
    )
    .bind(&name)
    .bind(parent_id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    let id = result.last_insert_rowid();
    
    Ok(Entity {
        id,
        name,
        entity_type: "business".to_string(),
        parent_id,
    })
}

#[tauri::command]
async fn delete_entity(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
) -> Result<String, String> {
    if id == 1 {
        return Err("Cannot delete Personal entity".to_string());
    }
    
    sqlx::query("DELETE FROM entities WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Entity deleted".to_string())
}

// Wallet commands

#[tauri::command]
async fn add_wallet(
    pool: tauri::State<'_, SqlitePool>,
    name: String,
    xpub: Option<String>,
    wallet_type: String,
    entity_id: i64,
) -> Result<String, String> {
    // For manual wallets, generate a unique identifier
    let xpub_value = xpub.unwrap_or_else(|| format!("manual-{}", uuid::Uuid::new_v4()));
    
    sqlx::query(
        "INSERT INTO wallets (name, xpub, wallet_type, entity_id) VALUES (?, ?, ?, ?)"
    )
    .bind(&name)
    .bind(&xpub_value)
    .bind(&wallet_type)
    .bind(entity_id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(format!("Wallet '{}' added successfully", name))
}

#[tauri::command]
async fn get_wallets(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<WalletWithOwner>, String> {
    let wallets = sqlx::query_as::<_, Wallet>(
        "SELECT id, name, xpub, wallet_type, entity_id FROM wallets"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    let entities = sqlx::query_as::<_, Entity>(
        "SELECT id, name, entity_type, parent_id FROM entities"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    let wallets_with_owner: Vec<WalletWithOwner> = wallets
        .into_iter()
        .map(|w| {
            let entity = entities.iter().find(|e| e.id == w.entity_id);
            WalletWithOwner {
                id: w.id,
                name: w.name,
                xpub: w.xpub,
                wallet_type: w.wallet_type,
                entity_id: w.entity_id,
                owner_name: entity.map(|e| e.name.clone()).unwrap_or("Unknown".to_string()),
                owner_type: entity.map(|e| e.entity_type.clone()).unwrap_or("unknown".to_string()),
            }
        })
        .collect();
    
    Ok(wallets_with_owner)
}

#[tauri::command]
async fn delete_wallet(pool: tauri::State<'_, SqlitePool>, id: i64) -> Result<String, String> {
    sqlx::query("DELETE FROM wallets WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Wallet deleted".to_string())
}

#[tauri::command]
async fn derive_addresses(xpub: String, start: u32, count: u32) -> Result<Vec<String>, String> {
    bitcoin_utils::derive_addresses(&xpub, start, count)
}

#[tauri::command]
async fn fetch_wallet_balance(xpub: String) -> Result<u64, String> {
    let xpub_clone = xpub.clone();
    let receiving = blockchain::scan_addresses_with_gap_limit(
        |start, count| bitcoin_utils::derive_addresses_for_chain(&xpub_clone, 0, start, count),
        0,
    ).await?;
    
    let change = blockchain::scan_addresses_with_gap_limit(
        |start, count| bitcoin_utils::derive_addresses_for_chain(&xpub, 1, start, count),
        1,
    ).await?;
    
    Ok(receiving + change)
}

#[tauri::command]
async fn fetch_wallet_transactions(xpub: String) -> Result<Vec<blockchain::Transaction>, String> {
    use std::collections::HashMap;
    
    let mut all_txs: HashMap<String, blockchain::Transaction> = HashMap::new();
    
    // Scan receiving addresses (chain 0)
    let mut consecutive_empty = 0;
    let mut index = 0;
    
    while consecutive_empty < 20 && index < 1000 {
        let addresses = bitcoin_utils::derive_addresses_for_chain(&xpub, 0, index, 1)?;
        let address = &addresses[0];
        
        let stats = blockchain::fetch_address_stats(address).await?;
        
        if stats.tx_count > 0 {
            let txs = blockchain::fetch_address_transactions(address).await?;
            for tx in txs {
                all_txs.entry(tx.txid.clone())
                    .and_modify(|existing| existing.amount_sats += tx.amount_sats)
                    .or_insert(tx);
            }
            consecutive_empty = 0;
        } else {
            consecutive_empty += 1;
        }
        index += 1;
    }
    
    // Scan change addresses (chain 1)
    consecutive_empty = 0;
    index = 0;
    
    while consecutive_empty < 20 && index < 1000 {
        let addresses = bitcoin_utils::derive_addresses_for_chain(&xpub, 1, index, 1)?;
        let address = &addresses[0];
        
        let stats = blockchain::fetch_address_stats(address).await?;
        
        if stats.tx_count > 0 {
            let txs = blockchain::fetch_address_transactions(address).await?;
            for tx in txs {
                all_txs.entry(tx.txid.clone())
                    .and_modify(|existing| existing.amount_sats += tx.amount_sats)
                    .or_insert(tx);
            }
            consecutive_empty = 0;
        } else {
            consecutive_empty += 1;
        }
        index += 1;
    }
    
    let mut txs: Vec<_> = all_txs.into_values().collect();
    txs.sort_by(|a, b| b.timestamp.cmp(&a.timestamp));
    
    Ok(txs)
}

#[tauri::command]
async fn save_transactions(
    pool: tauri::State<'_, SqlitePool>,
    wallet_id: i64,
    transactions: Vec<blockchain::Transaction>,
) -> Result<String, String> {
    for tx in transactions {
        sqlx::query(
            r#"
            INSERT INTO transactions (wallet_id, txid, amount_sats, fee_sats, confirmed, block_height, timestamp)
            VALUES (?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(wallet_id, txid) DO UPDATE SET
                amount_sats = excluded.amount_sats,
                fee_sats = excluded.fee_sats,
                confirmed = excluded.confirmed,
                block_height = excluded.block_height,
                timestamp = excluded.timestamp
            "#,
        )
        .bind(wallet_id)
        .bind(&tx.txid)
        .bind(tx.amount_sats)
        .bind(tx.fee_sats as i64)
        .bind(tx.confirmed)
        .bind(tx.block_height.map(|h| h as i64))
        .bind(tx.timestamp.map(|t| t as i64))
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    }
    
    Ok("Transactions saved".to_string())
}

#[tauri::command]
async fn get_cached_transactions(
    pool: tauri::State<'_, SqlitePool>,
    wallet_id: i64,
) -> Result<Vec<StoredTransaction>, String> {
    let txs = sqlx::query_as::<_, StoredTransaction>(
        "SELECT id, wallet_id, txid, amount_sats, fee_sats, confirmed, block_height, timestamp, category, note FROM transactions WHERE wallet_id = ? ORDER BY timestamp DESC"
    )
    .bind(wallet_id)
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(txs)
}

#[tauri::command]
async fn get_all_transactions(
    pool: tauri::State<'_, SqlitePool>,
    entity_id: Option<i64>,
) -> Result<Vec<TransactionWithDetails>, String> {
    let query = match entity_id {
        Some(id) => {
            sqlx::query_as::<_, TransactionWithDetails>(
                r#"
                SELECT t.id, t.wallet_id, t.txid, t.amount_sats, t.fee_sats, 
                       t.fee_fiat, t.fee_fiat_currency,
                       t.confirmed, t.block_height, t.timestamp, 
                       t.category, t.note, t.fiat_value, t.fiat_currency,
                       COALESCE(t.currency, 'BTC') as currency,
                       w.name as wallet_name, e.name as owner_name
                FROM transactions t
                JOIN wallets w ON t.wallet_id = w.id
                JOIN entities e ON w.entity_id = e.id
                WHERE w.entity_id = ?
                ORDER BY t.timestamp DESC
                "#,
            )
            .bind(id)
            .fetch_all(pool.inner())
            .await
        }
        None => {
            sqlx::query_as::<_, TransactionWithDetails>(
                r#"
                SELECT t.id, t.wallet_id, t.txid, t.amount_sats, t.fee_sats,
                       t.fee_fiat, t.fee_fiat_currency,
                       t.confirmed, t.block_height, t.timestamp, 
                       t.category, t.note, t.fiat_value, t.fiat_currency,
                       COALESCE(t.currency, 'BTC') as currency,
                       w.name as wallet_name, e.name as owner_name
                FROM transactions t
                JOIN wallets w ON t.wallet_id = w.id
                JOIN entities e ON w.entity_id = e.id
                ORDER BY t.timestamp DESC
                "#,
            )
            .fetch_all(pool.inner())
            .await
        }
    };

    query.map_err(|e| e.to_string())
}

#[tauri::command]
async fn update_transaction(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    category: Option<String>,
    note: Option<String>,
) -> Result<String, String> {
    sqlx::query("UPDATE transactions SET category = ?, note = ? WHERE id = ?")
        .bind(category)
        .bind(note)
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Transaction updated".to_string())
}

#[tauri::command]
async fn get_wallet_balances(pool: tauri::State<'_, SqlitePool>) -> Result<std::collections::HashMap<i64, i64>, String> {
    let rows = sqlx::query_as::<_, (i64, i64)>(
        "SELECT wallet_id, SUM(amount_sats) as balance FROM transactions GROUP BY wallet_id"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    let mut balances = std::collections::HashMap::new();
    for (wallet_id, balance) in rows {
        balances.insert(wallet_id, balance);
    }
    
    Ok(balances)
}

#[tauri::command]
async fn get_setting(pool: tauri::State<'_, SqlitePool>, key: String) -> Result<Option<String>, String> {
    let result = sqlx::query_as::<_, (String,)>(
        "SELECT value FROM settings WHERE key = ?"
    )
    .bind(&key)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(result.map(|r| r.0))
}

#[tauri::command]
async fn set_setting(pool: tauri::State<'_, SqlitePool>, key: String, value: String) -> Result<String, String> {
    sqlx::query(
        "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value"
    )
    .bind(&key)
    .bind(&value)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok("Setting saved".to_string())
}

#[tauri::command]
async fn update_wallet(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    name: String,
    entity_id: i64,
) -> Result<String, String> {
    sqlx::query("UPDATE wallets SET name = ?, entity_id = ? WHERE id = ?")
        .bind(&name)
        .bind(entity_id)
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Wallet updated".to_string())
}

#[tauri::command]
async fn fetch_current_price(currency: String) -> Result<f64, String> {
    let url = format!(
        "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies={}",
        currency.to_lowercase()
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "SatStone-BitFinances/1.0")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status();
    let body = response.text().await.map_err(|e| format!("Failed to read body: {}", e))?;
    
    if !status.is_success() {
        return Err(format!("API error ({}): {}", status, body));
    }
    
    let data: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let price = data["bitcoin"][currency.to_lowercase()]
        .as_f64()
        .ok_or_else(|| format!("Price not found in response"))?;
    
    Ok(price)
}

#[tauri::command]
async fn fetch_historical_price(currency: String, date: String) -> Result<f64, String> {
    let url = format!(
        "https://api.coingecko.com/api/v3/coins/bitcoin/history?date={}&localization=false",
        date
    );
    
    let client = reqwest::Client::new();
    let response = client
        .get(&url)
        .header("Accept", "application/json")
        .header("User-Agent", "SatStone-BitFinances/1.0")
        .send()
        .await
        .map_err(|e| format!("Request failed: {}", e))?;
    
    let status = response.status();
    let body = response.text().await.map_err(|e| format!("Failed to read body: {}", e))?;
    
    if !status.is_success() {
        return Err(format!("API error ({}): {}", status, body));
    }
    
    let data: serde_json::Value = serde_json::from_str(&body)
        .map_err(|e| format!("Failed to parse JSON: {}", e))?;
    
    let price = data["market_data"]["current_price"][currency.to_lowercase()]
        .as_f64()
        .ok_or_else(|| format!("Historical price not found for {}", date))?;
    
    Ok(price)
}

#[tauri::command]
async fn get_cached_price(
    pool: tauri::State<'_, SqlitePool>,
    currency: String,
    date: String,
) -> Result<Option<f64>, String> {
    let result = sqlx::query_as::<_, (f64,)>(
        "SELECT price FROM price_cache WHERE currency = ? AND date = ?"
    )
    .bind(&currency)
    .bind(&date)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(result.map(|r| r.0))
}

#[tauri::command]
async fn cache_price(
    pool: tauri::State<'_, SqlitePool>,
    currency: String,
    price: f64,
    date: String,
) -> Result<String, String> {
    sqlx::query(
        "INSERT INTO price_cache (currency, price, date) VALUES (?, ?, ?) 
         ON CONFLICT(currency, date) DO UPDATE SET price = excluded.price, updated_at = CURRENT_TIMESTAMP"
    )
    .bind(&currency)
    .bind(price)
    .bind(&date)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok("Price cached".to_string())
}

#[tauri::command]
async fn update_transaction_fiat(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    fiat_value: Option<f64>,
    fiat_currency: Option<String>,
) -> Result<String, String> {
    sqlx::query(
        "UPDATE transactions SET fiat_value = ?, fiat_currency = ? WHERE id = ?"
    )
    .bind(fiat_value)
    .bind(&fiat_currency)
    .bind(id)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok("Transaction fiat updated".to_string())
}

#[tauri::command]
async fn add_manual_transaction(
    pool: tauri::State<'_, SqlitePool>,
    wallet_id: i64,
    amount_sats: i64,
    timestamp: i64,
    category: Option<String>,
    note: Option<String>,
    fiat_value: Option<f64>,
    fiat_currency: Option<String>,
    currency: Option<String>,
    fee_sats: Option<i64>,
    fee_fiat: Option<f64>,
    fee_fiat_currency: Option<String>,
) -> Result<String, String> {
    let txid = format!("manual-{}-{}", timestamp, rand::random::<u32>());
    let tx_currency = currency.unwrap_or_else(|| "BTC".to_string());
    
    sqlx::query(
        r#"
        INSERT INTO transactions (wallet_id, txid, amount_sats, fee_sats, fee_fiat, fee_fiat_currency, confirmed, timestamp, category, note, fiat_value, fiat_currency, currency)
        VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
        "#,
    )
    .bind(wallet_id)
    .bind(&txid)
    .bind(amount_sats)
    .bind(fee_sats.unwrap_or(0))
    .bind(fee_fiat)
    .bind(&fee_fiat_currency)
    .bind(timestamp)
    .bind(&category)
    .bind(&note)
    .bind(fiat_value)
    .bind(&fiat_currency)
    .bind(&tx_currency)
    .execute(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok("Transaction added".to_string())
}

#[tauri::command]
async fn delete_transaction(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
) -> Result<String, String> {
    // Only allow deleting manual transactions
    let tx = sqlx::query_as::<_, (String,)>(
        "SELECT txid FROM transactions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    if let Some((txid,)) = tx {
        if !txid.starts_with("manual-") {
            return Err("Cannot delete synced transactions".to_string());
        }
    } else {
        return Err("Transaction not found".to_string());
    }
    
    sqlx::query("DELETE FROM transactions WHERE id = ?")
        .bind(id)
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("Transaction deleted".to_string())
}

#[tauri::command]
async fn update_manual_transaction(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    amount_sats: i64,
    timestamp: i64,
    category: Option<String>,
    note: Option<String>,
    fiat_value: Option<f64>,
    fiat_currency: Option<String>,
    currency: Option<String>,
    fee_sats: Option<i64>,
    fee_fiat: Option<f64>,
    fee_fiat_currency: Option<String>,
) -> Result<String, String> {
    // Verify it's a manual transaction
    let existing = sqlx::query_as::<_, (String,)>(
        "SELECT txid FROM transactions WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    match existing {
        Some((txid,)) if txid.starts_with("manual-") => {
            let tx_currency = currency.unwrap_or_else(|| "BTC".to_string());
            
            sqlx::query(
                r#"
                UPDATE transactions 
                SET amount_sats = ?, fee_sats = ?, fee_fiat = ?, fee_fiat_currency = ?,
                    timestamp = ?, category = ?, note = ?, fiat_value = ?, fiat_currency = ?, currency = ?
                WHERE id = ?
                "#,
            )
            .bind(amount_sats)
            .bind(fee_sats.unwrap_or(0))
            .bind(fee_fiat)
            .bind(&fee_fiat_currency)
            .bind(timestamp)
            .bind(&category)
            .bind(&note)
            .bind(fiat_value)
            .bind(&fiat_currency)
            .bind(&tx_currency)
            .bind(id)
            .execute(pool.inner())
            .await
            .map_err(|e| e.to_string())?;
            
            Ok("Transaction updated".to_string())
        }
        Some(_) => Err("Cannot edit synced transactions".to_string()),
        None => Err("Transaction not found".to_string()),
    }
}

#[derive(Debug, Serialize, Deserialize)]
struct ImportTransaction {
    id: String,
    timestamp: i64,
    amount_sats: i64,
    fee_sats: i64,
    fee_fiat: Option<f64>,
    fee_fiat_currency: Option<String>,
    category: Option<String>,
    note: Option<String>,
    fiat_value: Option<f64>,
    fiat_currency: Option<String>,
    currency: Option<String>,
}

#[tauri::command]
async fn import_transactions(
    pool: tauri::State<'_, SqlitePool>,
    wallet_id: i64,
    transactions: Vec<ImportTransaction>,
) -> Result<ImportResult, String> {
    let mut imported = 0;
    let mut skipped = 0;
    let mut errors: Vec<String> = Vec::new();
    
    for tx in transactions {
        // Check for duplicate by source_id
        let existing = sqlx::query_as::<_, (i64,)>(
            "SELECT id FROM transactions WHERE wallet_id = ? AND txid = ?"
        )
        .bind(wallet_id)
        .bind(&tx.id)
        .fetch_optional(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
        
        if existing.is_some() {
            skipped += 1;
            continue;
        }
        
        let tx_currency = tx.currency.unwrap_or_else(|| "BTC".to_string());
        
        // Insert transaction
        let result = sqlx::query(
            r#"
            INSERT INTO transactions (wallet_id, txid, amount_sats, fee_sats, fee_fiat, fee_fiat_currency, confirmed, block_height, timestamp, category, note, fiat_value, fiat_currency, currency)
            VALUES (?, ?, ?, ?, ?, ?, 1, NULL, ?, ?, ?, ?, ?, ?)
            "#,
        )
        .bind(wallet_id)
        .bind(&tx.id)
        .bind(tx.amount_sats)
        .bind(tx.fee_sats)
        .bind(tx.fee_fiat)
        .bind(&tx.fee_fiat_currency)
        .bind(tx.timestamp)
        .bind(&tx.category)
        .bind(&tx.note)
        .bind(tx.fiat_value)
        .bind(&tx.fiat_currency)
        .bind(&tx_currency)
        .execute(pool.inner())
        .await;
        
        match result {
            Ok(_) => imported += 1,
            Err(e) => errors.push(format!("Failed to import tx {}: {}", tx.id, e)),
        }
    }
    
    Ok(ImportResult { imported, skipped, errors })
}

#[derive(Debug, Serialize, Deserialize)]
struct ImportResult {
    imported: i32,
    skipped: i32,
    errors: Vec<String>,
}

#[tauri::command]
async fn reset_all_data(pool: tauri::State<'_, SqlitePool>) -> Result<String, String> {
    // Delete all transactions
    sqlx::query("DELETE FROM transactions")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    // Delete all wallets
    sqlx::query("DELETE FROM wallets")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    // Delete all entities except Personal
    sqlx::query("DELETE FROM entities WHERE entity_type != 'personal'")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    // Delete all settings
    sqlx::query("DELETE FROM settings")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    // Delete price cache
    sqlx::query("DELETE FROM price_cache")
        .execute(pool.inner())
        .await
        .map_err(|e| e.to_string())?;
    
    Ok("All data reset successfully".to_string())
}

#[tauri::command]
async fn get_categories(pool: tauri::State<'_, SqlitePool>) -> Result<Vec<Category>, String> {
    let categories = sqlx::query_as::<_, Category>(
        "SELECT id, name, is_system FROM categories ORDER BY is_system DESC, name ASC"
    )
    .fetch_all(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    Ok(categories)
}

#[tauri::command]
async fn add_category(
    pool: tauri::State<'_, SqlitePool>,
    name: String,
) -> Result<Category, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Category name cannot be empty".to_string());
    }
    
    let result = sqlx::query(
        "INSERT INTO categories (name, is_system) VALUES (?, 0)"
    )
    .bind(trimmed)
    .execute(pool.inner())
    .await
    .map_err(|e| {
        if e.to_string().contains("UNIQUE") {
            "Category already exists".to_string()
        } else {
            e.to_string()
        }
    })?;
    
    Ok(Category {
        id: result.last_insert_rowid(),
        name: trimmed.to_string(),
        is_system: false,
    })
}

#[tauri::command]
async fn update_category(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
    name: String,
) -> Result<String, String> {
    let trimmed = name.trim();
    if trimmed.is_empty() {
        return Err("Category name cannot be empty".to_string());
    }
    
    // Check if it's a system category
    let category = sqlx::query_as::<_, Category>(
        "SELECT id, name, is_system FROM categories WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    match category {
        Some(cat) if cat.is_system => {
            Err("Cannot edit system categories".to_string())
        }
        Some(_) => {
            sqlx::query("UPDATE categories SET name = ? WHERE id = ?")
                .bind(trimmed)
                .bind(id)
                .execute(pool.inner())
                .await
                .map_err(|e| {
                    if e.to_string().contains("UNIQUE") {
                        "Category already exists".to_string()
                    } else {
                        e.to_string()
                    }
                })?;
            Ok("Category updated".to_string())
        }
        None => Err("Category not found".to_string()),
    }
}

#[tauri::command]
async fn delete_category(
    pool: tauri::State<'_, SqlitePool>,
    id: i64,
) -> Result<String, String> {
    // Check if it's a system category
    let category = sqlx::query_as::<_, Category>(
        "SELECT id, name, is_system FROM categories WHERE id = ?"
    )
    .bind(id)
    .fetch_optional(pool.inner())
    .await
    .map_err(|e| e.to_string())?;
    
    match category {
        Some(cat) if cat.is_system => {
            Err("Cannot delete system categories".to_string())
        }
        Some(cat) => {
            // Update transactions using this category to "Uncategorized"
            sqlx::query("UPDATE transactions SET category = 'Uncategorized' WHERE category = ?")
                .bind(&cat.name)
                .execute(pool.inner())
                .await
                .map_err(|e| e.to_string())?;
            
            // Delete the category
            sqlx::query("DELETE FROM categories WHERE id = ?")
                .bind(id)
                .execute(pool.inner())
                .await
                .map_err(|e| e.to_string())?;
            
            Ok("Category deleted".to_string())
        }
        None => Err("Category not found".to_string()),
    }
}

// ============================================================================
// ENCRYPTION COMMANDS
// ============================================================================

#[tauri::command]
async fn check_db_encrypted() -> Result<bool, String> {
    Ok(encrypted_db::EncryptedDb::is_encrypted())
}

#[tauri::command]
async fn check_db_exists() -> Result<bool, String> {
    Ok(encrypted_db::EncryptedDb::db_exists())
}

#[tauri::command]
async fn generate_recovery_phrase() -> Result<String, String> {
    crypto::generate_recovery_phrase()
}

#[tauri::command]
async fn check_password_strength(password: String) -> Result<PasswordStrength, String> {
    Ok(crypto::calculate_password_strength(&password))
}

#[tauri::command]
async fn validate_recovery_phrase(phrase: String) -> Result<bool, String> {
    Ok(crypto::validate_recovery_phrase(&phrase))
}

#[tauri::command]
async fn encrypt_database(passphrase: String, recovery_phrase: String) -> Result<String, String> {
    if !crypto::validate_recovery_phrase(&recovery_phrase) {
        return Err("Invalid recovery phrase".to_string());
    }
    
    encrypted_db::EncryptedDb::encrypt_database(&passphrase, &recovery_phrase)?;
    
    Ok("Database encrypted successfully".to_string())
}

#[tauri::command]
async fn unlock_with_passphrase(passphrase: String) -> Result<bool, String> {
    // Try to open with passphrase - if it works, passphrase is correct
    let _db = encrypted_db::EncryptedDb::open_with_passphrase(&passphrase)?;
    Ok(true)
}

#[tauri::command]
async fn unlock_with_recovery(recovery_phrase: String) -> Result<bool, String> {
    if !crypto::validate_recovery_phrase(&recovery_phrase) {
        return Err("Invalid recovery phrase".to_string());
    }
    
    let _db = encrypted_db::EncryptedDb::open_with_recovery(&recovery_phrase)?;
    Ok(true)
}

#[tauri::command]
async fn change_passphrase(old_passphrase: String, new_passphrase: String) -> Result<String, String> {
    encrypted_db::EncryptedDb::change_passphrase(&old_passphrase, &new_passphrase)?;
    Ok("Passphrase changed successfully".to_string())
}

#[tauri::command]
async fn remove_encryption(passphrase: String) -> Result<String, String> {
    encrypted_db::EncryptedDb::decrypt_database(&passphrase)?;
    Ok("Encryption removed successfully".to_string())
}

#[tokio::main]
async fn main() {
    let pool = db::init_db().await.expect("Failed to initialize database");

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            app.manage(pool);
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            get_entities,
            add_family_member,
            add_business,
            delete_entity,
            add_wallet,
            get_wallets,
            delete_wallet,
            update_wallet,
            derive_addresses,
            fetch_wallet_balance,
            fetch_wallet_transactions,
            save_transactions,
            get_cached_transactions,
            get_all_transactions,
            update_transaction,
            get_wallet_balances,
            get_setting,
            set_setting,
            fetch_current_price,
            fetch_historical_price,
            get_cached_price,
            cache_price,
            update_transaction_fiat,
            add_manual_transaction,
            delete_transaction,
            update_manual_transaction,
            import_transactions,
            reset_all_data,
            get_categories,
            add_category,
            update_category,
            delete_category,
            check_db_encrypted,
            check_db_exists,
            generate_recovery_phrase,
            check_password_strength,
            validate_recovery_phrase,
            encrypt_database,
            unlock_with_passphrase,
            unlock_with_recovery,
            change_passphrase,
            remove_encryption,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}