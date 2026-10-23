'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { API_URL } from '@/lib/api';

/**
 * Reports each public page view, so the dashboard can show traffic beside
 * the cars it is about.
 *
 * The visitor id is random, kept in the browser, and means nothing anywhere
 * else — it exists only to tell one person reading five cars apart from five
 * people reading one.
 */
const KEY = 'vc_visitor';

// When storage is blocked — a private window, a hardened browser — the id
// lives for the tab instead. Falling back to a shared constant would collapse
// every such visitor into one, which is worse than counting them as new.
let perTab = '';

function visitorId(): string {
  const fresh = () =>
    typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  try {
    let id = localStorage.getItem(KEY);
    if (!id) {
      id = fresh();
      localStorage.setItem(KEY, id);
    }
    return id;
  } catch {
    if (!perTab) perTab = fresh();
    return perTab;
  }
}

export default function TrackView() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;
    const onCar = pathname.match(/^\/vehicles\/([a-f\d]{24})$/i);
    fetch(`${API_URL}/stats/view`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        path: pathname,
        visitor: visitorId(),
        vehicleId: onCar ? onCar[1] : undefined,
      }),
      // The view is usually the last thing a page does before the visitor
      // moves on; without this the request dies with the page.
      keepalive: true,
    }).catch(() => {
      /* counting is never worth surfacing to a visitor */
    });
  }, [pathname]);

  return null;
}
