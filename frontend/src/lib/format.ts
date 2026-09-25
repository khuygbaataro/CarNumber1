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

// Үйлдвэрлэсэн он, сартай бол сарыг нь хамт: (2015, 11) -> "2015 оны 11 сар".
// Хуучин өгөгдөлд он аравтын бутархайгаар (2015.11) сар шифрлэсэн байдгийг ч зохицуулна.
export const formatYear = (year?: number, month?: number | null): string => {
  const y = Number(year) || 0;
  const yr = Math.trunc(y);
  let mo = Number(month) || 0;
  if (!mo && !Number.isInteger(y)) mo = Math.round((y - yr) * 100); // legacy 2015.11 -> 11
  if (mo >= 1 && mo <= 12) return `${yr} оны ${String(mo).padStart(2, '0')} сар`;
  return `${yr} он`;
};

// Compact build date for tight spots — a poster chip, a printed table
// column: "2015", or "2015/11" when the month is known. Same legacy
// 2015.11 handling as formatYear, just without the words.
export const formatYearShort = (year?: number, month?: number | null): string => {
  const y = Number(year) || 0;
  const yr = Math.trunc(y);
  let mo = Number(month) || 0;
  if (!mo && !Number.isInteger(y)) mo = Math.round((y - yr) * 100);
  return mo >= 1 && mo <= 12 ? `${yr}/${String(mo).padStart(2, '0')}` : String(yr);
};

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
