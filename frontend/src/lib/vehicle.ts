// Shared vehicle-level rules used by both cards and pages.

/**
 * How long a car wears the "Шинэ" badge, in days. Based on createdAt so it
 * lines up with the backend's "newest" ordering (SORT_MAP.newest =
 * '-createdAt').
 *
 * Keep this short. Cars are uploaded in batches here, so a wide window puts
 * the badge on every single card and it stops meaning anything — the badge
 * only works while it marks a minority of the catalogue. Raise it if stock
 * starts turning over more slowly.
 */
export const NEW_ARRIVAL_DAYS = 2;

export function isNewArrival(createdAt?: string): boolean {
  if (!createdAt) return false;
  const added = new Date(createdAt).getTime();
  if (!Number.isFinite(added)) return false;
  return Date.now() - added < NEW_ARRIVAL_DAYS * 24 * 60 * 60 * 1000;
}

/** Grouping key for a brand — trimmed and upper-cased, blanks folded to "—". */
export function brandKey(brand?: string): string {
  return (brand || '').trim().toUpperCase() || '—';
}

/**
 * Groups vehicles by brand, brands A→Z. Each group keeps the order it was
 * given, so a caller that handed over a sorted list gets it back sorted.
 */
export function groupByBrand<T extends { brand: string }>(
  items: T[]
): { brand: string; items: T[] }[] {
  const groups = new Map<string, T[]>();
  items.forEach((item) => {
    const key = brandKey(item.brand);
    const list = groups.get(key);
    if (list) list.push(item);
    else groups.set(key, [item]);
  });
  return [...groups.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([brand, list]) => ({ brand, items: list }));
}

/**
 * Stock numbers live inside the model field as "Prius 41 #8088" — the last
 * digits staff use to call a car on the lot. Split them out so a listing
 * can show the number in its own column without repeating it in the name.
 *
 * Only an explicit "#" counts. A bare trailing number is part of the model
 * itself often enough ("Land Cruiser 200", "RX 450") that guessing would
 * strip real names.
 */
export function splitStockCode(model?: string): { code: string; name: string } {
  const full = (model || '').trim();
  const match = full.match(/#\s*([A-Za-z0-9-]+)/);
  if (!match) return { code: '', name: full };
  return {
    code: match[1],
    name: full.replace(match[0], '').replace(/\s{2,}/g, ' ').trim(),
  };
}
