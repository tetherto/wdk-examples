/**
 * TRON Example: Read-Only Account
 *
 * Demonstrates: Creating a WalletAccountReadOnlyTron to monitor any
 * address without needing a private key.
 *
 * Run: npx tsx wallet-tron/read-only-account.ts
 */

import { WalletAccountReadOnlyTron } from '@tetherto/wdk-wallet-tron'
import { loadTronConfig } from '../shared/config.js'
import { logSection, logResult, formatSun } from '../shared/helpers.js'

async function main() {
  const config = loadTronConfig()

  logSection('Read-Only Account')

  const readOnlyAccount = new WalletAccountReadOnlyTron(config.recipientAddress, {
    provider: config.provider,
  })

  logResult('Watching Address', { address: await readOnlyAccount.getAddress() })

  const balance = await readOnlyAccount.getBalance()
  logResult('Native Balance', { balance: formatSun(balance) })

  const tokenBalance = await readOnlyAccount.getTokenBalance(config.tokenContract)
  logResult('TRC20 Token Balance', {
    contract: config.tokenContract,
    balance: `${tokenBalance} (base units)`,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
