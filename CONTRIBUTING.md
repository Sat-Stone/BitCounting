# Contributing to BitCounting

Thank you for your interest in contributing to BitCounting! This document provides guidelines and instructions for contributing.

## Code of Conduct

- Be respectful and inclusive
- Focus on constructive feedback
- Help others learn and grow

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/Sat-Stone/BitCounting/issues)
2. If not, create a new issue with:
   - Clear description of the bug
   - Steps to reproduce
   - Expected vs actual behavior
   - Your OS and app version

### Suggesting Features

1. Check existing [Issues](https://github.com/Sat-Stone/BitCounting/issues) and [Discussions](https://github.com/Sat-Stone/BitCounting/discussions)
2. Create a new issue with the `enhancement` label
3. Describe the feature and its use case

### Submitting Code

1. **Fork** the repository
2. **Clone** your fork locally
3. **Create a branch** for your changes:
   ```bash
   git checkout -b feature/your-feature-name
   ```
4. **Make your changes** following our code style
5. **Test** your changes thoroughly
6. **Commit** with clear messages:
   ```bash
   git commit -m "feat: add amazing feature"
   ```
7. **Push** to your fork:
   ```bash
   git push origin feature/your-feature-name
   ```
8. **Open a Pull Request** against `main`

## Code Style

### Rust
- Follow standard Rust conventions
- Run `cargo fmt` before committing
- Run `cargo clippy` and fix warnings

### TypeScript/Svelte
- Use TypeScript strict mode
- Follow existing patterns in the codebase
- Use meaningful variable names

### Commits
We follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation
- `style:` - Formatting (no code change)
- `refactor:` - Code restructuring
- `test:` - Adding tests
- `chore:` - Maintenance tasks

## Pull Request Guidelines

- Keep PRs focused on a single change
- Update documentation if needed
- Add tests for new features
- Ensure all tests pass
- Wait for code review before merging

## Development Setup

```bash
# Install dependencies
npm install

# Run development server
npm run tauri dev

# Run tests
cargo test --manifest-path src-tauri/Cargo.toml
```

## Security

If you discover a security vulnerability, please **do not** open a public issue. Instead, email security concerns to [satstone@pm.me] or use GitHub's private vulnerability reporting.

## Questions?

Feel free to open a [Discussion](https://github.com/Sat-Stone/BitCounting/discussions) for questions or ideas!

---

Thank you for contributing! 🧡