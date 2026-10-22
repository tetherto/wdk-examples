/**
 * The wallet auth condition shared by the examples in this folder.
 *
 * Thresholds are in token units and sent as decimal strings. The condition
 * reads Ethereum mainnet regardless of which network the wallet transacts on;
 * swap in any supported chain or condition type.
 */
export const RECIPIENT_CONDITION = {
  type: 'token_balance' as const,
  contractAddress: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', // USDC on Ethereum
  chainId: 1,
  threshold: '1000',
  decimals: 6,
  label: 'Holds at least 1,000 USDC on Ethereum',
}

/** A public address holding more than 1,000 USDC on Ethereum at the time of writing, used to show the ALLOW path. */
export const EXAMPLE_PASSING_ADDRESS = '0x55FE002aefF02F77364de339a1292923A15844B8'
