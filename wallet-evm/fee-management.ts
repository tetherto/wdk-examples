/**
 * EVM Example: Fee Management
 *
 * Demonstrates: Retrieving current network fee rates (normal and fast)
 * using getFeeRates(). Based on EIP-1559 base fee with multipliers.
 *
 * Run: npx tsx evm/08-fee-management.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Fee Management')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const feeRates = await wallet.getFeeRates()
  logResult('Current Fee Rates', {
    normal: formatWei(feeRates.normal),
    fast: formatWei(feeRates.fast),
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
