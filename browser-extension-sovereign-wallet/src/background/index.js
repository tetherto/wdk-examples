/**
 * Sovereign Wallet — Background Service Worker
 * Wallet ops, WDK integration, session, encrypted storage.
 */

import './polyfills.js';
import { generateMnemonic, validateMnemonic } from 'bip39';
import { encrypt, decrypt } from '../lib/crypto.js';
import {
  initWdk,
  disposeWdk,
  deriveAccountsForChain,
  fetchBalancesForAddress,
  sendChainTransaction,
  signPersonalMessage,
  getWdkAccount,
  getChainAddress,
  estimateSendFee,
} from './wdk-loader.js';
import { fetchUsdPrices } from '../lib/prices.js';
import { formatUnits } from 'ethers';
import {
  appendTxLog,
  fetchTransactions,
  formatPortfolioAssets,
} from './transactions.js';
import { EVM_CHAINS, ALL_CHAIN_IDS, isEvmChain } from '../config/chains.js';
import {
  getDualDealView,
  getEscrowConfigSummary,
  buildOtcTermsPayload,
  encodeCreateOtcDeal,
  encodeDualDealCall,
  encodeErc20Approve,
  sendEscrowTx,
  ethCall,
  applyEscrowJsonOverrides,
} from './escrow-service.js';

const SESSION_TIMEOUT_MS = 15 * 60 * 1000;
const MNEMONIC_WORD_COUNTS = [12, 15, 18, 21, 24];

function normalizeMnemonic(mnemonic) {
  return String(mnemonic || '')
    .trim()
    .toLowerCase()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[,;|]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
const STORAGE_KEYS = {
  ENCRYPTED_VAULT: 'wdk_vault',
  ACCOUNTS: 'wdk_accounts',
  ACCOUNT_COUNT: 'wdk_account_count',
  ACTIVE_ACCOUNT_INDEX: 'wdk_active_account_index',
  PREFERENCES: 'wdk_preferences',
};

let sessionState = {
  isUnlocked: false,
  mnemonic: null,
  sessionExpiry: null,
  activeAccountIndex: 0,
};

let sessionAlarmScheduled = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true;
});

function assertTrustedSender(sender, { allowContentScript = false } = {}) {
  if (!sender || sender.id !== chrome.runtime.id) {
    throw new Error('Unauthorized message sender');
  }
  if (allowContentScript && sender.tab?.url) {
    const url = sender.tab.url;
    if (
      !url.startsWith('https://') &&
      !url.startsWith('http://localhost') &&
      !url.startsWith('http://127.0.0.1')
    ) {
      throw new Error('Content script requests only allowed on https or localhost');
    }
  }
}

async function handleMessage(message, sender) {
  const { type, payload } = message;
  const senderUrl = sender.url || '';
  const isExtensionPage = senderUrl.startsWith('chrome-extension://');
  // Escrow opens in a tab; sender.tab is set — must not treat as dapp content script.
  const fromContentScript = Boolean(sender.tab) && !isExtensionPage;

  if (fromContentScript) {
    assertTrustedSender(sender, { allowContentScript: true });
  } else {
    assertTrustedSender(sender);
  }

  switch (type) {
    case 'WALLET_CREATE':
      return createWallet(payload);
    case 'WALLET_IMPORT':
      return importWallet(payload);
    case 'WALLET_REPLACE':
      return replaceWallet(payload);
    case 'WALLET_UNLOCK':
      return unlockWallet(payload);
    case 'WALLET_LOCK':
      return lockWallet();
    case 'WALLET_STATUS':
      return getWalletStatus();
    case 'GET_ACCOUNTS':
      return getAccounts(payload);
    case 'GET_PORTFOLIO':
      return getPortfolio(payload);
    case 'GET_BALANCE':
      return getBalance(payload);
    case 'GET_CHAIN_ADDRESS':
      return getChainAddressForChain(payload);
    case 'ESTIMATE_SEND_FEE':
      return estimateSendFeeForPayload(payload);
    case 'GET_TRANSACTIONS':
      return getTransactions(payload);
    case 'SEND_TRANSACTION':
      return sendTransaction(payload);
    case 'VALIDATE_ADDRESS':
      return validateAddress(payload);
    case 'GET_SEED_PHRASE':
      return getSeedPhrase(payload);
    case 'CHANGE_PASSWORD':
      return changePassword(payload);
    case 'ADD_ACCOUNT':
      return addAccount();
    case 'SWITCH_ACCOUNT':
      return switchAccount(payload);
    case 'RESET_WALLET':
      return resetWallet();
    case 'REQUEST_ACCOUNTS':
    case 'GET_ACCOUNTS_CONTENT':
    case 'SEND_TX_CONTENT':
    case 'PERSONAL_SIGN':
    case 'ETH_SIGN_TYPED_DATA':
    case 'ETH_CALL':
    case 'WALLET_SWITCH_CHAIN':
      if (!fromContentScript) {
        throw new Error('This action is only available from a web page context');
      }
      if (type === 'REQUEST_ACCOUNTS') return requestAccountsForDapp(payload, sender);
      if (type === 'GET_ACCOUNTS_CONTENT') return getAccountsForDapp(payload, sender);
      if (type === 'SEND_TX_CONTENT') return sendTransactionFromDapp(payload, sender);
      if (type === 'ETH_SIGN_TYPED_DATA') return signTypedDataFromDapp(payload, sender);
      if (type === 'ETH_CALL') return ethCallFromDapp(payload, sender);
      if (type === 'WALLET_SWITCH_CHAIN') return switchChainFromDapp(payload, sender);
      return personalSign(payload, sender);
    case 'ESCROW_INIT_CONFIG': {
      if (payload?.json) applyEscrowJsonOverrides(payload.json);
      return { success: true, config: getEscrowConfigSummary(payload?.chainKey) };
    }
    case 'ESCROW_GET_CONFIG':
      return { success: true, config: getEscrowConfigSummary(payload?.chainKey) };
    case 'ESCROW_GET_DEAL':
      requireUnlocked();
      return {
        success: true,
        deal: await getDualDealView(payload.dealAddress, payload.chainKey),
      };
    case 'ESCROW_BUILD_TERMS':
      return { success: true, ...buildOtcTermsPayload(payload) };
    case 'ESCROW_CREATE_OTC_TX':
    case 'ESCROW_CREATE_DEAL_TX':
      requireUnlocked();
      return { success: true, ...(await encodeCreateOtcDeal(payload)) };
    case 'ESCROW_DEAL_CALL':
      return {
        success: true,
        data: await encodeDualDealCall(payload.dealAddress, payload.fn, payload.args),
      };
    case 'ESCROW_ENCODE_ERC20_APPROVE':
      return {
        success: true,
        data: encodeErc20Approve(payload.spender, payload.amount),
      };
    case 'ESCROW_SEND_TX':
      requireUnlocked();
      return sendEscrowTx({
        chain: payload.chainKey || payload.chain || 'bsc',
        accountIndex: sessionState.activeAccountIndex,
        to: payload.to,
        data: payload.data,
        value: payload.value ? BigInt(payload.value) : 0n,
      }).then((r) => ({ success: true, txHash: r.hash }));
    default:
      throw new Error(`Unknown message type: ${type}`);
  }
}

async function loadActiveAccountIndex() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.ACTIVE_ACCOUNT_INDEX);
  const idx = stored[STORAGE_KEYS.ACTIVE_ACCOUNT_INDEX];
  if (typeof idx === 'number' && idx >= 0 && idx < 20) {
    sessionState.activeAccountIndex = idx;
  } else {
    sessionState.activeAccountIndex = 0;
  }
}

async function persistActiveAccountIndex(index) {
  sessionState.activeAccountIndex = index;
  await chrome.storage.local.set({ [STORAGE_KEYS.ACTIVE_ACCOUNT_INDEX]: index });
}

async function unlockSession(mnemonic) {
  await loadActiveAccountIndex();
  initWdk(mnemonic);
  sessionState = {
    ...sessionState,
    isUnlocked: true,
    mnemonic,
    sessionExpiry: Date.now() + SESSION_TIMEOUT_MS,
  };
  scheduleSessionTimeout();
}

async function createWallet({ password }) {
  const existing = await getStoredVault();
  if (existing) {
    throw new Error('A wallet already exists. Reset the wallet first or unlock it.');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const mnemonic = generateMnemonic(128);
  await storeEncryptedVault(mnemonic, password);
  await unlockSession(mnemonic);
  await persistActiveAccountIndex(0);
  return { success: true, mnemonic, message: 'Wallet created successfully' };
}

async function importWallet({ mnemonic, password }) {
  const existing = await getStoredVault();
  if (existing) {
    throw new Error('A wallet already exists. Use Settings → Import Different Wallet or reset first.');
  }
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const phrase = normalizeMnemonic(mnemonic);
  const words = phrase ? phrase.split(' ') : [];
  if (!MNEMONIC_WORD_COUNTS.includes(words.length)) {
    throw new Error(`Seed phrase must be ${MNEMONIC_WORD_COUNTS.join(', ')} words (${words.length} provided).`);
  }
  if (!validateMnemonic(phrase)) {
    throw new Error('Invalid seed phrase. Check spelling and word order.');
  }

  try {
    await storeEncryptedVault(phrase, password);
    await chrome.storage.local.set({ [STORAGE_KEYS.ACCOUNT_COUNT]: 5 });
    await unlockSession(phrase);
    await persistActiveAccountIndex(0);
  } catch (err) {
    await chrome.storage.local.remove(STORAGE_KEYS.ENCRYPTED_VAULT);
    lockWallet();
    throw err;
  }
  return { success: true, message: 'Wallet imported successfully' };
}

async function replaceWallet({ mnemonic, password }) {
  if (!password || password.length < 8) {
    throw new Error('Password must be at least 8 characters.');
  }
  const phrase = normalizeMnemonic(mnemonic);
  const words = phrase ? phrase.split(' ') : [];
  if (!MNEMONIC_WORD_COUNTS.includes(words.length)) {
    throw new Error(`Seed phrase must be ${MNEMONIC_WORD_COUNTS.join(', ')} words (${words.length} provided).`);
  }
  if (!validateMnemonic(phrase)) {
    throw new Error('Invalid seed phrase. Check spelling and word order.');
  }

  lockWallet();
  sessionState.activeAccountIndex = 0;
  await chrome.storage.local.clear();

  try {
    await storeEncryptedVault(phrase, password);
    await chrome.storage.local.set({ [STORAGE_KEYS.ACCOUNT_COUNT]: 5 });
    await unlockSession(phrase);
    await persistActiveAccountIndex(0);
  } catch (err) {
    await chrome.storage.local.remove(STORAGE_KEYS.ENCRYPTED_VAULT);
    lockWallet();
    throw err;
  }
  return { success: true, message: 'Wallet replaced successfully' };
}

async function unlockWallet({ password }) {
  const vault = await getStoredVault();
  if (!vault) {
    throw new Error('No wallet found. Please create or import a wallet.');
  }
  try {
    const mnemonic = await decrypt(
      vault.encryptedMnemonic,
      password,
      vault.salt,
      vault.iv
    );
    await unlockSession(mnemonic);
    return { success: true };
  } catch {
    throw new Error('Incorrect password. Please try again.');
  }
}

function lockWallet() {
  disposeWdk();
  sessionState = {
    isUnlocked: false,
    mnemonic: null,
    sessionExpiry: null,
    activeAccountIndex: sessionState.activeAccountIndex || 0,
  };
  chrome.alarms.clear('session_timeout');
  sessionAlarmScheduled = false;
  return { success: true };
}

async function getWalletStatus() {
  const vault = await getStoredVault();
  if (sessionState.isUnlocked && Date.now() > sessionState.sessionExpiry) {
    lockWallet();
  }
  return {
    hasWallet: !!vault,
    isUnlocked: sessionState.isUnlocked,
    activeAccountIndex: sessionState.activeAccountIndex,
  };
}

async function getAccountCount() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.ACCOUNT_COUNT);
  const n = stored[STORAGE_KEYS.ACCOUNT_COUNT];
  return typeof n === 'number' && n >= 1 ? Math.min(n, 20) : 5;
}

async function getAccounts({ chain = 'ethereum' } = {}) {
  requireUnlocked();
  const count = await getAccountCount();
  const accounts = await deriveAccountsForChain(chain, count);
  return { success: true, accounts };
}

async function getPortfolio({ chain = 'ethereum' } = {}) {
  requireUnlocked();
  const idx = sessionState.activeAccountIndex;
  const { address, balances } = await fetchBalancesForAddress(chain, idx);
  const cfg = isEvmChain(chain) ? EVM_CHAINS[chain] : null;
  const chainName = cfg?.name || chain.charAt(0).toUpperCase() + chain.slice(1);
  let usdPrices = {};
  try {
    usdPrices = await fetchUsdPrices();
  } catch {
    /* portfolio still works without USD */
  }

  const assets = formatPortfolioAssets(chain, balances, chainName, usdPrices);
  let portfolioUsd = 0;
  for (const asset of assets) {
    if (typeof asset.valueUsd === 'number' && Number.isFinite(asset.valueUsd)) {
      portfolioUsd += asset.valueUsd;
    }
  }

  let transactions = [];
  try {
    transactions = await fetchTransactions(chain, idx);
  } catch {
    /* history unavailable for this chain */
  }

  const addresses = {};
  for (const chainId of ALL_CHAIN_IDS) {
    try {
      const addr = await getChainAddress(chainId, idx);
      if (addr) addresses[chainId] = addr;
    } catch {
      /* chain unavailable */
    }
  }

  return {
    success: true,
    address,
    balances,
    assets,
    transactions,
    addresses,
    activeAccountIndex: idx,
    portfolioUsd,
    usdPrices,
  };
}

async function estimateSendFeeForPayload({ chain, to, amount, token }) {
  requireUnlocked();
  const estimate = await estimateSendFee({
    chain,
    accountIndex: sessionState.activeAccountIndex,
    to,
    amount,
    token,
  });
  return { success: true, ...estimate };
}

async function getBalance({ chain, network }) {
  requireUnlocked();
  const { balances, address } = await fetchBalancesForAddress(
    chain,
    sessionState.activeAccountIndex
  );
  return { success: true, balance: balances, address, network };
}

async function getChainAddressForChain({ chain }) {
  requireUnlocked();
  const address = await getChainAddress(chain, sessionState.activeAccountIndex);
  if (!address) {
    throw new Error(`Could not derive ${chain} address.`);
  }
  return { success: true, address };
}

async function getTransactions({ chain }) {
  requireUnlocked();
  const transactions = await fetchTransactions(chain, sessionState.activeAccountIndex);
  return { success: true, transactions };
}

async function sendTransaction({ to, amount, chain, token }) {
  requireUnlocked();
  const idx = sessionState.activeAccountIndex;
  const account = await getWdkAccount(chain, idx);
  const from = await account.getAddress();

  if (to.toLowerCase() === from.toLowerCase()) {
    throw new Error('Cannot send to your own address.');
  }

  const { balances } = await fetchBalancesForAddress(chain, idx);
  const cfg = isEvmChain(chain) ? EVM_CHAINS[chain] : null;
  const tokenSymbol = token || cfg?.nativeSymbol;
  const available = parseFloat(balances[tokenSymbol] || '0');
  const sendAmount = parseFloat(amount);
  if (!Number.isFinite(sendAmount) || sendAmount <= 0) {
    throw new Error('Enter a valid amount.');
  }
  if (sendAmount > available) {
    throw new Error(`Insufficient ${tokenSymbol} balance (available: ${available}).`);
  }

  if (isEvmChain(chain)) {
    const ethBal = parseFloat(balances[cfg.nativeSymbol] || '0');
    if (ethBal <= 0 && tokenSymbol !== cfg.nativeSymbol) {
      throw new Error(`You need ${cfg.nativeSymbol} on ${cfg.name} to pay network fees.`);
    }
  }

  const result = await sendChainTransaction({
    chain,
    accountIndex: idx,
    to,
    amount,
    token,
  });

  await appendTxLog({
    hash: result.hash,
    type: 'send',
    amount: String(amount),
    token: token || (isEvmChain(chain) ? EVM_CHAINS[chain].nativeSymbol : chain.toUpperCase()),
    from,
    to,
    chain,
    status: 'confirmed',
  });

  return { success: true, txHash: result.hash };
}

function validateAddress({ address, chain }) {
  let isValid = false;
  if (isEvmChain(chain) || chain === 'ethereum' || chain === 'polygon' || chain === 'arbitrum') {
    isValid = /^0x[a-fA-F0-9]{40}$/.test(address);
  } else if (chain === 'bitcoin') {
    isValid = /^(bc1|[13])[a-zA-HJ-NP-Z0-9]{25,90}$/.test(address);
  } else if (chain === 'solana') {
    isValid = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address);
  }
  return { success: true, isValid };
}

async function getSeedPhrase({ password }) {
  requireUnlocked();
  const vault = await getStoredVault();
  try {
    const mnemonic = await decrypt(
      vault.encryptedMnemonic,
      password,
      vault.salt,
      vault.iv
    );
    return { success: true, mnemonic };
  } catch {
    throw new Error('Incorrect password.');
  }
}

async function changePassword({ currentPassword, newPassword }) {
  requireUnlocked();
  const vault = await getStoredVault();
  try {
    const mnemonic = await decrypt(
      vault.encryptedMnemonic,
      currentPassword,
      vault.salt,
      vault.iv
    );
    await storeEncryptedVault(mnemonic, newPassword);
    return { success: true };
  } catch {
    throw new Error('Incorrect current password.');
  }
}

async function addAccount() {
  requireUnlocked();
  const count = await getAccountCount();
  if (count >= 20) {
    throw new Error('Maximum of 20 accounts reached.');
  }
  const next = count + 1;
  await chrome.storage.local.set({ [STORAGE_KEYS.ACCOUNT_COUNT]: next });
  return { success: true, accountCount: next };
}

async function switchAccount({ index }) {
  requireUnlocked();
  const i = Number(index);
  if (!Number.isInteger(i) || i < 0) {
    throw new Error('Invalid account.');
  }
  const count = await getAccountCount();
  if (i >= count) {
    throw new Error(`Account ${i + 1} does not exist. Add an account first.`);
  }
  await persistActiveAccountIndex(i);
  return { success: true, activeAccountIndex: i };
}

async function resetWallet() {
  lockWallet();
  await chrome.storage.local.clear();
  sessionState.activeAccountIndex = 0;
  return { success: true };
}

async function isDappOriginAllowed(origin) {
  if (!origin) return false;
  const prefs = await getPreferences();
  return Boolean(prefs.connectedOrigins?.[origin]);
}

async function requireDappOrigin(sender) {
  if (!sender?.tab?.id || !sender.origin) {
    throw new Error('Invalid sender.');
  }
  if (!(await isDappOriginAllowed(sender.origin))) {
    throw new Error('Site not connected.');
  }
}

async function requestAccountsForDapp({ chain = 'ethereum' }, sender) {
  requireUnlocked();
  await requireDappOrigin(sender);
  const accounts = await deriveAccountsForChain(chain, 1);
  return { success: true, accounts: [accounts[0].address] };
}

async function getAccountsForDapp({ chain = 'ethereum' }, sender) {
  requireUnlocked();
  if (!(await isDappOriginAllowed(sender?.origin))) {
    return { success: true, accounts: [] };
  }
  const accounts = await deriveAccountsForChain(chain, 1);
  return { success: true, accounts: [accounts[0].address] };
}

async function sendTransactionFromDapp({ txParams, chain = 'polygon' }, sender) {
  requireUnlocked();
  await requireDappOrigin(sender);
  const to = txParams.to;
  const data = txParams.data;
  const valueWei = txParams.value ? BigInt(txParams.value) : 0n;

  if (data && data !== '0x' && isEvmChain(chain)) {
    const { sendEvmContractTransaction } = await import('./wdk-loader.js');
    const result = await sendEvmContractTransaction({
      chain,
      accountIndex: sessionState.activeAccountIndex,
      to,
      data,
      value: valueWei,
    });
    return { success: true, txHash: result.hash };
  }

  const amount = formatUnits(valueWei, 18);
  const result = await sendTransaction({
    to,
    amount: amount === '0.0' ? '0' : amount,
    chain,
    token: EVM_CHAINS[chain]?.nativeSymbol,
  });
  return { success: true, txHash: result.hash };
}

async function signTypedDataFromDapp({ typedData, chain = 'polygon' }, sender) {
  requireUnlocked();
  await requireDappOrigin(sender);
  const account = await getWdkAccount(chain, sessionState.activeAccountIndex);
  if (typeof account.signTypedData !== 'function') {
    throw new Error('Typed data signing not supported.');
  }
  const { domain, types, message, primaryType } = typedData;
  const typesCopy = { ...types };
  delete typesCopy.EIP712Domain;
  const signature = await account.signTypedData({
    domain,
    types: typesCopy,
    message,
    primaryType,
  });
  return { success: true, signature };
}

async function ethCallFromDapp({ to, data, networkKey, chainKey }, sender) {
  await requireDappOrigin(sender);
  const result = await ethCall({ to, data, chainKey: chainKey || networkKey });
  return { success: true, result };
}

async function initEscrowConfig() {
  try {
    const res = await fetch(chrome.runtime.getURL('escrow.json'));
    if (res.ok) applyEscrowJsonOverrides(await res.json());
  } catch {
    /* defaults */
  }
}
initEscrowConfig();

async function switchChainFromDapp({ chainIdHex }, sender) {
  await requireDappOrigin(sender);
  return { success: true, chainId: chainIdHex };
}

async function personalSign(payload, sender) {
  requireUnlocked();
  await requireDappOrigin(sender);
  const message = payload?.message ?? payload?.data;
  if (message == null || message === '') {
    throw new Error('Missing message to sign.');
  }
  const chain = payload?.chain || 'ethereum';
  const signature = await signPersonalMessage(
    chain,
    sessionState.activeAccountIndex,
    message
  );
  return { success: true, signature };
}

async function getPreferences() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.PREFERENCES);
  return stored[STORAGE_KEYS.PREFERENCES] || { connectedOrigins: {} };
}

async function storeEncryptedVault(mnemonic, password) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedMnemonic = await encrypt(mnemonic, password, salt, iv);
  await chrome.storage.local.set({
    [STORAGE_KEYS.ENCRYPTED_VAULT]: {
      encryptedMnemonic,
      salt: Array.from(salt),
      iv: Array.from(iv),
      version: 1,
      createdAt: Date.now(),
    },
  });
}

async function getStoredVault() {
  const result = await chrome.storage.local.get(STORAGE_KEYS.ENCRYPTED_VAULT);
  return result[STORAGE_KEYS.ENCRYPTED_VAULT] || null;
}

function scheduleSessionTimeout() {
  if (sessionAlarmScheduled) return;
  chrome.alarms.create('session_timeout', {
    delayInMinutes: SESSION_TIMEOUT_MS / 60000,
  });
  sessionAlarmScheduled = true;
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'session_timeout') {
    lockWallet();
    chrome.runtime.sendMessage({ type: 'SESSION_EXPIRED' }).catch(() => {});
  }
});

function requireUnlocked() {
  if (!sessionState.isUnlocked) {
    throw new Error('Wallet is locked. Please unlock with your password.');
  }
  if (Date.now() > sessionState.sessionExpiry) {
    lockWallet();
    throw new Error('Session expired. Please unlock again.');
  }
  sessionState.sessionExpiry = Date.now() + SESSION_TIMEOUT_MS;
}
