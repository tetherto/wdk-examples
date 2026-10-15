# Stable snapshot

| | |
|---|---|
| **Ref** | `main` (single release line) |
| **Manifest** | 1.0.1 |
| **Date** | 2026-05-31 |
| **Branch** | `main` |

Working set: grant application submitted, wdk-examples PR [#11](https://github.com/tetherto/wdk-examples/pull/11), dApp RPC origin checks, send presets, HD accounts.

## Restore later

```bash
git clone https://github.com/001453/Sovereign-wallet.git
cd Sovereign-wallet
git checkout main
npm install
npm run build:prod
```

Load `dist/` in Chrome. `node_modules/` and `dist/` are not in git — run install + build after clone.
