## Summary

Adds a **runnable** `browser-extension-sovereign-wallet/` example for the [Browser Extension Starter](https://tether.dev/grants/bounties/) grant ($4,000 USD₮).

Self-custodial Chrome/Brave MV3 wallet using `@tetherto/wdk` with **EVM, Bitcoin (Blockbook), and Solana** — encrypted vault, popup UX, and `window.wdk` content provider.

Rebased onto latest `main` (includes WalletConnect walletkit row).

## Grant deliverables

- [x] MV3 service worker + popup + content script
- [x] `@tetherto/wdk` + EVM/BTC/Solana wallet managers
- [x] PBKDF2 + AES-256-GCM vault, session lock
- [x] Create / import / unlock, portfolio, send / receive
- [x] `window.wdk` EIP-1193-style provider (origin-gated)
- [x] Full runnable source in wdk-examples (not index-only)
- [x] Architecture docs: `docs/ARCHITECTURE.md`
- [x] Screenshots in `docs/screenshots/`
- [x] Demo video link in `docs/demo/README.md`
- [x] Apache-2.0 LICENSE

## Verify locally

```bash
cd browser-extension-sovereign-wallet
npm install
npm run build:prod
```

Load `dist/` in `chrome://extensions` (Developer mode → Load unpacked).

## Differentiators

- Multi-chain in one extension (EVM × 4 chains + BTC + Solana)
- Full source in wdk-examples — clone, build, load
- Canonical repo for ongoing development: https://github.com/001453/Sovereign-wallet

## Docs

- [README](./browser-extension-sovereign-wallet/README.md)
- [Architecture](./browser-extension-sovereign-wallet/docs/ARCHITECTURE.md)
- [Grant checklist](./browser-extension-sovereign-wallet/docs/GRANT_APPLICATION.md)

## License

Apache-2.0
