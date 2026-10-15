# Architecture — Sovereign Wallet browser extension

Chrome/Brave extension (Manifest V3) that wires [WDK](https://wdk.tether.io) into a popup + background service worker.

Chains are registered in `src/background/wdk-manager.js`. EVM chains share `@tetherto/wdk-wallet-evm` with different RPC URLs; Bitcoin uses Blockbook HTTP; Solana uses the public mainnet RPC from config.

---

## Layout

```
public/
  manifest.json
  popup.html          # UI markup
  popup.js            # popup logic (event delegation, no inline handlers)
  popup-qr.js         # QR bundle (webpack entry)
src/
  background/
    index.js          # message router, vault, session
    wdk-manager.js    # WDK init, balances, send
    transactions.js   # history helpers
  config/chains.js    # RPC URLs, token contract addresses
  content/index.js    # EIP-1193 provider on window.wdk
  lib/
    crypto.js
    messages.js
webpack.config.js
```

### Messages

Popup and content scripts talk to the service worker with `chrome.runtime.sendMessage({ type, payload })`. Types are defined in `background/index.js` (`WALLET_CREATE`, `GET_PORTFOLIO`, `SEND_TRANSACTION`, etc.).

Signing, decryption, and `WDK` instances live only in the background script.

### Storage

```
chrome.storage.local
  wdk_vault          encrypted mnemonic (AES-256-GCM)
  wdk_accounts       account indices / metadata
  wdk_tx_log         outbound txs (EVM/Solana; BTC uses WDK getTransfers)
```

Passwords and private keys are not written to `chrome.storage`.

---

## WDK usage

```javascript
import WDK from '@tetherto/wdk';
import WalletManagerEvm from '@tetherto/wdk-wallet-evm';
import WalletManagerBtc from '@tetherto/wdk-wallet-btc';

const wdk = new WDK(mnemonic)
  .registerWallet('ethereum', WalletManagerEvm, { provider: 'https://eth.drpc.org' })
  .registerWallet('bitcoin', WalletManagerBtc, {
    network: 'bitcoin',
    client: { type: 'blockbook-http', clientConfig: { url: 'https://btc1.trezor.io' } },
  });

const account = await wdk.getAccount('ethereum', 0);
await account.getAddress();
await account.getBalance();
```

Polygon, Arbitrum, and BNB Smart Chain are separate `registerWallet` calls with their own provider URLs (see `src/config/chains.js`).

### Dependencies

| Package | Role |
|---------|------|
| `@tetherto/wdk` | registers chain wallet managers |
| `@tetherto/wdk-wallet-evm` | Ethereum, Polygon, Arbitrum, BSC |
| `@tetherto/wdk-wallet-btc` | Bitcoin (BIP-84 default) |
| `@tetherto/wdk-wallet-solana` | Solana |
| `bip39` | mnemonic create/validate in background |
| `ethers` | formatting units in UI-facing responses |

The production bundle replaces Node-only pieces (Electrum TCP, `sodium-native`) with browser shims under `src/shims/`.

---

## Security

- Vault: PBKDF2-SHA256 (310k iterations) → AES-256-GCM for the mnemonic
- Session lock after 15 minutes (`chrome.alarms`)
- CSP on extension pages: `script-src 'self' 'wasm-unsafe-eval'` (required by WDK crypto WASM)
- Seed export requires password again

User-controlled strings in the popup go through `escapeHtml` before `innerHTML`; seed words use `textContent` only.

### dApp (`window.wdk`)

Content-script RPCs require the site origin to be listed in `wdk_preferences.connectedOrigins`. dApp calls from unconnected origins return empty accounts or “Site not connected” — no silent signing from arbitrary pages.

---

## Build and load

Requires Node 18+.

```bash
npm install
npm run build:prod   # output in dist/
```

`npm run dev` runs webpack in watch mode.

Load `dist/` via `chrome://extensions` → Developer mode → Load unpacked.

Icons are generated on `prebuild` (`npm run icons`).

---

## Adding a chain

Register another wallet manager on the shared `WDK` instance in `wdk-manager.js`, add RPC/token entries in `chains.js`, and extend the popup `NETWORKS` list if the UI should expose it.

Solana example:

```javascript
import WalletManagerSolana from '@tetherto/wdk-wallet-solana';

wdk.registerWallet('solana', WalletManagerSolana, {
  provider: ['https://api.mainnet-beta.solana.com', 'https://solana-rpc.publicnode.com'],
});
```

Protocols (swap, bridge, etc.) use `wdk.registerProtocol()` — not wired in this starter yet.

---

## License

Apache-2.0 — see [LICENSE](../LICENSE).
