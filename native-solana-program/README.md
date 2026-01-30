# Native Solana Program

A simple Solana program built with native Rust (no Anchor framework) demonstrating getter and setter functionality.

## Why Native Solana?

- ✅ **No version conflicts** - Works directly with Solana 1.18.20 build tools
- ✅ **Full control** - Direct access to Solana program APIs
- ✅ **Lighter weight** - No framework overhead
- ✅ **Educational** - Understand how Solana programs work at a low level

## Comparison: Native vs Anchor

| Feature | Native Solana | Anchor |
|---------|--------------|--------|
| Setup Complexity | Medium | Low |
| Boilerplate | More | Less |
| Control | Full | Framework abstractions |
| Version Compatibility | Better | Can have conflicts |
| Learning Curve | Steeper | Gentler |

## Prerequisites

```bash
# Solana CLI (already installed)
solana --version

# Rust (already installed)
rustc --version
```

## Build

```bash
# Set PATH to Solana tools
export PATH="$HOME/.local/share/solana/solana-install/bin:$PATH"

# Build the program
cargo build-sbf

# Or use npm script
npm run build
```

## Deploy to Devnet

```bash
# Set cluster
solana config set --url devnet

# Deploy
solana program deploy target/deploy/native_solana_program.so

# Or use npm script
npm run deploy
```

## Program Instructions

- **0: Initialize** - Create a data account with an initial value
- **1: Set Value** - Update the stored value (requires authority)
- **2: Get Value** - Read the current value (read-only, logs to console)

## Test

```bash
# Run Rust tests
cargo test-sbf

# Run TypeScript tests (after deployment)
npm test
```

## How It Works

1. **Entrypoint**: `process_instruction` handles all program calls
2. **Instruction Parsing**: First byte determines the instruction type
3. **Account Management**: Manual account validation and data serialization
4. **Data Layout**: `[value: u64 (8 bytes), authority: Pubkey (32 bytes)]`

## Advantages of Native Approach

- No dependency on Anchor's version
- Works with any Solana CLI version
- Better understanding of Solana's internals
- More flexible for custom requirements
