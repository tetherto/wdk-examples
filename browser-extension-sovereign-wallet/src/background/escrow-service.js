/**
 * Multi-chain OTC escrow — USDT + trade token (EVM)
 */
import { Contract, JsonRpcProvider, Interface, parseUnits, id } from 'ethers';
import {
  ESCROW_ABIS,
  DUAL_DEAL_STATE,
  getEscrowNetwork,
  isEscrowDeployed,
  getProtocolFeeBps,
  getProtocolFeeRecipient,
  listEscrowEvmChains,
  getEscrowComingSoon,
  getEvmEscrowDeployStatus,
} from '../config/escrow.js';
import { getWdkAccount, sendEvmContractTransaction, normalizeAddress } from './wdk-loader.js';

function providerFor(chainKey) {
  const cfg = getEscrowNetwork(chainKey);
  return new JsonRpcProvider(cfg.rpcUrl, cfg.chainId);
}

export function termsHashFromJson(termsObject) {
  const canonical = JSON.stringify(termsObject, Object.keys(termsObject).sort());
  return id(canonical);
}

export function buildOtcTermsPayload({
  buyer,
  seller,
  tradeToken,
  usdtAmount,
  tokenAmount,
  fundingDeadline,
  description = '',
  chainKey,
}) {
  const cfg = getEscrowNetwork(chainKey);
  const terms = {
    version: 2,
    type: 'otc_dual',
    buyer: normalizeAddress(buyer),
    seller: normalizeAddress(seller),
    usdt: cfg.usdt,
    tradeToken: normalizeAddress(tradeToken),
    usdtAmount: String(usdtAmount),
    tokenAmount: String(tokenAmount),
    fundingDeadline,
    feeBps: getProtocolFeeBps(),
    feeRecipient: getProtocolFeeRecipient(),
    description,
    chainId: cfg.chainId,
    chainKey,
  };
  return { terms, termsHash: termsHashFromJson(terms) };
}

export async function getDualDealView(dealAddress, chainKey) {
  const cfg = getEscrowNetwork(chainKey);
  const provider = providerFor(chainKey);
  const deal = new Contract(dealAddress, ESCROW_ABIS.dualDeal, provider);
  const [status, t] = await Promise.all([deal.getStatus(), deal.terms()]);
  return {
    dealAddress,
    chainKey,
    network: cfg.name,
    state: DUAL_DEAL_STATE[Number(status.currentState)] ?? 'Unknown',
    buyerAccepted: status.buyerOk,
    sellerAccepted: status.sellerOk,
    usdtDeposited: status.usdtIn,
    tokenDeposited: status.tokenIn,
    fundingDeadline: Number(status.fundingDeadline),
    terms: {
      buyer: t.buyer,
      seller: t.seller,
      usdt: t.usdt,
      tradeToken: t.tradeToken,
      usdtAmount: t.usdtAmount.toString(),
      tokenAmount: t.tokenAmount.toString(),
      feeBps: Number(t.feeBps),
      feeRecipient: t.feeRecipient,
      termsHash: t.termsHash,
    },
    explorer: cfg.explorer,
    usdtDecimals: cfg.usdtDecimals,
  };
}

export async function encodeCreateOtcDeal({
  buyer,
  seller,
  tradeToken,
  usdtAmountHuman,
  tokenAmountHuman,
  tokenDecimals,
  fundingDeadlineUnix,
  termsHash,
  chainKey,
}) {
  const cfg = getEscrowNetwork(chainKey);
  const iface = new Interface(ESCROW_ABIS.dualFactory);
  const usdtAmount = parseUnits(String(usdtAmountHuman), cfg.usdtDecimals);
  const tokenAmount = parseUnits(String(tokenAmountHuman), Number(tokenDecimals));
  const feeRecipient = getProtocolFeeRecipient();
  const feeBps = getProtocolFeeBps();
  return {
    to: cfg.factory,
    data: iface.encodeFunctionData('createOtcDeal', [
      buyer,
      seller,
      tradeToken,
      usdtAmount,
      tokenAmount,
      fundingDeadlineUnix,
      feeBps,
      feeRecipient,
      termsHash,
    ]),
    factory: cfg.factory,
    deployed: isEscrowDeployed(cfg),
    chainKey,
  };
}

export async function encodeDualDealCall(dealAddress, fn, args = []) {
  const iface = new Interface(ESCROW_ABIS.dualDeal);
  return iface.encodeFunctionData(fn, args);
}

const ERC20_APPROVE_ABI = ['function approve(address spender, uint256 amount) returns (bool)'];

export function encodeErc20Approve(spender, amount) {
  const iface = new Interface(ERC20_APPROVE_ABI);
  return iface.encodeFunctionData('approve', [spender, amount]);
}

export async function sendEscrowTx({ chain, accountIndex, to, data, value = 0n }) {
  return sendEvmContractTransaction({ chain, accountIndex, to, data, value });
}

export async function ethCall({ to, data, chainKey }) {
  const provider = providerFor(chainKey);
  return provider.call({ to, data });
}

export function getEscrowConfigSummary(chainKey) {
  const cfg = getEscrowNetwork(chainKey);
  return {
    ...cfg,
    deployed: isEscrowDeployed(cfg),
    feeBps: getProtocolFeeBps(),
    feeRecipient: getProtocolFeeRecipient(),
    evmChains: listEscrowEvmChains(),
    comingSoon: getEscrowComingSoon(),
    evmDeployStatus: getEvmEscrowDeployStatus(),
  };
}

export { applyEscrowJsonOverrides } from '../config/escrow.js';
