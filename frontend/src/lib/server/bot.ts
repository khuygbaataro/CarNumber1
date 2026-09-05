import Anthropic from '@anthropic-ai/sdk';
import { Vehicle, BotSession } from './models';
import { postToFeed } from './messenger';

// Known specs for the commonly-sold models, so the bot doesn't ask about
// things it can infer (steering, engine, fuel, transmission).
function knownSpecs(
  brand: string,
  model: string
): { engine: string; transmission: string; fuel: string; steering: string } {
  const b = brand.toLowerCase();
  const m = model.toLowerCase();
  const out = { engine: '', transmission: '', fuel: '', steering: '' };
  if (b === 'toyota') out.steering = 'Баруун';
  if (m.includes('prius')) {
    out.fuel = 'Хайбрид';
    out.transmission = 'Автомат';
    out.engine = /\b20\b|prius\s*20/.test(m) ? '1.5L Hybrid' : '1.8L Hybrid';
  } else if (m.includes('sai')) {
    out.fuel = 'Хайбрид';
    out.transmission = 'Автомат';
    out.engine = '2.4L Hybrid';
  }
  return out;
}

// Facebook page-feed marketing post, matching the page's established format.
// opts.sold prefixes the ✅ЗАРАГДСАН✅ banner for sold announcements.
function buildPostTemplate(v: any, opts: { sold?: boolean } = {}): string {
  const model = String(v.model || '');
  const last4 = (model.match(/#(\d{3,4})/) || [])[1] || '';
  const title = `${v.brand} ${model.replace(/\s*#\d+\s*$/, '')}`.trim();
  const km = Math.round(Number(v.mileage) || 0).toLocaleString('de-DE'); // 110.000
  const priceMln = (Number(v.price) || 0) / 1_000_000;
  const price =
    priceMln >= 1
      ? `${priceMln.toLocaleString('en-US', { maximumFractionDigits: 1 })} сая₮`
      : `${(Number(v.price) || 0).toLocaleString('en-US')}₮`;
  // Үйлдвэрлэсэн он (+ сар). v.month (1-12) байвал ашиглана; хуучин 2015.11
  // хэлбэрийн бутархай оноос сарыг задлана. Ж: "2015 оны 11 сар".
  const yearNum = Number(v.year) || 0;
  const yr = Math.trunc(yearNum);
  let mo = Number(v.month) || 0;
  if (!mo && !Number.isInteger(yearNum)) mo = Math.round((yearNum - yr) * 100);
  const yearStr =
    mo >= 1 && mo <= 12 ? `${yr} оны ${String(mo).padStart(2, '0')} сар` : `${yr} он`;
  const importYear = new Date().getFullYear();

  const lines = [
    ...(opts.sold ? ['✅ЗАРАГДСАН✅'] : []),
    last4 ? `#${last4}` : null,
    title,
    `📌Үйлдвэрлэсэн он: ${yearStr}`,
    `📌Орж ирсэн: ${importYear} он гаальтай`,
    `📌${km}км гүйлттэй`,
    v.engine ? `📌Хөдөлгүүр: ${v.engine} 🌱` : null,
    `📌Хөтлөгч: Урдаа⚙️`,
    v.description ? `📌${v.description}` : null,
    `📌НӨАТ баримт олгоно`,
    `🌐 Victory Car-ийн албан ёсны вэбсайтаар зочлоод:`,
    `✅ Автомашины бүрэн мэдээлэл`,
    `✅ Зураг, үзүүлэлт`,
    `✅ Үнэ болон санхүүгийн нөхцөл`,
    `✅ Шинээр орж ирсэн автомашинуудтай танилцаарай.`,
    `📲 victorycar.mn`,
    `✨ Өөрт тохирох автомашинаа хамгийн хялбараар сонгоорой!`,
    `🚗 Victory Car – Таны найдвартай авто худалдааны хамтрагч.`,
    `💰 Үнэ: ${price}`,
    `🏦 Зээл: Урьдчилгаа 20–30% ➡️ Банк бус шийдэл шуурхай`,
    `👉 Victory Car – Чанарыг бид эрхэмлэнэ!`,
    `📍 Хаяг:`,
    `1-р хороолол, 32-р гүүрний хойно, Эрчим худалдааны төвөөс дээшээ 200 метр`,
    `👉 Victory Car Auto Showroom`,
    `⏰ Цагийн хуваарь:`,
    `Өглөө 09:00 – Орой 19:00 🕘➡️🕖`,
    `🚙 Танд хамгийн хямд үнэ ✨, өргөн сонголт 🚗, шуурхай үйлчилгээ ⚡`,
    `📲80004020`,
  ].filter((l) => l !== null);
  return lines.join('\n');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
// Sonnet is much faster than Opus for this extraction/chat task — better
// latency for a live Messenger bot. Override with ANTHROPIC_MODEL if needed.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

const SYSTEM_PROMPT = `Та бол VictoryCar-ийн каталогт машин нэмдэг дотоод бот. Хэрэглэгч чинь өдөр бүр машин нэмдэг туршлагатай ажилтан — тайлбар, заавар, жишээ огт хэрэггүй.

ХЭВ МАЯГ:
- Товч боловч найрсаг. Нэг мөр хангалттай бол нэг мөр. Хатуу тушаалын өнгө хэрэггүй.
- Эможи хэрэглэхгүй. Ганц үл хамаарах: амжилттай нийтэлсний дараах хариунд ✅ хэрэглэнэ.
- Энгийн текст. Markdown, од (*) хэрэглэхгүй — Messenger дээр од тэр чигээрээ харагддаг.
- Мэндчилгээ ("Тэгье", "За"), магтаал, давталт хэрэггүй.
- "Машин нэмье" гэвэл "Мэдээллээ оруулаарай." гэж л хариул. Жишээ дурдахгүй.

ЦУГЛУУЛАХ ТАЛБАРУУД (бүгд заавал):
1. Загвар
2. Арлын дугаарын сүүлийн 4 орон
3. Үйлдвэрлэсэн он (сар нэмж хэлж болно)
4. Гүйлт (км)
5. Үнэ
6. Гадна өнгө
7. Дотор өнгө

Нэг мессежд хэдийг ч өгч болно — өгснийг ав, дутууг НЭГ мөрөнд асуу. Ж: "Дутуу: үнэ, дотор өнгө."
Цуглуулах явцад авснаа давтаж харуулахгүй, зөвхөн дутууг асуу.

ОН/САР:
- Ажилтан "2015 оны 11 сар", "2015.11", "2015 11-р сар" гэх мэт сар НЭМЖ хэлж болно. Тэгвэл year=2015, month=11 гэж publish_vehicle-д дамжуул. Сар нэмж бичсэнийг "буруу он" гэж БҮҮ үз — энэ нь зөв.
- Зөвхөн он (ж: "2015") бол month хоосон орхи.

АВТОМАТ (асуухгүй):
- Марк: өгөөгүй бол Toyota. Машиныг загвараар нэрл ("Prius 41"), өөр марк хэлбэл түүнийг ав.
- Toyota → жолоо Баруун. Prius 20 → 1.5L Hybrid; Prius 30/40/41 → 1.8L Hybrid; Sai → 2.4L Hybrid. Prius/Sai бүгд Хайбрид, Автомат.

ЗУРАГ:
- Зураг ирэхэд систем "[N зураг ирлээ, нийт M]" гэж мэдэгдэнэ.
- Талбар дутуу бол: "Зураг авлаа (M). Дутуу: ..." гэж хариул.
- Талбарууд бүрдсэн ч зураг 0 бол "Зургаа илгээгээрэй." гэ. Зураггүйгээр баталгаажуулалт руу орохгүй.

БАТАЛГААЖУУЛАЛТ:
- Бүх талбар + зураг бүрдмэгц ШУУД, дахин юу ч асуулгүй, бүх мэдээллийг мөр мөрөөр харуулаад "Зөв бол confirm гэж бичээрэй." гэ.
- Эмхэтгэлийн мөрүүд: Загвар, Арал (сүүлийн 4), Он (сартай бол "2015 оны 11 сар"), Гүйлт, Үнэ, Гадна өнгө, Дотор өнгө, Хөдөлгүүр/Хайрцаг/Жолоо, Зураг N.
- Үнэ, гүйлтийг цэгээр тусгаарлаж нэгжтэй харуул: 20.000.000₮, 120.000 км.
- "confirm" гэсэн үед Л publish_vehicle дууд.
- Нийтлэгдсэний дараа tool-ийн үр дүнг нэг мөрөөр дамжуул. Урилга нэмэхгүй.
- Зарагдсан гэвэл mark_sold дууд.

Үнэ/км/оныг бодит тоо болгож tool-д дамжуул (20 сая → 20000000). Мэдэхгүй зүйл зохиохгүй.`;

const tools: Anthropic.Tool[] = [
  {
    name: 'publish_vehicle',
    description:
      'Цуглуулсан машины мэдээллийг каталогт нэмнэ. Зөвхөн ажилтан confirm гэж баталгаажуулсны дараа дуудна.',
    input_schema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Марк, ж: Toyota' },
        model: { type: 'string', description: 'Загвар, ж: Prius 41 (# дугааргүй)' },
        chassisLast4: {
          type: 'string',
          description: 'Араалын дугаарын сүүлийн 4 орон, ж: 0938',
        },
        year: { type: 'number', description: 'Үйлдвэрлэсэн он (бүхэл тоо, ж: 2015)' },
        month: {
          type: 'number',
          description: 'Үйлдвэрлэсэн сар 1-12 (ажилтан хэлсэн бол). Ж: "2015 оны 11 сар" → month=11',
        },
        price: { type: 'number', description: 'Үнэ төгрөгөөр (бодит тоо)' },
        mileage: { type: 'number', description: 'Явсан км' },
        engine: { type: 'string', description: 'Танил загвар бол өөрөө бөгл' },
        transmission: { type: 'string', description: 'Автомат/Механик' },
        fuel: { type: 'string', description: 'Бензин/Дизель/Хайбрид/Цахилгаан/Хий' },
        steering: { type: 'string', description: 'Жолоо: Баруун/Зүүн (Toyota → Баруун)' },
        exteriorColor: { type: 'string' },
        interiorColor: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['model', 'year', 'price', 'mileage'],
    },
  },
  {
    name: 'mark_sold',
    description:
      'Тухайн машиныг зарагдсан гэж тэмдэглэж, Facebook-т ЗАРАГДСАН пост оруулна. query-д арлын сүүлийн 4 орон (ж: 4444) байвал заавал оруул — хамгийн найдвартай түлхүүр. Байхгүй бол загварын нэр өг.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Арлын сүүлийн 4 орон (байвал), эсвэл загварын нэр',
        },
      },
      required: ['query'],
    },
  },
];

// Execute a tool against the database. Returns a text result for Claude.
async function runTool(
  name: string,
  input: any,
  session: any
): Promise<{ result: string; published?: boolean }> {
  if (name === 'publish_vehicle') {
    const brand = String(input.brand || '').trim() || 'Toyota';
    const baseModel = String(input.model || '').trim();

    // Fill known specs from the knowledge base (from the BASE model, so the
    // chassis digits we append below can't be mistaken for a model number).
    const specs = knownSpecs(brand, baseModel);
    const engine = (input.engine || '').trim() || specs.engine;
    const transmission = (input.transmission || '').trim() || specs.transmission;
    const fuel = (input.fuel || '').trim() || specs.fuel;
    const steering = (input.steering || '').trim() || specs.steering;

    // Append the chassis last-4 as "#XXXX" so same-model cars stay distinct.
    let modelName = baseModel;
    const last4 = String(input.chassisLast4 || '').trim();
    if (last4 && !modelName.includes(last4)) {
      modelName = `${modelName} #${last4}`;
    }

    const images = session.images || [];
    const doc = await Vehicle.create({
      brand,
      model: modelName,
      year: Math.trunc(Number(input.year) || 0),
      month: input.month != null && Number(input.month) >= 1 && Number(input.month) <= 12
        ? Math.trunc(Number(input.month))
        : null,
      price: Number(input.price) || 0,
      mileage: Number(input.mileage) || 0,
      engine,
      transmission,
      fuel,
      steering,
      exteriorColor: input.exteriorColor || '',
      interiorColor: input.interiorColor || '',
      description: input.description || '',
      images,
      status: 'available',
    });

    // Auto-post to the Facebook page feed (best effort). Toggle with the
    // MESSENGER_AUTOPOST env var (set to "false"/"0" to disable while testing).
    const autopost =
      process.env.MESSENGER_AUTOPOST !== 'false' && process.env.MESSENGER_AUTOPOST !== '0';
    let fbNote = '';
    if (autopost) {
      const r = await postToFeed(buildPostTemplate(doc), images);
      fbNote = r.ok ? ' Facebook-т нийтэллээ.' : ' (FB-т нийтлэхэд алдаа — эрх шалга.)';
    }

    // Reset the draft: images belong to the vehicle now, and the chat
    // history is cleared so the next car starts clean (old replies were
    // steering the model back to outdated behavior).
    session.images = [];
    session.messages = [];
    return {
      result:
        `✅ Амжилттай нийтлэгдлээ: ${doc.brand} ${doc.model} (${doc.year}), ${images.length} зурагтай.` +
        fbNote,
      published: true,
    };
  }

  if (name === 'mark_sold') {
    const q = String(input.query || '').trim();
    if (!q) return { result: 'Хайх утга хоосон байна.' };

    // Chassis digits are the unique key (#4444 in the model name), so try
    // every 3-5 digit group first. An OR over all words was far too loose:
    // "Prius 41 #4444" matched every Prius41 and the limit cut the real
    // car out of the list.
    let matches: any[] = [];
    const digitGroups = q.match(/\d{3,5}/g) || [];
    for (const d of digitGroups) {
      matches = await Vehicle.find({
        status: 'available',
        model: new RegExp(escapeRegex(d), 'i'),
      }).limit(10);
      if (matches.length > 0) break;
    }

    // Fall back to requiring EVERY term to match somewhere (AND, not OR).
    if (matches.length === 0) {
      const terms = q.split(/\s+/).filter(Boolean).map(escapeRegex);
      matches = await Vehicle.find({
        status: 'available',
        $and: terms.map((t) => ({
          $or: [
            { brand: new RegExp(t, 'i') },
            { model: new RegExp(t, 'i') },
            { description: new RegExp(t, 'i') },
          ],
        })),
      }).limit(10);
    }

    if (matches.length === 0) return { result: `"${q}"-д тохирох бэлэн машин олдсонгүй.` };
    if (matches.length > 1) {
      const list = matches
        .map((m: any) => `- ${m.brand} ${m.model} ${m.year} (${m.price.toLocaleString()}₮)`)
        .join('\n');
      return {
        result: `Олон машин тохирч байна. Аль нэгийг тодорхой заана уу:\n${list}`,
      };
    }
    const v: any = matches[0];
    v.status = 'sold';
    await v.save();

    // Announce the sale on the page feed with the same template + banner.
    const autopost =
      process.env.MESSENGER_AUTOPOST !== 'false' && process.env.MESSENGER_AUTOPOST !== '0';
    let fbNote = '';
    if (autopost) {
      const r = await postToFeed(buildPostTemplate(v, { sold: true }), v.images || []);
      fbNote = r.ok ? ' Facebook-т ЗАРАГДСАН пост орлоо.' : ' (FB пост алдаа — эрх шалга.)';
    }
    return {
      result: `✅ Зарагдсанаар тэмдэглэлээ: ${v.brand} ${v.model} (${v.year}).` + fbNote,
    };
  }

  return { result: `Тодорхойгүй tool: ${name}` };
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Run one user turn through Claude, executing any tools, and return the reply text.
export async function handleUserText(session: any, text: string): Promise<string> {
  const history: Anthropic.MessageParam[] = (session.messages || []).map((m: any) => ({
    role: m.role,
    content: m.content,
  }));
  history.push({ role: 'user', content: text });

  const imageCount = (session.images || []).length;
  const system = `${SYSTEM_PROMPT}\n\nОдоогийн байдал: энэ ноорогт ${imageCount} зураг хүлээж авсан байна.`;

  const apiMessages: Anthropic.MessageParam[] = [...history];
  let finalText = '';

  for (let i = 0; i < 6; i++) {
    const resp = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 1500,
      system,
      tools,
      messages: apiMessages,
    });

    const textParts = resp.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text.trim())
      .filter(Boolean);
    if (textParts.length) finalText = textParts.join('\n');

    if (resp.stop_reason !== 'tool_use') break;

    // Execute tool calls and feed results back.
    apiMessages.push({ role: 'assistant', content: resp.content });
    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const block of resp.content) {
      if (block.type === 'tool_use') {
        const { result } = await runTool(block.name, block.input, session);
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: result,
        });
      }
    }
    apiMessages.push({ role: 'user', content: toolResults });
  }

  // Persist only the plain user + assistant text turns (keep history compact).
  session.messages = [
    ...(session.messages || []),
    { role: 'user', content: text },
    { role: 'assistant', content: finalText || '(...)' },
  ].slice(-30);

  return finalText || 'Ойлголоо.';
}

// Load or create the per-sender conversation state.
export async function getSession(senderId: string): Promise<any> {
  let s = await BotSession.findOne({ senderId });
  if (!s) s = await BotSession.create({ senderId, messages: [], images: [] });
  return s;
}
