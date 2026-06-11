/**
 * WalletConnect-WalletKit Example: End-to-end signing flow
 *
 * Demonstrates: pairing an in-process WalletConnect dApp (SignClient) with
 * a WDK-backed wallet (WalletKit) over the real WalletConnect relay, then
 * exercising personal_sign, eth_signTypedData_v4, and solana_signMessage
 * end-to-end with dApp-side verification. No browser required.
 *
 * Run: npx tsx walletconnect-walletkit/signing-flow.ts
 */

import { Core } from '@walletconnect/core'
import { SignClient } from '@walletconnect/sign-client'
import { verifyMessage, verifyTypedData, hexlify, toUtf8Bytes } from 'ethers'
import bs58 from 'bs58'
import nacl from 'tweetnacl'

import { loadWalletConnectConfig } from '../shared/config.js'
import { logSection, logResult } from '../shared/helpers.js'
import { setupWallet, CHAIN, EVM_METHODS, SOLANA_METHODS } from './wallet.js'

async function main() {
  const config = loadWalletConnectConfig()

  logSection('Setup Wallet')
  const { walletkit, evmAddress, solanaAddress } = await setupWallet(config)
  logResult('Derived Addresses', { evm: evmAddress, solana: solanaAddress })

  logSection('Setup dApp')
  // The dApp lives in the same process as the wallet, so its Core gets its
  // own storage prefix to avoid colliding with the wallet's Core.
  const dappCore = new Core({ projectId: config.projectId, customStoragePrefix: 'dapp' })
  const signClient = await SignClient.init({
    core: dappCore,
    metadata: {
      name: 'WDK Example dApp',
      description: 'In-process dApp driving the signing flow',
      url: 'https://example.com',
      icons: [],
    },
  })

  logSection('Pair')
  const { uri, approval } = await signClient.connect({
    optionalNamespaces: {
      eip155: {
        chains: [CHAIN.SEPOLIA],
        methods: EVM_METHODS,
        events: ['chainChanged', 'accountsChanged'],
      },
      solana: {
        chains: [CHAIN.SOLANA_DEVNET],
        methods: SOLANA_METHODS,
        events: [],
      },
    },
  })
  if (!uri) throw new Error('SignClient.connect did not return a pairing URI')

  const sessionPromise = approval()
  await walletkit.pair({ uri })
  const session = await sessionPromise
  logResult('Paired', { topic: session.topic })

  logSection('Personal Sign (Sepolia)')
  const personalMessage = 'Hello from the WDK WalletConnect example'
  const personalSig = await signClient.request<string>({
    topic: session.topic,
    chainId: CHAIN.SEPOLIA,
    request: {
      method: 'personal_sign',
      params: [hexlify(toUtf8Bytes(personalMessage)), evmAddress],
    },
  })
  const personalRecovered = verifyMessage(personalMessage, personalSig)
  logResult('Signed', { message: personalMessage, signature: personalSig })
  logResult('Verification', {
    recovered: personalRecovered,
    isValid: personalRecovered.toLowerCase() === evmAddress.toLowerCase(),
  })

  logSection('Sign Typed Data v4 (Sepolia)')
  const typedData = {
    types: {
      EIP712Domain: [
        { name: 'name', type: 'string' },
        { name: 'version', type: 'string' },
        { name: 'chainId', type: 'uint256' },
      ],
      Person: [
        { name: 'name', type: 'string' },
        { name: 'wallet', type: 'address' },
      ],
    },
    primaryType: 'Person',
    domain: { name: 'WDK Example', version: '1', chainId: 11155111 },
    message: { name: 'Alice', wallet: evmAddress },
  }
  const typedSig = await signClient.request<string>({
    topic: session.topic,
    chainId: CHAIN.SEPOLIA,
    request: {
      method: 'eth_signTypedData_v4',
      params: [evmAddress, JSON.stringify(typedData)],
    },
  })
  const { EIP712Domain: _omit, ...verifyTypes } = typedData.types
  const typedRecovered = verifyTypedData(
    typedData.domain,
    verifyTypes,
    typedData.message,
    typedSig,
  )
  logResult('Signed', { signature: typedSig })
  logResult('Verification', {
    recovered: typedRecovered,
    isValid: typedRecovered.toLowerCase() === evmAddress.toLowerCase(),
  })

  logSection('Solana Sign Message (Devnet)')
  const solanaMessage = 'Hello from the WDK WalletConnect example (Solana)'
  const solanaResponse = await signClient.request<{ signature: string }>({
    topic: session.topic,
    chainId: CHAIN.SOLANA_DEVNET,
    request: {
      method: 'solana_signMessage',
      params: {
        pubkey: solanaAddress,
        message: bs58.encode(Buffer.from(solanaMessage, 'utf8')),
      },
    },
  })
  const solanaValid = nacl.sign.detached.verify(
    Buffer.from(solanaMessage, 'utf8'),
    bs58.decode(solanaResponse.signature),
    bs58.decode(solanaAddress),
  )
  logResult('Signed', { message: solanaMessage, signature: solanaResponse.signature })
  logResult('Verification', { isValid: solanaValid })

  logSection('Disconnect')
  await signClient.disconnect({
    topic: session.topic,
    reason: { code: 6000, message: 'Demo complete' },
  })
  logResult('Disconnected', { topic: session.topic })

  console.log('\nDone.')
  process.exit(0)
}

main().catch((err) => {
  console.error('Error:', err instanceof Error ? err.message : err)
  process.exit(1)
})
