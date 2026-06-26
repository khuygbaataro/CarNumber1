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
