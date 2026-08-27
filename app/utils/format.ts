export function formatNumber(n: number): string {
  if (n >= 1000) {
    const k = n / 1000;
    const s = k.toFixed(1);
    return s.endsWith('.0') ? s.slice(0, -2) + 'k' : s + 'k';
  }
  return n.toString();
}