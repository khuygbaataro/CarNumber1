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
├── backend/    # Express + MongoDB REST API   (see backend/README.md)
└── frontend/   # Next.js public site + admin   (coming next)
```

## Getting started

```bash
# Backend
cd backend
npm install
cp .env.example .env      # fill in MongoDB + Cloudinary + JWT values
npm run seed:admin
npm run dev               # http://localhost:5000
```

The frontend is added in the next development phase.

## Status

- ✅ Backend API (auth, vehicles, settings, uploads)
- ⏳ Frontend — public site (Home, Vehicle List, Vehicle Detail + loan calculator)
- ⏳ Frontend — admin panel
- ⏳ Deployment

> Notes: public UI is in **Mongolian**; prices in **₮ (MNT)**.
