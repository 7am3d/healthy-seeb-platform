import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { PostsTable } from '@/components/portal/PostsTable'
import { Link } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { getCommitteePostCounts, getCommitteePosts } from '@/lib/portal/posts'
import { requireStaffSession } from '@/lib/portal/session'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalDashboard' })
  return { title: t('metaTitle') }
}

export default async function StaffDashboardPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  const [counts, latest] = await Promise.all([
    getCommitteePostCounts(session),
    getCommitteePosts(session, { limit: 6 }),
  ])

  const t = await getTranslations('portalDashboard')
  const tPortal = await getTranslations('portal')
  const format = await getFormatter()

  const committee = session.membership.committee.name
  const name = session.user.name || session.user.email

  const cards = [
    { key: 'events', type: 'activity', count: counts.activity, color: 'text-primary' },
    {
      key: 'announcements',
      type: 'announcement',
      count: counts.announcement,
      color: 'text-secondary',
    },
    { key: 'reports', type: 'report', count: counts.report, color: 'text-sand' },
  ] as const

  return (
    <div className="flex flex-col gap-10">
      {/* Welcome */}
      <div className="flex flex-col gap-6 rounded-lg bg-surface-container-lowest p-8 shadow-sm md:flex-row md:items-center md:justify-between">
        <div className="flex flex-col gap-2">
          <span className="inline-block self-start rounded-md bg-surface-container px-3 py-1 text-label-sm text-primary">
            {committee}
          </span>
          <h1 className="text-[28px] leading-tight font-bold tracking-tight text-primary lg:text-headline-xl">
            {t('title')}
          </h1>
          <p className="text-body-md text-on-surface-variant">
            {t('welcome', { name, committee })}
          </p>
        </div>
        <Link
          href="/portal/posts/new"
          className="self-start rounded-sm bg-sand px-6 py-3 text-label-md text-white shadow-sm transition-colors hover:bg-sand-hover md:self-center"
        >
          {tPortal('addNew')}
        </Link>
      </div>

      {/* Counts per type */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {cards.map((card) => (
          <Link
            key={card.key}
            href={`/portal/posts?type=${card.type}`}
            className="flex flex-col gap-4 rounded-lg bg-surface-container-lowest p-8 shadow-sm transition-shadow hover:shadow-md"
          >
            <span className="text-section-title text-primary">{t(`cards.${card.key}.title`)}</span>
            <span className={`text-display-lg ${card.color}`}>
              {format.number(card.count, digits(locale))}
            </span>
            <span className="text-body-sm text-outline">{t(`cards.${card.key}.caption`)}</span>
          </Link>
        ))}
      </div>

      {/* Latest posts */}
      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
        <div className="flex items-end justify-between gap-4 p-8">
          <div>
            <h2 className="text-headline-md text-primary">{t('latest.title')}</h2>
            <p className="text-body-md text-on-surface-variant">
              {t('latest.subtitle', { committee })}
            </p>
          </div>
          <Link
            href="/portal/posts"
            className="text-label-md whitespace-nowrap text-secondary hover:text-primary"
          >
            {t('latest.viewAll')}
          </Link>
        </div>
        <PostsTable posts={latest} />
      </div>
    </div>
  )
}
