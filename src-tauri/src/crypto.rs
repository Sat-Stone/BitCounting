//! Cryptographic utilities for database encryption
//! 
//! Uses:
//! - BIP39 for recovery phrase generation
//! - Argon2id for passphrase to key derivation
//! - AES-256 via SQLCipher for database encryption

use argon2::{Argon2, password_hash::SaltString, PasswordHasher};
use bip39::{Mnemonic, Language};

/// Generate a new 12-word BIP39 mnemonic recovery phrase
pub fn generate_recovery_phrase() -> Result<String, String> {
    // Generate 16 bytes of entropy for 12 words
    let mut entropy = [0u8; 16];
    getrandom::getrandom(&mut entropy)
        .map_err(|e| format!("Failed to generate random entropy: {}", e))?;
    
    let mnemonic = Mnemonic::from_entropy_in(Language::English, &entropy)
        .map_err(|e| format!("Failed to generate mnemonic: {}", e))?;
    
    Ok(mnemonic.to_string())
}

/// Derive a deterministic encryption key from a recovery phrase
/// This allows recovering the database with just the 12 words
pub fn derive_key_from_recovery(recovery_phrase: &str) -> Result<String, String> {
    // Normalize the phrase
    let normalized = recovery_phrase
        .to_lowercase()
        .trim()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ");
    
    // Parse and validate the mnemonic
    let mnemonic = Mnemonic::parse_in_normalized(Language::English, &normalized)
        .map_err(|e| format!("Invalid recovery phrase: {:?}", e))?;
    
    // Use the mnemonic's seed to derive a key
    let seed = mnemonic.to_seed("");
    
    // Take first 32 bytes of seed as the encryption key
    let key_bytes = &seed[0..32];
    Ok(hex::encode(key_bytes))
}

/// Derive an encryption key from a user passphrase using Argon2id
/// Returns a hex-encoded 32-byte key suitable for SQLCipher
pub fn derive_key_from_passphrase(passphrase: &str, salt: &str) -> Result<String, String> {
    let argon2 = Argon2::default();
    
    // Use provided salt (stored alongside encrypted DB)
    let salt_string = SaltString::encode_b64(salt.as_bytes())
        .map_err(|e| format!("Invalid salt: {}", e))?;
    
    let password_hash = argon2
        .hash_password(passphrase.as_bytes(), &salt_string)
        .map_err(|e| format!("Failed to hash passphrase: {}", e))?;
    
    // Extract the hash output
    let hash = password_hash.hash.ok_or("No hash output")?;
    let hash_bytes = hash.as_bytes();
    
    // Take first 32 bytes for AES-256
    let key_bytes = &hash_bytes[0..32.min(hash_bytes.len())];
    
    // Pad if necessary
    let mut key = [0u8; 32];
    key[..key_bytes.len()].copy_from_slice(key_bytes);
    
    Ok(hex::encode(key))
}

/// Generate a random salt for passphrase derivation
pub fn generate_salt() -> String {
    let mut salt_bytes = [0u8; 16];
    getrandom::getrandom(&mut salt_bytes).expect("Failed to generate random salt");
    hex::encode(salt_bytes)
}

/// Calculate password strength score (0-100)
pub fn calculate_password_strength(password: &str) -> PasswordStrength {
    let mut score: u32 = 0;
    let len = password.len();
    
    // Length scoring
    if len >= 8 { score += 20; }
    if len >= 12 { score += 15; }
    if len >= 16 { score += 10; }
    if len >= 20 { score += 5; }
    
    // Character variety
    let has_lower = password.chars().any(|c| c.is_ascii_lowercase());
    let has_upper = password.chars().any(|c| c.is_ascii_uppercase());
    let has_digit = password.chars().any(|c| c.is_ascii_digit());
    let has_special = password.chars().any(|c| !c.is_alphanumeric());
    
    if has_lower { score += 10; }
    if has_upper { score += 15; }
    if has_digit { score += 15; }
    if has_special { score += 20; }
    
    // Bonus for mixing
    let variety_count = [has_lower, has_upper, has_digit, has_special]
        .iter()
        .filter(|&&x| x)
        .count();
    
    if variety_count >= 3 { score += 10; }
    if variety_count == 4 { score += 10; }
    
    // Penalty for common patterns
    let lower = password.to_lowercase();
    if lower.contains("password") || lower.contains("123456") || lower.contains("qwerty") {
        score = score.saturating_sub(30);
    }
    
    // Cap at 100
    let final_score = score.min(100);
    
    let (level, label) = match final_score {
        0..=20 => ("very_weak", "Very Weak"),
        21..=40 => ("weak", "Weak"),
        41..=60 => ("fair", "Fair"),
        61..=80 => ("strong", "Strong"),
        _ => ("very_strong", "Very Strong"),
    };
    
    PasswordStrength {
        score: final_score,
        level: level.to_string(),
        label: label.to_string(),
    }
}

#[derive(Debug, serde::Serialize)]
pub struct PasswordStrength {
    pub score: u32,
    pub level: String,
    pub label: String,
}

/// Validate a BIP39 mnemonic phrase
pub fn validate_recovery_phrase(phrase: &str) -> bool {
    // Normalize: lowercase, trim, collapse spaces
    let normalized = phrase
        .to_lowercase()
        .trim()
        .split_whitespace()
        .collect::<Vec<&str>>()
        .join(" ");
    
    Mnemonic::parse_in_normalized(Language::English, &normalized).is_ok()
}

#[cfg(test)]
mod tests {
    use super::*;
    
    #[test]
    fn test_generate_recovery_phrase() {
        let phrase = generate_recovery_phrase().unwrap();
        let words: Vec<&str> = phrase.split_whitespace().collect();
        assert_eq!(words.len(), 12);
    }
    
    #[test]
    fn test_derive_key_deterministic() {
        let phrase = "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";
        let key1 = derive_key_from_recovery(phrase).unwrap();
        let key2 = derive_key_from_recovery(phrase).unwrap();
        assert_eq!(key1, key2);
        assert_eq!(key1.len(), 64); // 32 bytes = 64 hex chars
    }
    
    #[test]
    fn test_password_strength() {
        assert!(calculate_password_strength("123").score < 30);
        assert!(calculate_password_strength("MyP@ssw0rd!").score >= 60);
    }
}