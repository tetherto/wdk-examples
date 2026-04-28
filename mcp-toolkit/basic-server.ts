/**
 * WDK MCP Toolkit Example: Basic Server
 *
 * Demonstrates: Creating a WDK MCP server, registering wallet modules,
 * enabling optional tools, and serving the tools over stdio.
 *
 * Run: npx tsx mcp-toolkit/basic-server.ts
 */

import 'dotenv/config'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import {
  WdkMcpServer,
  WALLET_TOOLS,
  PRICING_TOOLS,
  INDEXER_TOOLS,
  SWAP_TOOLS,
  BRIDGE_TOOLS,
  LENDING_TOOLS,
  FIAT_TOOLS,
} from '@tetherto/wdk-mcp-toolkit'
import WalletManagerBtc from '@tetherto/wdk-wallet-btc'
import WalletManagerEvm from '@tetherto/wdk-wallet-evm'
import VeloraProtocolEvm from '@tetherto/wdk-protocol-swap-velora-evm'
import Usdt0ProtocolEvm from '@tetherto/wdk-protocol-bridge-usdt0-evm'
import AaveProtocolEvm from '@tetherto/wdk-protocol-lending-aave-evm'
import MoonPayProtocol from '@tetherto/wdk-protocol-fiat-moonpay'

const seed = process.env.WDK_SEED ?? process.env.SEED_PHRASE
const hasIndexer = Boolean(process.env.WDK_INDEXER_API_KEY)
const hasFiat = Boolean(process.env.MOONPAY_API_KEY && process.env.MOONPAY_SECRET_KEY)
const elicitation = process.env.WDK_MCP_ELICITATION ?? 'true'

if (!['true', 'false'].includes(elicitation)) {
  throw new Error("WDK_MCP_ELICITATION can only be set to 'true' or 'false'.")
}

async function main() {
  if (!seed) {
    console.error('Error: WDK_SEED or SEED_PHRASE is required.')
    console.error('Copy .env.example to .env and fill in the values.')
    process.exit(1)
  }

  const server = new WdkMcpServer('wdk-mcp-server', '1.0.0', {
    capabilities: {
      elicitation: elicitation !== 'false',
    },
  })
    .useWdk({ seed })
    .registerWallet('ethereum', WalletManagerEvm, {
      provider: process.env.WDK_RPC_ETHEREUM ?? process.env.EVM_RPC_URL ?? 'https://rpc.mevblocker.io/fast',
    })
    .registerWallet('arbitrum', WalletManagerEvm, {
      provider: process.env.WDK_RPC_ARBITRUM ?? 'https://arb1.arbitrum.io/rpc',
    })
    .registerWallet('bitcoin', WalletManagerBtc, {
      network: 'bitcoin',
    })
    .registerProtocol('ethereum', 'velora', VeloraProtocolEvm)
    .registerProtocol('arbitrum', 'velora', VeloraProtocolEvm)
    .registerProtocol('ethereum', 'usdt0', Usdt0ProtocolEvm)
    .registerProtocol('arbitrum', 'usdt0', Usdt0ProtocolEvm)
    .registerProtocol('ethereum', 'aave', AaveProtocolEvm)
    .usePricing()

  if (hasIndexer && process.env.WDK_INDEXER_API_KEY) {
    server.useIndexer({ apiKey: process.env.WDK_INDEXER_API_KEY })
  }

  if (hasFiat && process.env.MOONPAY_API_KEY && process.env.MOONPAY_SECRET_KEY) {
    const registerFiatProtocol = server.registerProtocol.bind(server) as (
      chain: string,
      label: string,
      protocol: typeof MoonPayProtocol,
      config: { apiKey: string; secretKey: string }
    ) => typeof server

    registerFiatProtocol('ethereum', 'moonpay', MoonPayProtocol, {
      apiKey: process.env.MOONPAY_API_KEY,
      secretKey: process.env.MOONPAY_SECRET_KEY,
    })
  }

  const tools = [
    ...WALLET_TOOLS,
    ...PRICING_TOOLS,
    ...SWAP_TOOLS,
    ...BRIDGE_TOOLS,
    ...LENDING_TOOLS,
  ]

  if (hasIndexer) {
    tools.push(...INDEXER_TOOLS)
  }

  if (hasFiat) {
    tools.push(...FIAT_TOOLS)
  }

  server.registerTools(tools)

  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('WDK MCP Server running on stdio')
  console.error('Registered chains:', server.getChains())
  console.error('Registered swap protocols:', server.getSwapChains())
  console.error('Registered bridge protocols:', server.getBridgeChains())
  console.error('Registered lending protocols:', server.getLendingChains())
  console.error('Indexer:', hasIndexer ? 'enabled' : 'disabled')
  console.error('Fiat:', hasFiat ? `enabled: ${server.getFiatChains().join(', ')}` : 'disabled')
  console.error('Elicitation:', elicitation !== 'false' ? 'enabled' : 'disabled')
}

main().catch((err) => {
  console.error('Fatal error:', err)
  process.exit(1)
})
