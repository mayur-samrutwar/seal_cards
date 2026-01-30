# Anchor Program - Getter and Setter

A simple Solana program demonstrating getter and setter functionality with tests.

## Prerequisites

1. Install Solana CLI:
```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

2. Install Anchor:
```bash
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

3. Install dependencies:
```bash
npm install
# or
yarn install
```

## Setup

1. Generate a keypair (if you don't have one):
```bash
solana-keygen new
```

2. Set cluster to devnet:
```bash
solana config set --url devnet
```

3. Airdrop SOL for testing:
```bash
solana airdrop 2
```

## Build

```bash
anchor build
```

## Test

Run tests on devnet:
```bash
anchor test --skip-local-validator
```

Run tests on local validator:
```bash
anchor test
```

## Deploy to Devnet

```bash
anchor deploy --provider.cluster devnet
```

## Program Functions

- `initialize(value: u64)` - Initialize a new data account with a value
- `set_value(new_value: u64)` - Update the value (requires authority)
- `get_value()` - Read the current value (view function)

## Test Coverage

The tests cover:
- ✅ Initializing with a value
- ✅ Getting the current value
- ✅ Setting a new value
- ✅ Authorization checks (unauthorized access fails)
