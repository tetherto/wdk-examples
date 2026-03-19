# WDK Examples

Runnable code examples for [WDK (Wallet Development Kit)](https://docs.wdk.tether.io/) SDK modules.

Each example is a standalone TypeScript script that demonstrates a specific SDK capability. Examples are designed to run against live testnets and serve as the canonical reference linked from each SDK's README.

## Prerequisites

```bash
npm install
cp .env.example .env
# Fill in .env with your testnet RPC URLs, seed phrase, and contract addresses
```

## Modules

| Module | SDK Package | Examples |
|--------|-------------|----------|
| [wallet-evm](./wallet-evm/) | `@tetherto/wdk-wallet-evm` | Wallet creation, accounts, balances, transactions, token transfers, signing, fees |
| [wallet-evm-erc-4337](./wallet-evm-erc-4337/) | `@tetherto/wdk-wallet-evm-erc-4337` | Account abstraction wallets, UserOperations, paymaster modes, bundler integration |

## Running Examples

Run a single example:

```bash
npm run example:wallet-evm:create-wallet
```

Validate all examples for a module:

```bash
npm run validate:wallet-evm
npm run validate:wallet-evm-erc-4337
```

Validate everything:

```bash
npm run validate:all
```

Type-check all examples:

```bash
npm run typecheck
```

## Documentation

- [WDK Documentation](https://docs.wdk.tether.io/)
- [EVM API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm/api-reference)
- [EVM ERC-4337 API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm-erc-4337/api-reference)

## License

Apache License 2.0
