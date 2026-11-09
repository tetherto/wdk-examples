# Deploy status (checkpoint)

Last updated: 2026-05-21. Resume multi-chain deploy when deployer has gas.

## Live on mainnet

| Network | Factory | Registry |
|---------|---------|----------|
| **BSC** | `0x70648Cc55D6e587967380cA481BBDe1dc79bFfE0` | `0x187D951ed96b6cB8734A2eEe0d91C0cd24eD17fb` |

Configured in `public/escrow.json`. Fee: 50 bps → `0x48E07a92A870F7474b67683b6dBb32E619d88C7a`.

## Pending (factory `0x000…`)

| Network | USDT | Approx. gas to fund deployer |
|---------|------|------------------------------|
| Polygon | `0xc2132D05D31c914a87C6611C10748AEb04B58e8F` (6 dec) | ~2 POL |
| Arbitrum | `0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9` (6 dec) | ~0.0002 ETH |
| Ethereum | `0xdAC17F958D2ee523a2206206994597C13D831ec7` (6 dec) | ~0.001 ETH |

## Deployer wallet

Same key as BSC deploy: **`0x48E07a92A870F7474b67683b6dBb32E619d88C7a`**

Send native gas on each chain above, then run (from repo sibling folder `contracts/`):

```powershell
cd d:\Downloads\sovereign-wallet\contracts
.\tools\Deploy-All-Evm.ps1 -UpdateEscrowJson
cd ..\wdk-extension
npm run build:prod
```

Reload extension at `chrome://extensions`.

Single network:

```powershell
.\tools\Deploy-Dual.ps1 -Network polygon
```

`Deploy-Dual.ps1` sets the correct USDT per `-Network` (not the BSC address from `.env`).

## Local-only (not in GitHub extension repo)

- Solidity + Foundry: `d:\Downloads\sovereign-wallet\contracts\`
- Deploy scripts: `contracts\tools\Deploy-Dual.ps1`, `Deploy-All-Evm.ps1`, `Update-Escrow-From-Broadcast.ps1`
- Secrets: `contracts\.env` (never commit)

## Extension / UI (saved on GitHub)

- Escrow UI: **Create** / **Join** only (no in-wallet Setup wizard)
- BSC: **live** in network dropdown; other EVM: **pending**
- BTC / SOL: **coming soon** for escrow

## After deploy checklist

- [ ] `Update-Escrow-From-Broadcast.ps1` updated `public/escrow.json` (only chains with real tx hashes)
- [ ] `npm run build:prod`
- [ ] Extension reload
- [ ] Small test OTC on each new chain

See also [ESCROW.md](./ESCROW.md), [KILAVUZ-ESCROW-TR.md](./KILAVUZ-ESCROW-TR.md).
