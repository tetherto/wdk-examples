/**
 * EVM ERC-4337 Example: Fee Management
 *
 * Demonstrates: Retrieving current bundler fee rates (normal and fast)
 * for UserOperations.
 *
 * Run: npx tsx evm-4337/08-fee-management.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Fee Management (ERC-4337 Bundler)')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    entryPointAddress: config.entryPointAddress,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const feeRates = await wallet.getFeeRates()
  logResult('Current Bundler Fee Rates', {
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
