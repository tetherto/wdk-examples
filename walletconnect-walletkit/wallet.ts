/**
 * Wallet side: WDK + WalletKit.
 *
 * Builds a WDK with EVM + Solana wallets, initialises a WalletKit client
 * with an isolated Core (its own storage prefix so it doesn't collide with
 * the in-process dApp), and registers session_proposal / session_request
 * handlers that route signing requests to the matching WDK account.
 */

import WDK from '@tetherto/wdk'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import WalletManagerSolana from '@tetherto/wdk-wallet-solana'
import { Core } from '@walletconnect/core'
import { WalletKit, IWalletKit } from '@reown/walletkit'
import { buildApprovedNamespaces } from '@walletconnect/utils'
import { getBytes, toUtf8String } from 'ethers'
import bs58 from 'bs58'

import { logResult } from '../shared/helpers.js'

export const CHAIN = {
  SEPOLIA: 'eip155:11155111',
  SOLANA_DEVNET: 'solana:EtWTRABZaYq6iMfeYKouRu166VU2xqa1',
}

export const EVM_METHODS = ['personal_sign', 'eth_signTypedData_v4']
export const SOLANA_METHODS = ['solana_signMessage']

type WdkAccount = {
  sign: (message: string) => Promise<string>
}

type WdkEvmAccount = WdkAccount & {
  signTypedData: (typedData: {
    domain: Record<string, unknown>
    types: Record<string, unknown>
    message: Record<string, unknown>
  }) => Promise<string>
}

export type WalletConfig = {
  projectId: string
  seedPhrase: string
  sepoliaRpcUrl: string
  solanaDevnetRpcUrl: string
}

export type WalletHandle = {
  wdk: WDK
  walletkit: IWalletKit
  evmAddress: string
  solanaAddress: string
}

export async function setupWallet(config: WalletConfig): Promise<WalletHandle> {
  const wdk = new WDK(config.seedPhrase)
    .registerWallet('sepolia', WalletManagerEvm, { provider: config.sepoliaRpcUrl })
    .registerWallet('solana-devnet', WalletManagerSolana, { rpcUrl: config.solanaDevnetRpcUrl })

  const sepoliaAccount = await wdk.getAccount('sepolia', 0)
  const solanaDevnetAccount = await wdk.getAccount('solana-devnet', 0)

  const evmAddress = await sepoliaAccount.getAddress()
  const solanaAddress = await solanaDevnetAccount.getAddress()

  const accounts: Record<string, Awaited<ReturnType<typeof wdk.getAccount>>> = {
    [CHAIN.SEPOLIA]: sepoliaAccount,
    [CHAIN.SOLANA_DEVNET]: solanaDevnetAccount,
  }

  const supportedNamespaces = {
    eip155: {
      chains: [CHAIN.SEPOLIA],
      methods: EVM_METHODS,
      events: ['chainChanged', 'accountsChanged'],
      accounts: [`${CHAIN.SEPOLIA}:${evmAddress}`],
    },
    solana: {
      chains: [CHAIN.SOLANA_DEVNET],
      methods: SOLANA_METHODS,
      events: [],
      accounts: [`${CHAIN.SOLANA_DEVNET}:${solanaAddress}`],
    },
  }

  // The dApp lives in the same Node process, so the wallet's Core gets its
  // own storage prefix to avoid sharing state with the dApp's Core.
  const core = new Core({ projectId: config.projectId, customStoragePrefix: 'wallet' })
  const walletkit = await WalletKit.init({
    core,
    metadata: {
      name: 'WDK Example Wallet',
      description: 'WDK-backed wallet driven by WalletKit',
      url: 'https://wallet.tether.io',
      icons: [],
    },
  })

  walletkit.on('session_proposal', async ({ id, params }) => {
    const namespaces = buildApprovedNamespaces({ proposal: params, supportedNamespaces })
    await walletkit.approveSession({ id, namespaces })
    logResult('Session Approved', { id })
  })

  walletkit.on('session_request', async ({ id, topic, params }) => {
    try {
      const account = accounts[params.chainId]
      if (!account) throw new Error(`Unsupported chain: ${params.chainId}`)
      const namespace = params.chainId.split(':')[0]
      let result: unknown
      switch (namespace) {
        case 'eip155':
          result = await signEvm(account, params.request.method, params.request.params)
          break
        case 'solana':
          result = await signSolana(account, params.request.method, params.request.params)
          break
        default:
          throw new Error(`Unsupported chain namespace: ${namespace}`)
      }
      await walletkit.respondSessionRequest({
        topic,
        response: { id, jsonrpc: '2.0', result },
      })
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      await walletkit.respondSessionRequest({
        topic,
        response: { id, jsonrpc: '2.0', error: { code: 5000, message } },
      })
    }
  })

  return { wdk, walletkit, evmAddress, solanaAddress }
}

async function signEvm(
  account: WdkAccount,
  method: string,
  params: unknown,
): Promise<string> {
  const arr = params as unknown[]
  switch (method) {
    case 'personal_sign':
      return account.sign(decodeMaybeString(arr[0] as string))
    case 'eth_signTypedData':
    case 'eth_signTypedData_v4': {
      const raw = arr[1]
      const typed = typeof raw === 'string' ? JSON.parse(raw) : (raw as Record<string, unknown>)
      const t = typed as {
        domain: Record<string, unknown>
        types: Record<string, unknown>
        message: Record<string, unknown>
      }
      const { EIP712Domain: _ignore, ...types } = t.types
      return (account as WdkEvmAccount).signTypedData({ domain: t.domain, types, message: t.message })
    }
    default:
      throw new Error(`EVM method not supported: ${method}`)
  }
}

async function signSolana(
  account: WdkAccount,
  method: string,
  params: unknown,
): Promise<unknown> {
  switch (method) {
    case 'solana_signMessage': {
      const message = (params as { message?: string })?.message
      const decoded = decodeSolanaMessage(message)
      const hexSignature = await account.sign(decoded)
      return { signature: bs58.encode(Buffer.from(hexSignature, 'hex')) }
    }
    default:
      throw new Error(`Solana method not supported: ${method}`)
  }
}

function decodeMaybeString(raw: string): string {
  if (typeof raw !== 'string' || !raw.startsWith('0x')) return raw
  try {
    return toUtf8String(raw)
  } catch {
    return Buffer.from(getBytes(raw)).toString('binary')
  }
}

function decodeSolanaMessage(message: unknown): string {
  if (typeof message !== 'string') return Buffer.from(message as ArrayBuffer).toString('utf8')
  try {
    return Buffer.from(bs58.decode(message)).toString('utf8')
  } catch {
    return message
  }
}
