import QRCode from 'qrcode';

window.SovereignQR = {
  toCanvas(canvas, text) {
    return QRCode.toCanvas(canvas, text, {
      width: 168,
      margin: 2,
      color: { dark: '#0a0f0d', light: '#ffffff' },
    });
  },
};
