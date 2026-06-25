# Dealership Frontend

Next.js (App Router) + TypeScript + Tailwind CSS. Public catalog site in **Mongolian**.

## Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local   # set NEXT_PUBLIC_API_URL
npm run dev                         # http://localhost:3000
```

`NEXT_PUBLIC_API_URL` must point at the backend, **including** the `/api` suffix
(e.g. `http://localhost:5000/api`).

## Scripts

| Script          | Description                |
| --------------- | ------------------------- |
| `npm run dev`   | Dev server                |
| `npm run build` | Production build          |
| `npm start`     | Run the production build  |
| `npm run lint`  | ESLint                    |

## Pages

- `/` — Home: banner, featured vehicles, latest vehicles, contact info
- `/vehicles` — list with search / filter / sort / pagination
- `/vehicles/[id]` — detail: image gallery, optional video, specs, **loan calculator**

## Notes

- All media is served from **Cloudinary** (`next.config.mjs` allows `res.cloudinary.com`).
- UI strings live in `src/lib/labels.ts` (single place to edit Mongolian copy).
- Pages fetch with `no-store`, so admin edits appear on the site immediately.
