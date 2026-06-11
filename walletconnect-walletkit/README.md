# walletconnect-walletkit

Self-contained example showing how a [WDK](https://docs.wdk.tether.io/)-managed
wallet integrates with [Reown WalletKit](https://docs.reown.com/walletkit/overview)
to answer signing requests over the WalletConnect protocol.

Unlike the other examples in this repo, the dApp side is spun up in the same
script — `signing-flow.ts` runs an in-process `@walletconnect/sign-client`
dApp alongside a `@reown/walletkit` wallet, pairs them over the real
WalletConnect relay, exercises three signing methods, verifies each
signature, and exits.

## What it demonstrates

- Registering two **testnet** chains on one `WDK` instance
  (`sepolia` + `solana-devnet`). Mainnet is intentionally excluded to keep
  the example safe by default — no risk of broadcasting against real funds
  if someone extends the script.
- Initialising a `WalletKit` client on the wallet side.
- Initialising a `SignClient` on the dApp side (no browser involved).
- Pairing the two through `wc:` URI generation + `walletkit.pair`.
- Building the approved namespace via `@walletconnect/utils`
  `buildApprovedNamespaces`, intersecting the dApp's request with the
  wallet's support.
- Handling three signing requests end-to-end:
  - `personal_sign` on `eip155:11155111` — routed to `account.sign(message)` (WDK).
  - `eth_signTypedData_v4` on `eip155:11155111` — driven by an
    `ethers.Wallet` built from `account.keyPair.privateKey` because WDK
    does not expose EIP-712 signing directly.
  - `solana_signMessage` on `solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1`
    (Solana devnet) — routed to `account.sign(message)` (WDK), with
    hex → base58 re-encoding so the wire format matches the
    [WC Solana spec](https://docs.walletconnect.network/wallet-sdk/chain-support/solana).
- Verifying each signature on the dApp side:
  - `ethers.verifyMessage` / `ethers.verifyTypedData` for EVM.
  - `tweetnacl.sign.detached.verify` against the base58-decoded Solana
    public key.

## Run

From the repository root, set the env once:

```bash
cp .env.example .env
# Fill in WALLETCONNECT_PROJECT_ID (and tweak SEED_PHRASE if you wish)
```

Then install the sub-repo and run the flow:

```bash
cd walletconnect-walletkit
npm install
npm run example:signing-flow
```

You should see something like:

```
============================================================
  Setup WDK
============================================================

--- Derived addresses ---
  evm: 0x...
  solana: ...

============================================================
  Start wallet (WalletKit)
============================================================

============================================================
  Start dApp (SignClient)
============================================================

============================================================
  Pair
============================================================

--- Wallet approved session ---
  id: ...

--- Paired ---
  topic: ...

============================================================
  personal_sign (Ethereum)
============================================================

--- personal_sign ---
  signature: 0x...
  recovered: 0x...
  valid: true

…and so on for eth_signTypedData_v4 and solana_signMessage, ending with a
clean disconnect and `Done.`.
```

## Env

All values are required and have sensible defaults pre-filled in
`.env.example`:

| Variable                              | Default                                         |
| ------------------------------------- | ----------------------------------------------- |
| `SEED_PHRASE`                         | (shared with the rest of the repo's examples)   |
| `WALLETCONNECT_PROJECT_ID`            | — get one at https://dashboard.walletconnect.com |
| `WALLETCONNECT_SEPOLIA_RPC_URL`       | `https://ethereum-sepolia-rpc.publicnode.com`   |
| `WALLETCONNECT_SOLANA_DEVNET_RPC_URL` | `https://api.devnet.solana.com`                 |

The RPC URLs are only consulted by WDK when constructing a wallet manager;
this example signs only and does not broadcast, so the public defaults
are fine.

## Out of scope

- **Broadcast methods** (`eth_sendTransaction`, `solana_signAndSendTransaction`)
  are deliberately not exercised by this script — they require a funded
  testnet wallet and a real network round-trip, which doesn't fit the
  one-shot demo. WDK supports both via `account.sendTransaction(tx)` and
  they can be wired into a real-dApp variant of this example.
- **Sign-only-without-broadcast variants** (`eth_signTransaction`,
  `solana_signTransaction`, `solana_signAllTransactions`) — not exposed by
  WDK's high-level API.
- **WalletConnect Pay** — to be demonstrated separately.

## Plugging in your own key management

`@tetherto/wdk` keeps the seed in memory and derives accounts on demand. To
swap in your own custody (HSM, MPC, KMS), implement a wallet manager that
satisfies WDK's `WalletManager` interface and register it in place of
`WalletManagerEvm` / `WalletManagerSolana`.

## Documentation

- [Reown WalletKit](https://docs.reown.com/walletkit/overview)
- [WalletConnect EVM RPC spec](https://docs.walletconnect.network/wallet-sdk/chain-support/ethereum)
- [WalletConnect Solana RPC spec](https://docs.walletconnect.network/wallet-sdk/chain-support/solana)
- [WDK API Reference](https://docs.wdk.tether.io/)
