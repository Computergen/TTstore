# TULA MARKET API

This service is the first application-owned backend slice. It provides PostgreSQL-backed authentication and public catalog endpoints while the existing Firebase paths remain available during migration.

## Local setup

1. Install Node.js 20 or newer and PostgreSQL.
2. Create a PostgreSQL database named `tula_market`.
3. Copy `.env.example` to `.env` and set `DATABASE_URL`.
4. Install dependencies and apply the schema:

```powershell
npm install
npm run db:migrate
npm start
```

The API listens on `http://localhost:3000` by default.

## Initial endpoints

- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/logout`
- `GET /api/v1/auth/me`
- `GET /api/v1/catalog/products`
- `GET /api/v1/catalog/stores`

The browser client is exposed as `window.tulaApi` from `assets/js/api.js`. It uses an HttpOnly `tula_session` cookie and is currently enabled on the login, registration, and admin login pages.