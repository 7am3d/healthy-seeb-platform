import type { Metadata } from 'next'
import { hasLocale, NextIntlClientProvider } from 'next-intl'
import { getTranslations, setRequestLocale } from 'next-intl/server'
import { notFound } from 'next/navigation'
import React from 'react'

import { localeDirection, routing } from '@/i18n/routing'

// Self-hosted Almarai font (the font in the UI/UX design), served from our own site.
import '@fontsource/almarai/300.css'
import '@fontsource/almarai/400.css'
import '@fontsource/almarai/700.css'
import '@fontsource/almarai/800.css'

import '../styles.css'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }))
}

export async function generateMetadata({ params }: Omit<Props, 'children'>): Promise<Metadata> {
  const { locale } = await params
  if (!hasLocale(routing.locales, locale)) return {}

  const t = await getTranslations({ locale, namespace: 'common' })

  return {
    title: {
      default: t('siteName'),
      template: `%s | ${t('siteName')}`,
    },
    description: t('siteDescription'),
    alternates: {
      languages: Object.fromEntries(routing.locales.map((l) => [l, `/${l}`])),
    },
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params

  if (!hasLocale(routing.locales, locale)) {
    notFound()
  }

  // Lets pages in this layout be pre-rendered for each language.
  setRequestLocale(locale)

  const t = await getTranslations({ locale, namespace: 'common' })

  return (
    <html lang={locale} dir={localeDirection[locale]} data-scroll-behavior="smooth">
      <body>
        <NextIntlClientProvider>
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-surface-container-lowest focus:px-4 focus:py-2 focus:shadow"
          >
            {t('skipToContent')}
          </a>
          {/* Each area adds its own header and <main id="main-content">:
              (site)/layout.tsx for the public website, portal/ for the staff portal. */}
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
