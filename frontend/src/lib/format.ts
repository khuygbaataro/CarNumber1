// Formatting helpers. Prices are in MNT (₮).

export const formatNumber = (n: number): string =>
  Math.round(n).toLocaleString('en-US');

export const formatPrice = (price: number): string => `${formatNumber(price)}₮`;

export const formatMileage = (km: number): string => `${formatNumber(km)} км`;
