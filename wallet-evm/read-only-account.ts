/**
 * EVM Example: Read-Only Account
 *
 * Demonstrates: Creating a WalletAccountReadOnlyEvm to monitor any
 * address without needing a private key.
 *
 * Run: npx tsx evm/04-read-only-account.ts
 */

import { WalletAccountReadOnlyEvm } from '@tetherto/wdk-wallet-evm'
import { loadEvmConfig } from '../shared/config.js'
import { logSection, logResult, formatWei } from '../shared/helpers.js'

async function main() {
  const config = loadEvmConfig()

  logSection('Read-Only Account')

  const readOnlyAccount = new WalletAccountReadOnlyEvm(config.recipientAddress, {
    provider: config.rpcUrl,
  })

  const address = await readOnlyAccount.getAddress()
  logResult('Watching Address', { address })

  const balance = await readOnlyAccount.getBalance()
  logResult('Native Balance', { balance: formatWei(balance) })

  const tokenBalance = await readOnlyAccount.getTokenBalance(config.tokenContract)
  logResult('ERC-20 Token Balance', {
    contract: config.tokenContract,
    balance: `${tokenBalance} (base units)`,
  })

  console.log('\nDone.')
}

main().catch((err) => {
  console.error('Error:', err.message)
  process.exit(1)
})
