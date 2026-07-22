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

// Facebook page-feed post text for a newly added vehicle.
function buildPostTemplate(v: any): string {
  const num = (n: number) => (Number(n) || 0).toLocaleString('en-US');
  const specLine = [v.engine, v.transmission, v.steering && `Жолоо: ${v.steering}`]
    .filter(Boolean)
    .join(' | ');
  const lines = [
    `${v.brand} ${v.model} · ${v.year} он`,
    `Үнэ: ${num(v.price)}₮`,
    `Гүйлт: ${num(v.mileage)} км`,
    specLine,
    v.exteriorColor && `Өнгө: ${v.exteriorColor}`,
    v.description && v.description,
    '',
    'Дэлгэрэнгүй: https://victorycar.mn',
    'Утас: +976 8000-4020',
  ].filter(Boolean);
  return lines.join('\n');
}

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

const SYSTEM_PROMPT = `Та бол VictoryCar-ийн каталогт машин нэмэх дотоод туслах. Facebook Messenger дээр ажилтантай харилцана.

ХЭВ МАЯГ (маш чухал):
- Маш товч. Богино өгүүлбэр, цөөн үг. Эр хүн шиг шууд, тодорхой, дуулгавартай.
- Эможи, тэмдэгт зураг ОГТ бүү хэрэглэ. Хэзээ ч, ямар ч мессежд эможи бүү бич.
- Нэг удаад нэг л зүйл асуу. Илүү тайлбар, магтаал, давталт бүү бич.

МЭДЭЭЛЛИЙН САН (эдгээрийг АСУУХГҮЙ, өөрөө бөглө):
- Toyota бол жолоо баруун талд (steering: Баруун).
- Prius 20/30/40/41 бол хайбрид (fuel: Хайбрид), автомат (transmission: Автомат).
  Хөдөлгүүр: Prius 20 → 1.5L Hybrid, бусад Prius (30/40/41) → 1.8L Hybrid.
- Toyota Sai → 2.4L Hybrid, автомат.
Танил загвар бол дээрхийг автоматаар бөглө, дахин бүү асуу.

МАРК: битгий асуу. Өгөөгүй бол Toyota гэж үз. Машиныг зөвхөн загвараар нь нэрл
(ж: "Prius 41"), "Toyota" гэж бүү нэм. Ажилтан өөр марк (ж: Nissan) хэлбэл тэрийг ав.

ЗӨВХӨН ДООРХЫГ АСУУ (нэг нэгээр, товч):
1. Загвар (ж: Prius 41)
2. Араалын сүүлийн 4 орон (ж: 0938)
3. Он
4. Гүйлт (км)
5. Үнэ (төгрөг)
6. Гадна өнгө
Танил бус загвар бол дутуу зүйлийг (хөдөлгүүр, түлш, жолоо) асуу.

ЗУРАГ: ажилтан зургаа шууд илгээнэ. Хэдэн зураг авсныг систем хэлнэ. Зураг байхгүй бол нэг удаа сануул.

УРСГАЛ:
1. Дээрх талбаруудыг цуглуул. Танил загварын үлдсэн мэдээллийг өөрөө бөгл.
2. Бүрдсэн бол товч эмхэтгэл харуулаад "Байршуулах уу? confirm гэж бичнэ үү" гэ.
3. "confirm" гэсэн ҮЕД Л publish_vehicle дууд. Өмнө нь бүү дууд.
4. Машин зарагдсан гэвэл mark_sold дууд.

ДҮРЭМ: мэдэхгүй зүйл бүү зохио. Үнэ/км/оныг бодит тоо болго (сая, мянгыг тооцоол).`;

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
        year: { type: 'number', description: 'Үйлдвэрлэсэн он' },
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
      'Тухайн машиныг зарагдсан гэж тэмдэглэнэ. query-д марк/загвар/он гэх мэт хайлтын үг өг.',
    input_schema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Хайх машины марк/загвар/он' },
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
      year: Number(input.year) || 0,
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

    // Auto-post to the Facebook page feed (best effort).
    const posted = (await postToFeed(buildPostTemplate(doc), images)).ok;

    // Clear the draft images now that they belong to a vehicle.
    session.images = [];
    return {
      result:
        `Нэмэгдлээ: ${doc.brand} ${doc.model} ${doc.year}, ${images.length} зураг.` +
        (posted ? ' Facebook-т нийтэллээ.' : ' (FB-т нийтлэхэд алдаа — эрх шалга.)'),
      published: true,
    };
  }

  if (name === 'mark_sold') {
    const q = String(input.query || '').trim();
    if (!q) return { result: 'Хайх утга хоосон байна.' };
    const rx = new RegExp(q.split(/\s+/).map((s) => escapeRegex(s)).join('|'), 'i');
    const matches = await Vehicle.find({
      status: 'available',
      $or: [{ brand: rx }, { model: rx }, { description: rx }],
    }).limit(10);
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
    return { result: `Зарагдсан гэж тэмдэглэлээ: ${v.brand} ${v.model} ${v.year}.` };
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
