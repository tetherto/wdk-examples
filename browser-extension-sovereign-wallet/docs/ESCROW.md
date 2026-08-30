# Sovereign Escrow — OTC (multi-EVM)

Non-custodial **USDT ↔ any ERC-20/BEP-20** swap: both parties accept, both deposit, then **atomic settle**. No admin on deals.

> **Turkish guide:** [KILAVUZ-ESCROW-TR.md](./KILAVUZ-ESCROW-TR.md) — Foundry deploy, `escrow.json`, extension build, full OTC flow.

## Supported networks

| Network | Wallet + escrow UI | USDt decimals | Factory in repo |
|---------|-------------------|---------------|-----------------|
| Ethereum | ✓ | 6 | placeholder (`0x0…`) |
| Polygon | ✓ | 6 | placeholder |
| Arbitrum | ✓ | 6 | placeholder |
| BNB Smart Chain (BSC) | ✓ | 18 | **live** (see below) |
| Bitcoin / Solana | Wallet only | — | **Coming soon** (see `comingSoon` in `escrow.json`) |

All four EVM chains are listed in `escrow.json` → `evmChains` with canonical **USDT** addresses. Escrow deals work only where `factory` is non-zero (currently **BSC**). Each trade deploys a new **DualAssetDealEscrow** from that chain’s factory.

## Live deployments (mainnet)

| Network | DualFactory | Registry |
|---------|-------------|----------|
| **BSC** | [`0x70648Cc55D6e587967380cA481BBDe1dc79bFfE0`](https://bscscan.com/address/0x70648Cc55D6e587967380cA481BBDe1dc79bFfE0) | [`0x187D951ed96b6cB8734A2eEe0d91C0cd24eD17fb`](https://bscscan.com/address/0x187D951ed96b6cB8734A2eEe0d91C0cd24eD17fb) |

Configured in `public/escrow.json`: `protocolFeeBps` **50** (0.5%), `protocolFeeRecipient` set at deploy time.

Other EVM chains: deploy with Foundry (see below), then `.\tools\Update-Escrow-From-Broadcast.ps1` and rebuild.

### Deploy other EVM chains (operator)

Deployer wallet (same key as BSC): `0x48E07a92A870F7474b67683b6dBb32E619d88C7a` — must hold **native gas on each chain**.

| Network | Approx. gas needed (forge estimate) |
|---------|-------------------------------------|
| Polygon | ~1.5 POL |
| Arbitrum | ~0.0001 ETH |
| Ethereum | ~0.0005 ETH |

```powershell
cd contracts
# Fund deployer on polygon / arbitrum / ethereum first
.\tools\Deploy-All-Evm.ps1 -UpdateEscrowJson
cd ..\wdk-extension
npm run build:prod
```

`Deploy-Dual.ps1` always sets the correct **USDT** per `-Network` (not the BSC address from `.env`).

## Wallet UI (extension)

After `npm run build:prod` and loading `dist/`:

1. Unlock wallet in the popup.
2. **Settings → Sovereign Escrow** (or open `chrome-extension://…/escrow/index.html`).
3. Choose **Network** (e.g. BNB Smart Chain).
4. **Create** — new OTC deal, or **Join** — existing deal address.

Deploy / Foundry / `escrow.json` editing is **documentation only** (this file and the Turkish guide), not a tab inside the wallet.

You should see **Live on … · factory 0x7064…** on BSC when `escrow.json` is loaded. If not: reload the extension at `chrome://extensions` and reopen Escrow.

## Quick start (operators)

### 1. Contracts (Foundry)

Contracts live in the sibling `contracts/` folder (not shipped inside this npm package). Example:

```bash
cd contracts
forge install foundry-rs/forge-std --no-commit
# .env: MNEMONIC or PRIVATE_KEY, never commit
forge test
# Windows: .\tools\Deploy-Dual.ps1 -Network bsc
# Or: forge script script/DeployDual.s.sol --rpc-url https://bsc-dataseed.binance.org --broadcast
```

Use the correct **USDT** address per chain (BSC: `0x55d398326f99059fF775485246999027B3197955`, 18 decimals).

### 2. Configure `escrow.json`

Edit `wdk-extension/public/escrow.json` with factory/registry per network and `protocolFeeRecipient`.

### 3. Build and load extension

```bash
cd wdk-extension
npm install
npm run build:prod
```

Chrome → Developer mode → **Load unpacked** → `wdk-extension/dist`.

## User flow (dual-asset OTC)

1. Creator calls `createOtcDeal` on **DualAssetEscrowFactory** (buyer, seller, trade token, amounts, funding deadline, fee, terms hash).
2. **Both** call `acceptTerms()` on the new **DualAssetDealEscrow** (Join tab).
3. Buyer: `approve` USDT → `depositUsdt()`.
4. Seller: `approve` trade token → `depositToken()`.
5. When both deposited, contract **settles** (USDT → seller, token → buyer, fee to `feeRecipient`).
6. After `fundingDeadline` without full deposit → `claimRefund()`.
7. Optional: `requestCancel()` per contract rules.

## Repo layout

| Path | Role |
|------|------|
| `../contracts/src/DualAsset*.sol` | OTC factory + deal (sibling repo folder) |
| `escrow-app/` | Escrow UI → `dist/escrow/` |
| `src/config/escrow.js` | Per-chain config + ABIs |
| `src/background/escrow-service.js` | Encode / read deals |
| `public/escrow.json` | Published factory addresses |

## Decentralization

- **DualAssetDealEscrow**: no owner; funds move only per terms + time.
- **DualAssetEscrowFactory**: deploys deals only; cannot pull from existing deals.
- **EscrowRegistry**: immutable `factory` pointer for wallet allowlist.

End users only need the extension + `escrow.json` addresses; deploy keys are not required in the wallet.

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| “Escrow is not available on this network” | Deploy factory for that chain and update `escrow.json`, then rebuild |
| Factory line missing on BSC | Reload extension; ensure `escrow.json` has non-zero BSC addresses |
| Content script / https error | Open Escrow from the extension (not `file://`); reload after update |
| Wrong USDT amount on BSC | BSC USDT uses **18** decimals; enter human-readable amounts in the form |
| Seller deposit fails | Match token `decimals` in the form; approve + deposit from Join |
