# EVM Bermuda Examples

Examples for the [`@bermuda/wdk-wallet-evm-bermuda`](https://github.com/bermudabay/wdk-wallet-evm-bermuda) package: shielded deposits, transfers and withdrawals for EVM wallets. The package currently supports Plasma testnet only.

| Example | Description |
|---------|-------------|
| [Create Wallet](./create-wallet.ts) | Initialize a wallet manager and derive the master EVM account and its default Bermuda account |
| [Manage Accounts](./manage-accounts.ts) | Derive multiple Bermuda accounts by BIP-44 and Bermuda account index |
| [Check Balances](./check-balances.ts) | Query the shielded ERC-20 token balance of an owned account |
| [Deposit](./deposit.ts) | Shield native XPL into the Bermuda account, and handle an insufficient balance |
| [Transfer](./transfer.ts) | Transfer shielded funds to another Bermuda account, with a memo |
| [Withdraw](./withdraw.ts) | Unshield funds to the master EVM account |

## Before You Run

- Node.js 20.19 or later is required.
- The package is installed from GitHub and depends on the Bermuda SDK's tarball URL. npm 12 and later refuse both by default, so this folder's [`.npmrc`](./.npmrc) allows them (`allow-git=root`, `allow-remote=all`).
- `npm run example:create-wallet` prints the master EVM account. Fund it with testnet XPL: it pays for deposits and their network fees.
- Deposit, transfer and withdraw send real Plasma testnet transactions. Unlike most other examples in this repo, they don't wait for `ACTUALLY_SEND=true`. Run the deposit first: transfers and withdrawals spend the shielded balance it creates.
- The examples cache the pool's state and the account's UTXOs in the OS temp directory, so only the first run syncs the pool's history. A balance read right after a transaction can lag it by up to a block.

## Upgrading from `@bermuda/wdk-wallet-bermuda` 0.1.x

Version 0.3.2 targets a new deployment of the Bermuda pool. Funds shielded with 0.1.x stay in the previous pool, so withdraw them with 0.1.x first. Bermuda addresses change too. See "Upgrading from 0.1.x" in the [package README](https://github.com/bermudabay/wdk-wallet-evm-bermuda#readme) for all changes.

## API Reference

[github.com/bermudabay/wdk-wallet-evm-bermuda](https://github.com/bermudabay/wdk-wallet-evm-bermuda#readme)
