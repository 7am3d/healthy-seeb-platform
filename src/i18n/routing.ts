import { defineRouting } from 'next-intl/routing'

export const routing = defineRouting({
  // Arabic is the main language of the site. English is the second language.
  locales: ['ar', 'en'],
  defaultLocale: 'ar',
  // Every public URL starts with the language: /ar/... or /en/...
  localePrefix: 'always',
})

export type Locale = (typeof routing.locales)[number]

/** Text direction for each language. Arabic is right-to-left. */
export const localeDirection: Record<Locale, 'rtl' | 'ltr'> = {
  ar: 'rtl',
  en: 'ltr',
}
