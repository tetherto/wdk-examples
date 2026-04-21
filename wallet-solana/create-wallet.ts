/**
 * Solana Example: Create Wallet
 *
 * Demonstrates: Initializing a WalletManagerSolana, deriving an account,
 * and converting it to a read-only account.
 *
 * Run: npx tsx wallet-solana/create-wallet.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Create Wallet')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  const address = await account.getAddress()
  logResult('Account 0', { address })

  const readOnlyAccount = await account.toReadOnlyAccount()
  const roAddress = await readOnlyAccount.getAddress()
  logResult('Read-Only Account', { address: roAddress })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
