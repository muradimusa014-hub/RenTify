# Rentify Zaria

A property rental marketplace built for Zaria, Nigeria. Browse listings, submit booking requests, upload payment receipts, and manage the full rental lifecycle — all in one platform.

## Tech Stack

- **Frontend**: Next.js 15, React 19
- **Backend**: Next.js API Routes (App Router)
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT (httpOnly cookies), bcrypt
- **Deployment**: Vercel

## Quick Start

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `JWT_SECRET` | Secret used to sign tokens | Yes |
| `DATABASE_URL` | PostgreSQL connection string | Yes |

### Local Development

You can use your production Supabase database for local development, or any local PostgreSQL instance.

Example `.env`:

```
JWT_SECRET=your-secret-key-here
DATABASE_URL="postgresql://postgres:your-password@host:5432/postgres?sslmode=require"
```

## Database

```bash
npx prisma generate
npx prisma db push
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

Ensure `JWT_SECRET` and `DATABASE_URL` are set in your Vercel project environment variables before deploying to production.
