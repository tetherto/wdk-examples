/**
 * EVM Example: Check Balances
 *
 * Demonstrates: Querying native token (ETH) and ERC-20 token balances
 * for an owned account.
 *
 * Run: npx tsx evm/03-check-balances.ts
 */

import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Check Balances (Owned Account)')

  const wallet = new WalletManagerEvm(config.seedPhrase, {
    provider: config.rpcUrl,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Account', { address })

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
