# 🚀 Deployment Guide

We deploy in this order: **Database → Media → Backend → Frontend**.

```
MongoDB Atlas  →  Cloudinary  →  Render (backend API)  →  Vercel (frontend)
```

You'll need free accounts on: **MongoDB Atlas**, **Cloudinary**, **Render**, **Vercel**.
All four have generous free tiers — no payment required for V1.

---

## 1. MongoDB Atlas (database)

1. Create a free **M0** cluster at https://www.mongodb.com/cloud/atlas.
2. **Database Access** → add a user (username + password).
3. **Network Access** → add IP `0.0.0.0/0` (allow from anywhere — needed for Render).
4. **Connect → Drivers** → copy the connection string. It looks like:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/dealership?retryWrites=true&w=majority
   ```
   Replace `<user>` / `<password>` and keep `/dealership` as the DB name.
   → This is your **`MONGODB_URI`**.

## 2. Cloudinary (images & video)

1. Sign up at https://cloudinary.com → open the **Dashboard**.
2. Copy: **Cloud name**, **API Key**, **API Secret**.
   → `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

## 3. Render (backend API)

This repo includes [`render.yaml`](render.yaml), so Render configures itself.

1. https://render.com → **New + → Blueprint** → connect the GitHub repo
   `khuygbaataro/CarNumber1`.
2. Render detects `render.yaml` and creates the **dealership-api** service.
3. Set the secret env vars when prompted (the `sync: false` ones):
   - `MONGODB_URI` → from step 1
   - `ADMIN_EMAIL` / `ADMIN_PASSWORD` → your admin login (choose a strong password)
   - `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` → step 2
   - `CLIENT_URL` → leave blank for now (set after Vercel, step 4)
4. Deploy. When it's live you'll get a URL like `https://dealership-api.onrender.com`.
   - Test it: open `https://dealership-api.onrender.com/api/health` → `{"success":true}`.
   - `SEED_ON_START=true` auto-creates your admin on first boot.

### 3b. (Optional) Load sample data

To show demo vehicles immediately, run the sample seed **once** from your
machine against the Atlas database:

```bash
cd backend
# In backend/.env set MONGODB_URI to your Atlas connection string, then:
npm run seed:sample
```

This adds ~6 demo vehicles + sample settings (placeholder images). Replace
them later via the admin panel. Safe to re-run — it skips data that exists.

> ⚠️ Render free tier **sleeps after 15 min** of inactivity; the first request
> then takes ~30–50s to wake. Fine for a demo.

## 4. Vercel (frontend)

1. https://vercel.com → **Add New → Project** → import `khuygbaataro/CarNumber1`.
2. **Root Directory** → `frontend`.
3. Framework preset: **Next.js** (auto-detected). Build/output settings: default.
4. **Environment Variables** → add:
   - `NEXT_PUBLIC_API_URL` = `https://dealership-api.onrender.com/api`
     (your Render URL **+ `/api`**)
5. Deploy. You'll get a URL like `https://your-app.vercel.app`.

## 5. Connect them (CORS)

1. Back in **Render** → the `dealership-api` service → **Environment**:
   - Set `CLIENT_URL` = `https://your-app.vercel.app` (your Vercel URL, no trailing slash).
   - You can list several, comma-separated (e.g. add a custom domain later).
2. Render redeploys. Done — the site is live. 🎉

---

## Deploying the live site (victorycar.mn)

The sections above describe the first-time setup. This is how the site that
is actually running gets updated today.

Both halves live on Vercel, not Render:

| Project | What | Deploy from | Its Root Directory | URL |
| --- | --- | --- | --- | --- |
| `car-number1` | Next.js site + admin | repo root | `frontend` | www.victorycar.mn |
| `car-number1-api` | Express API | `backend/` | `.` | car-number1-api.vercel.app |

**Pushing to GitHub does not deploy.** The GitHub → Vercel webhook stopped
firing; a push updates the repository and nothing else. "Redeploy" in the
Vercel dashboard rebuilds the *same commit* it already has, so it will not
pick up new code either. Deploy from a terminal:

```bash
cd /path/to/CarNumber1        # the repo ROOT, for the site
npx vercel --prod --yes
```

```bash
cd /path/to/CarNumber1/backend   # for the API
npx vercel --prod --yes
```

**The directory matters.** Vercel applies the project's own Root Directory
on top of wherever you run the CLI. `car-number1` already has `frontend`
set, so running it inside `frontend/` makes Vercel look for
`frontend/frontend`, find no app there, and publish an empty site that 404s
on every route. The link that decides this is the `.vercel` folder: there
should be one at the repo root (`car-number1`) and one in `backend/`
(`car-number1-api`), and none in `frontend/`. If `vercel link` writes one
into `frontend/`, delete it.

`vercel link` also appends `.env*` to the local `.gitignore`. Narrow it back
to `.env.local` — `frontend/.env.production` is tracked on purpose.

Afterwards, check a route that is not the home page — the empty-deploy
failure still serves HTML, just a 404 page:

```bash
curl -o /dev/null -w '%{http_code}\n' https://www.victorycar.mn/admin/vehicles
```

---

## Local development (for reference)

```bash
# Terminal 1 — backend
cd backend && npm install && cp .env.example .env   # fill values
npm run seed:admin && npm run dev                   # http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm install && cp .env.local.example .env.local
npm run dev                                         # http://localhost:3000
```

## Environment variables summary

**Backend (Render)**

| Var | Example |
| --- | --- |
| `MONGODB_URI` | `mongodb+srv://...` |
| `JWT_SECRET` | (auto-generated by Render) |
| `JWT_EXPIRES_IN` | `7d` |
| `ADMIN_EMAIL` | `admin@dealership.mn` |
| `ADMIN_PASSWORD` | strong password |
| `SEED_ON_START` | `true` |
| `CLIENT_URL` | `https://your-app.vercel.app` |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | from Cloudinary |

**Frontend (Vercel)**

| Var | Example |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | `https://dealership-api.onrender.com/api` |
