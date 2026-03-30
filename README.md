# ClawEverything — Sell4U MVP

**Claw делает ВСЁ за тебя.** Продавай одним голосовым сообщением.

Mobile-first PWA на Next.js 15 App Router.

## Tech Stack

- **Framework:** Next.js 15 (App Router, Server Actions, RSC)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS v4 + shadcn/ui components + Framer Motion
- **Backend:** Supabase (Auth, PostgreSQL + PostGIS, Storage, Edge Functions, Realtime)
- **AI:** Grok API + OpenAI GPT-4o / GPT-4o-mini (fallback)
- **State:** Zustand
- **Deployment:** Vercel

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Copy env vars
cp .env.local.example .env.local

# 3. Set up Supabase
# - Create project at supabase.com
# - Run supabase/migrations/001_initial_schema.sql in SQL Editor
# - Copy URL and anon key to .env.local

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Project Structure

```
src/
├── app/
│   ├── (app)/              # Authenticated app layout
│   │   ├── dashboard/      # Main dashboard (Sell4U / Buy4U tabs)
│   │   ├── sell/new/       # Create listing wizard
│   │   ├── marketplace/    # Browse listings
│   │   ├── chats/          # Messaging
│   │   ├── notifications/  # Push notifications
│   │   └── profile/        # User settings
│   ├── auth/               # Sign in / sign up / magic link
│   ├── layout.tsx          # Root layout + providers
│   └── page.tsx            # Landing page
├── components/
│   ├── icons/              # ClawLogo SVG
│   ├── layout/             # Header, BottomNav, Providers
│   └── ui/                 # Button, Card, Input, Badge, Skeleton
├── lib/
│   ├── supabase/           # Client, Server, Middleware helpers
│   ├── types/              # Database types
│   ├── i18n.ts             # RU/EN translations
│   ├── store.ts            # Zustand global store
│   └── utils.ts            # Helpers (cn, formatPrice, formatRelativeTime)
└── middleware.ts            # Auth guard
```

## Database Schema

See `supabase/migrations/001_initial_schema.sql`:
- **users** — profile with PostGIS location, style_examples
- **listings** — items with AI metadata, dual-language titles
- **listing_images** — original + AI-enhanced URLs
- **chats** — buyer/seller messages (JSONB), Claw-managed flag
- **notifications** — push notifications with read status
- **moderation_logs** — AI + human review pipeline

## Features (Этап 1 — Done)

- [x] Project scaffold + TypeScript strict
- [x] Supabase Auth (email/password, Google OAuth, magic link)
- [x] Dark/Light theme with animated toggle
- [x] RU/EN language switcher
- [x] Mobile-first layout with bottom navigation
- [x] Landing page with feature showcase
- [x] Dashboard with Sell4U / Buy4U tabs
- [x] Create listing wizard (4-step: Voice → Photos → AI → Publish)
- [x] PWA manifest
- [x] Error boundaries + 404 page + loading states

## Roadmap

- **Этап 2:** Dashboard with real data from Supabase
- **Этап 3:** Full Sell4U flow (Web Speech API, camera, AI processing via Edge Functions)
- **Этап 4:** Marketplace feed with geo-filters + realtime chat
- **Этап 5:** Push notifications + PostGIS proximity matching
- **Этап 6:** Moderation panel + full PWA + service worker

## License

Private — ClawEverything
