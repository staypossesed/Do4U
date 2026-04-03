# Do4U — Sell4U / Buy4U MVP

**Do4U делает за тебя:** продажа, покупка и дальше — автоматизация (в т.ч. переписка и объявления).

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
# - Run migrations in SQL Editor in order: 001, 002–003 as needed, 004, 005, 006
#   (If you skipped 004 but need profile country/city: run 007_ensure_user_geo_columns.sql — idempotent.)
# - Copy URL and anon key to .env.local

# 4. Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Статус готовности к закрытой бете

MVP собран для **ограниченного пилота**: основные сценарии проходятся от начала до конца в одном продукте.

**Ключевые рабочие цепочки**

1. **Создание объявления** — Sell4U: голос и/или фото → AI-анализ и превью (RU/EN) → публикация, запись в `listings`, карточка в ленте «Рядом с тобой».
2. **Получение уведомлений** — события (в т.ч. новое сообщение в чате) попадают в `notifications`, push + realtime; из списка уведомлений можно перейти в чат.
3. **Чаты и AI-черновики** — переписка на странице объявления и в `/chats`; переключатель **Do4U** пишет `chats.is_claw_managed`; при сообщении покупателя вызывается `POST /api/ai/chat-suggest` (лимит ~20 запросов/мин), продавец видит черновик и решает, отправлять ли его.

**Первый запуск** — компонент онбординга в `(app)/layout` показывается **один раз на аккаунт**: флаг в `localStorage`, в `auth.user_metadata.has_completed_onboarding` и в `users.preferences.has_completed_onboarding`.

### Как протестировать полный цикл (первые пользователи)

1. **Продавец:** создай объявление (**Продать** → голос → фото → AI → **Запустить Do4U**), дождись экрана успеха и уведомления «Объявление опубликовано».
2. **Покупатель** (второй аккаунт или инкогнито): открой объявление на **Рядом с тобой**, напиши в чат. У продавца в **Уведомлениях** появится `chat_message` — тап откроет чат (`?chat=`).
3. **Черновик Do4U:** у продавца включи **Do4U-ответы** в чате или на карточке объявления; после сообщения покупателя вызывается **`POST /api/ai/chat-suggest`**. В UI появится блок **SellerDraft**: отправить как есть, отредактировать и отправить, или **Отклонить**. При ответе **429** клиент показывает понятное сообщение о лимите.
4. **Сервисный ключ:** в `.env.local` задай `SUPABASE_SERVICE_ROLE_KEY` только на сервере (Vercel) — для чтения `style_examples` продавца; ключ не попадает в клиентский бандл.
5. **Миграции:** примени **`006_notifications_chat_triggers.sql`** (уведомления о новых сообщениях, колонка `pending_ai_suggestion`) и включи **Realtime** для таблицы `notifications` в Supabase Dashboard.

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
│   ├── icons/              # Do4U logo SVG
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
- **chats** — buyer/seller messages (JSONB), AI-managed flag (`is_claw_managed` in DB)
- **notifications** — push notifications with read status
- **moderation_logs** — AI + human review pipeline

Run `004_marketplace_platforms_and_geo.sql` for:
- **marketplace_platforms** — external marketplaces per `country_code` (slug, `posting_method`: `api` | `template` | `manual`)
- **users** — `country_code`, `city`, `latitude`, `longitude` (uses `IF NOT EXISTS`; safe to re-run)

`007_ensure_user_geo_columns.sql` — только колонки гео у `users` (если **004** не применяли, а сохранение страны/города в профиле падает).

Run `005_nearby_listings_marketplace.sql` for:
- **RPC `nearby_listings_for_marketplace`** — активные объявления в радиусе 30 км (исключая текущего пользователя), сортировки «новые / рядом / популярные / горячие».

## Как протестировать Sell4U flow

1. **Окружение:** заполни `.env.local` (Supabase URL/anon key, `GROK_API_KEY` и/или `OPENAI_API_KEY` для AI и модерации).
2. **База:** примени миграции, включая `004` и `005`. У пользователя должны быть координаты (автоматически через `GeoBootstrap` или вручную в `users`).
3. **Профиль:** **Профиль** → страна + город → **Сохранить место продаж** (нужны колонки из **004** или **007**). На превью Sell4U площадки подтянутся из `marketplace_platforms`.
4. **Создание объявления:** **Продать** → голос → 4–8 фото → дождись AI (скелетоны) → на превью проверь карусель, RU/EN текст, цену, чекбоксы площадок → **Запустить Do4U**. Должен появиться toast «Do4U начал работу…», затем экран успеха с кнопками копирования шаблонов для внешних площадок.
5. **Модерация:** попробуй заведомо запрещённый товар в описании — ожидай блокировку с предупреждением (`MODERATION_BLOCKED`).
6. **Внутренний маркетплейс:** вкладка **Рядом с тобой** — только `active` чужие объявления в ~30 км (при отсутствии гео — fallback без дистанции). Фильтры категорий и сортировки.
7. **Чат:** открой карточку объявления (не как продавец) — отправь сообщение; в **Чаты** список диалогов, realtime через Supabase.

## Известные ограничения MVP

- **Внешние площадки (Avito, VK, eBay и т.д.):** только **шаблоны текста** для копирования — полной автоматической публикации через API нет; пользователь вставляет объявление вручную на выбранном сайте.
- **Do4U-маркетплейс:** объявления видны внутри приложения; геолента и чаты завязаны на Supabase и выбранную страну в профиле.
- **AI-черновики в чате:** лимит запросов, ответы не уходят покупателю без подтверждения продавца.

## Глобальная логика площадок

1. **Первый вход:** компонент `GeoBootstrap` (в `(app)/layout`) запрашивает `navigator.geolocation`, затем вызывает `POST /api/geo/resolve`, который объединяет координаты с геолокацией по IP ([ipapi.co](https://ipapi.co)) и при необходимости обратным геокодированием ([Nominatim](https://nominatim.openstreetmap.org)). Результат пишется в `public.users` (и в `location` как `POINT`).

2. **Edge Function (опционально):** `supabase/functions/geo-from-ip` — тот же IP-lookup для деплоя на Supabase (`supabase functions deploy geo-from-ip`). В Vercel достаточно API route.

3. **Переменные:** необязательный `IPAPI_TOKEN` в `.env.local` для расширенного лимита ipapi.

4. **Список площадок:** клиент читает `marketplace_platforms` по `country_code` пользователя (после следующих этапов — превью Sell4U и чекбоксы).

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

Private — Do4U
