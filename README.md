# HymnBook

HymnBook is a Next.js application for browsing and managing Christian song lyrics in multiple languages. It includes a public hymn library, search, favorites, an admin CMS, and optional audio uploads backed by Cloudflare R2.

## Features

- Public hymn browsing with category-based discovery
- Multi-language song pages
- Search across titles and lyrics
- Favorites stored in the browser
- Admin area for managing songs and languages
- Optional song audio uploads with Cloudflare R2
- Direct browser uploads with presigned URLs and server-side fallback uploads

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS v4
- Drizzle ORM
- PostgreSQL
- NextAuth v5
- Cloudflare R2 for audio storage

## Project Structure

```text
app/          Next.js routes, layouts, and API handlers
components/   UI and admin components
lib/          Auth, DB access, R2 helpers, utilities
scripts/      Project scripts such as seeding and R2 CORS updates
drizzle/      Generated database artifacts
public/       Static assets
```

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Create your local environment file

```bash
cp .env.example .env.local
```

On PowerShell:

```powershell
Copy-Item .env.example .env.local
```

### 3. Configure required environment variables

Minimum variables for local development:

- `POSTGRES_URL` - PostgreSQL connection string used by Drizzle
- `AUTH_SECRET` - secret used by NextAuth
- `AUTH_URL` - app URL for auth callbacks, for example `http://localhost:3000`
- `ADMIN_EMAIL` - admin login email
- `ADMIN_PASSWORD` - bcrypt hash for the admin password
- `NEXT_PUBLIC_BASE_URL` - public site URL

Generate a bcrypt hash for `ADMIN_PASSWORD`:

```bash
node -e "require('bcryptjs').hash('yourpassword', 12).then(h => console.log(h))"
```

### 4. Set up the database

```bash
npm run db:push
npm run db:seed
```

### 5. Start the app

```bash
npm run dev
```

The app will be available at `http://localhost:3000`.

## Audio Uploads with Cloudflare R2

Audio uploads are optional. If you want song audio support, configure these additional variables:

- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_PUBLIC_BASE_URL`
- `R2_ENDPOINT` - optional override; defaults to the standard Cloudflare R2 endpoint for the account
- `NEXT_PUBLIC_AUDIO_UPLOAD_MODE` - `auto`, `direct`, or `proxy`

### Upload behavior

- Supported file types: `mp3`, `m4a`
- Maximum audio size: `10 MB`
- In `direct` mode, the browser uploads to R2 using a presigned URL
- In `proxy` mode, the app uploads through the server
- In `auto` mode, local development uses proxy uploads and production prefers direct uploads with proxy fallback where possible

The production proxy fallback is intended for smaller uploads. Larger files depend on direct browser-to-R2 uploads, so the bucket CORS policy must allow your site origin.

## R2 CORS Policy

This repo includes a dashboard-ready Cloudflare R2 CORS policy file:

- `scripts/r2-cors.hymnbook.json`

It currently allows:

- `https://hb.sateeshboggarapu.com`
- `http://localhost:3000`
- `http://127.0.0.1:3000`

To update the bucket CORS policy through the Cloudflare API, set:

- `CLOUDFLARE_API_TOKEN`
- `R2_ACCOUNT_ID`
- `R2_BUCKET_NAME`

Then run:

```bash
npm run r2:cors:set
```

Optional:

- `R2_CORS_FILE` - path to a different CORS policy file

The script accepts either the Cloudflare dashboard JSON array format or the API-style `{ "rules": [...] }` format and normalizes it before sending the update request.

## Available Scripts

- `npm run dev` - start the development server
- `npm run build` - create a production build
- `npm run start` - run the production build
- `npm run lint` - run ESLint
- `npm run db:generate` - generate Drizzle migrations
- `npm run db:push` - push the schema to the database
- `npm run db:migrate` - run migrations
- `npm run db:studio` - open Drizzle Studio
- `npm run db:seed` - seed the database
- `npm run r2:cors:set` - update the R2 bucket CORS policy

## Deployment Notes

- Deploy the app on Vercel or another Node.js-compatible host
- Configure all required environment variables in the deployment target
- Ensure the public site URL matches `NEXT_PUBLIC_BASE_URL`
- If audio uploads are enabled, ensure the R2 bucket public URL and CORS policy are configured before using direct uploads

## License

This repository does not currently include a license file.
