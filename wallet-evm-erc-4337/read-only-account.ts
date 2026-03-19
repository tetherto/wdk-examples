/**
 * EVM ERC-4337 Example: Read-Only Account
 *
 * Demonstrates: Creating a WalletAccountReadOnlyEvmErc4337 to
 * monitor a smart account without a private key.
 *
 * Run: npx tsx evm-4337/04-read-only-account.ts
 */

import { WalletAccountReadOnlyEvmErc4337 } from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Read-Only ERC-4337 Account')

  const readOnlyAccount = new WalletAccountReadOnlyEvmErc4337(config.recipientAddress, {
    chainId: config.chainId,
    provider: config.rpcUrl,
    bundlerUrl: config.bundlerUrl,
    entryPointAddress: config.entryPointAddress,
    safeModulesVersion: config.safeModulesVersion,
    useNativeCoins: true,
  })

  const address = await readOnlyAccount.getAddress()
  logResult('Watching Smart Account', { address })

  const balance = await readOnlyAccount.getBalance()
  logResult('Native Balance', { balance: formatWei(balance) })

  const tokenBalance = await readOnlyAccount.getTokenBalance(config.tokenContract)
  logResult('ERC-20 Token Balance', {
    contract: config.tokenContract,
    balance: `${tokenBalance} (base units)`,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
