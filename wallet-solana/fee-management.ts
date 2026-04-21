/**
 * Solana Example: Fee Management
 *
 * Demonstrates: Retrieving current network fee rates with getFeeRates().
 *
 * Run: npx tsx wallet-solana/fee-management.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection, logResult, formatLamports } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Fee Management')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const feeRates = await wallet.getFeeRates()
  logResult('Current Fee Rates', {
    normal: formatLamports(feeRates.normal),
    fast: formatLamports(feeRates.fast),
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
