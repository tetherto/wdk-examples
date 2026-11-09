/** Human-readable balance strings for UI (no scientific notation). */
export function formatBalance(v) {
  const n = parseFloat(v);
  if (Number.isNaN(n) || n === 0) return '0';
  if (n < 0.000001) return '<0.000001';
  if (n < 1) {
    const s = n.toFixed(6).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
    return s || '0';
  }
  const s = n.toFixed(4).replace(/(\.\d*?)0+$/, '$1').replace(/\.$/, '');
  return s || '0';
}
