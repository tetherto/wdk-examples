/**
 * Bermuda Example: Check Balances
 *
 * Demonstrates: Querying shielded ERC-20 token balances for an owned account.
 *
 * Run: npx tsx wallet-bermuda/check-balances.ts
 */

import WalletManagerBermuda from '@bermuda/wdk-wallet-bermuda'
import { loadBermudaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { join } from 'node:path'
import { tmpdir } from 'node:os'
import fs from 'node:fs'

async function main() {
  const config = loadBermudaConfig()

  logSection('Check Balances')

  const wallet = new WalletManagerBermuda(config.seedPhrase, {
    provider: config.rpcUrl,
    utxoCache: join(tmpdir(), 'wdk-wallet-bermuda-examples-utxo-cache.json'),
    fs
  })

  const account = await wallet.getBermudaAccount()
  logResult('Bermuda account', { address: account.address })

  const tokenBalance = await account.getTokenBalance(config.tokenContract)
  logResult('Shielded ERC-20 token balance', {
    token: config.tokenContract,
    balance: `${tokenBalance} (base units)`,
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().then(() => process.exit(0))
