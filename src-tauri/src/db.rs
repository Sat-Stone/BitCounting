use sqlx::{sqlite::SqlitePoolOptions, SqlitePool};
use std::path::PathBuf;

pub async fn get_db_path() -> PathBuf {
    let app_dir = dirs::data_local_dir()
        .expect("Failed to get local data directory")
        .join("com.satstone.bitfinances");
    
    std::fs::create_dir_all(&app_dir).expect("Failed to create app directory");
    
    app_dir.join("personal.db")
}

pub async fn init_db() -> Result<SqlitePool, sqlx::Error> {
    let db_path = get_db_path().await;
    let db_url = format!("sqlite:{}?mode=rwc", db_path.display());
    
    let pool = SqlitePoolOptions::new()
        .max_connections(5)
        .connect(&db_url)
        .await?;
    
    // Create entities table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS entities (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            entity_type TEXT NOT NULL CHECK(entity_type IN ('personal', 'family', 'business')),
            parent_id INTEGER,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (parent_id) REFERENCES entities(id) ON DELETE SET NULL
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Insert default Personal entity if not exists
    sqlx::query(
        r#"
        INSERT OR IGNORE INTO entities (id, name, entity_type) VALUES (1, 'Personal', 'personal')
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Create wallets table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS wallets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            xpub TEXT NOT NULL UNIQUE,
            wallet_type TEXT NOT NULL DEFAULT 'zpub',
            entity_id INTEGER NOT NULL DEFAULT 1,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (entity_id) REFERENCES entities(id) ON DELETE CASCADE
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Create transactions table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            wallet_id INTEGER NOT NULL,
            txid TEXT NOT NULL,
            amount_sats INTEGER NOT NULL,
            fee_sats INTEGER NOT NULL DEFAULT 0,
            fee_fiat REAL,
            fee_fiat_currency TEXT,
            confirmed INTEGER NOT NULL DEFAULT 0,
            block_height INTEGER,
            timestamp INTEGER,
            category TEXT,
            note TEXT,
            fiat_value REAL,
            fiat_currency TEXT,
            currency TEXT DEFAULT 'BTC',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (wallet_id) REFERENCES wallets(id) ON DELETE CASCADE,
            UNIQUE(wallet_id, txid)
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Add columns if they don't exist (migrations for existing DBs)
    let _ = sqlx::query("ALTER TABLE transactions ADD COLUMN fiat_value REAL")
        .execute(&pool)
        .await;
    let _ = sqlx::query("ALTER TABLE transactions ADD COLUMN fiat_currency TEXT")
        .execute(&pool)
        .await;
    let _ = sqlx::query("ALTER TABLE transactions ADD COLUMN fee_fiat REAL")
        .execute(&pool)
        .await;
    let _ = sqlx::query("ALTER TABLE transactions ADD COLUMN fee_fiat_currency TEXT")
        .execute(&pool)
        .await;
    let _ = sqlx::query("ALTER TABLE transactions ADD COLUMN currency TEXT DEFAULT 'BTC'")
        .execute(&pool)
        .await;
    
    // Create settings table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS settings (
            key TEXT PRIMARY KEY,
            value TEXT NOT NULL
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Insert default settings if not exist
    sqlx::query(
        r#"INSERT OR IGNORE INTO settings (key, value) VALUES ('currency_format', 'sats')"#,
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"INSERT OR IGNORE INTO settings (key, value) VALUES ('fiat_enabled', 'true')"#,
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"INSERT OR IGNORE INTO settings (key, value) VALUES ('fiat_currency', 'EUR')"#,
    )
    .execute(&pool)
    .await?;
    
    sqlx::query(
        r#"INSERT OR IGNORE INTO settings (key, value) VALUES ('cost_basis_method', 'average')"#,
    )
    .execute(&pool)
    .await?;
    
    // Create price_cache table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS price_cache (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            currency TEXT NOT NULL,
            price REAL NOT NULL,
            date TEXT NOT NULL,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(currency, date)
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Create categories table
    sqlx::query(
        r#"
        CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            is_system INTEGER NOT NULL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
        "#,
    )
    .execute(&pool)
    .await?;
    
    // Insert default categories
    let default_categories = vec![
        ("Uncategorized", true),
        ("Buy", true),
        ("Sell", true),
        ("Transfer In", true),
        ("Transfer Out", true),
        ("Income", false),
        ("Gift", false),
        ("Food", false),
        ("Utilities", false),
        ("Shopping", false),
        ("Trading Gain", false),
        ("Trading Loss", false),
        ("Mining", false),
        ("Lending Interest (Income)", false),
        ("Lending Interest (Cost)", false),
        ("Receive Loan", false),
        ("Repay Loan", false),
        ("Liquidation", false),
    ];

    for (name, is_system) in default_categories {
        sqlx::query(
            "INSERT OR IGNORE INTO categories (name, is_system) VALUES (?, ?)"
        )
        .bind(name)
        .bind(is_system)
        .execute(&pool)
        .await?;
    }
    
    Ok(pool)
}