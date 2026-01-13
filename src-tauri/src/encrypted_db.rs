//! Encrypted database management using SQLCipher
//!
//! Architecture:
//! - Recovery phrase (12 words) -> Master encryption key (via BIP39 seed)
//! - Passphrase -> Used to encrypt/store the recovery phrase locally
//! - Database is ALWAYS encrypted with the master key (derived from recovery phrase)
//!
//! This means:
//! - Recovery phrase can ALWAYS unlock the database
//! - Passphrase unlocks by decrypting the stored recovery phrase, then using that

use rusqlite::{Connection, OpenFlags};
use std::path::PathBuf;
use std::sync::Arc;
use tokio::sync::Mutex;

use crate::crypto;

/// Encrypted database connection wrapper
pub struct EncryptedDb {
    conn: Arc<Mutex<Connection>>,
    _db_path: PathBuf,
    _is_encrypted: bool,
}

impl EncryptedDb {
    /// Get the database file path
    pub fn get_db_path() -> PathBuf {
        let app_dir = dirs::data_local_dir()
            .expect("Failed to get local data directory")
            .join("com.satstone.bitfinances");
        
        std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");
        
        app_dir.join("satstone.db")
    }
    
    /// Get the app data directory
    fn get_app_dir() -> PathBuf {
        let app_dir = dirs::data_local_dir()
            .expect("Failed to get local data directory")
            .join("com.satstone.bitfinances");
        
        std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");
        app_dir
    }
    
    /// Get the encryption metadata file path
    pub fn get_meta_path() -> PathBuf {
        Self::get_app_dir().join("encryption.meta")
    }
    
    /// Check if database exists
    pub fn db_exists() -> bool {
        Self::get_db_path().exists()
    }
    
    /// Check if database is encrypted
    pub fn is_encrypted() -> bool {
        let meta_path = Self::get_meta_path();
        if meta_path.exists() {
            if let Ok(content) = std::fs::read_to_string(&meta_path) {
                return content.trim() == "encrypted";
            }
        }
        false
    }
    
    /// Get the stored salt for passphrase operations
    fn get_salt() -> Option<String> {
        std::fs::read_to_string(Self::get_app_dir().join("salt.key")).ok()
    }
    
    /// Save salt
    fn save_salt(salt: &str) -> Result<(), String> {
        std::fs::write(Self::get_app_dir().join("salt.key"), salt)
            .map_err(|e| e.to_string())
    }
    
    /// Get the encrypted recovery phrase (encrypted with passphrase)
    fn get_encrypted_recovery() -> Option<String> {
        std::fs::read_to_string(Self::get_app_dir().join("recovery.enc")).ok()
    }
    
    /// Save encrypted recovery phrase
    fn save_encrypted_recovery(encrypted: &str) -> Result<(), String> {
        std::fs::write(Self::get_app_dir().join("recovery.enc"), encrypted)
            .map_err(|e| e.to_string())
    }
    
    /// Set encryption status in metadata
    fn set_encrypted_status(encrypted: bool) -> Result<(), String> {
        let status = if encrypted { "encrypted" } else { "plaintext" };
        std::fs::write(Self::get_meta_path(), status).map_err(|e| e.to_string())
    }
    
    /// Simple XOR encryption for storing recovery phrase (encrypted with passphrase-derived key)
    fn xor_encrypt(data: &str, key: &str) -> String {
        let key_bytes = key.as_bytes();
        let encrypted: Vec<u8> = data.as_bytes()
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ key_bytes[i % key_bytes.len()])
            .collect();
        hex::encode(encrypted)
    }
    
    /// Simple XOR decryption
    fn xor_decrypt(encrypted_hex: &str, key: &str) -> Result<String, String> {
        let encrypted = hex::decode(encrypted_hex)
            .map_err(|e| format!("Failed to decode: {}", e))?;
        let key_bytes = key.as_bytes();
        let decrypted: Vec<u8> = encrypted
            .iter()
            .enumerate()
            .map(|(i, b)| b ^ key_bytes[i % key_bytes.len()])
            .collect();
        String::from_utf8(decrypted)
            .map_err(|e| format!("Failed to decrypt: {}", e))
    }
    
    /// Open an encrypted database with the master key
    fn open_with_key(hex_key: &str) -> Result<Self, String> {
        let db_path = Self::get_db_path();
        
        let conn = Connection::open_with_flags(
            &db_path,
            OpenFlags::SQLITE_OPEN_READ_WRITE,
        )
        .map_err(|e| format!("Failed to open database: {}", e))?;
        
        // Set the encryption key
        conn.execute_batch(&format!("PRAGMA key = \"x'{}'\";", hex_key))
            .map_err(|e| format!("Failed to set encryption key: {}", e))?;
        
        // Verify we can read the database
        conn.execute_batch("SELECT count(*) FROM sqlite_master;")
            .map_err(|_| "Invalid passphrase or corrupted database".to_string())?;
        
        Ok(Self {
            conn: Arc::new(Mutex::new(conn)),
            _db_path: db_path,
            _is_encrypted: true,
        })
    }
    
    /// Open with passphrase
    /// Decrypts the stored recovery phrase, then uses it to derive the master key
    pub fn open_with_passphrase(passphrase: &str) -> Result<Self, String> {
        // Get salt
        let salt = Self::get_salt().ok_or("No encryption data found")?;
        
        // Derive key from passphrase
        let passphrase_key = crypto::derive_key_from_passphrase(passphrase, &salt)?;
        
        // Get and decrypt the stored recovery phrase
        let encrypted_recovery = Self::get_encrypted_recovery()
            .ok_or("No encrypted recovery phrase found")?;
        
        let recovery_phrase = Self::xor_decrypt(&encrypted_recovery, &passphrase_key)
            .map_err(|_| "Invalid passphrase")?;
        
        // Validate it's a real recovery phrase
        if !crypto::validate_recovery_phrase(&recovery_phrase) {
            return Err("Invalid passphrase".to_string());
        }
        
        // Derive master key from recovery phrase
        let master_key = crypto::derive_key_from_recovery(&recovery_phrase)?;
        
        // Open with master key
        Self::open_with_key(&master_key)
    }
    
    /// Open with recovery phrase directly
    pub fn open_with_recovery(recovery_phrase: &str) -> Result<Self, String> {
        // Normalize
        let normalized = recovery_phrase
            .to_lowercase()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ");
        
        // Validate
        if !crypto::validate_recovery_phrase(&normalized) {
            return Err("Invalid recovery phrase".to_string());
        }
        
        // Derive master key
        let master_key = crypto::derive_key_from_recovery(&normalized)?;
        
        // Open with master key
        Self::open_with_key(&master_key)
    }
    
    /// Encrypt an existing unencrypted database
    pub fn encrypt_database(passphrase: &str, recovery_phrase: &str) -> Result<(), String> {
        let db_path = Self::get_db_path();
        let temp_path = db_path.with_extension("db.tmp");
        
        // Normalize recovery phrase
        let normalized_recovery = recovery_phrase
            .to_lowercase()
            .split_whitespace()
            .collect::<Vec<&str>>()
            .join(" ");
        
        // Derive MASTER KEY from recovery phrase
        let master_key = crypto::derive_key_from_recovery(&normalized_recovery)?;
        
        // Generate salt for passphrase
        let salt = crypto::generate_salt();
        
        // Derive passphrase key
        let passphrase_key = crypto::derive_key_from_passphrase(passphrase, &salt)?;
        
        // Encrypt the recovery phrase with the passphrase key
        let encrypted_recovery = Self::xor_encrypt(&normalized_recovery, &passphrase_key);
        
        // Open the existing unencrypted database
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        // Export to a new encrypted database using MASTER KEY
        conn.execute_batch(&format!(
            "ATTACH DATABASE '{}' AS encrypted KEY \"x'{}'\";
             SELECT sqlcipher_export('encrypted');
             DETACH DATABASE encrypted;",
            temp_path.display(),
            master_key
        ))
        .map_err(|e| format!("Failed to encrypt database: {}", e))?;
        
        drop(conn);
        
        // Replace original with encrypted version
        std::fs::rename(&temp_path, &db_path)
            .map_err(|e| format!("Failed to replace database: {}", e))?;
        
        // Save metadata
        Self::save_salt(&salt)?;
        Self::save_encrypted_recovery(&encrypted_recovery)?;
        Self::set_encrypted_status(true)?;
        
        Ok(())
    }
    
    /// Change passphrase (re-encrypts the recovery phrase with new passphrase)
    pub fn change_passphrase(old_passphrase: &str, new_passphrase: &str) -> Result<(), String> {
        // First, decrypt recovery phrase with old passphrase
        let salt = Self::get_salt().ok_or("No encryption data found")?;
        let old_key = crypto::derive_key_from_passphrase(old_passphrase, &salt)?;
        
        let encrypted_recovery = Self::get_encrypted_recovery()
            .ok_or("No encrypted recovery phrase found")?;
        
        let recovery_phrase = Self::xor_decrypt(&encrypted_recovery, &old_key)
            .map_err(|_| "Invalid current passphrase")?;
        
        if !crypto::validate_recovery_phrase(&recovery_phrase) {
            return Err("Invalid current passphrase".to_string());
        }
        
        // Generate new salt and encrypt recovery with new passphrase
        let new_salt = crypto::generate_salt();
        let new_key = crypto::derive_key_from_passphrase(new_passphrase, &new_salt)?;
        let new_encrypted_recovery = Self::xor_encrypt(&recovery_phrase, &new_key);
        
        // Save new data
        Self::save_salt(&new_salt)?;
        Self::save_encrypted_recovery(&new_encrypted_recovery)?;
        
        Ok(())
    }
    
    /// Remove encryption from database
    pub fn decrypt_database(passphrase: &str) -> Result<(), String> {
        let db_path = Self::get_db_path();
        let temp_path = db_path.with_extension("db.tmp");
        
        // Get recovery phrase via passphrase
        let salt = Self::get_salt().ok_or("No encryption data found")?;
        let passphrase_key = crypto::derive_key_from_passphrase(passphrase, &salt)?;
        
        let encrypted_recovery = Self::get_encrypted_recovery()
            .ok_or("No encrypted recovery phrase found")?;
        
        let recovery_phrase = Self::xor_decrypt(&encrypted_recovery, &passphrase_key)
            .map_err(|_| "Invalid passphrase")?;
        
        if !crypto::validate_recovery_phrase(&recovery_phrase) {
            return Err("Invalid passphrase".to_string());
        }
        
        // Derive master key
        let master_key = crypto::derive_key_from_recovery(&recovery_phrase)?;
        
        // Open encrypted database
        let conn = Connection::open(&db_path)
            .map_err(|e| format!("Failed to open database: {}", e))?;
        
        conn.execute_batch(&format!("PRAGMA key = \"x'{}'\";", master_key))
            .map_err(|e| format!("Failed to set key: {}", e))?;
        
        // Verify
        conn.execute_batch("SELECT count(*) FROM sqlite_master;")
            .map_err(|_| "Invalid passphrase".to_string())?;
        
        // Export to unencrypted
        conn.execute_batch(&format!(
            "ATTACH DATABASE '{}' AS plaintext KEY '';
             SELECT sqlcipher_export('plaintext');
             DETACH DATABASE plaintext;",
            temp_path.display()
        ))
        .map_err(|e| format!("Failed to decrypt database: {}", e))?;
        
        drop(conn);
        
        // Replace
        std::fs::rename(&temp_path, &db_path)
            .map_err(|e| format!("Failed to replace database: {}", e))?;
        
        // Remove encryption files
        let app_dir = Self::get_app_dir();
        let _ = std::fs::remove_file(app_dir.join("salt.key"));
        let _ = std::fs::remove_file(app_dir.join("recovery.enc"));
        let _ = std::fs::remove_file(Self::get_meta_path());
        
        Ok(())
    }
    
    /// Get connection
    pub fn connection(&self) -> Arc<Mutex<Connection>> {
        Arc::clone(&self.conn)
    }
    
    /// Initialize schema
    pub async fn init_schema(&self) -> Result<(), String> {
        let conn = self.conn.lock().await;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS entities (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                entity_type TEXT NOT NULL,
                parent_id INTEGER,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            "INSERT OR IGNORE INTO entities (id, name, entity_type) VALUES (1, 'Personal', 'personal')",
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS wallets (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                xpub TEXT NOT NULL UNIQUE,
                wallet_type TEXT NOT NULL DEFAULT 'zpub',
                entity_id INTEGER NOT NULL DEFAULT 1,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS transactions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                wallet_id INTEGER NOT NULL,
                txid TEXT NOT NULL,
                amount_sats INTEGER NOT NULL,
                fee_sats INTEGER DEFAULT 0,
                fee_fiat REAL,
                fee_fiat_currency TEXT,
                confirmed INTEGER DEFAULT 0,
                block_height INTEGER,
                timestamp INTEGER,
                category TEXT,
                note TEXT,
                fiat_value REAL,
                fiat_currency TEXT,
                currency TEXT DEFAULT 'BTC',
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(wallet_id, txid)
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS settings (
                key TEXT PRIMARY KEY,
                value TEXT NOT NULL
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS price_cache (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                currency TEXT NOT NULL,
                price REAL NOT NULL,
                date TEXT NOT NULL,
                updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(currency, date)
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        conn.execute(
            r#"CREATE TABLE IF NOT EXISTS categories (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL UNIQUE,
                is_system INTEGER NOT NULL DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )"#,
            [],
        ).map_err(|e| e.to_string())?;
        
        Ok(())
    }
}