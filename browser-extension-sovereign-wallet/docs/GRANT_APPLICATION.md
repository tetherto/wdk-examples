# Browser Extension Starter — Grant Application

**Grant:** [Browser Extension Starter](https://tether.dev/grants/bounties/) — $4,000 USD₮  
**Applicant:** [@001453](https://github.com/001453) / nihat çetinkaya  
**Apply at:** https://tether.dev/grants/bounties/

---

## Deliverable checklist

| Requirement | Status | Evidence |
|-------------|--------|----------|
| Manifest V3 browser extension | Done | `public/manifest.json`, `src/background/` |
| WDK integration in service worker | Done | `src/background/wdk-manager.js` |
| Multi-chain support | Done | EVM + Bitcoin (Blockbook) + Solana |
| Encrypted vault (self-custodial) | Done | PBKDF2 + AES-256-GCM in `src/lib/crypto.js` |
| Create / import / unlock UX | Done | `public/popup.js` |
| Send / receive flows | Done | Popup UI + QR receive |
| dApp provider (EIP-1193-style) | Done | `src/content/index.js` → `window.wdk` |
| Runnable in wdk-examples | Done | `browser-extension-sovereign-wallet/` |
| Architecture documentation | Done | [ARCHITECTURE.md](./ARCHITECTURE.md) |
| Demo media | Done | [demo/README.md](./demo/README.md) + screenshots |
| Apache-2.0 license | Done | [LICENSE](../LICENSE) |
| Build verified (`npm run build:prod`) | Done | CI / local build log in PR |

---

## Links for reviewers

- **wdk-examples PR:** https://github.com/tetherto/wdk-examples/pull/11
- **Canonical repo:** https://github.com/001453/Sovereign-wallet
- **Quick start:** clone wdk-examples → `cd browser-extension-sovereign-wallet` → `npm install && npm run build:prod` → load `dist/` in Chrome

---

## Differentiators vs. other starters

- **Multi-chain in one MV3 extension:** EVM (4 chains) + Bitcoin Blockbook + Solana
- **Full runnable source** in wdk-examples (not index-only)
- **Production security patterns:** session lock, origin-gated dApp RPCs, MV3 CSP with WASM

---

## Application text (copy/paste for tether.dev)

```
Project: Sovereign Wallet — WDK Browser Extension Starter

I built a self-custodial Chrome/Brave MV3 wallet using @tetherto/wdk with EVM,
Bitcoin (Blockbook), and Solana support. The extension includes an encrypted
vault, popup UX (create/import/unlock/send/receive), and a content-script
window.wdk provider with origin gating.

Deliverable: runnable browser-extension-sovereign-wallet/ example in wdk-examples
with full source, architecture docs, screenshots, and build instructions.

PR: https://github.com/tetherto/wdk-examples/pull/11
Repo: https://github.com/001453/Sovereign-wallet

Build: cd browser-extension-sovereign-wallet && npm install && npm run build:prod
Load dist/ in chrome://extensions (Developer mode).

License: Apache-2.0
```
