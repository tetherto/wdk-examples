# Maintainer issue draft

Copy the title and body below into a new issue at:
https://github.com/tetherto/wdk-examples/issues/new

---

**Title:**

```
Browser Extension Starter grant submission — Sovereign Wallet (PR #11)
```

**Body:**

```markdown
## Summary

Grant submission for the [Browser Extension Starter](https://tether.dev/grants/bounties/) ($4,000 USD₮).

PR: https://github.com/tetherto/wdk-examples/pull/11

The PR adds a **runnable** `browser-extension-sovereign-wallet/` example with full MV3 source (not index-only). It demonstrates WDK in a service worker with EVM, Bitcoin (Blockbook), and Solana managers, encrypted vault, popup UX, and `window.wdk` content provider.

## Verify locally

```bash
git fetch origin pull/11/head:pr-11
git checkout pr-11
cd browser-extension-sovereign-wallet
npm install
npm run build:prod
```

Load `dist/` in `chrome://extensions` (Developer mode → Load unpacked).

## Deliverables

- [x] MV3 extension with WDK in background worker
- [x] Multi-chain: EVM + BTC + Solana
- [x] Encrypted vault + session lock
- [x] dApp provider (EIP-1193-style, origin-gated)
- [x] Architecture docs + screenshots
- [x] Apache-2.0

## Canonical repo

https://github.com/001453/Sovereign-wallet

Happy to address review feedback or rebase as needed. Thank you!
```
