/**
 * TON Example: Fee Management
 *
 * Demonstrates: Retrieving current network fee rates with getFeeRates().
 *
 * Run: npx tsx wallet-ton/fee-management.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult, formatNanotons } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Fee Management')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const feeRates = await wallet.getFeeRates()
  logResult('Current Fee Rates', {
    normal: formatNanotons(feeRates.normal),
    fast: formatNanotons(feeRates.fast),
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
