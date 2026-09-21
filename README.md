# ByHLTV — enterprise monorepo

Full HLTV-style Belarusian CS2 platform: Next.js web + NestJS API + Prisma (**PostgreSQL**; Docker Compose included).

## Structure

```
apps/web          Next.js UI (App Router, i18n be/ru/en)
apps/api          NestJS REST + WebSocket (/live)
packages/shared   Zod schemas + enums
packages/database Prisma schema + seed
packages/tsconfig Shared TS configs
tooling/scripts   bootstrap + smoke
```

## Quick start

```bash
# 1) install
npm install

# 2) database — start Postgres, then push schema + seed
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed

# 3) run API + Web (two terminals)
npm run dev:api
npm run dev:web
```

- Web: http://localhost:3000
- API: http://localhost:4000/api/v1
- Health: http://localhost:4000/api/v1/health

### Demo accounts

| Email | Password | Role |
|-------|----------|------|
| admin@byhltv.local | Admin123! | SUPERADMIN |
| editor@byhltv.local | Editor123! | EDITOR |
| mod@byhltv.local | Mod1234! | MODERATOR |
| to@byhltv.local | ToAdmin123! | TOURNAMENT_ADMIN |
| applicant@byhltv.local | Apply1234! | USER (pending TO application) |
| user@byhltv.local | User1234! | USER |

### Roles & ops flows

- Apply as TO: `/apply/tournament-admin` → Admin approves at `/admin/applications`
- TO ops dashboard: `/ops` (submissions + event ownership)
- Editor queue: same `/ops` when logged in as EDITOR+
- Moderator: `/mod` (reports queue, limited USER bans)
- Admin CMS: `/admin` (+ users, news, events, teams, players)
- Live operator console: `/ops/live/:matchSlug`
- Public live hub: `/live` (REST + Socket.IO `/live` rooms)
- Match CMS: `/admin/matches` — Editor/Admin create any match; Tournament Admin creates matches for their organized events. Public page: `/matches/:slug`. Live ops: `/ops/live/:slug`.

Realtime: Socket.IO namespaces `/live` (public match rooms) and `/ops` (JWT staff/TO chat).

### GSI (CS2 live stats)

1. Open Ops live console for a match (`/ops/live/:slug`) as Admin/Editor/TO
2. Set public host if the game PC is not on localhost, then **Download .cfg** (or copy URI)
3. Place `gamestate_integration_byhltv.cfg` into CS2 `game/csgo/cfg/` (or dedicated `csgo/cfg/`) and restart CS2
4. Prefer dedicated server for full `allplayers_*` roster; client mode merges per-player payloads by SteamID
5. Env: `GSI_PUBLIC_BASE_URL` — public API base written into cfg
6. Smoke without CS2: `node tooling/scripts/gsi-fixture.mjs`

### Demo parse (post-match)

1. On the same Ops live page, upload a `.dem` (optionally set map name)
2. API parses with `@laihoe/demoparser2` → per-map `PlayerMatchStat`, rounds, map scores
3. Public match page shows Overall / per-map tabs (HLTV-style scoreboard)

Ratings use **ByHLTV Rating 2.1-approx** and **3.0-lite** (`@byhltv/rating-engine`) — documented approximations, not official HLTV formulas.

Players CMS: `/admin/players` (EDITOR+)

## Database (PostgreSQL)

Default connection (also in `packages/database/.env` and `apps/api/.env`):

```
postgresql://byhltv:byhltv@localhost:5433/byhltv?schema=public
```

```bash
docker compose up -d postgres
npm run db:generate
npm run db:push
npm run db:seed
```

Note: compose maps Postgres to **host `:5433`** (container `:5432`) so it doesn't fight a local Postgres on 5432.

Optional: Redis / MinIO via `docker compose up -d`.

## Docker (Redis / MinIO)

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev:web` | Next.js |
| `npm run dev:api` | NestJS watch |
| `npm run build` | Turbo build |
| `npm run db:seed` | Seed demo data |
| `node tooling/scripts/smoke.mjs` | API smoke test |

## Features delivered

- Auth JWT + refresh, RBAC with `TOURNAMENT_ADMIN` + capability checks
- Tournament admin applications (apply → admin approve)
- Event submissions pipeline + Socket.IO `/ops` chat
- Teams, Players, Matches, Events, News CMS (multi-locale)
- Ranking + history snapshots, Stats engine, Live WS gateway (`/live` rooms)
- HLTV-like live scoreboard, stats, veto, rounds
- Forums, Gallery, Streams, Search, Notifications/Favorites API
- Fantasy draft, Betting odds/guides (informational)
- Admin overview, users, feature flags, audit log
- Throttling, Redis cache with in-memory fallback
