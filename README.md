# Coffee@CU

**Meet the Columbia community, one coffee at a time.**

Coffee@CU connects Columbia University students, faculty, and alumni for casual coffee chats. It's a community board — not a dating app. Browse people by interest, major, and availability. Request a chat with a personal message. Build connections across CC, SEAS, GS, Barnard, and Graduate programs.

> Built and maintained by [ADI](https://adicu.com) and [The Lion](https://www.columbiaspectator.com).

---

## Design

**"Limestone & Blue"** — old Columbia meets modern.

The Beaux-Arts grandeur of Low Library, the warm limestone of Butler, the specific Columbia blue — rendered in a clean contemporary UI. Intentionally not startup-y, not AI-generated-looking, not Inter.

The interface features:
- **Hero & Navigation:** Ambient glassmorphism accents layering perfectly over the Columbia Lion mural.
- **Bento Profiles:** A dynamic masonry grid of student cards displaying rich info—majors, clubs, and third-person Q&A prompts.
- **Profile Modal:** A spacious, fully responsive centered modal for deep-diving into profiles before connecting.
- **Typography:** 
  - **Display:** Cormorant Garamond — the serif of university presses and law reviews
  - **Body:** Lora — warm, readable
  - **Labels/Meta:** Courier Prime — typewritten campus memo energy
- **Palette:** Limestone cream (`#F4F0E6`), Columbia blue (`#003F8A`), warm copper (`#7A4A1E`)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, TypeScript) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Google OAuth + email/password) |
| File Storage | Supabase Storage (profile photos) |
| Search | Supabase full-text search (PostgreSQL `tsvector`) |
| Email | Resend |
| Styling | Tailwind CSS v4 + CSS variables |
| Animations | Framer Motion |
| Forms | React Hook Form + Zod |

---

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout — fonts (Cormorant, Lora, Courier Prime), metadata
│   ├── page.tsx                # Home (server) — fetches initial profiles, passes to HomeClient
│   ├── HomeClient.tsx          # Home (client) — search, filter, profile grid, drawer, modals
│   ├── login/
│   │   ├── page.tsx            # Login page layout
│   │   └── LoginForm.tsx       # Google OAuth + email/password form
│   ├── verify/page.tsx         # Email verification prompt
│   ├── profile/
│   │   ├── page.tsx            # Profile editor (server — loads existing data)
│   │   └── ProfileForm.tsx     # Profile form (client — RHF + Zod + photo upload)
│   ├── admin/
│   │   ├── page.tsx            # Admin page (server — role check)
│   │   └── AdminClient.tsx     # Admin UI (profiles list, user lookup, role management)
│   ├── auth/callback/route.ts  # OAuth callback — domain check, session exchange
│   ├── not-found.tsx           # 404
│   └── api/
│       ├── coffee-request/route.ts  # POST: atomic rate-limit + email
│       ├── profile/save/route.ts    # POST: save draft or publish profile
│       └── admin/
│           ├── toggle-visible/      # Mods: hide/restore profiles
│           ├── remove/              # Admins: permanently remove
│           ├── ban/                 # Admins: blacklist user
│           ├── suspend/             # Mods: pause request sending
│           ├── user-lookup/         # Mods: search user activity
│           └── roles/
│               ├── grant/           # Super admin: grant role
│               └── revoke/          # Super admin: revoke role
├── components/
│   ├── Nav.tsx                 # Sticky Columbia-blue header
│   ├── Footer.tsx              # ADI + The Lion credit
│   ├── ProfileCard.tsx         # Bento tile (name, badges, clubs row, Q&A responses)
│   ├── ProfileDrawer.tsx       # Centered modal displaying rich profile details
│   ├── ColumbiaCrown.tsx       # Vector accent graphic
│   └── PromptDropdown.tsx      # Custom select menu for Q&A onboarding
├── lib/
│   ├── supabase/
│   │   ├── client.ts           # Browser Supabase singleton (anon key only)
│   │   └── server.ts           # Server Supabase — session client + service role client
│   ├── auth.ts                 # Role check helpers, requireAuth, logAuditAction
│   ├── email.ts                # Resend helpers (coffee request + welcome email)
│   └── constants.ts            # Majors, schools, years, UNIVERSITY_DOMAINS, DAILY_LIMIT
├── types/index.ts              # TypeScript interfaces (Profile, DraftProfile, Meeting, etc.)
└── middleware.ts               # Edge middleware — auth guards + Columbia domain check
```

---

## Database Schema

```
profiles            — published community profiles (auth required to read — anti-scraping RLS)
draft_profiles      — in-progress profiles (missing photo or not yet submitted)
meetings            — coffee request log (dedup + daily rate-limit)
blacklist           — banned users
user_roles          — moderator / admin / super_admin hierarchy
suspensions         — temporary or indefinite request-send pauses
audit_log           — immutable record of all admin actions
university_domains  — allowed email domains per university (extensible)
```

Full schema with RLS policies: `supabase/migrations/001_initial_schema.sql`

---

## Security Architecture

**Anti-scraping:** Profiles require authentication at two layers:
1. RLS policy (`auth.uid() IS NOT NULL`) — unauthenticated Supabase queries return no rows
2. App-layer gate — unauthenticated visitors see the landing page only, not the profile grid

**Domain restriction:** `@columbia.edu` and `@barnard.edu` only, enforced at:
- Signup (client-side UX feedback)
- OAuth callback (`/auth/callback/route.ts`)
- Edge middleware (`middleware.ts`)
- API route level (secondary check on all sensitive routes)

**Rate limiting:** Coffee requests are rate-limited to `DAILY_REQUEST_LIMIT` (default: 3/day). Implemented as an atomic PostgreSQL function (`attempt_coffee_request`) to prevent race conditions from concurrent requests.

**Role hierarchy:** `moderator → admin → super_admin`. All role checks are server-side via the `user_roles` table. Service role key never exposed to the browser (`server-only` import guard).

**Audit log:** All admin actions (hide, remove, ban, suspend, role changes) are logged to the `audit_log` table with actor, target, and timestamp.

---

## Role Permissions

| Action | Moderator | Admin | Super Admin |
|---|---|---|---|
| Hide/restore profile | ✅ | ✅ | ✅ |
| User lookup + activity | ✅ | ✅ | ✅ |
| Suspend request-sending | ✅ | ✅ | ✅ |
| Permanently remove profile | ❌ | ✅ | ✅ |
| Ban user | ❌ | ✅ | ✅ |
| Grant/revoke roles | ❌ | ❌ | ✅ |

---

## Setup

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Resend](https://resend.com) account

### 1. Clone and install

```bash
git clone https://github.com/wessilfie/coffeecu.git coffeecu-next
cd coffeecu-next
npm install
```

### 2. Environment variables

```bash
cp .env.local.example .env.local
```

Fill in:
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
RESEND_API_KEY=re_your_key
RESEND_FROM_EMAIL=do-not-reply@coffeecu.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
DAILY_REQUEST_LIMIT=3
```

### 3. Database

Run the schema migration in your Supabase SQL editor:

```bash
# Copy contents of supabase/migrations/001_initial_schema.sql
# Paste into Supabase Dashboard → SQL Editor → Run
```

Or with the Supabase CLI:
```bash
supabase db push
```

### 4. Supabase Auth setup

In Supabase Dashboard:
- **Authentication → Providers:** Enable Email and Google
- **Authentication → URL Configuration:**
  - Site URL: `https://your-domain.com`
  - Redirect URLs: `https://your-domain.com/auth/callback`
- **Storage:** Create a bucket named `profile-photos` (private)

### 5. Google OAuth

In [Google Cloud Console](https://console.cloud.google.com):
- Create OAuth credentials
- Add `https://your-project.supabase.co/auth/v1/callback` as an authorized redirect URI
- Optionally restrict to `columbia.edu` hosted domain: add `"hd": "columbia.edu"` parameter

### 6. Run locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Adding Your First Super Admin

After setting up, grant yourself super_admin in Supabase SQL Editor:

```sql
-- First, find your user_id from auth.users
SELECT id, email FROM auth.users WHERE email = 'your-columbia-email@columbia.edu';

-- Then grant super_admin
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-here', 'super_admin');
```

After that, use the `/admin` → Role Management tab to manage other admins and moderators through the UI.

---

## Future Roadmap

- **WhatsApp/SMS notifications** — `phone` field already in schema; notification abstraction in `src/lib/email.ts` ready to extend
- **Multi-university** — `university_domains` table and `university` field on profiles support expansion to other schools without schema changes
- **Profile photo moderation** — flag inappropriate photos via admin panel
- **Event integration** — Columbia-specific coffee hours and community events

---

## Contributing

Built and maintained by ADI Labs and The Lion. Columbia community members with a Columbia email can contribute — open a PR against the `main` branch.
