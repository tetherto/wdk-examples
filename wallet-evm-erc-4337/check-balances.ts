/**
 * EVM ERC-4337 Example: Check Balances
 *
 * Demonstrates: Querying native token and ERC-20 balances for a
 * smart account (ERC-4337).
 *
 * Run: npx tsx evm-4337/03-check-balances.ts
 */

import WalletManagerEvmErc4337 from '@tetherto/wdk-wallet-evm-erc-4337'
import { loadErc4337Config } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadErc4337Config()

  logSection('Check Balances (ERC-4337 Smart Account)')

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
  logResult('Smart Account', { address })

  const balance = await account.getBalance()
  logResult('Native Balance', { balance: formatWei(balance) })

  const tokenBalance = await account.getTokenBalance(config.tokenContract)
  logResult('ERC-20 Token Balance', {
    contract: config.tokenContract,
    balance: `${tokenBalance} (base units)`,
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
