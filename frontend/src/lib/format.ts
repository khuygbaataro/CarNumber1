// Formatting helpers. Prices are in MNT (₮).

export const formatNumber = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

export const formatPrice = (price: number): string => `${formatNumber(price)}₮`;

// Compact, scannable price for cards: 65,500,000 -> "65.5 сая ₮"
export const formatPriceShort = (price: number): string => {
  const v = Math.round(price || 0);
  if (v >= 1_000_000) {
    const millions = Math.round((v / 1_000_000) * 100) / 100;
    return `${millions} сая ₮`;
  }
  return `${formatNumber(v)}₮`;
};

export const formatMileage = (km: number): string => `${formatNumber(km)} км`;

// Monthly payment span for an equal-principal loan: the instalment starts
// high and falls every month, so both ends are shown — "669,760 → 288,120₮".
// One ₮ at the end covers the pair and keeps the line short enough for a card.
export const formatPaymentRange = (first: number, last: number): string =>
  `${formatNumber(first)} → ${formatPrice(last)}`;

// How long ago something was added, in Mongolian. Within 24h it reads in
// hours/minutes; once a full day passes it flips to "N өдрийн өмнө".
export const formatTimeAgo = (dateStr?: string): string => {
  if (!dateStr) return '';
  const then = new Date(dateStr).getTime();
  if (!Number.isFinite(then)) return '';
  const sec = Math.max(0, Math.floor((Date.now() - then) / 1000));
  const min = Math.floor(sec / 60);
  const hr = Math.floor(min / 60);
  const day = Math.floor(hr / 24);
  if (sec < 60) return 'Дөнгөж сая';
  if (min < 60) return `${min} минутын өмнө`;
  if (hr < 24) return `${hr} цагийн өмнө`;
  if (day < 30) return `${day} өдрийн өмнө`;
  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon} сарын өмнө`;
  return `${Math.floor(mon / 12)} жилийн өмнө`;
};
