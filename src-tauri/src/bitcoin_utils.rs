use bitcoin::bip32::{DerivationPath, Xpub};
use bitcoin::secp256k1::Secp256k1;
use bitcoin::{Address, CompressedPublicKey, Network};
use std::str::FromStr;

pub fn derive_addresses(xpub_str: &str, start: u32, count: u32) -> Result<Vec<String>, String> {
    derive_addresses_for_chain(xpub_str, 0, start, count)
}

pub fn derive_addresses_for_chain(xpub_str: &str, chain: u32, start: u32, count: u32) -> Result<Vec<String>, String> {
    let secp = Secp256k1::new();
    let xpub = parse_xpub(xpub_str)?;
    
    let mut addresses = Vec::new();
    
    for i in start..(start + count) {
        let path = DerivationPath::from_str(&format!("m/{}/{}", chain, i))
            .map_err(|e| e.to_string())?;
        
        let derived = xpub.derive_pub(&secp, &path)
            .map_err(|e| e.to_string())?;
        
        let address = pubkey_to_address(&derived.public_key, xpub_str)?;
        addresses.push(address);
    }
    
    Ok(addresses)
}

fn parse_xpub(xpub_str: &str) -> Result<Xpub, String> {
    let converted = if xpub_str.starts_with("zpub") {
        convert_zpub_to_xpub(xpub_str)?
    } else if xpub_str.starts_with("ypub") {
        convert_ypub_to_xpub(xpub_str)?
    } else {
        xpub_str.to_string()
    };
    
    Xpub::from_str(&converted).map_err(|e| format!("Invalid xpub: {}", e))
}

fn convert_zpub_to_xpub(zpub: &str) -> Result<String, String> {
    let decoded = bs58::decode(zpub)
        .with_check(None)
        .into_vec()
        .map_err(|e| format!("Base58 decode error: {}", e))?;
    
    let mut converted = vec![0x04, 0x88, 0xB2, 0x1E];
    converted.extend_from_slice(&decoded[4..]);
    
    Ok(bs58::encode(converted).with_check().into_string())
}

fn convert_ypub_to_xpub(ypub: &str) -> Result<String, String> {
    let decoded = bs58::decode(ypub)
        .with_check(None)
        .into_vec()
        .map_err(|e| format!("Base58 decode error: {}", e))?;
    
    let mut converted = vec![0x04, 0x88, 0xB2, 0x1E];
    converted.extend_from_slice(&decoded[4..]);
    
    Ok(bs58::encode(converted).with_check().into_string())
}

fn pubkey_to_address(pubkey: &bitcoin::secp256k1::PublicKey, original_xpub: &str) -> Result<String, String> {
    let compressed = CompressedPublicKey(pubkey.clone());
    
    let address = if original_xpub.starts_with("zpub") {
        Address::p2wpkh(&compressed, Network::Bitcoin)
    } else if original_xpub.starts_with("ypub") {
        Address::p2shwpkh(&compressed, Network::Bitcoin)
    } else {
        Address::p2pkh(&compressed, Network::Bitcoin)
    };
    
    Ok(address.to_string())
}