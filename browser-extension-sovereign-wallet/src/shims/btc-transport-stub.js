/** Stub for Node-only BTC transports (Electrum TCP/TLS/WS) in the extension build. */
export default class BtcTransportStub {
  connect() {
    throw new Error('Electrum transport is not available in the browser extension. Use blockbook-http.');
  }
  disconnect() {}
}
