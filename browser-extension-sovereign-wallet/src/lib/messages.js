/**
 * WDK Extension - Message Bus
 * Typed message passing between popup and background service worker
 */

export async function sendMessage(type, payload = {}) {
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ type, payload }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }
      if (response?.error) {
        reject(new Error(response.error));
        return;
      }
      resolve(response);
    });
  });
}

// ─── Typed API ────────────────────────────────────────────────────────────────

export const wallet = {
  create: (password) => sendMessage('WALLET_CREATE', { password }),
  import: (mnemonic, password) => sendMessage('WALLET_IMPORT', { mnemonic, password }),
  unlock: (password) => sendMessage('WALLET_UNLOCK', { password }),
  lock: () => sendMessage('WALLET_LOCK'),
  status: () => sendMessage('WALLET_STATUS'),
  reset: () => sendMessage('RESET_WALLET'),
  getSeedPhrase: (password) => sendMessage('GET_SEED_PHRASE', { password }),
  changePassword: (currentPassword, newPassword) =>
    sendMessage('CHANGE_PASSWORD', { currentPassword, newPassword }),
};

export const accounts = {
  list: (chain) => sendMessage('GET_ACCOUNTS', { chain }),
  add: () => sendMessage('ADD_ACCOUNT'),
  switch: (index) => sendMessage('SWITCH_ACCOUNT', { index }),
};

export const chain = {
  balance: (address, chainName, network) =>
    sendMessage('GET_BALANCE', { address, chain: chainName, network }),
  transactions: (address, chainName, network) =>
    sendMessage('GET_TRANSACTIONS', { address, chain: chainName, network }),
  send: (params) => sendMessage('SEND_TRANSACTION', params),
  validateAddress: (address, chainName) =>
    sendMessage('VALIDATE_ADDRESS', { address, chain: chainName }),
};
