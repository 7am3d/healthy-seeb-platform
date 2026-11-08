import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { EventCards } from '@/components/site/posts/PostViews'
import { SectionHeading } from '@/components/site/SectionHeading'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { digits } from '@/lib/format'
import { isPortalPostType, PORTAL_POST_TYPES } from '@/lib/portal/post-types'
import { getSitePosts } from '@/lib/site/queries'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; page?: string }>
}

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'siteNews' })
  return { title: t('metaTitle') }
}

const PAGE_SIZE = 12

// News & events (the prototype links to it from "View all events" but has no design for it,
// so it reuses the committee page's event cards and filter pills).
export default async function NewsPage({ params, searchParams }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const { type: rawType, page: rawPage } = await searchParams
  const type = isPortalPostType(rawType) ? rawType : undefined
  const page = Math.max(1, Number.parseInt(rawPage ?? '1', 10) || 1)

  const [t, tSite, result] = await Promise.all([
    getTranslations('siteNews'),
    getTranslations('site'),
    getSitePosts({ type: type ?? [...PORTAL_POST_TYPES], limit: PAGE_SIZE, page }),
  ])

  const number = (value: number) => new Intl.NumberFormat(locale, digits(locale)).format(value)
  const filters = ['all', ...PORTAL_POST_TYPES] as const
  const current = type ?? 'all'
  const href = (options: { type?: string; page?: number }) => ({
    pathname: '/news',
    query: {
      ...(options.type && options.type !== 'all' ? { type: options.type } : {}),
      ...(options.page && options.page > 1 ? { page: String(options.page) } : {}),
    },
  })

  return (
    <div className="flex w-full flex-col">
      <Breadcrumbs
        items={[{ label: tSite('breadcrumb.home'), href: '/' }, { label: t('title') }]}
      />
      <section className="w-full bg-mint py-20">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <div className="mb-space-lg">
            <SectionHeading
              title={<span className="inline-block">{t('title')}</span>}
              subtitle={t('subtitle')}
              className=""
            />
          </div>
          <nav
            aria-label={t('filterLabel')}
            className="mb-space-xl flex flex-wrap items-center gap-space-sm"
          >
            {filters.map((filter) => (
              <Link
                key={filter}
                href={href({ type: filter })}
                aria-current={filter === current ? 'page' : undefined}
                className={`rounded-xl px-space-md py-space-xs text-label-md font-bold transition-colors ${
                  filter === current
                    ? 'bg-primary text-white'
                    : 'bg-white text-secondary hover:bg-surface-container-low'
                }`}
              >
                {t(`filters.${filter}`)}
              </Link>
            ))}
          </nav>

          {result.posts.length ? (
            <EventCards posts={result.posts} />
          ) : (
            <p className="text-body-md text-on-surface-variant">{t('empty')}</p>
          )}

          {result.totalPages > 1 ? (
            <nav
              className="mt-space-xl flex items-center justify-center gap-space-md text-label-md"
              aria-label={t('pageOf', { page: number(page), total: number(result.totalPages) })}
            >
              {page > 1 ? (
                <Link
                  href={href({ type: current, page: page - 1 })}
                  className="rounded-sm border border-secondary px-space-md py-space-xs font-bold text-secondary hover:bg-white"
                >
                  {t('previous')}
                </Link>
              ) : null}
              <span className="text-on-surface-variant">
                {t('pageOf', { page: number(page), total: number(result.totalPages) })}
              </span>
              {page < result.totalPages ? (
                <Link
                  href={href({ type: current, page: page + 1 })}
                  className="rounded-sm border border-secondary px-space-md py-space-xs font-bold text-secondary hover:bg-white"
                >
                  {t('next')}
                </Link>
              ) : null}
            </nav>
          ) : null}
        </div>
      </section>
    </div>
  )
}
