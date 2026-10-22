/**
 * Bermuda Example: Fund a Bermuda account by shielding native XPL.
 *
 * Run: npx tsx wallet-evm-bermuda/deposit.ts
 */

import WalletManagerBermuda, { NATIVE_DEPOSIT_TOKEN } from '@bermuda/wdk-wallet-evm-bermuda'
import { TransactionError, TransactionErrorReason } from '@tetherto/wdk-wallet'
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

  // Shields the chain's native currency (XPL), which the pool wraps: the
  // Bermuda account receives WXPL. The master EVM account pays the amount, the
  // deposit fees on top of it, and the network fee.
  //
  // Funds the Bermuda account itself by default. You can set params.to to
  // designate a different deposit recipient or params.recipients for multiple
  // recipients.
  try {
    const txHash = await account.deposit({
      token: NATIVE_DEPOSIT_TOKEN,
      amount: 100n
    })
    logResult('Transaction Sent', { hash: txHash })
  } catch (error) {
    // Thrown before anything is sent if the master EVM account can't pay for
    // the deposit. Fund it with XPL (see create-wallet.ts) and try again.
    if (error instanceof TransactionError && error.reason === TransactionErrorReason.INSUFFICIENT_BALANCE) {
      logResult('Insufficient balance', error.message)
    } else {
      throw error
    }
  }

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
