# PSR Frontend

PSR — a complete photography-community platform built on Next.js 16.4.6 App Router, React 19, Tailwind CSS 4, and PostgreSQL (via `pg`, no ORM).

## Tech stack
- **Framework:** Next.js 16.4.6 App Router (`cacheComponents: true`, `partialPrefetching: true`)
- **UI:** React 19, Tailwind CSS 4 (`@theme` design tokens)
- **Data:** PostgreSQL (`pg`), repository/service layer (no Prisma/ORM)
- **Auth:** Server-side sessions (`psru_session` cookie, HttpOnly, SameSite=Lax), Argon2 password hashing, role guards (`requireUser`, `requireRole`)
- **Mail:** Nodemailer SMTP (Gmail App Password) for password-reset email — server-only credentials

## Design system
Centralized Tailwind 4 `@theme` tokens:
- Brand orange `#ff7417`, deep orange `#e95d08`
- Dark bg `#090909`, surface `#111110`; light bg `#f5f2ed`, surface `#fffdfa`
- Text `#f4f1ed`, muted `#a29d97`, line `rgba(255,255,255,0.13)`
- Radius `14px`, shadows, Geist sans/mono fonts

Light & dark themes with persistent preference (localStorage) and system fallback. Orange used sparingly for primary actions, active states, focus rings, and highlights.

## Public website

### Routes
| Route | Description | Data source |
|-------|-------------|-------------|
| `/` | Homepage — hero with animated camera illustration, society intro, featured photographers/portfolios, events, exhibitions, membership CTA | Real API data; empty states when no records |
| `/photographers` | Photographer directory (list + pagination) | `GET /api/photographers` |
| `/photographers/[id]` | Photographer detail + portfolio placeholder | `GET /api/photographers/[id]` |
| `/portfolios` | Public portfolio gallery | `GET /api/portfolios` |
| `/portfolios/[id]` | Portfolio detail | `GET /api/portfolios/[id]` |
| `/events` | Published events list | `GET /api/events` |
| `/events/[eventId]` | Event detail | `GET /api/events/[eventId]` |
| `/exhibitions` | Published exhibitions list | `GET /api/exhibitions` |
| `/exhibitions/[id]` | Exhibition detail | `GET /api/exhibitions/[id]` |
| `/membership` | Membership explanation + application form | `POST /api/memberships/applications` |
| `/forgot-password` | Password-reset request (email only, generic response) | `POST /api/auth/forgot-password` |
| `/reset-password?token=...` | Password reset form | `POST /api/auth/reset-password` |

### Navigation
Home · Photographers · Portfolios · Events · Exhibitions · Join PSR · Sign in / My account. Mobile drawer with accessible menu button; drawer closes after navigation.

## Authentication
- `POST /api/auth/register` — public registration (roles: CLIENT/MEMBER/PHOTOGRAPHER; ADMIN not assignable publicly)
- `POST /api/login` — session login (`psru_session` cookie)
- `POST /api/logout` — session destruction
- `GET /api/users/me` — current user (401 when unauthenticated, handled as normal state)
- `PATCH /api/users/me` — profile update (name, phone)
- `POST /api/auth/forgot-password` — generic response, rate-limited, SHA-256-hashed token, 30-min expiry, single-use
- `POST /api/auth/reset-password` — token validation, password strength (min 8), Argon2 hashing, token consumption, all sessions revoked

### Forgot/reset security
- Never reveals whether an email is registered (identical public response)
- Token stored only as SHA-256 hash; raw token never logged
- Rate-limited by email (5 req/hour)
- Gmail SMTP via Nodemailer (server-only credentials, never in browser)

## Client account (`/account/*`)
Role-gated; client accesses only own data.
- `/account` — Dashboard (booking count, unread notifications, quick actions)
- `/account/profile` — Profile edit via `PATCH /api/users/me`
- `/account/bookings` — Booking list via `GET /api/bookings` (owner-scoped)
- `/account/bookings/[bookingId]` — Booking detail via `GET /api/bookings/[id]` (ownership-checked)
- `/account/bookings/[bookingId]/messages` — Send/read messages via `GET/POST /api/bookings/[id]/messages`
- `/account/notifications` — Notification list + mark-as-read via `PATCH /api/notifications/[id]/read`
- `/account/settings` — Theme toggle

## Photographer workspace (`/photographer/*`)
Role-gated to `PHOTOGRAPHER`; derives actor from session.
- `/photographer` — Dashboard overview
- `/photographer/profile` — Profile editor (name via `PATCH /api/users/me`, details via `POST /api/photographers/me/profile`)
- `/photographer/portfolio` — Portfolio manager (`POST /api/portfolios`)
- `/photographer/photos` — Photo manager + Cloudinary image upload (`POST /api/media/upload`)
- `/photographer/availability` — Availability slots (`POST /api/availability`)
- `/photographer/bookings` — Incoming booking requests (role-aware `GET /api/bookings`)
- `/photographer/bookings/[bookingId]` — Accept/reject/confirm/complete booking via `PATCH /api/bookings/[id]/status`
- `/photographer/bookings/[bookingId]/messages` — Booking messages
- `/photographer/notifications` — Notifications + mark-as-read
- `/photographer/settings` — Theme toggle

## Admin console (`/admin/*`)
Role-gated to `ADMIN`; all mutations audited.
- `/admin` — Dashboard with 14 section cards
- `/admin/membership-applications` — Approve/reject applications (`PATCH /api/admin/membership-applications`)
- `/admin/users` — List users, assign/revoke roles, activate/deactivate (`POST/PATCH /api/admin/users`)
- `/admin/photographers` — Photographer directory (`GET /api/admin/photographers`)
- `/admin/portfolios` — Portfolio moderation (`GET /api/admin/portfolios`)
- `/admin/photos` — Photo moderation (`GET /api/admin/photos`)
- `/admin/bookings` — Booking oversight (`GET /api/admin/bookings`)
- `/admin/events` — Events list (`GET /api/events`)
- `/admin/exhibitions` — Exhibitions list (`GET /api/exhibitions`)
- `/admin/awards` — Awards management (`GET/POST /api/admin/awards`)
- `/admin/media` — Media library + safe deletion (`GET/DELETE /api/admin/media`)
- `/admin/notifications` — Notification list + mark-as-read
- `/admin/site-settings` — Site configuration (`GET/POST/PATCH /api/admin/site-settings`)
- `/admin/audit-logs` — Read-only audit trail (`GET /api/admin/audit-logs`)

## API endpoint map

**Public (no auth):**
- `GET /api/photographers`, `GET /api/photographers/[id]`
- `GET /api/portfolios` (auth-aware: photographer list if signed in as photographer, else public)
- `GET /api/photos` (auth-aware: photographer's own photos if photographer, else public)
- `GET /api/events`, `GET /api/events/[eventId]`
- `GET /api/exhibitions`, `GET /api/exhibitions/[id]`
- `POST /api/auth/register`, `POST /api/login`
- `POST /api/auth/forgot-password`, `POST /api/auth/reset-password`
- `POST /api/memberships/applications`

**Authenticated (any role):**
- `GET/POST /api/logout`, `GET /api/users/me`, `PATCH /api/users/me`
- `GET /api/notifications`, `PATCH /api/notifications/[id]/read`
- `GET /api/bookings` (owner-scoped: client sees own, photographer sees incoming)
- `GET /api/bookings/[id]` (ownership-checked)
- `GET/POST /api/bookings/[id]/messages`
- `PATCH /api/bookings/[id]/status`
- `POST /api/bookings` (create)
- `GET/POST /api/photos` (photographer: own photos; public: listing)
- `PATCH/DELETE /api/photos/[id]` (ownership-checked)
- `GET/POST /api/availability`, `PATCH /api/availability/[slotId]`
- `GET /api/portfolios/[id]`, `PATCH/DELETE /api/portfolios/[id]`
- `POST /api/portfolios/[id]/photos`, `DELETE /api/portfolios/[id]/photos?photoId=`
- `POST /api/events`, `POST /api/events/[id]/register`, `DELETE /api/events/[id]/register`
- `POST /api/events/[id]/publish` (ADMIN)
- `GET/POST /api/exhibitions` (ADMIN create)
- `GET /api/photographers/me`, `POST /api/photographers/me/profile`

**Admin only:**
- `GET/POST /api/admin/users`, `GET /api/admin/photographers`, `GET /api/admin/portfolios`, `GET /api/admin/photos`, `GET /api/admin/bookings`
- `GET /api/admin/events`, `GET /api/admin/exhibitions`
- `GET/POST /api/admin/awards`, `GET/DELETE /api/admin/media`, `DELETE /api/admin/media/[id]`
- `GET/POST/PATCH /api/admin/site-settings`
- `GET /api/admin/audit-logs`
- `GET/PATCH /api/admin/membership-applications`

## Environment variables

**Required (already configured):**
```
DATABASE_URL=postgresql://... (Neon, sslmode=require)
DB_POOL_MAX=5
```

**Server-only mail (configure for password-reset email):**
```
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SECURE=true
MAIL_USER=the-sending-gmail-address
MAIL_APP_PASSWORD=Google-App-Password   # Google App Password, 2-Step Verification required
MAIL_FROM=PSR <the-sending-gmail-address>
APP_BASE_URL=http://localhost:3000      # production HTTPS URL in deployment
```

**Cloudinary (server-side, already configured):**
```
CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET
```

Never put mail/Cloudinary/database credentials in `NEXT_PUBLIC_` variables.

## Run
```bash
# Install dependencies
npm install

# Development server
npm run dev

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Production build
npm run build
```

## Known gaps (documented per brief)
1. **Gmail email delivery** is wired end-to-end but not live until `MAIL_*` credentials are added to `.env.local` (Google App Password, 2-Step Verification enabled). The forgot-password route gracefully handles missing mail config (catches failure, still returns generic 200).
2. **Client booking detail** shows booking data returned by `GET /api/bookings/[id]`; some fields (photographer name, payment status) depend on backend columns present.
3. **Photographer photo upload** posts to Cloudinary and registers a media asset; actual file bytes go to Cloudinary directly.
4. **Admin user role assignment** uses existing `assignRole`/`removeRole` repository helpers; role policy (who can assign what) is enforced at the route level (ADMIN only).
5. **SQL assumptions** noted in `lib/repositories/README.md` (no email outbox table, no normalized unique email index, no booking-overlap constraint) remain as production concerns to address via additive migrations when needed.

## Quality gates
- `npm run lint` — clean (0 errors)
- `npx tsc --noEmit` — clean
- `npm run build` — clean (74 routes, TypeScript passes)
- E2E tests pass across auth, public pages, client account, photographer workspace, and admin console
