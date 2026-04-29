# WDK Examples

Runnable code examples for [WDK (Wallet Development Kit)](https://docs.wdk.tether.io/) SDK modules.

Each folder contains small runnable examples for one WDK package or integration.

## Examples

| Folder | Package | Description |
|--------|---------|-------------|
| [wdk](./wdk/) | `@tetherto/wdk` | Core WDK setup, wallet registration, middleware, and transaction flow |
| [wallet-evm](./wallet-evm/) | `@tetherto/wdk-wallet-evm` | EVM wallets, balances, transactions, token transfers, signing, and fees |
| [wallet-evm-erc-4337](./wallet-evm-erc-4337/) | `@tetherto/wdk-wallet-evm-erc-4337` | ERC-4337 smart accounts, UserOperations, paymasters, and bundlers |
| [wallet-solana](./wallet-solana/) | `@tetherto/wdk-wallet-solana` | Solana wallets, balances, transactions, SPL tokens, signing, and fees |
| [wallet-ton](./wallet-ton/) | `@tetherto/wdk-wallet-ton` | TON wallets, balances, transactions, Jettons, signing, and fees |
| [wallet-tron](./wallet-tron/) | `@tetherto/wdk-wallet-tron` | TRON wallets, balances, transactions, TRC20 tokens, signing, and fees |
| [mcp-toolkit](./mcp-toolkit/) | `@tetherto/wdk-mcp-toolkit` | MCP server and LangChain agent examples for WDK tools |

## Run

Install dependencies and copy the sample environment:

```bash
npm install
cp .env.example .env
```

Run one example:

```bash
npm run example:wallet-evm:create-wallet
```

Validate examples:

```bash
npm run typecheck
npm run validate:wallet-evm
npm run validate:all
```

Most transaction examples quote by default. Set `ACTUALLY_SEND=true` only when using a funded test wallet.

## Documentation

- [WDK Documentation](https://docs.wdk.tether.io/)
- [WDK Core API Reference](https://docs.wdk.tether.io/sdk/core-module/api-reference)
- [EVM API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm/api-reference)
- [EVM ERC-4337 API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-evm-erc-4337/api-reference)
- [Solana API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-solana/api-reference)
- [TON API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-ton/api-reference)
- [TRON API Reference](https://docs.wdk.tether.io/sdk/wallet-modules/wallet-tron/api-reference)
- [MCP Toolkit API Reference](https://docs.wdk.tether.io/ai/mcp-toolkit/api-reference)

## License

Apache License 2.0
