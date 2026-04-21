export function formatWei(wei: bigint): string {
  const eth = Number(wei) / 1e18
  return `${eth.toFixed(6)} ETH (${wei} wei)`
}

export function formatUnits(value: bigint, decimals: number, symbol: string): string {
  const amount = Number(value) / 10 ** decimals
  return `${amount.toFixed(6)} ${symbol} (${value} base units)`
}

export function formatLamports(lamports: bigint): string {
  return formatUnits(lamports, 9, 'SOL')
}

export function formatNanotons(nanotons: bigint): string {
  return formatUnits(nanotons, 9, 'TON')
}

export function formatSun(sun: bigint): string {
  return formatUnits(sun, 6, 'TRX')
}

export function formatTokenBalance(balance: bigint, decimals: number, symbol: string): string {
  const value = Number(balance) / 10 ** decimals
  return `${value} ${symbol} (${balance} base units)`
}

export function logResult(label: string, data: unknown): void {
  console.log(`\n--- ${label} ---`)
  if (typeof data === 'object' && data !== null) {
    for (const [key, value] of Object.entries(data)) {
      console.log(`  ${key}: ${value}`)
    }
  } else {
    console.log(` `, data)
  }
}

export function logSection(title: string): void {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log(`${'='.repeat(60)}`)
}
