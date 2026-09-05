// Загварын нэрээс ангилал гаргана (Prius 41, Sai, RX, ... эсвэл Бусад).
// Frontend дээр тооцдог тул тусад нь backend endpoint шаардахгүй.
export function categoryOf(model: string): string {
  const m = String(model || '').trim();
  const prius = m.match(/prius\s*(\d{2})/i);
  if (prius) return `Prius ${prius[1]}`;
  if (/prius/i.test(m)) return 'Prius';
  if (/^aqua/i.test(m)) return 'Aqua';
  if (/^sai/i.test(m)) return 'Sai';
  if (/^alphard/i.test(m)) return 'Alphard';
  if (/^crown/i.test(m)) return 'Crown';
  if (/^camry/i.test(m)) return 'Camry';
  if (/^harrier/i.test(m)) return 'Harrier';
  if (/^vellfire/i.test(m)) return 'Vellfire';
  if (/land\s*cruiser/i.test(m)) return 'Land Cruiser';
  if (/^rx/i.test(m)) return 'RX';
  if (/^hs/i.test(m)) return 'HS';
  if (/^gs/i.test(m)) return 'GS';
  if (/^c-?hr/i.test(m)) return 'CHR';
  return 'Бусад';
}
