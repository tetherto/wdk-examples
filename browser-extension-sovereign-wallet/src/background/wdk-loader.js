/**
 * Re-export WDK helpers (loaded after polyfills in the background bundle).
 */
export {
  initWdk,
  disposeWdk,
  deriveAccountsForChain,
  fetchBalancesForAddress,
  sendChainTransaction,
  signPersonalMessage,
  getWdkAccount,
  getChainAddress,
  normalizeAddress,
  estimateSendFee,
  sendEvmContractTransaction,
} from './wdk-manager.js';
