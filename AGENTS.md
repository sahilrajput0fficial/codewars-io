# AGENTS.md

## Project context

CodeWars is a ranked 1v1 DSA battle platform. Frontend: **Next.js 14 (App
Router)**. Backend: **FastAPI**. The product is divided into 4 independent
modules (Auth & Profiles, Problems & Judge, Match Engine, Retention) —
each developer owns a full vertical slice (frontend + backend) of one
module. See `MODULES.md` for ownership boundaries before touching code
outside your assigned module.

All color, typography, and shape decisions are governed by `DESIGN.md` at
the repo root. Read it before writing any UI code — do not introduce a
new color or font that isn't already a token defined there.

---

## Dev environment tips

- Use `pnpm dlx turbo run where <project_name>` to jump to a package
  instead of scanning with `ls`.
- Run `pnpm install --filter <project_name>` to add the package to your
  workspace so Vite, ESLint, and TypeScript can see it.
- Use `pnpm create vite@latest <project_name> -- --template react-ts` to
  spin up a new React + Vite package with TypeScript checks ready.
- Check the `name` field inside each package's `package.json` to confirm
  the correct package name instead of the top-level one.
- Backend env vars live in `backend/.env` — required: `DATABASE_URL`,
  `REDIS_URL`, `JUDGE0_URL`, `JWT_SECRET`, `JWT_REFRESH_SECRET`,
  `SENTRY_DSN`.
- Frontend env vars live in `frontend/.env.local` — required:
  `NEXT_PUBLIC_API_URL`.
- Run `docker-compose up -d` from repo root to start local Postgres,
  Redis, and a local Judge0 instance before running the backend.
- Never run user-submitted code against the main backend process — all
  code execution must go through the Judge0 service, never inline.

---

## Backend architecture guidelines

### Stack
- **Framework:** FastAPI (async), `uvicorn` as the ASGI server.
- **ORM:** SQLModel (SQLAlchemy 2.0 async) — models double as Pydantic
  schemas where reasonable, but keep dedicated `schemas.py` for
  request/response shapes that differ from the DB model.
- **Migrations:** Alembic. Never use `SQLModel.metadata.create_all()`
  outside local scratch scripts — every schema change goes through a
  migration.
- **Job queue:** `arq` (not BullMQ — BullMQ is Node-only and not part of
  this stack). Background jobs (ELO recalculation, quest resets, streak
  updates, replay persistence) are registered in `app/jobs/`.
- **Auth:** Fully self-issued and self-managed. Password/OAuth
  credential verification, JWT issuance, and JWT refresh all happen in
  our own backend — **nothing about auth relies on Supabase**. Supabase
  is used only as the Postgres host for `DATABASE_URL`; it is not an
  identity provider. See "Auth: self-issued JWT" below for the full
  contract.
- **Code execution:** Judge0 CE, self-hosted, running on an isolated VM
  — never on the same host as the FastAPI app. All execution requests go
  through the Problems & Judge module's submission service, never called
  directly from another module.

### Auth: self-issued JWT (access + refresh)

We do **not** use Supabase Auth, Supabase JWKS, or Supabase session
cookies anywhere in the stack. Auth is entirely first-party:

- **Token issuance:** `app/modules/auth/services.py` is the only place
  that mints tokens. On successful login/signup it issues:
  - an **access token** — short-lived (15 min), signed with `JWT_SECRET`
    (HS256), carries `sub` = `users.id` (UUID) plus `exp`, `iat`, `jti`.
  - a **refresh token** — long-lived (30 days), signed with a
    **separate** secret `JWT_REFRESH_SECRET`, carries `sub`, `exp`,
    `iat`, `jti`, and a `token_family` id for rotation tracking.
- **Refresh token storage:** refresh tokens are stored server-side
  (hashed, never plaintext) in a `refresh_tokens` table keyed by
  `token_family`, so any token can be revoked individually or by family
  (e.g. "log out everywhere"). Never trust a refresh token that isn't
  present and unexpired in this table.
- **Rotation:** every call to `POST /auth/refresh` issues a brand-new
  access + refresh token pair and invalidates the previous refresh
  token in the same family. If a refresh token is reused after
  rotation (replay), revoke the entire `token_family` — that's a signal
  of token theft.
- **Validation:** every protected route depends on `get_current_user`,
  which decodes and verifies the access token locally with `JWT_SECRET`
  (no network call, no JWKS fetch, no third-party dependency). Never
  validate against an external identity provider.
- **Password storage:** hash with `bcrypt`/`argon2` in
  `auth/services.py`; never store or log plaintext passwords.
- **OAuth (GitHub/Google), if used:** our backend exchanges the OAuth
  provider's code directly, verifies the identity, upserts the `users`
  row, and then issues our own access + refresh pair exactly as above.
  The provider is only used to confirm identity at signup/login — it
  never issues or refreshes the tokens our app trusts.
- **WebSocket auth:** `/ws/queue` and `/ws/match/{id}` accept the access
  token as a query param (`?token=`) and validate it the same way as
  HTTP routes — locally, against `JWT_SECRET`. Never trust a
  client-supplied `user_id` or `elo` query param.

### Keep the backend modular
- Organize the backend into feature/module-based folders, aligned to the
  4 product modules — not arbitrary technical groupings.
- Every module should have a clear separation of responsibilities.
- A module's folder name should match its product module
  (`auth`, `problems`, `match_engine`, `retention`) — not generic names
  like `module_name`.

Example:

```
backend/
└── app/
    ├── modules/
    │   ├── auth/
    │   │   ├── router.py        # API routes: /auth/signup, /auth/login,
    │   │   │                     #   /auth/refresh, /auth/logout
    │   │   ├── services.py      # Business logic: password hashing,
    │   │   │                     #   JWT issuance + rotation, OAuth exchange
    │   │   ├── schemas.py       # Pydantic request/response schemas
    │   │   ├── models.py        # Database models (User, EloHistory,
    │   │   │                     #   RefreshToken)
    │   │   ├── repository.py    # Database operations (optional)
    │   │   └── utils.py         # Helper functions (if required)
    │   ├── problems/
    │   │   ├── router.py
    │   │   ├── services.py      # Judge0 integration lives here
    │   │   ├── schemas.py
    │   │   ├── models.py        # Problem, TestCase, Submission
    │   │   └── repository.py
    │   ├── match_engine/
    │   │   ├── router.py
    │   │   ├── websocket.py     # /ws/queue and /ws/match/{id} handlers
    │   │   ├── services.py      # matchmaking, ELO formula
    │   │   ├── schemas.py
    │   │   └── models.py        # Match
    │   └── retention/
    │       ├── router.py
    │       ├── services.py      # bot simulation, quest logic
    │       ├── schemas.py
    │       └── models.py        # Quest
    ├── jobs/                    # arq background jobs, one file per concern
    │   ├── elo_jobs.py
    │   ├── quest_jobs.py
    │   └── streak_jobs.py
    ├── core/
    │   ├── config.py            # env var loading
    │   ├── deps.py               # get_current_user, shared dependencies
    │   ├── jwt.py                 # encode/decode/rotate helpers, shared by
    │   │                           #   HTTP deps and the WS auth path
    │   └── redis.py              # shared Redis client
    └── main.py                   # registers all module routers, lifespan, Sentry init
```

### Routing
- Keep all API endpoints inside `router.py` of their modules.
- Routers should only:
  - validate requests
  - call service functions
  - return responses
- Do **not** place business logic inside routers.
- WebSocket handlers (`match_engine/websocket.py`) follow the same rule —
  the handler dispatches events, the service layer decides what happens.

### Services
- Keep all business logic inside `services.py` of their modules.
- Services should contain:
  - validations
  - workflows
  - integrations (Judge0 calls)
  - processing logic (ELO calculation, quest completion checks, JWT
    issuance/rotation for the auth module)
- Services should not depend on HTTP request objects or WebSocket
  connection objects directly — pass plain data in, get plain data out,
  so services stay testable without a live request/connection.

### Models & Schemas
- Database models belong in `models.py` of their modules.
- Request/response models belong in `schemas.py` of their modules.
- A module never imports another module's `models.py` directly for
  writes. Cross-module data needs (e.g. Match Engine writing to
  `users.elo`) go through that module's service function or a clearly
  defined repository method — not a raw cross-module model import.

### Database
- Keep database queries separated from routing logic.
- Prefer repository/helper files when query complexity increases.
- Every leaderboard-style or rank-style query reads from `users` —
  there is no separate `leaderboard` table. Do not create one.
- `elo_history` is append-only. Never `UPDATE` a row in this table, only
  `INSERT`.
- `refresh_tokens` (owned by the auth module) stores hashed refresh
  tokens keyed by `token_family`. Revoking a family is a soft-delete
  (`revoked_at` timestamp) — never hard-delete rows we may need for
  theft-detection auditing.
- Add a database index whenever a new query sorts or filters on a
  column at read-heavy scale (e.g. `users.elo`, `problems.difficulty`,
  `refresh_tokens.token_family`) — call this out explicitly in the
  migration, don't add it silently later.

### Cross-module contracts
- Modules communicate only through:
  1. Shared database tables, with clear read/write ownership per table
     (documented in `MODULES.md`)
  2. Each other's REST endpoints (called as plain HTTP, even
     internally — no direct Python function imports across module
     boundaries)
  3. WebSocket events, for Match Engine → Retention notifications
- If a task requires reaching into another module's internals, stop and
  check `MODULES.md` for the correct interface contract first.

---

## Frontend Architecture Guidelines (Next.js)

The frontend uses **Next.js 14 (App Router)** with **TypeScript**,
**Tailwind CSS**, and **Zustand** for client state. Follow a clean,
scalable, and reusable architecture aligned to the same 4 product
modules used on the backend.

### Stack
- **Framework:** Next.js 14, App Router, TypeScript strict mode.
- **Styling:** Tailwind CSS + `shadcn/ui` for primitive components
  (dialogs, dropdowns, toasts). All colors and fonts come from
  `DESIGN.md` tokens — never hardcode hex values or arbitrary Tailwind
  color classes.
- **State:** Zustand for client-side state (`matchStore`, `userStore`).
  Use `TanStack Query` for server state/data fetching — do not put
  server data inside Zustand stores.
- **Code editor:** `@monaco-editor/react` — the only code editor
  component used anywhere in the app.
- **Auth:** first-party, backed entirely by our own FastAPI `/auth`
  routes — **no `@supabase/ssr`, no Supabase client anywhere in the
  frontend.**
  - The access token is held in memory (Zustand `userStore`) and
    attached as `Authorization: Bearer <token>` by `lib/api-client.ts`.
  - The refresh token is stored in an **httpOnly, secure cookie** set by
    the backend on login/refresh — never accessible to client-side JS.
  - `lib/api-client.ts` implements the single shared
    401-detect-refresh-retry wrapper (`apiFetch`): on a 401, it calls
    `POST /auth/refresh` once, updates the in-memory access token on
    success, and retries the original request; on refresh failure it
    clears `userStore` and redirects to `/login`. No feature should
    hand-roll its own refresh logic.
  - `useCurrentUser` reads from `userStore`, not from any Supabase
    hook. Server components that need the user identity read the
    access token off the request cookies/headers and call our own
    `GET /users/me` — never a Supabase server client.
  - During an active match, proactively refresh on an interval shorter
    than the access token TTL so a player is never mid-submit when the
    token expires.
- **Fonts:** Loaded via `next/font/google` only — `Inter` for UI,
  `JetBrains Mono` for all numbers and code (see `DESIGN.md` Section 6).

## Recommended Structure

```
frontend/
├── app/
│   ├── (auth)/
│   │   ├── login/
│   │   └── signup/               # first-party signup — no /auth/callback,
│   │                              #   since there is no external OAuth
│   │                              #   redirect step to catch
│   ├── (main)/
│   │   ├── u/[username]/         # M1 — profile page
│   │   ├── leaderboard/          # M1 — leaderboard page
│   │   ├── problem/[slug]/       # M2 — problem detail + editor
│   │   ├── problems/             # M2 — problem list
│   │   ├── play/                 # M3 — matchmaking / queue
│   │   ├── match/[id]/           # M3 — live match arena
│   │   └── page.tsx              # M4 — homepage / hub (bots, POTD, quests)
│   ├── api/                      # Next.js route handlers, used sparingly —
│   │                              prefer calling FastAPI directly from
│   │                              server components/actions
│   ├── layout.tsx
│   ├── globals.css
│   └── favicon.ico / icon.svg
│
├── components/
│   ├── ui/                       # shadcn/ui primitives — do not edit by hand,
│   │                              regenerate via shadcn CLI
│   ├── forms/
│   ├── layout/                   # Navbar, footer — shared across all modules
│   └── shared/                   # EloBadge, TierIcon, DifficultyLabel —
│                                   cross-module shared components only
│
├── features/
│   ├── auth/                     # M1 — sign-in/sign-up forms, profile components
│   ├── leaderboard/               # M1 — table, rank row, your-rank marker
│   ├── problems/                  # M2 — problem list, editor panel, result panel
│   ├── match/                     # M3 — match arena, matchStore, WS client
│   └── retention/                 # M4 — bot select, quest panel, POTD card
│
├── lib/
│   └── api-client.ts              # typed fetch wrapper for the FastAPI backend
│                                    #   (apiFetch: attaches bearer token,
│                                    #   401-detect-refresh-retry)
│
├── services/                      # one file per backend module's API surface
│   ├── auth-service.ts
│   ├── problems-service.ts
│   ├── match-service.ts
│   └── retention-service.ts
│
├── hooks/
│   ├── use-match-socket.ts        # WebSocket connection + reconnect logic
│   └── use-current-user.ts
│
├── stores/
│   ├── match-store.ts              # Zustand — live match state
│   └── user-store.ts                # Zustand — session, profile, ELO,
│                                      #   in-memory access token
│
├── utils/
│
├── types/
│   └── api.ts                       # shared types mirroring backend Pydantic schemas
│
├── constants/
│   └── elo-tiers.ts                 # bronze/silver/gold/diamond thresholds
│
├── public/
│   └── logos/                       # CodeWars SVG marks — see DESIGN.md for usage rules
│
├── DESIGN.md
└── MODULES.md
```

the feature folder speciifc struture should be 
features/
└── feature-name/
    ├── components/
    ├── hooks/
    ├── services/
    ├── utils/
    ├── types.ts
    ├── constants.ts
    ├── index.ts
    └── feature-name.tsx

## Component Rules

- Build reusable components.
- Keep components focused on a single responsibility.
- Avoid large files.
- Move repeated UI into shared components — anything used by 2+ modules
  (e.g. `EloBadge`, `DifficultyLabel`, `TierIcon`) belongs in
  `components/shared/`, not duplicated inside a `features/` folder.
- Keep business logic outside UI components whenever possible — fetch
  and transform data in a service or server component, pass clean props
  to presentational components.
- Numbers (ELO, timers, ranks, stats) are always rendered in
  `font-mono` — see `DESIGN.md` Section 6. Wrap these in a shared
  `<Mono>` or `<StatValue>` component rather than applying the class
  inline everywhere.

## Design system compliance

- Every new component must use tokens from `DESIGN.md` — `bg-surface`,
  `text-text-secondary`, `border-border`, `text-accent`, `tier-gold`,
  etc. Never a raw hex value or arbitrary Tailwind color class.
- Accent color (`accent` token) usage is capped per `DESIGN.md` Section
  3 — if a new component seems to need an accent touch that isn't
  already on that list, default to grayscale + weight/size first and
  flag it for review rather than adding a new accent use case silently.
- Competitive/battle UI elements (match cards, VS layouts, rank badges,
  primary action buttons) use angular clipped corners. Calm UI elements
  (settings, forms, nav) use standard 8px rounded corners. See
  `DESIGN.md` Section 7 — do not unify these into one corner style.

## Next.js Best Practices

- Prefer **Server Components** by default.
- Use **Client Components** only when interactivity is required —
  the match arena, the code editor, and anything using Zustand or
  WebSockets must be client components; the leaderboard table and
  problem list can be server components with client-side row
  interactivity isolated to small child components.
- Fetch data on the server whenever possible.
- Keep API calls inside `services/` files — never call `fetch()`
  directly inside a component or page file.
- Use loading and error boundaries (`loading.tsx`, `error.tsx`) per
  route segment, especially for `match/[id]/` where WebSocket
  connection failures need a clear fallback state.
- Optimize images using `next/image`.
- Use `next/link` for navigation.
- Follow App Router conventions — route groups `(auth)` and `(main)`
  separate authenticated-flow pages from the main app shell without
  affecting the URL structure.
- Difficulty filters on `/problems` and tier filters on `/leaderboard`
  are query params on the same route (`?difficulty=easy`,
  `?tier=gold`) — never separate routes per filter value.

---

## Build & Deployment (Vercel Multi-Project)

Both the frontend (Next.js) and backend (FastAPI) are deployed in a single Vercel project using Vercel's experimental multi-project services configuration (`vercel.json`).

### 1. Development Mode (Localhost)
For local development, both services run independently on different localhost ports.

* **Frontend:** `http://localhost:3000`
* **Backend:** `http://localhost:8000`

#### Environment Configuration:
* **Frontend (`frontend/.env.local`):**
  ```env
  NEXT_PUBLIC_ENVIRONMENT=development
  NEXT_PUBLIC_API_URL=http://localhost:8000
  NEXT_PUBLIC_FRONTEND_URL=http://localhost:3000
  ```
* **Backend (`backend/.env`):**
  ```env
  ENVIRONMENT=development
  FRONTEND_URL=http://localhost:3000
  JWT_SECRET=dev-only-change-me
  JWT_REFRESH_SECRET=dev-only-change-me-too
  ```

---

### 2. Production Mode (Vercel)
In production, both services are served on the same domain (e.g., `https://codewars-io.vercel.app`), with the backend routed under the prefix `/_/backend`.

* **Frontend:** `https://codewars-io.vercel.app`
* **Backend:** `https://codewars-io.vercel.app/_/backend`

#### How to configure Vercel:
You must configure the following environment variables in the **Vercel Project Dashboard** (Go to *Project Settings > Environment Variables*):

1. **Frontend Service Variables:**
   * `NEXT_PUBLIC_ENVIRONMENT` = `production`
   * *(Optional)* `NEXT_PUBLIC_API_URL` = `https://codewars-io.vercel.app/_/backend`
   * *(Optional)* `NEXT_PUBLIC_FRONTEND_URL` = `https://codewars-io.vercel.app`

2. **Backend Service Variables:**
   * `ENVIRONMENT` = `production`
   * `FRONTEND_URL` = `https://codewars-io.vercel.app`
   * `JWT_SECRET` = *(strong, rotated secret — access token signing)*
   * `JWT_REFRESH_SECRET` = *(separate strong, rotated secret — refresh token signing)*

#### Build-Time Safety Guard:
The frontend has a safety guard in `frontend/next.config.ts`. If Vercel tries to build the application and `NEXT_PUBLIC_ENVIRONMENT` is not set to `production`, the build will fail immediately. This ensures development settings are never accidentally deployed.

Once the environment variables are configured on Vercel, every push to the `main` branch will trigger Vercel's automated git integration to build and deploy in production mode automatically.

### 3. Deploying to Production (Git Workflow)
Run the following commands to commit your configurations and push to GitHub:

```powershell
# 1. Verify the modified files
git status

# 2. Stage all changed files
git add .

# 3. Commit the changes
git commit -m "chore: configure vercel production environment variables and safety guards"

# 4. Push to origin main to trigger Vercel's auto-build
git push origin main
```

---

### 4. Daily Feature Development & Deployment Workflow (Step-by-Step Example)

Here is a step-by-step example of how to develop a new feature (e.g., adding a `"User Profile Settings"` page) locally and deploy it online to Vercel without manual configuration changes:

#### Step 1: Develop and Test Locally
Ensure your local environment files specify the development environment.
* `frontend/.env.local` contains `NEXT_PUBLIC_ENVIRONMENT=development`
* `backend/.env` contains `ENVIRONMENT=development`

Start your local services (FastAPI on port `8000`, Next.js on port `3000`). All API calls will automatically route to `http://localhost:8000`. Test the feature in your browser at `http://localhost:3000`.

#### Step 2: Push to GitHub to Deploy Live
Once your feature is complete and working locally, you do **not** need to edit any configuration or URL files. Simply run the following git commands:

```powershell
# 1. Review changed and untracked files
git status

# 2. Stage your new feature code
git add .

# 3. Commit your feature changes
git commit -m "feat: implement user profile settings page"

# 4. Push to main branch (triggers Vercel production build automatically)
git push origin main
```

Vercel will build the project using its configured production environment variables, compile your Next.js frontend to securely call `https://codewars-io.vercel.app/_/backend`, and publish it live!