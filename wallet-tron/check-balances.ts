/**
 * TRON Example: Check Balances
 *
 * Demonstrates: Querying native TRX and TRC20 token balances for an owned account.
 *
 * Run: npx tsx wallet-tron/check-balances.ts
 */

import WalletManagerTron from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection, logResult, formatSun } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Check Balances (Owned Account)')

  const wallet = new WalletManagerTron(config.seedPhrase, {
    provider: config.provider,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Account', { address: await account.getAddress() })

  const balance = await account.getBalance()
  logResult('Native Balance', { balance: formatSun(balance) })

  const tokenBalance = await account.getTokenBalance(config.tokenContract)
  logResult('TRC20 Token Balance', {
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
