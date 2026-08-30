/**
 * Content script: exposes window.wdk for dApps (EIP-1193-style).
 * Signing and keys stay in the background service worker.
 */
(function () {
  'use strict';

  if (window.__wdkInjected) return;
  window.__wdkInjected = true;

  const WDKProvider = {
    isWDK: true,
    isMetaMask: false,
    chainId: '0x1',

    async request({ method, params = [] }) {
      switch (method) {
        case 'eth_requestAccounts':
          return requestAccounts();
        case 'eth_accounts':
          return getAccounts();
        case 'eth_chainId':
          return this.chainId;
        case 'eth_sendTransaction':
          return sendTransaction(params[0]);
        case 'personal_sign':
          return personalSign(params[0], params[1]);
        case 'eth_signTypedData_v4':
        case 'eth_signTypedData':
          return signTypedData(params[1] ?? params[0]);
        case 'eth_call':
          return ethCall(params[0]);
        case 'wallet_switchEthereumChain':
          return switchChain(params[0]);
        default:
          throw new Error(`Method ${method} not supported`);
      }
    },

    on(event, listener) {
      window.addEventListener(`wdk_${event}`, (e) => listener(e.detail));
    },

    removeListener(event, listener) {
      window.removeEventListener(`wdk_${event}`, listener);
    },
  };

  async function requestAccounts() {
    const response = await sendToBackground('REQUEST_ACCOUNTS');
    return response.accounts || [];
  }

  async function getAccounts() {
    const response = await sendToBackground('GET_ACCOUNTS_CONTENT');
    return response.accounts || [];
  }

  async function sendTransaction(txParams) {
    const response = await sendToBackground('SEND_TX_CONTENT', { txParams });
    return response.txHash;
  }

  async function personalSign(data, address) {
    const response = await sendToBackground('PERSONAL_SIGN', { data, address });
    return response.signature;
  }

  async function signTypedData(typedData) {
    const response = await sendToBackground('ETH_SIGN_TYPED_DATA', {
      typedData,
      chain: 'polygon',
    });
    return response.signature;
  }

  async function ethCall(callParams) {
    const response = await sendToBackground('ETH_CALL', {
      to: callParams.to,
      data: callParams.data,
      networkKey: callParams.networkKey || 'polygonAmoy',
    });
    return response.result;
  }

  async function switchChain({ chainId }) {
    await sendToBackground('WALLET_SWITCH_CHAIN', { chainIdHex: chainId });
    WDKProvider.chainId = chainId;
    return null;
  }

  function sendToBackground(type, payload = {}) {
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
        resolve(response || {});
      });
    });
  }

  try {
    Object.defineProperty(window, 'wdk', {
      value: WDKProvider,
      writable: false,
      configurable: false,
    });
  } catch {
    /* already defined */
  }
})();
