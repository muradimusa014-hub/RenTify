# Rentify Zaria

A property rental marketplace built for Zaria, Nigeria. Browse listings, submit booking requests, upload payment receipts, and manage the full rental lifecycle — all in one platform.

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes (App Router)
- **Database**: SQLite via Prisma ORM
- **Auth**: JWT (httpOnly cookies), bcrypt
- **Deployment**: Vercel

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

Copy `.env.example` to `.env` and set a strong `JWT_SECRET`:

```bash
cp .env.example .env
```

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret used to sign tokens | Yes |
| `DATABASE_URL` | SQLite database path | No (defaults to `file:./dev.db`) |

## Database

```bash
npx prisma generate
npx prisma db push
```

To seed sample data (if a seed script exists):

```bash
node prisma/seed.js
```

## Roles

| Role | Access |
|------|--------|
| `tenant` | Browse properties, submit bookings, upload receipts |
| `landlord` | Create/edit/delete own property listings |
| `admin` | Approve/reject payments, complete bookings, flag properties, delete users |

## Booking Flow

1. Tenant browses properties on `/listings` or the homepage.
2. Tenant requests a booking from the property detail page.
3. Tenant uploads a payment receipt from the tenant dashboard (`/tenant`).
4. Admin reviews the receipt and approves or rejects the payment.
5. Admin marks inspection as done to complete the booking.

## Lint

```bash
npm run lint
```

## Build

```bash
npm run build
```

## Deploy

```bash
vercel --prod
```

Ensure `JWT_SECRET` is set in your Vercel project environment variables before deploying to production.
# RenTify 
