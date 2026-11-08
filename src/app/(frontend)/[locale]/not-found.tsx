import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

export default async function NotFound() {
  const t = await getTranslations('common.notFound')

  return (
    <main id="main-content" className="container-page py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">{t('title')}</h1>
      <p className="mt-2 text-on-surface-variant">{t('description')}</p>
      <Link
        href="/"
        className="mt-8 inline-flex rounded-md bg-primary px-5 py-2.5 font-medium text-white hover:bg-primary-hover"
      >
        {t('backHome')}
      </Link>
    </main>
  )
}
