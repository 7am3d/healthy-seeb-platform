import createMiddleware from 'next-intl/middleware'

import { routing } from './i18n/routing'

// Sends visitors to /ar or /en (based on their browser language, Arabic by default)
// and remembers the language they picked.
export default createMiddleware(routing)

export const config = {
  // Run on public pages only. Skip the Payload admin panel and API,
  // Next.js internals, and files with an extension (images, fonts, etc.).
  matcher: ['/((?!admin|api|my-route|_next|_vercel|.*\\..*).*)'],
}
