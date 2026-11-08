import { createNavigation } from 'next-intl/navigation'

import { routing } from './routing'

/**
 * Use these instead of the ones from `next/link` and `next/navigation`.
 * They add the current language to every link automatically,
 * e.g. <Link href="/committees"> goes to /ar/committees or /en/committees.
 */
export const { Link, redirect, usePathname, useRouter, getPathname } = createNavigation(routing)
