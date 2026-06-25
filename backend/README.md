# Dealership Backend (API)

Express + MongoDB REST API for the dealership catalog.

## Setup

```bash
cd backend
npm install
cp .env.example .env      # then fill in real values
npm run seed:admin        # creates the admin from ADMIN_EMAIL / ADMIN_PASSWORD
npm run dev               # http://localhost:5000
```

You need:

- **MongoDB** — local (`mongodb://localhost:27017/dealership`) or a free MongoDB Atlas cluster.
- **Cloudinary** — free account → copy Cloud name, API key, API secret into `.env`.

## Scripts

| Script               | Description                          |
| -------------------- | ------------------------------------ |
| `npm run dev`        | Start with nodemon (auto-reload)     |
| `npm start`          | Start in production mode             |
| `npm run seed:admin` | Create the admin user from `.env`    |

## API overview

Base URL: `/api`. All responses use `{ success, data }` or `{ success, message }`.

### Auth

| Method | Path          | Access | Body                  |
| ------ | ------------- | ------ | --------------------- |
| POST   | `/auth/login` | Public | `{ email, password }` |
| GET    | `/auth/me`    | Admin  | —                     |

### Vehicles

| Method | Path                    | Access | Notes                          |
| ------ | ----------------------- | ------ | ------------------------------ |
| GET    | `/vehicles`             | Public | search/filter/sort/pagination  |
| GET    | `/vehicles/featured`    | Public | featured + available           |
| GET    | `/vehicles/latest`      | Public | newest available               |
| GET    | `/vehicles/:id`         | Public | single vehicle                 |
| POST   | `/vehicles`             | Admin  | create                         |
| PUT    | `/vehicles/:id`         | Admin  | update                         |
| PATCH  | `/vehicles/:id/status`  | Admin  | `{ status: available\|sold }`  |
| DELETE | `/vehicles/:id`         | Admin  | delete                         |

**`GET /vehicles` query params:**
`brand, model, year, minPrice, maxPrice, status, search, sort, page, limit`
`sort` ∈ `newest | oldest | price_asc | price_desc | year_desc | year_asc`

### Settings

| Method | Path        | Access | Notes              |
| ------ | ----------- | ------ | ------------------ |
| GET    | `/settings` | Public | header/footer/etc. |
| PUT    | `/settings` | Admin  | partial update     |

### Upload (Cloudinary)

| Method | Path             | Access | Field                  |
| ------ | ---------------- | ------ | ---------------------- |
| POST   | `/upload/images` | Admin  | `images` (multipart)   |
| POST   | `/upload/video`  | Admin  | `video` (multipart)    |
