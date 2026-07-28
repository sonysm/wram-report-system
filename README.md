# WRAM Report System

A Next.js reporting application with Prisma ORM and PostgreSQL.

## Tech Stack
- **Frontend**: Next.js 14, React 18, TypeScript
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL via Prisma ORM
- **Auth**: JWT + bcryptjs

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment variables in `.env`:
   ```
   DATABASE_URL="postgresql://user:password@localhost:5432/wram_report_db"
   JWT_SECRET="your-secret-key"
   ```

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Seed provinces and demo users:
   ```bash
   npm run db:seed
   ```

5. Start development server:
   ```bash
   npm run dev
   ```

You can also do migration + seed in one command:

```bash
npm run db:setup
```

## Demo Login

Use these built-in accounts:

- Super Admin: `demo_admin` / `demo12345`
- Province User (Kandal): `demo_kandal` / `demo12345`

These accounts are created by `npm run db:seed`.

## Key Behavior

- User accounts are linked to one province.
- Users can only submit and edit entries within their province.
- Users select district from dropdown and can add a new district if not found.
- Each record stores district metrics: `planArea`, `planDone`, `actualArea`, `householdPlan`, `householdDone`, and `note`.
- Every entry create/update and district create is recorded in `AuditLog`.
- Super admin can view consolidated province/district report data.

## Project Structure

```
wram-report-system/
├── prisma/schema.prisma     # Database schema (User, Province, District, Entry, AuditLog)
├── lib/
│   ├── db.ts                # Prisma client singleton
│   └── auth.ts              # JWT + bcrypt helpers
├── pages/
│   ├── index.tsx            # Home / data entry
│   ├── login.tsx            # Login page
│   ├── reports.tsx          # Reports view
│   └── api/
│       ├── auth.ts          # Login/register endpoint
│       ├── me.ts            # Current user profile
│       ├── districts.ts     # Province-scoped district list/add
│       ├── entries.ts       # Entry create/update/list with audit logs
│       ├── reports.ts       # Super-admin grouped report data
│       └── provinces.ts     # Province list
└── components/
   ├── Layout.tsx            # Navigation wrapper
   ├── DataForm.tsx          # Province-scoped entry form + edit list
   └── ReportTable.tsx       # Super-admin report table
```
