/**
 * Solana Example: Check Balances
 *
 * Demonstrates: Querying native SOL and SPL token balances for an owned account.
 *
 * Run: npx tsx wallet-solana/check-balances.ts
 */

import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { loadSolanaConfig } from '../shared/config.js'
import { logSection, logResult, formatLamports } from '../shared/helpers.js'

async function main() {
  const config = loadSolanaConfig()

  logSection('Check Balances (Owned Account)')

  const wallet = new WalletManagerSolana(config.seedPhrase, {
    rpcUrl: config.rpcUrl,
    commitment: config.commitment,
    transferMaxFee: config.transferMaxFee,
  })

  const account = await wallet.getAccount(0)
  logResult('Account', { address: await account.getAddress() })

  const balance = await account.getBalance()
  logResult('Native Balance', { balance: formatLamports(balance) })

  const tokenBalance = await account.getTokenBalance(config.tokenMint)
  logResult('SPL Token Balance', {
    mint: config.tokenMint,
    balance: `${tokenBalance} (base units)`,
  })

  wallet.dispose()
  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
