/**
 * TRON Example: Fee Management
 *
 * Demonstrates: Retrieving current network fee rates with getFeeRates().
 *
 * Run: npx tsx wallet-tron/fee-management.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection, logResult, formatSun } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Fee Management')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const feeRates = await wallet.getFeeRates()
  logResult('Current Fee Rates', {
    normal: formatSun(feeRates.normal),
    fast: formatSun(feeRates.fast),
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
