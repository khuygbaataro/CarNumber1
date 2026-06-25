# 🚗 Dealership Catalog (CarNumber1)

A simple, production-ready automobile dealership **catalog** website.

- **Public site:** browse, search, and view vehicles; monthly loan calculator; dealership contact info.
- **Admin panel:** JWT-secured; manage vehicles (CRUD, multiple images + one video, available/sold status) and site settings.

## Tech stack

| Layer    | Tech                                              |
| -------- | ------------------------------------------------- |
| Backend  | Node.js · Express · MongoDB (Mongoose) · JWT      |
| Frontend | Next.js (App Router) · TypeScript · Tailwind CSS  |
| Media    | Cloudinary                                        |

## Structure

```
.
├── backend/        # Express + MongoDB REST API   (see backend/README.md)
├── frontend/       # Next.js public site + admin   (see frontend/README.md)
├── render.yaml     # Render blueprint for the backend
└── DEPLOYMENT.md   # step-by-step cloud deploy guide
```

## Getting started (local)

```bash
# Terminal 1 — backend
cd backend && npm install
cp .env.example .env       # fill in MongoDB + Cloudinary + JWT values
npm run seed:admin
npm run dev                # http://localhost:5000

# Terminal 2 — frontend
cd frontend && npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                # http://localhost:3000
```

## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) — MongoDB Atlas + Cloudinary + Render (backend) + Vercel (frontend).

## Status

- ✅ Backend API (auth, vehicles, settings, uploads)
- ✅ Frontend — public site (Home, Vehicle List, Vehicle Detail + loan calculator)
- ✅ Frontend — admin panel (login, vehicle CRUD, image/video upload, settings)
- ✅ Deployment (backend → Render, frontend → Vercel, DB → MongoDB Atlas)

> Notes: public UI is in **Mongolian**; prices in **₮ (MNT)**.
> Stack: Next.js 16 · React 19 · TypeScript · Tailwind · Express · MongoDB.
