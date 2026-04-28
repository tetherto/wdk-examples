"""
WDK MCP Toolkit Example: LangChain Agent (Python)

Demonstrates: Starting the WDK MCP Toolkit as a subprocess, loading its
tools through LangChain's MCP adapter, and running an interactive agent.

Run: python mcp-toolkit/langchain/python/agent.py
"""

import asyncio
import os
import sys
import readline  # noqa: F401
from pathlib import Path

from langchain_mcp_adapters.client import MultiServerMCPClient
from langgraph.prebuilt import create_react_agent


def get_llm():
    if os.getenv("OPENAI_API_KEY"):
        from langchain_openai import ChatOpenAI

        return ChatOpenAI(model="gpt-4o")

    if os.getenv("ANTHROPIC_API_KEY"):
        from langchain_anthropic import ChatAnthropic

        return ChatAnthropic(model="claude-sonnet-4-20250514")

    print("Error: Set OPENAI_API_KEY or ANTHROPIC_API_KEY")
    sys.exit(1)


def get_server_config():
    repo_root = Path(__file__).resolve().parents[3]
    toolkit_cli = repo_root / "node_modules" / "@tetherto" / "wdk-mcp-toolkit" / "bin" / "index.js"
    seed = os.getenv("WDK_SEED") or os.getenv("SEED_PHRASE")

    env = {
        **os.environ,
        "WDK_MCP_ELICITATION": "false",
    }

    if seed:
        env["WDK_SEED"] = seed

    return {
        "wdk": {
            "transport": "stdio",
            "command": "node",
            "args": [str(toolkit_cli), "serve"],
            "env": env,
        }
    }


async def main():
    llm = get_llm()
    config = get_server_config()

    print("Connecting to WDK MCP server...")
    client = MultiServerMCPClient(config)

    try:
        tools = await client.get_tools()
        print(f"Loaded {len(tools)} tools: {', '.join(tool.name for tool in tools)}")
        print()

        agent = create_react_agent(llm, tools)

        print("WDK LangChain agent ready. Type your prompt, or 'quit' to exit.")
        print("Examples:")
        print("  - What is the current price of Bitcoin?")
        print("  - What is my Ethereum address?")
        print("  - Check my ETH balance")
        print()

        while True:
            try:
                user_input = input("You: ").strip()
                if not user_input or user_input.lower() in ("quit", "exit", "q"):
                    break

                result = await agent.ainvoke(
                    {"messages": [{"role": "user", "content": user_input}]}
                )

                for message in result["messages"]:
                    if (
                        getattr(message, "type", None) == "ai"
                        and getattr(message, "content", None)
                    ):
                        print(f"Agent: {message.content}")
                print()
            except (EOFError, KeyboardInterrupt):
                break
    finally:
        print("Goodbye.")
        await client.close()


if __name__ == "__main__":
    asyncio.run(main())
