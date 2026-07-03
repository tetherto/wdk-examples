# Browser Extension Starter

A WXT + React starter for building a browser-extension wallet with WDK.

- Source: [th3nolo/wdk-browser-extension-starter-public](https://github.com/th3nolo/wdk-browser-extension-starter-public)
- Demo: [GitHub Pages showcase](https://th3nolo.github.io/wdk-browser-extension-starter-public/)
- Main WDK packages: `@tetherto/wdk`, `@tetherto/wdk-wallet-evm`, `@tetherto/wdk-wallet-btc`, `@tetherto/wdk-wallet-solana`, and `@tetherto/wdk-wallet-spark`

The starter shows a full extension app rather than a short script example. It keeps wallet execution in the extension background context, exposes a popup UI, injects an EIP-6963 provider for dApps, and routes dApp signatures and transactions through origin-scoped approval flows.

## What It Covers

- Local encrypted seed vaults with password lock and session timeout.
- Multiple wallets and multiple accounts per wallet.
- Account, balance, signing, and transaction flows through WDK wallet modules.
- Send and receive UX for configured assets and networks.
- Pending dApp approval storage for signatures and EVM transactions.
- Chrome extension build, browser smoke tests, and release packaging.

## Try It

```bash
git clone https://github.com/th3nolo/wdk-browser-extension-starter-public.git
cd wdk-browser-extension-starter-public
pnpm install
pnpm build
pnpm test
```

Load the generated extension from `.output/chrome-mv3` in Chrome or Brave.

## Reference Docs

- [Setup and build instructions](https://github.com/th3nolo/wdk-browser-extension-starter-public#quick-start)
- [Architecture](https://github.com/th3nolo/wdk-browser-extension-starter-public/blob/master/docs/ARCHITECTURE.md)
- [Security](https://github.com/th3nolo/wdk-browser-extension-starter-public/blob/master/docs/SECURITY.md)
- [Browser verification](https://github.com/th3nolo/wdk-browser-extension-starter-public/blob/master/docs/BROWSER_VERIFICATION.md)
