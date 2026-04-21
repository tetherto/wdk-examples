/**
 * TON Example: Check Balances
 *
 * Demonstrates: Querying native TON and Jetton balances for an owned account.
 *
 * Run: npx tsx wallet-ton/check-balances.ts
 */

import WalletManagerTon from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult, formatNanotons } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Check Balances (Owned Account)')

  const wallet = new WalletManagerTon(config.seedPhrase, {
    tonClient: config.tonClient,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Account', { address: await account.getAddress() })

  const balance = await account.getBalance()
  logResult('Native Balance', { balance: formatNanotons(balance) })

  const tokenBalance = await account.getTokenBalance(config.jettonAddress)
  logResult('Jetton Balance', {
    contract: config.jettonAddress,
    balance: `${tokenBalance} (base units)`,
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
