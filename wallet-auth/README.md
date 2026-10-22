# Wallet Auth Examples

Examples that use [`@insumermodel/wdk-protocol-wallet-auth`](https://github.com/douglasborthwick-crypto/wdk-protocol-wallet-auth) as a condition in the [`@tetherto/wdk`](https://github.com/tetherto/wdk) transaction policy engine.

A wallet auth check evaluates a wallet against on-chain conditions (token balances, NFT ownership, attestations) and returns a signed pass/fail result from InsumerAPI. As a policy condition it runs before anything is signed locally, and the signed result can be re-verified later against a public key set.

| Example | Description |
|---------|-------------|
| [Policy Gate](./policy-gate.ts) | Deny an ERC-20 transfer unless the recipient meets an on-chain condition, and simulate the decision for a passing and a failing recipient |
| [Verify Attestation](./verify-attestation.ts) | Request the result as a JWT and verify its ES256 signature locally against the public JWKS |

## Setup

Add an InsumerAPI key to `.env` as `INSUMER_API_KEY`. To create a free one:

```bash
curl -X POST https://api.insumermodel.com/v1/keys/create \
  -H "Content-Type: application/json" \
  -d '{"email":"you@example.com","appName":"wdk-examples","tier":"free"}'
```

Each wallet auth check uses one verification credit: `policy-gate` uses two per run (one more with `ACTUALLY_SEND=true`), `verify-attestation` uses one.

## How the policy behaves

- The DENY rule fails closed: if the check throws or times out, the engine blocks the transfer.
- Governed accounts are default-deny, so the policy pairs the DENY rule with an ALLOW rule for transfers that clear it.
- `account.simulate.transfer(...)` returns the decision without executing anything. Set `ACTUALLY_SEND=true` to send a real transfer through the governed account.

## API Reference

- [WDK transaction policies](https://github.com/tetherto/wdk#transaction-policies)
- [InsumerAPI reference](https://insumermodel.com/developers/api-reference/)
