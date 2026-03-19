/**
 * EVM ERC-4337 Example: Manage Accounts
 *
 * Demonstrates: Deriving multiple smart accounts by index and custom paths.
 *
 * Run: npx tsx evm-4337/02-manage-accounts.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Manage Multiple ERC-4337 Accounts')

  const wallet = new WalletManagerEvmErc4337(config.seedPhrase, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    entryPointAddress: config.entryPointAddress,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const account0 = await wallet.getAccount(0)
  const address0 = await account0.getAddress()
  logResult('Smart Account 0', { address: address0 })

  const account1 = await wallet.getAccount(1)
  const address1 = await account1.getAddress()
  logResult('Smart Account 1', { address: address1 })

  // Custom derivation path: m/44'/60'/0'/0/5
  const customAccount = await wallet.getAccountByPath("0'/0/5")
  const customAddress = await customAccount.getAddress()
  logResult('Custom Path (0\'/0/5)', { address: customAddress })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
