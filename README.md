# HymnBook

A modern hymn library web app built with Next.js and TypeScript.

## Project overview

- Purpose: browse, search, and manage hymns with translations and favorites.
- Structure: Next.js app (app/), serverless API routes (app/api/), components in `components/`, and Drizzle ORM database schema in `db/`.

## Tech stack

- Next.js 16 (App Router)
- React 19 + TypeScript
- Tailwind CSS + PostCSS
- Drizzle ORM (drizzle-orm + drizzle-kit)
- Authentication: `next-auth`
- State / data fetching: `@tanstack/react-query`
- Vercel platform integrations: `@vercel/postgres`, `@vercel/kv`
- UI primitives and utilities: `shadcn`, `lucide-react`, `framer-motion`, `sonner`, `class-variance-authority`

See `package.json` for exact dependency versions.

## Getting started

Prerequisites:

- Node.js (recommended version compatible with Next.js 16)
- A Postgres database for production or local development

Install dependencies:

```bash
npm install
```

Run development server:

```bash
npm run dev
```

Build for production:

```bash
npm run build
npm run start
```

## Database / Drizzle

Useful scripts (see `package.json`):

- `npm run db:generate` — generate migrations/types
- `npm run db:push` — push schema to the database
- `npm run db:migrate` — run migrations
- `npm run db:studio` — open Drizzle Studio
- `npm run db:seed` — seed the database (runs `scripts/seed.ts`)

## Environment variables

Create a `.env.local` with at least the following keys (names may vary depending on your setup):

- `DATABASE_URL` — Postgres connection string
- `NEXTAUTH_SECRET` — secret for NextAuth
- `NEXTAUTH_URL` — your app URL for auth callbacks

Also configure any Vercel-specific variables if deploying (e.g., Vercel Postgres / KV credentials).

## Contributing

- Fork and create a feature branch
- Open a pull request describing changes

## Where to look

- App entry: `app/`
- Components: `components/`
- DB schema and queries: `db/`
- Scripts: `scripts/`

## License

This repository does not include a license file. Add one if you intend to make this project public.

---

If you'd like, I can also add a `CONTRIBUTING.md`, a sample `.env.local.example`, or commit the README for you. What would you like next?
# HymnBook — Christian Song Lyrics Website

A full-stack Next.js application for browsing Christian song lyrics in multiple languages (English, Telugu, Hindi, Tamil, Malayalam). Built with a gold-and-deep-blue color scheme, mobile-first responsive design, fullscreen reading mode, and an admin CMS.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, RSC) |
| Language | TypeScript 5 |
| Styling | Tailwind CSS v4, shadcn/ui |
| Database | PostgreSQL (Vercel Postgres / Neon) |
| ORM | Drizzle ORM |
| Auth | NextAuth v5 (credentials) |
| State | React Query, localStorage |
| Animation | Framer Motion |
| Deployment | Vercel |

---

## Getting Started

### 1. Clone & install

```bash
git clone <repo-url>
cd ChristianSongsWebSite
npm install
```

### 2. Environment variables

Copy and fill in your values:

```bash
cp .env.example .env.local
```

You need:
- `POSTGRES_URL` — PostgreSQL connection string
- `AUTH_SECRET` — random string for NextAuth (`openssl rand -base64 32`)
- `ADMIN_EMAIL` / `ADMIN_PASSWORD` — admin login (password must be a bcrypt hash)

Generate a password hash:

```bash
node -e "require('bcryptjs').hash('yourpassword',12).then(h=>console.log(h))"
```

### 3. Database setup

```bash
npm run db:push     # push schema to database
npm run db:seed     # seed sample songs & languages
```

### 4. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
├── app/
│   ├── (public)/              # Public routes (home, songs, search, favorites)
│   │   ├── page.tsx           # Home page with song grid
│   │   ├── songs/[slug]/      # Song detail with lyrics viewer
│   │   ├── search/            # Full-text search
│   │   └── favorites/         # Local favorites
│   ├── admin/                 # Admin area (login, dashboard, CRUD)
│   │   ├── songs/             # Song management
│   │   └── languages/         # Language management
│   ├── api/                   # REST API routes
│   │   ├── songs/             # GET (list), POST (create)
│   │   ├── songs/[id]/        # GET, PUT, DELETE
│   │   ├── search/            # Full-text search endpoint
│   │   ├── favorites/         # Favorites CRUD
│   │   └── languages/         # Language CRUD
│   ├── layout.tsx             # Root layout (fonts, providers)
│   ├── not-found.tsx          # 404 page
│   ├── sitemap.ts             # Dynamic sitemap
│   └── robots.ts              # Robots.txt
├── components/
│   ├── ui/                    # shadcn/ui primitives
│   ├── layout/                # Header, Footer, MobileNav
│   ├── songs/                 # SongCard, SongList, CategoryFilter
│   ├── lyrics/                # LyricsViewer, LanguageTabs, FullscreenReader
│   ├── search/                # SearchBar, SearchResults
│   └── admin/                 # SongForm, TranslationEditor, AdminSignOut
├── hooks/                     # useFavorites, useSearch, useFullscreen
├── lib/
│   ├── db/                    # schema.ts, queries.ts, index.ts
│   ├── validations/           # Zod schemas
│   ├── auth.ts                # NextAuth v5 config
│   ├── favorites.ts           # localStorage helpers
│   └── utils.ts               # cn() helper
├── types/                     # TypeScript interfaces
├── scripts/                   # seed.ts
├── middleware.ts               # Admin auth guard
└── drizzle.config.ts          # Drizzle Kit config
```

---

## Key Features

### Public
- **Home** — Song grid with category badges and language indicators
- **Category Filter** — Filter songs by category (Worship, Hymns, Praise, etc.)
- **Song Detail** — Multi-language lyrics viewer with language pill tabs
- **Fullscreen Reader** — Distraction-free reading with font size controls, light/dark backgrounds, and swipe-to-switch language
- **Search** — Full-text search across titles and lyrics in all languages (PostgreSQL tsvector)
- **Favorites** — Heart button saves to localStorage; sort by recent or A-Z
- **Share** — Native Web Share API with WhatsApp, Telegram, email fallbacks
- **Dark Mode** — System-aware theme toggle

### Admin (`/admin`)
- **Dashboard** — Song/language counts, quick actions
- **Song Editor** — Multi-language translation editor with live preview, category autocomplete, draft autosave
- **Language Manager** — Add/edit/delete languages, toggle active
- **Auth** — Credentials-based login with bcrypt password hashing

---

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | ESLint check |
| `npm run db:generate` | Generate Drizzle migrations |
| `npm run db:push` | Push schema to database |
| `npm run db:migrate` | Run migrations |
| `npm run db:studio` | Open Drizzle Studio |
| `npm run db:seed` | Seed sample data |

---

## Deployment (Vercel)

1. Push to GitHub
2. Import in Vercel
3. Add a **Vercel Postgres** database (or connect Neon)
4. Set environment variables
5. Deploy — Vercel runs `next build` automatically
6. Run `npm run db:push` and `npm run db:seed` via Vercel CLI or locally

---

## License

MIT
