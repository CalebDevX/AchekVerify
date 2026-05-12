# WhatOTP — WhatsApp OTP Verification SaaS

A developer-first SaaS platform for the Nigerian market that lets businesses verify users via WhatsApp OTP. Cheaper and more global than SMS.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, served at `/api`)
- `pnpm --filter @workspace/web run dev` — run the frontend (served at `/`)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `node_modules/.bin/tsx lib/db/src/seed.ts` — re-seed 4 NGN plans (run from workspace root using npx tsx)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing key, `PAYSTACK_SECRET_KEY` — Paystack secret key for payments

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + TailwindCSS + shadcn/ui + Wouter routing
- API: Express 5 + JWT auth (jsonwebtoken + bcryptjs)
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)
- Payments: Paystack (NGN, Naira)
- WhatsApp: Baileys (`@whiskeysockets/baileys`) for real QR-based sessions

## Where things live

- `lib/api-spec/openapi.yaml` — Single source of truth for all API contracts
- `lib/db/src/schema/` — Drizzle schema (users, plans, subscriptions, apiKeys, whatsappNumbers, otpRequests)
- `lib/db/src/seed.ts` — Seeds 4 NGN plans (run via `npx tsx lib/db/src/seed.ts`)
- `artifacts/api-server/src/routes/` — Route handlers (auth, plans, subscriptions, apiKeys, whatsappNumbers, otp, adminUsers, dashboard, payments)
- `artifacts/api-server/src/lib/baileys-manager.ts` — Baileys session manager (QR, send OTP, reconnect)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT auth middleware
- `artifacts/web/src/` — React frontend
- `artifacts/web/src/hooks/use-auth.tsx` — AuthContext + token management

## Architecture decisions

- JWT-based auth stored in `localStorage` with `Authorization: Bearer` header via `setAuthTokenGetter` from the api-client lib
- WhatsApp numbers managed by admin via Baileys real QR sessions; numbers connect with `GET /admin/whatsapp-numbers/:id/qr`
- User custom numbers (Business/Enterprise plans): users register their own WA number via `/user/whatsapp-number` endpoints
- OTP requests track `requestId` (UUID-style) for stateless verification from any API client
- API keys use bcrypt hash + prefix lookup for secure key storage
- Subscriptions track `otpUsed` vs plan's `otpLimit` to enforce per-period caps
- Paystack payment flow: `POST /payments/initialize` → Paystack payment page → redirect back with `?paystack_ref=xxx` → `GET /payments/verify/:ref`

## Product

- **Landing page** — hero, features, 4 NGN-priced plans (₦2,500–₦45,000/month)
- **User dashboard** — stats, API keys, subscription (Paystack checkout), OTP logs, API docs
- **Admin panel** — user management, WhatsApp number management (real QR), platform stats
- **OTP API** — `POST /api/otp/send` and `POST /api/otp/verify` (API key authenticated)

## Plans (NGN, monthly)

| Plan | Price | OTPs | Custom Number | USA Numbers |
|------|-------|------|---------------|-------------|
| Starter | ₦2,500 | 500 | No | No |
| Growth | ₦7,500 | 2,000 | No | No |
| Business | ₦18,000 | 10,000 | Yes | No |
| Enterprise | ₦45,000 | 50,000 | Yes | Yes |

## User preferences

- Admin credentials: `admin@whatatp.com` / `Admin@1234`
- Demo user: `demo@whatatp.com` / `Admin@1234`
- Paystack integration requires `PAYSTACK_SECRET_KEY` env secret (test key: `sk_test_...`)

## Gotchas

- Always run `pnpm run typecheck:libs` before typechecking leaf packages after DB schema changes
- API key secrets are only shown once on creation — they are bcrypt-hashed in DB
- The `setAuthTokenGetter` is exported from `@workspace/api-client-react` main index, NOT the internal `src/custom-fetch` path
- Baileys sessions are stored in `artifacts/api-server/sessions/<numberId>/` (file-based via `useMultiFileAuthState`)
- `lib/db/src/seed.ts` is excluded from the lib's tsconfig (run separately, not compiled as part of the lib)
- QR codes expire in 60 seconds — the `/qr` endpoints auto-start a session if none is running

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
