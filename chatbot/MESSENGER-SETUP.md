# VictoryCar — Messenger дээрх "машин нэмэх" бот (тохиргоо)

Facebook хуудсанд бичсэн мессежийг webhook-оор Vercel backend руу аваад, Claude API-аар
машины мэдээллийг цуглуулж, баталгаажуулсны дараа каталогт нэмдэг систем.

## Урсгал

```
FB Messenger → /api/messenger/webhook (Vercel)
   → эрх шалгах (whitelist)
   → зураг ирвэл Cloudinary руу (жижигрүүлж, watermark дарж) хадгална
   → текст ирвэл Claude API асуултууд асууж мэдээлэл цуглуулна
   → бүх мэдээллийг эмхэтгэн үзүүлж "confirm гэж бичнэ үү" гэнэ
   → "confirm" → машиныг MongoDB-д нэмнэ (сайтад шууд харагдана)
   → "зарагдсан" → тухайн машиныг олж төлөвийг нь sold болгоно
```

Код: `frontend/src/app/api/messenger/webhook/route.ts` + `frontend/src/lib/server/*`.
Vercel дээр сайттай хамт auto-deploy хийгдэнэ.

## 1. Vercel Environment Variables

Vercel → project → Settings → Environment Variables-д дараахыг нэм
(`frontend/.env.local.example`-ийг лавлана уу):

| Нэр | Утга |
|---|---|
| `MONGODB_URI` | Backend-тэй ижил Mongo холболт |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Backend-тэй ижил Cloudinary |
| `ANTHROPIC_API_KEY` | Claude API түлхүүр |
| `MESSENGER_VERIFY_TOKEN` | Дурын санамсаргүй мөр (доор webhook-д бас бичнэ) |
| `MESSENGER_PAGE_ACCESS_TOKEN` | FB Page Access Token (доор авна) |
| `MESSENGER_APP_SECRET` | FB App Secret |
| `MESSENGER_ADMIN_IDS` | Эрх бүхий хүмүүсийн PSID, таслалаар (доор авна) |

Тохируулсны дараа дахин deploy хий (Redeploy).

## 2. Facebook App тохиргоо

1. https://developers.facebook.com → тухайн App → **Messenger → Settings**.
2. **Access Tokens** хэсэгт өөрийн Page-ээ холбож **Page Access Token** үүсгэ →
   `MESSENGER_PAGE_ACCESS_TOKEN`-д тавь.
3. App **Settings → Basic → App Secret** → `MESSENGER_APP_SECRET`.
4. **Webhooks → Add Callback URL**:
   - Callback URL: `https://<таны-сайт>/api/messenger/webhook`
   - Verify Token: `MESSENGER_VERIFY_TOKEN`-д бичсэн мөр
   - "Verify and Save" дарна (амжилттай бол ногоон).
5. Webhook **Subscriptions**: `messages`, `messaging_postbacks`-ийг чагтал.
6. **Add Subscriptions** дээр Page-ээ сонгож webhook-д бүртгэ.

## 3. Эрх бүхий хүний PSID олох

PSID = тухайн хүн таны Page руу бичихэд үүсдэг дугаар (Facebook user ID биш).

1. Эрх өгөх ажилтан Page руу нэг мессеж бичнэ.
2. Vercel → project → **Logs** дотор webhook-ийн `sender.id`-г хар
   (эсвэл түр `console.log` нэмж болно).
3. Тэр дугаарыг `MESSENGER_ADMIN_IDS`-д таслалаар нэмнэ. Хэд хэдэн хүн бол:
   `MESSENGER_ADMIN_IDS=123...,456...`
4. Redeploy.

> Whitelist-д байхгүй хүн бичвэл бот "зөвхөн эрх бүхий ажилтан" гэж хариулж, машин нэмэхгүй.

## 4. Ашиглах жишээ (ажилтан Page руу бичнэ)

```
Ажилтан: Шинэ машин нэмье
Бот: За. Ямар марк вэ?
Ажилтан: Toyota Prius 41, 2013 он
Бот: Үнэ хэд вэ?
Ажилтан: 24 сая, 180000 км явсан, хайбрид, автомат, цагаан өнгө
Бот: (зураг илгээхийг сануулна)
Ажилтан: [зургууд илгээнэ]
Бот: Зураг хүлээж авлаа (5 ширхэг).
Ажилтан: болсон
Бот: [эмхэтгэсэн мэдээллийг харуулаад] Зар дээр байршуулах уу? confirm гэж бичнэ үү.
Ажилтан: confirm
Бот: Машин амжилттай нэмэгдлээ ✅
```

Зарагдсан машин:

```
Ажилтан: Prius 41 2013 зарагдсан
Бот: Зарагдсан гэж тэмдэглэлээ ✅
```

## Санамж

- Зураг нь backend-ийн admin upload-той ижил аргаар жижгэрч, watermark дарагдана
  (Settings → Зургийн боловсруулалт тохиргоог ашиглана).
- Bot нь машин үүсгэхдээ backend-ийн ижил Mongo/Cloudinary-г шууд ашигладаг тул
  сайтад тэр даруй харагдана.
- Claude загварыг `ANTHROPIC_MODEL`-оор сольж болно (default: `claude-opus-4-8`).
