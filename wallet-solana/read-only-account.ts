/**
 * Solana Example: Read-Only Account
 *
 * Demonstrates: Creating a WalletAccountReadOnlySolana to monitor any
 * address without needing a private key.
 *
 * Run: npx tsx wallet-solana/read-only-account.ts
 */

import { WalletAccountReadOnlySolana } from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection, logResult, formatLamports } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Read-Only Account')

  const readOnlyAccount = new WalletAccountReadOnlySolana(config.recipientAddress, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
  })

  logResult('Watching Address', { address: await readOnlyAccount.getAddress() })

  const balance = await readOnlyAccount.getBalance()
  logResult('Native Balance', { balance: formatLamports(balance) })

  const tokenBalance = await readOnlyAccount.getTokenBalance(config.tokenMint)
  logResult('SPL Token Balance', {
    mint: config.tokenMint,
    balance: `${tokenBalance} (base units)`,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
