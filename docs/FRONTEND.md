# Front-end guide

How the public website and the staff/admin portal are organised, so both developers build screens the same way.

**Stack:** Next.js 16 (App Router) · Payload CMS 3 · Tailwind CSS 4 · next-intl 4 (Arabic/English) · TypeScript.

## Getting started

```bash
cp .env.example .env        # then fill in the values
docker compose up -d        # starts PostgreSQL on port 5433
npm install
npm run dev                 # http://localhost:3000 → redirects to /ar
npm run seed:dev            # once: test accounts, 7 committees, posts, map places, requests
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
    styles.css                 Tailwind + design tokens (colours, spacing, type scale)
    [locale]/
      layout.tsx               <html lang dir>, fonts (no header/footer)
      not-found.tsx            Translated 404 page
      (site)/                  Public website: its layout adds the header, footer and dialogs
        page.tsx               Home              →  /ar, /en
        about/page.tsx         About us          →  /ar/about
        committees/[code]/     Committee page    →  /ar/committees/health (one template, 7 committees)
        news/page.tsx          News & events     →  /ar/news?type=activity
        actions.ts             "Contribute" and "Suggestion" forms → saved to `requests`
      portal/
        login/                 Shared login for staff and admins  →  /ar/portal/login
        actions.ts             Login / logout server actions
        (staff)/               Staff portal: layout checks the login and draws the sidebar
          page.tsx             Dashboard            →  /ar/portal
          posts/page.tsx       Posts list           →  /ar/portal/posts?type=report
          posts/new/           Add post             →  /ar/portal/posts/new?type=report
          posts/[id]/edit/     Edit draft/rejected  →  /ar/portal/posts/12/edit
          posts/actions.ts     Upload a file, save a post (draft / submit for approval)
          committee/           Committee page editor (saves a draft)  →  /ar/portal/committee
          referrals/           Requests referred by the admin          →  /ar/portal/referrals
        admin/                 Admin portal (its own layout)  →  /ar/portal/admin
  app/(payload)/               Payload admin + API (do not edit by hand)
  access/roles.ts              Shared access helpers (isAdministrator, committee memberships)
  collections/                 Payload collections (Posts, Committees, Requests, Places, Media, ...)
  components/
    site/                      Public header, footer, dialogs, map, post cards, committee tabs
    portal/                    Portal shell, posts table, post form, committee editor, referrals
    ui/                        Icon (Material Symbols as inline SVG), Dialog (native <dialog>)
  i18n/
    routing.ts                 Languages: ar (default) and en
    messages.ts                Registers every translation file
    navigation.ts              Link / useRouter that keep the language
    request.ts                 Loads the text for each request
  lib/
    format.ts                  digits(): Arabic-Indic digits on Arabic pages
    site/queries.ts            Public queries (anonymous access rules)
    portal/session.ts          Who is signed in, their role and committee
    portal/posts.ts            Post queries for the portal
    portal/rich-text.ts        Post form text (**bold**, - lists) ⇄ Payload rich text
  scripts/seed-dev.ts          Local test data (npm run seed:dev, data in seed-data.json)
  proxy.ts                     Redirects / to /ar or /en
public/brand/                  Logos from the UI/UX prototype
```

Each developer works in their own page folders and their own message files.
Only touch shared files (`layout.tsx`, `styles.css`, `messages.ts`, `collections/`) when you need to, and tell your partner first.

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

| Prototype                                        | Our project                                                            |
| ------------------------------------------------ | ---------------------------------------------------------------------- |
| `font-body-md text-body-md` (two classes)        | `text-body-md`                                                         |
| `rounded-lg` (4px there)                         | `rounded-sm`                                                           |
| `rounded-xl` (8px there)                         | `rounded-lg`                                                           |
| `rounded` (2px there)                            | `rounded-xs`                                                           |
| `rounded-full` (12px there)                      | `rounded-xl`                                                           |
| `rounded-[9999px]`                               | `rounded-full`                                                         |
| `px-space-md`, `gap-space-sm`, `p-space-lg`, ... | same (spacing tokens exist)                                            |
| `bg-[#116e68]` / `bg-[#b79f7d]` / `bg-[#EEF6F2]` | `bg-secondary` / `bg-sand` / `bg-mint`                                 |
| `right-0`, `pr-72`, `text-right`                 | `start-0`, `ps-72`, `text-start`                                       |
| `<span class="material-symbols-outlined">map`    | `<Icon name="map" />` (add new icons to `components/ui/icon-paths.ts`) |

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

## How the website and the portal connect

Everything the public sees comes from Payload, and the portal screens write to the same collections:

| Public website                                  | Comes from                               | Edited in                                                                                               |
| ----------------------------------------------- | ---------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Events, announcements, reports (+ news page)    | `posts` with status `approved`           | Staff: Add post → admin approves (Payload admin for now)                                                |
| Committee page (members, responsibilities, ...) | `committees`, **published** version      | Staff chair/rapporteur: Committee page → saved as draft → admin publishes                               |
| Home map and committee maps                     | `places` (`showOnHomeMap`, `committees`) | Payload admin                                                                                           |
| "Contribute with us" and "Submit a suggestion"  | create `requests` (status `new`)         | Admin refers a request to a committee (`reviewStatus: referred`) → staff follow up in Referred requests |

- **Committees use Payload drafts.** Staff saves only write a draft version; the public page keeps the published one until an administrator presses _Publish changes_ (in `/admin` until the admin portal screen exists). The Committees `beforeChange` hook refuses non-draft saves from staff.
- **Posts:** staff can create posts and edit their own `draft`/`rejected` posts; they can only set the status to `draft` or `submitted`. Approving/rejecting is for administrators.
- **Requests:** only the public form server actions create them (validated, honeypot field, 5 per 10 minutes per IP). Staff see requests referred to their committee only, can change `followUpStatus` and add notes (earlier notes cannot be changed). `referralNote` is the admin's note shown to the committee; `adminNotes` stays private.
- **Media:** signed-in users can upload; only administrators can change or delete files. Staff uploads go through `uploadPostFile` (photos ≤ 5 MB, PDF ≤ 20 MB) one file at a time.

## Before deploying (team lead)

- Create Payload migrations (`npm run payload migrate:create`) – development only uses automatic schema push.
- Uploads are stored on the local disk (`/media`). On Vercel the disk is not kept, so add a storage adapter (e.g. `@payloadcms/storage-vercel-blob` or S3). Vercel also limits a request body to **4.5 MB**, so large PDFs need the adapter's client uploads.
- The forms' rate limit is in memory (per server instance). Use a shared store (e.g. Upstash Redis) if spam becomes a problem.
- The map uses CARTO / Esri tiles (with attribution) and the committee maps embed Google Maps; check their terms for production traffic.

## Git workflow

- Branch from `main` for each screen: `feat/<screen-name>`.
- Keep pull requests small (one screen or feature each) and merge often.
- Before opening a pull request, run `npm run lint` and check the page in Arabic and English.
