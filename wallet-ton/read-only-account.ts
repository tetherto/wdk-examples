/**
 * TON Example: Read-Only Account
 *
 * Demonstrates: Creating a WalletAccountReadOnlyTon to monitor any
 * wallet with a public key.
 *
 * Run: npx tsx wallet-ton/read-only-account.ts
 */

import { WalletAccountReadOnlyTon } from '@tetherto/wdk-wallet-ton'
import { loadTonConfig } from '../shared/config.js'
import { logSection, logResult, formatNanotons } from '../shared/helpers.js'

async function main() {
  const config = loadTonConfig()

  logSection('Read-Only Account')

  const readOnlyAccount = new WalletAccountReadOnlyTon(config.readOnlyPublicKey, {
    tonClient: config.tonClient,
  })

  logResult('Watching Wallet', { address: await readOnlyAccount.getAddress() })

  const balance = await readOnlyAccount.getBalance()
  logResult('Native Balance', { balance: formatNanotons(balance) })

  const tokenBalance = await readOnlyAccount.getTokenBalance(config.jettonAddress)
  logResult('Jetton Balance', {
    contract: config.jettonAddress,
    balance: `${tokenBalance} (base units)`,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
