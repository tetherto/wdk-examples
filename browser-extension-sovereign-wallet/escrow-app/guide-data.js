/** Escrow step copy — network labels from src/config (via webpack). */
export {
  EVM_CHAIN_KEYS,
  listEvmChainKeys,
  chainLabel,
  nativeGasSymbol,
  explorerForChain,
  formatComingSoonLabels,
} from '../src/config/evm-escrow-meta.js';

export const CREATE_STEPS = [
  { id: 'wallet', title: 'Unlock wallet', check: (ctx) => ctx.walletUnlocked },
  { id: 'form', title: 'Fill deal form', check: (ctx) => ctx.createFormValid },
  { id: 'tx', title: 'Create deal (confirm tx)', check: () => false },
];

export const JOIN_STEPS = [
  { id: 'wallet', title: 'Unlock wallet', check: (ctx) => ctx.walletUnlocked },
  { id: 'addr', title: 'Enter deal address', check: (ctx) => ctx.hasDealAddress },
  {
    id: 'accept',
    title: 'Both accept terms',
    check: (ctx) => ctx.deal?.buyerAccepted && ctx.deal?.sellerAccepted,
  },
  {
    id: 'deposit',
    title: 'Both deposit (USDT + token)',
    check: (ctx) => ctx.deal?.usdtDeposited && ctx.deal?.tokenDeposited,
  },
  { id: 'done', title: 'Settled', check: (ctx) => ctx.deal?.state === 'Settled' },
];
