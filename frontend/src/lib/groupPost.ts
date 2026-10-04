// The post text that goes with a car's photos into a Facebook group.
//
// A group post is not the website: it is read in a feed, half-skimmed, and
// it has one job — get the phone to ring. So it carries the two facts that
// decide whether someone reads on (age and mileage), the one that removes
// the obstacle (a small down payment, leasing available), and then the
// number. The price is left out by default: quoting it lets a reader decide
// against the car without ever calling, and the call is the point.

import { Vehicle } from '@/types';
import { formatMileage, formatPrice, formatYear } from './format';
import { splitStockCode } from './vehicle';

/** The number group posts are answered on — not the showroom line. */
export const GROUP_PHONE_DEFAULT = '8833-3688';

export interface GroupPostOptions {
  phone: string;
  /** Off by default; see the note above. */
  withPrice?: boolean;
}

export function buildGroupPost(v: Vehicle, options: GroupPostOptions): string {
  const { name } = splitStockCode(v.model);
  const phone = options.phone.trim() || GROUP_PHONE_DEFAULT;

  const lines = [
    `🚗 ${v.brand} ${name || v.model}`,
    `📅 Үйлдвэрлэсэн он: ${formatYear(v.year, v.month)}`,
  ];
  if (v.mileage) lines.push(`🛣 Гүйлт: ${formatMileage(v.mileage)}`);
  if (options.withPrice && v.price) lines.push(`💵 Үнэ: ${formatPrice(v.price)}`);

  lines.push(
    '',
    '💰 Урьдчилгаа багатай',
    '🏦 Зээлээр авах боломжтой',
    '',
    '☎️ Нөхцөл, дэлгэрэнгүй мэдээллийг утсаар шууд тайлбарлаж өгнө.',
    `📞 ${phone}`
  );

  return lines.join('\n');
}

/**
 * A filename the seller can find again in their downloads folder.
 * Cyrillic and spaces are stripped: a car's model often carries both, and
 * they survive a download badly on Windows.
 */
export function postImageName(v: Vehicle, index: number, url: string): string {
  const { code, name } = splitStockCode(v.model);
  const ext = (url.split('?')[0].match(/\.([a-z0-9]{3,4})$/i)?.[1] || 'jpg').toLowerCase();
  const slug = `${v.brand} ${name || v.model}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${[slug, code].filter(Boolean).join('-')}-${index + 1}.${ext}`;
}
