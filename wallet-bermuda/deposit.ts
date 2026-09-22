/**
 * Bermuda Example: Fund a Bermuda account.
 *
 * Run: npx tsx wallet-bermuda/deposit.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs'

async function main() {
  const config = loadBermudaConfig()

  logSection('Deposit')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
    utxoCache: join(tmpdir(), 'wdk-wallet-bermuda-examples-utxo-cache.json'),
    fs
  })

  const account = await wallet.getBermudaAccount()

  // Funds the Bermuda account itself by default. You can set params.to to
  // designate a different deposit recipient or params.recipients for multiple
  // recipients.
  const txHash = await account.deposit({
    token: config.tokenContract,
    amount: 100n
  })
  logResult('Transaction Sent', { hash: txHash })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
