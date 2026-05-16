# Browser extension — Sovereign Wallet

Reference **Chrome / Brave Manifest V3** wallet built with [WDK](https://wdk.tether.io).

Canonical source (build, issues, releases):

**https://github.com/001453/Sovereign-wallet**

This folder indexes that project for the [WDK examples](https://github.com/tetherto/wdk-examples) collection. The full extension is maintained in the linked repository (not duplicated here).

## What it demonstrates

| Topic | Implementation |
|-------|----------------|
| Packaging | MV3 service worker, popup, content script |
| WDK | `@tetherto/wdk` with EVM, Bitcoin (Blockbook), Solana managers |
| Security | PBKDF2 + AES-256-GCM vault, session lock, MV3 CSP |
| UX | Create / import / unlock, portfolio, send / receive, HD accounts |
| dApps | `window.wdk` provider (EIP-1193-style); RPCs gated by connected site origin |

## Supported networks (current)

- **EVM:** Ethereum, Polygon, Arbitrum (native + USDt; XAUt on Ethereum)
- **Bitcoin:** BIP-84 via Blockbook HTTP
- **Solana:** mainnet RPC

## Quick start

```bash
git clone https://github.com/001453/Sovereign-wallet.git
cd Sovereign-wallet
npm install
npm run build:prod
```

Load the `dist/` directory in `chrome://extensions` (Developer mode → Load unpacked).

## Repository layout

| Path | Role |
|------|------|
| `src/background/` | Vault, session, WDK (`wdk-manager.js`) |
| `src/config/chains.js` | RPC URLs and token contracts |
| `public/popup.html`, `public/popup.js` | Popup UI |
| `src/content/index.js` | In-page `window.wdk` bridge |
| `docs/README.md` | Architecture and message flow |

## WDK packages

- `@tetherto/wdk`
- `@tetherto/wdk-wallet-evm`
- `@tetherto/wdk-wallet-btc`
- `@tetherto/wdk-wallet-solana`

## Demo assets

- Video and screenshots: see `docs/demo/` and `docs/screenshots/` in the main repository.

## License

Apache-2.0 (see [LICENSE](https://github.com/001453/Sovereign-wallet/blob/main/LICENSE) in the main repository).
