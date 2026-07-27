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

4. Start development server:
   ```bash
   npm run dev
   ```

## Project Structure

```
wram-report-system/
├── prisma/schema.prisma     # Database schema (Department, Entry, User)
├── lib/
│   ├── db.ts                # Prisma client singleton
│   └── auth.ts              # JWT + bcrypt helpers
├── pages/
│   ├── index.tsx            # Home / data entry
│   ├── login.tsx            # Login page
│   ├── reports.tsx          # Reports view
│   └── api/
│       ├── auth.ts          # Login/register endpoint
│       ├── entries.ts       # CRUD for entries
│       └── reports.ts       # Grouped report data
└── components/
    ├── Layout.tsx            # Navigation wrapper
    ├── DataForm.tsx          # Entry submission form
    └── ReportTable.tsx       # Aggregated report table
```
