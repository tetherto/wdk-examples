/**
 * Bermuda Example: Withdraw from a private Bermuda account onto a public
 * Ethereum account.
 *
 * Run: npx tsx wallet-bermuda/withdraw.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs'

async function main() {
  const config = loadBermudaConfig()

  logSection('Withdraw')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
    utxoCache: join(tmpdir(), 'wdk-wallet-bermuda-examples-utxo-cache.json'),
    fs
  })

  // The spender Bermuda account - must have shielded funds.
  const account = await wallet.getBermudaAccount()

  // If not set the withdrawal recipient defaults to the associated public
  // Ethereum account.
  const txHash = await account.withdraw({
    token: config.tokenContract,
    amount: 25n,
  })
  logResult('Transaction Sent', { hash: txHash })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
