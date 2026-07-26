# Bid Bot

Upwork proposal and bidder management tool — replaces your Coda workflow with dedupe, proposal editing, submitted ledger, and team stats.

## Features

- **Bid intake** — Paste Upwork job URLs with automatic duplicate detection
- **Proposal editor** — Rich text editor (Tiptap) for writing proposals
- **Status workflow** — Draft → Ready → Submitted → Viewed → Responded → Hired
- **Submitted bids ledger** — Filterable table by person, status, and job response
- **Stats dashboard** — Team response %, view %, hired %, connects, weekly views chart
- **Role-based access** — Bidders and managers via Supabase Row Level Security

## Stack

- Next.js 15 (App Router) + TypeScript
- Supabase (PostgreSQL, Auth, RLS)
- shadcn/ui + Tailwind CSS
- TanStack Table, Recharts, Tiptap

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Connect Supabase MCP in Cursor (recommended)

This lets the AI agent manage your Supabase project directly (run migrations, query tables, fetch API keys).

1. The project already includes [`.cursor/mcp.json`](.cursor/mcp.json) with the hosted Supabase MCP server.
2. Open **Cursor Settings → Tools & MCP**.
3. Find **supabase** and click **Authenticate** (or "Needs authentication") to sign in via browser.
4. Pick the Supabase organization and project for this app.
5. Restart Cursor if tools don't appear immediately.

Optional: scope MCP to one project by changing the URL in `.cursor/mcp.json`:

```json
"url": "https://mcp.supabase.com/mcp?project_ref=YOUR_PROJECT_REF"
```

### 3. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and create a free project
2. In **SQL Editor**, run the migration file:
   ```
   supabase/migrations/001_initial_schema.sql
   ```
3. Copy your project URL and anon key from **Settings → API**

### 4. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 5. Run the dev server

RLS permissions are **re-applied automatically** before every `dev` and `build`:

```bash
npm run dev
```

To manually sync schema + permissions anytime:

```bash
npm run supabase:sync
```

This runs `supabase/migrations/001_initial_schema.sql` (first time) and `supabase/permissions.sql` (every time). Requires `DATABASE_URL` in `.env.local`.

Open [http://localhost:3000](http://localhost:3000), sign up, and start adding bids.

### 6. Promote a user to manager (optional)

In Supabase SQL Editor:

```sql
UPDATE profiles SET role = 'manager' WHERE email = 'your@email.com';
```

## Project structure

```
src/
├── app/
│   ├── bids/           # Intake queue + new bid + detail
│   ├── submitted/      # Submitted bids ledger
│   ├── stats/          # Team KPIs + weekly chart
│   └── (auth)/         # Login & signup
├── components/
│   ├── bids/           # Tables, forms, proposal editor
│   └── stats/          # Charts and stats tables
├── db/schema.ts        # Drizzle schema (types)
├── lib/
│   ├── actions/bids.ts # Server actions
│   ├── upwork-url.ts   # URL normalization & dedupe ID
│   └── stats.ts        # Aggregate calculations
└── supabase/migrations/ # SQL schema + RLS
```

## Workflow

1. Bidder pastes Upwork URL on **New Bid**
2. System checks for duplicate submissions across the team
3. Bidder writes proposal in the rich text editor
4. Bidder marks bid as **Submitted** after posting on Upwork
5. Track **Client Viewed** / **Client Responded** as updates come in
6. Managers view **Stats** for team performance

## Deploy to Vercel

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add the same environment variables
4. Deploy

## License

Private — internal team use.
