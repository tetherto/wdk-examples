# WalletConnect WalletKit Example

Example integrating [Reown WalletKit](https://docs.reown.com/walletkit/overview)
with [WDK](https://docs.wdk.tether.io/) to answer WalletConnect signing requests.
A self-contained script runs an in-process dApp and wallet, pairs them over the
WalletConnect relay, and exercises EVM + Solana message signing.

| Example | Description |
|---------|-------------|
| [Signing Flow](./signing-flow.ts) | Pair a dApp and WDK wallet over WalletConnect and handle `personal_sign`, `eth_signTypedData_v4`, and `solana_signMessage` |

> Requires a free `WALLETCONNECT_PROJECT_ID` from https://dashboard.walletconnect.com — set it in `.env` before running.

## API Reference

[docs.wdk.tether.io/sdk/core-module/api-reference](https://docs.wdk.tether.io/sdk/core-module/api-reference)
