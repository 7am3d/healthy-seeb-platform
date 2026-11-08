'use client'

import { useLocale, useTranslations } from 'next-intl'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type Props = {
  className?: string
}

/** Switches between Arabic and English while staying on the same page. */
export function LocaleSwitcher({ className }: Props) {
  const t = useTranslations('common.languageSwitcher')
  const locale = useLocale()
  const pathname = usePathname()
  const otherLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale

  return (
    <Link
      href={pathname}
      locale={otherLocale}
      lang={otherLocale}
      hrefLang={otherLocale}
      aria-label={t('label')}
      className={className}
    >
      {t('switchTo')}
    </Link>
  )
}
