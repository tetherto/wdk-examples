/**
 * Bermuda Example: Transfer from one's default to another Bermuda account,
 * here just a Bermuda sub account owned by the master EVM wallet.
 *
 * Run: npx tsx wallet-bermuda/transfer.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs'

async function main() {
  const config = loadBermudaConfig()

  logSection('Transfer')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
    utxoCache: join(tmpdir(), 'wdk-wallet-bermuda-examples-utxo-cache.json'),
    fs
  })

  // The spender Bermuda account - must have shielded funds.
  const account = await wallet.getBermudaAccount()
  // The recipient - here just another Bermuda account controlled by the master
  // EVM wallet.
  const subAccount = await wallet.getBermudaAccount(0, 1)

  // Also supports multiple .recipients as {to,amount,note?}[].
  const txHash = await account.transfer({
    to: subAccount.address,
    token: config.tokenContract,
    amount: 5n,
    // Transaction notes are optional and can be set on deposits and transfers.
    note: 'gmuda'
  })
  logResult('Transaction Sent', { hash: txHash })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
