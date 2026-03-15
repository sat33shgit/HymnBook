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
