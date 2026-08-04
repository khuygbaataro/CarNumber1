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
