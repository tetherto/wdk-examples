/**
 * EVM ERC-4337 Example: Memory Management
 *
 * Demonstrates: Securely disposing ERC-4337 wallet accounts and the
 * wallet manager to clear private keys from memory.
 *
 * Run: npx tsx evm-4337/09-memory-management.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Memory Management (ERC-4337)')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    entryPointAddress: config.entryPointAddress,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  console.log('  Smart account created:', address)

  account.dispose()
  console.log('  Account disposed (private key cleared)')

  wallet.dispose()
  console.log('  Wallet manager disposed (all keys cleared)')

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
