# Wallet Auth — pre-transaction condition checks

Runnable examples demonstrating the `WalletAuthProtocol` shape proposed in [tetherto/wdk#46](https://github.com/tetherto/wdk/issues/46) — a fifth protocol base class alongside `SwapProtocol`, `BridgeProtocol`, `LendingProtocol`, and `FiatProtocol`.

A wallet auth protocol answers a pre-transaction question: *given a wallet and a set of on-chain conditions, return a cryptographically signed pass/fail before the transaction is built.* These examples call [InsumerAPI](https://insumermodel.com) as the reference verifier.

## Examples

| File | Demonstrates |
|------|-------------|
| [`condition-check.ts`](./condition-check.ts) | Single-condition pre-transaction check (USDC balance) |
| [`condition-stack.ts`](./condition-stack.ts) | Stacked conditions (token balance + NFT ownership) in one attestation |
| [`verify-attestation.ts`](./verify-attestation.ts) | Request JWT-format attestation and verify offline against JWKS |

## Setup

```bash
cp .env.example .env
# Then add WALLET_AUTH_API_KEY to .env
npm install
```

Get a free API key (10 credits, no signup wall):

```bash
curl -X POST https://api.insumermodel.com/v1/keys/create \
  -H 'content-type: application/json' \
  -d '{"email":"you@example.com","appName":"WDK Example","tier":"free"}'
```

## Run

```bash
npm run example:wallet-auth:condition-check
npm run example:wallet-auth:condition-stack
npm run example:wallet-auth:verify-attestation
```

Each attestation consumes 1 credit; `validate:wallet-auth` runs all three examples and consumes 3 credits per run.

## Pattern

The samples use InsumerAPI as the reference verifier. `WalletAuthProtocol` follows the abstract-base-class pattern of the existing WDK protocols — `SwapProtocol` / `BridgeProtocol` / `LendingProtocol` / `FiatProtocol` each have one or more reference impls behind a shared interface.
