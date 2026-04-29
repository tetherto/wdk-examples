/**
 * WDK MCP Toolkit Example: LangChain Agent (TypeScript)
 *
 * Demonstrates: Starting the WDK MCP Toolkit as a subprocess, loading its
 * tools through LangChain's MCP adapter, and running an interactive agent.
 *
 * Run: npx tsx mcp-toolkit/langchain/typescript/agent.ts
 */

import 'dotenv/config'
import { MultiServerMCPClient } from '@langchain/mcp-adapters'
import { createReactAgent } from '@langchain/langgraph/prebuilt'
import type { BaseChatModel } from '@langchain/core/language_models/chat_models'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { createInterface } from 'node:readline'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..', '..', '..')
const toolkitCli = path.join(repoRoot, 'node_modules', '@tetherto', 'wdk-mcp-toolkit', 'bin', 'index.js')

async function getLLM(): Promise<BaseChatModel> {
  if (process.env.OPENAI_API_KEY) {
    const { ChatOpenAI } = await import('@langchain/openai')
    return new ChatOpenAI({ model: 'gpt-4o' })
  }

  if (process.env.ANTHROPIC_API_KEY) {
    const { ChatAnthropic } = await import('@langchain/anthropic')
    return new ChatAnthropic({ model: 'claude-sonnet-4-20250514' })
  }

  console.error('Error: Set OPENAI_API_KEY or ANTHROPIC_API_KEY.')
  process.exit(1)
}

function prompt(rl: ReturnType<typeof createInterface>): Promise<string | null> {
  return new Promise((resolve) => {
    rl.question('You: ', (answer) => resolve(answer.trim() || null))
  })
}

function getEnvironment(): Record<string, string> {
  const seed = process.env.WDK_SEED ?? process.env.SEED_PHRASE

  return {
    ...(process.env as Record<string, string>),
    ...(seed ? { WDK_SEED: seed } : {}),
    WDK_MCP_ELICITATION: 'false',
  }
}

async function main() {
  const llm = await getLLM()
  const client = new MultiServerMCPClient({
    wdk: {
      transport: 'stdio' as const,
      command: process.execPath,
      args: [toolkitCli, 'serve'],
      env: getEnvironment(),
    },
  })

  try {
    console.log('Connecting to WDK MCP server...')

    const tools = await client.getTools()
    console.log(`Loaded ${tools.length} tools: ${tools.map((tool) => tool.name).join(', ')}`)
    console.log()

    const agent = createReactAgent({ llm, tools })

    console.log("WDK LangChain agent ready. Type your prompt, or 'quit' to exit.")
    console.log('Examples:')
    console.log('  - What is the current price of Bitcoin?')
    console.log('  - What is my Ethereum address?')
    console.log('  - Check my ETH balance')
    console.log()

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
    })

    let running = true
    while (running) {
      const userInput = await prompt(rl)

      if (!userInput || ['quit', 'exit', 'q'].includes(userInput.toLowerCase())) {
        console.log('Goodbye.')
        running = false
        break
      }

      const result = await agent.invoke({
        messages: [{ role: 'user', content: userInput }],
      })

      const lastMessage = result.messages.at(-1)
      const content = lastMessage?.content

      if (typeof content === 'string') {
        console.log(`Agent: ${content}`)
      } else if (content) {
        console.log('Agent:', JSON.stringify(content))
      }

      console.log()
    }

    rl.close()
  } finally {
    await client.close()
  }
}

main().catch((err) => {
  console.error('Fatal:', err)
  process.exit(1)
})
