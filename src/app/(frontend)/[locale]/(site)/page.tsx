import { getTranslations, setRequestLocale } from 'next-intl/server'

import { LocaleSwitcher } from '@/components/layout/LocaleSwitcher'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

// Temporary home page that proves the language and RTL setup works.
// It will be replaced by the real home screen.
export default async function HomePage({ params }: Props) {
  const { locale } = await params
  // The layout already checked that `locale` is 'ar' or 'en'.
  setRequestLocale(locale as Locale)

  const t = await getTranslations('home')

  return (
    <section className="container-page py-16">
      <h1 className="text-3xl font-bold text-primary sm:text-4xl">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-lg text-on-surface-variant">{t('intro')}</p>
      <LocaleSwitcher className="mt-8 inline-flex items-center rounded-md border border-outline-variant px-4 py-2 font-medium text-primary hover:bg-surface-container-low" />
    </section>
  )
}
