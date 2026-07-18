import Anthropic from '@anthropic-ai/sdk';
import { Vehicle, BotSession } from './models';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-opus-4-8';

const SYSTEM_PROMPT = `Та бол VictoryCar авто худалдааны каталогт машин нэмэхэд ажилтанд туслах AI туслах юм. Facebook Messenger дээр ажилладаг. Монголоор товч, найрсаг ярь.

ЗОРИЛГО: Ажилтнаас нэг машины мэдээллийг цуглуулж, баталгаажуулсны дараа сайтын каталогт нэмэх.

АСУУХ ТАЛБАРУУД (дараалан, товч асуу):
- Марк (brand, ж: Toyota)
- Загвар (model, ж: Prius 41)
- Он (year)
- Үнэ (price, төгрөгөөр)
- Явсан км (mileage)
- Хөдөлгүүр (engine, ж: 1.8L Hybrid)
- Хурдны хайрцаг (transmission: Автомат/Механик)
- Түлш (fuel: Бензин/Дизель/Хайбрид/Цахилгаан/Хий)
- Гадна өнгө (exteriorColor)
- Дотор өнгө (interiorColor)
- Нэмэлт тайлбар (description, заавал биш)

ЗУРАГ: Ажилтан зургаа шууд Messenger-ээр илгээнэ. Хэдэн зураг хүлээж авсныг систем танд хэлнэ — зургийг та асуухгүй, зүгээр л ажилтанд зураг илгээхийг сануул.

УРСГАЛ:
1. Мэдээллийг дараалан асууж цуглуул. Нэг мессежд олон талбар өгвөл хүлээж ав.
2. Хангалттай мэдээлэл (ядаж марк, загвар, он, үнэ, км) цугларсан бол БҮХ мэдээллийг эмхэтгэн харуулж, "Зар дээр байршуулах уу? Тийм бол confirm гэж бичнэ үү" гэж асуу.
3. Ажилтан "confirm" гэж бичсэн ҮЕД Л publish_vehicle tool-ийг дуудаж машиныг нэмнэ. Түүнээс өмнө бүү дууд.
4. Машин зарагдсан гэвэл mark_sold tool-оор тухайн машиныг олж төлөвийг нь солино.

ДҮРЭМ:
- Мэдэхгүй зүйлийг бүү зохио. Ажилтнаас тодруул.
- Үнэ, км-ийг тоо болгон авах (сая, мянга гэх мэтийг тооцоолж бодит тоо болго).
- confirm хийхээс өмнө заавал эмхэтгэсэн мэдээллийг харуул.`;

const tools: Anthropic.Tool[] = [
  {
    name: 'publish_vehicle',
    description:
      'Цуглуулсан машины мэдээллийг каталогт нэмнэ. Зөвхөн ажилтан confirm гэж баталгаажуулсны дараа дуудна.',
    input_schema: {
      type: 'object',
      properties: {
        brand: { type: 'string', description: 'Марк, ж: Toyota' },
        model: { type: 'string', description: 'Загвар, ж: Prius 41' },
        year: { type: 'number', description: 'Үйлдвэрлэсэн он' },
        price: { type: 'number', description: 'Үнэ төгрөгөөр (бодит тоо)' },
        mileage: { type: 'number', description: 'Явсан км' },
        engine: { type: 'string' },
        transmission: { type: 'string' },
        fuel: { type: 'string' },
        exteriorColor: { type: 'string' },
        interiorColor: { type: 'string' },
        description: { type: 'string' },
      },
      required: ['brand', 'model', 'year', 'price', 'mileage'],
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
    const doc = await Vehicle.create({
      brand: String(input.brand || '').trim(),
      model: String(input.model || '').trim(),
      year: Number(input.year) || 0,
      price: Number(input.price) || 0,
      mileage: Number(input.mileage) || 0,
      engine: input.engine || '',
      transmission: input.transmission || '',
      fuel: input.fuel || '',
      exteriorColor: input.exteriorColor || '',
      interiorColor: input.interiorColor || '',
      description: input.description || '',
      images: session.images || [],
      status: 'available',
    });
    const imgCount = (session.images || []).length;
    // Clear the draft images now that they belong to a vehicle.
    session.images = [];
    return {
      result: `Машин амжилттай нэмэгдлээ: ${doc.brand} ${doc.model} ${doc.year}, ${imgCount} зурагтай. ID: ${doc._id}`,
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
