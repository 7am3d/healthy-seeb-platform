# Front-end guide

How the public website and the staff/admin portal are organised, so both developers build screens the same way.

**Stack:** Next.js 16 (App Router) · Payload CMS 3 · Tailwind CSS 4 · next-intl 4 (Arabic/English) · TypeScript.

## Getting started

```bash
cp .env.example .env        # then fill in the values
docker compose up -d        # starts PostgreSQL on port 5433
npm install
npm run dev                 # http://localhost:3000 → redirects to /ar
npm run seed:dev            # once: test accounts, 7 committees, sample posts
```

- Public website: `http://localhost:3000/ar` and `http://localhost:3000/en`
- Staff/admin portal: `http://localhost:3000/ar/portal/login`
- Payload admin panel (developers and super-admins): `http://localhost:3000/admin`

Test accounts from `npm run seed:dev` (local only, same as the UI/UX prototype):

| Role  | Email                  | Password     | Lands on                              |
| ----- | ---------------------- | ------------ | ------------------------------------- |
| Staff | `test@seebhealthy.om`  | `Seeb@2026`  | `/ar/portal` (Health Committee chair) |
| Admin | `admin@seebhealthy.om` | `Admin@2026` | `/ar/portal/admin`                    |

In development (`npm run dev`), Payload creates the database tables automatically.
A production build (`npm run build && npm start`) does not, so the project needs Payload migrations before it is deployed.

## Where things go

```txt
messages/
  ar/<namespace>.json          Arabic text, one file per page or feature
  en/<namespace>.json          English text, same keys as Arabic
src/
  app/(frontend)/
    styles.css                 Tailwind + design tokens (colours, fonts)
    [locale]/
      layout.tsx               <html lang dir>, fonts (no header/footer)
      not-found.tsx            Translated 404 page
      (site)/                  Public website: its layout adds the public header/footer
        page.tsx               Home page  →  /ar, /en
        committees/page.tsx    Example    →  /ar/committees
      portal/
        login/                 Shared login for staff and admins  →  /ar/portal/login
        actions.ts             Login / logout server actions
        (staff)/               Staff portal: layout checks the login and draws the sidebar
          page.tsx             Staff dashboard  →  /ar/portal
          posts/page.tsx       Posts list       →  /ar/portal/posts?type=report
        admin/                 Admin portal (its own layout)  →  /ar/portal/admin
  app/(payload)/               Payload admin + API (do not edit by hand)
  components/
    layout/                    Header, footer, language switcher (shared)
    portal/                    Portal shell (sidebar + header), posts table, status chips
    <page-name>/               Components used by one page only
    ui/                        Small reusable pieces (buttons, cards)
  i18n/
    routing.ts                 Languages: ar (default) and en
    messages.ts                Registers every translation file
    navigation.ts              Link / useRouter that keep the language
    request.ts                 Loads the text for each request
  lib/
    format.ts                  digits(): Arabic-Indic digits on Arabic pages
    portal/session.ts          Who is signed in, their role and committee
    portal/posts.ts            Post queries for the portal
  scripts/seed-dev.ts          Local test data (npm run seed:dev)
  proxy.ts                     Redirects / to /ar or /en
public/brand/                  Logos from the UI/UX prototype
```

Each developer works in their own page folders and their own message files.
Only touch shared files (`layout.tsx`, `components/layout/`, `styles.css`, `messages.ts`) when you need to, and tell your partner first.

## Rule 1: no hard-coded text

All visible text comes from the message files, in both languages.

1. Create `messages/en/<page>.json` and `messages/ar/<page>.json` with the same keys.
2. Register them in `src/i18n/messages.ts` (keep the lists alphabetical to avoid merge conflicts).
3. Use them:

```tsx
// Server component (default): async page or component
import { getTranslations } from 'next-intl/server'
const t = await getTranslations('contact')
<h1>{t('title')}</h1>

// Client component ('use client')
import { useTranslations } from 'next-intl'
const t = useTranslations('contact')
```

If the Arabic file is missing a key that the English file has, TypeScript reports an error.
Content that staff edit (news, committee posts) comes from Payload, not from these files.

## Rule 2: links keep the language

```tsx
import { Link } from '@/i18n/navigation' // ✅ adds /ar or /en for you
import Link from 'next/link' // ❌ do not use for internal pages

;<Link href="/committees">…</Link> // → /ar/committees or /en/committees
```

The same file exports `useRouter`, `usePathname` and `redirect`. Use these instead of the ones from `next/navigation`.

## Rule 3: write layouts that work in both directions

Arabic pages are right-to-left. Use **start/end** classes instead of **left/right**, and the layout mirrors itself automatically.

| Instead of                      | Use                             |
| ------------------------------- | ------------------------------- |
| `ml-4` / `mr-4`                 | `ms-4` / `me-4`                 |
| `pl-4` / `pr-4`                 | `ps-4` / `pe-4`                 |
| `left-0` / `right-0`            | `start-0` / `end-0`             |
| `text-left` / `text-right`      | `text-start` / `text-end`       |
| `border-l` / `border-r`         | `border-s` / `border-e`         |
| `rounded-l-lg` / `rounded-r-lg` | `rounded-s-lg` / `rounded-e-lg` |

- Flex and grid follow the direction automatically. Do not add `flex-row-reverse` for Arabic.
- Icons that point a direction (arrows, chevrons) need flipping: `className="rtl:-scale-x-100"`.
- Use `rtl:` / `ltr:` only for real exceptions.
- Check every screen in **both** `/ar` and `/en`, at phone width too.

## Design tokens

Colours, the Almarai font and the type scale come from the UI/UX prototype and are defined once in `src/app/(frontend)/styles.css` under `@theme`.
Use the token classes instead of raw hex values, so a palette change happens in one place:

- Colours: `bg-primary` (blue), `text-secondary` (green), `bg-sand`, `bg-mint`, `bg-surface-container-low`, `text-on-surface-variant`, `border-outline-variant`, `text-error`, ...
- Text styles: `text-display-lg`, `text-headline-xl`, `text-headline-lg`, `text-headline-md`, `text-section-title`, `text-body-md`, `text-body-sm`, `text-label-md`, `text-label-sm` (size, line height and weight in one class).

### Porting classes from the prototype

The prototype (`alyaqeenkhalid.github.io/seebwebsiteinternal`) uses the same colour names, so most classes copy across. A few need translating:

| Prototype                                        | Our project                            |
| ------------------------------------------------ | -------------------------------------- |
| `font-body-md text-body-md` (two classes)        | `text-body-md`                         |
| `rounded-lg` (4px there)                         | `rounded-sm`                           |
| `rounded-xl` (8px there)                         | `rounded-lg`                           |
| `rounded` (2px there)                            | `rounded-xs`                           |
| `rounded-[9999px]`                               | `rounded-full`                         |
| `px-space-md` / `px-space-lg` / `px-space-xl`    | `px-4` / `px-6` / `px-10`              |
| `gap-space-xs` / `gap-space-sm`                  | `gap-1` / `gap-2`                      |
| `bg-[#116e68]` / `bg-[#b79f7d]` / `bg-[#EEF6F2]` | `bg-secondary` / `bg-sand` / `bg-mint` |
| `right-0`, `pr-72`, `text-right`                 | `start-0`, `ps-72`, `text-start`       |

### Numbers and dates in Arabic

The design shows Arabic-Indic digits (٢٠٢٦), but browsers now default to 2026 for Arabic. Pass `digits(locale)` from `@/lib/format` when formatting:

```tsx
format.number(count, digits(locale))
format.dateTime(date, { ...digits(locale), day: '2-digit', month: 'long', year: 'numeric' })
```

Page width: wrap page sections in `container-page` (centred, max 1280px, responsive side padding).

## Reading content from Payload

Pages are server components, so they can query Payload directly:

```tsx
import { getPayload } from 'payload'
import config from '@payload-config'

const payload = await getPayload({ config })
const { docs } = await payload.find({
  collection: 'posts',
  where: { status: { equals: 'approved' } },
  overrideAccess: false, // important: apply the public access rules
  sort: '-createdAt',
  limit: 6,
})
```

The Local API **skips access control by default**. On public pages, always pass `overrideAccess: false` (or filter by `status: approved`) so drafts and rejected posts never appear.

## Portal sign-in and permissions

- Login uses Payload accounts (`users` collection). `portal/actions.ts` signs in and sends staff to `/portal` and administrators to `/portal/admin`.
- In a staff page or layout, call `requireStaffSession(locale)` from `@/lib/portal/session`. It redirects to the login page if needed and returns the user and their committee.
- The admin portal should have its own check (e.g. a `requireAdminSession` next to it) that only lets `globalRole` administrator/super-admin in.
- Query data **as the signed-in user** (`user: session.user, overrideAccess: false`) so the collection access rules apply. See `src/lib/portal/posts.ts`.

## Git workflow

- Branch from `main` for each screen: `feat/<screen-name>`.
- Keep pull requests small (one screen or feature each) and merge often.
- Before opening a pull request, run `npm run lint` and check the page in Arabic and English.
