# BitCounting

<p align="center">
  <svg width="420" height="140" viewBox="0 0 420 140" xmlns="http://www.w3.org/2000/svg">
  <style>
    text {
      font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      font-weight: bold;
      letter-spacing: -0.015em;
    }
  </style>
  
  <text x="30" y="95" font-size="92" fill="#f7931a">Bit</text>
  <text x="30" y="95" font-size="92" fill="#333">
    <tspan dx="118">Counting</tspan>
  </text>
</svg>
</p>

<p align="center">
  <strong>Privacy-focused Bitcoin financial management for individuals, families, and businesses.</strong>
</p>

<p align="center">
  <a href="https://github.com/Sat-Stone/BitCounting/releases/latest">
    <img src="https://img.shields.io/github/v/release/Sat-Stone/BitCounting" alt="Latest Release">
  </a>
  <a href="https://github.com/Sat-Stone/BitCounting/blob/main/LICENSE">
    <img src="https://img.shields.io/github/license/Sat-Stone/BitCounting" alt="License">
  </a>
</p>

---

## ✨ Features

- **100% Privacy** - All data stored locally with AES-256 encryption
- **Offline-first** - Works without internet, sync when you want
- **Bitcoin-native** - Display everything in BTC/sats, fiat is optional
- **Multi-account** - Track Personal, Family, and Business wallets separately
- **No private keys** - Only uses xpub/zpub for watch-only tracking
- **CSV Import** - Import from exchanges (Bull Bitcoin, LN Markets, etc.)
- **P&L Tracking** - Realized/unrealized gains with cost basis methods

## 📥 Download

| Platform | Download |
|----------|----------|
| macOS | [BitCounting.dmg](https://github.com/Sat-Stone/BitCounting/releases/latest) |
| Windows | Coming soon |
| Linux | Coming soon |

### macOS Installation Note

Since the app is not signed with an Apple Developer certificate, you may see a security warning:

1. Download the `.dmg` file
2. Open it and drag BitCounting to Applications
3. **First launch:** Right-click the app → "Open" → Click "Open" in the dialog
4. After first launch, it will open normally

## 🔒 Security

- **Local-only storage** - Your data never leaves your device
- **AES-256 encryption** - Protect your database with a passphrase
- **12-word recovery** - BIP39 mnemonic backup for your encryption
- **No telemetry** - Zero tracking, zero analytics
- **Open source** - Audit the code yourself

## 🛠 Tech Stack

- **Backend:** Rust + Tauri v2
- **Frontend:** Svelte 5
- **Database:** SQLite with SQLCipher encryption
- **Bitcoin:** BIP32/44/49/84/86 address derivation

## 🏗 Building from Source

### Prerequisites

- [Node.js](https://nodejs.org/) 18+
- [Rust](https://rustup.rs/) 1.70+
- [Tauri CLI](https://tauri.app/v1/guides/getting-started/prerequisites)

### Build

```bash
# Clone the repository
git clone https://github.com/Sat-Stone/BitCounting.git
cd BitCounting

# Install dependencies
npm install

# Run in development
npm run tauri dev

# Build for production
npm run tauri build
```

## 📖 Documentation

- [User Guide](docs/USER_GUIDE.md) (coming soon)
- [CSV Import Formats](docs/CSV_FORMATS.md) (coming soon)
- [Contributing](CONTRIBUTING.md)

## 🤝 Contributing

Contributions are welcome! Please read our [Contributing Guide](CONTRIBUTING.md) first.

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## ⚠️ Disclaimer

This software is for informational purposes only. It is not financial advice. Always verify your transaction data against original sources. The developers are not responsible for any financial decisions made based on this software.

---

<p align="center">
  Made with 🧡 for the Bitcoin community
</p>
