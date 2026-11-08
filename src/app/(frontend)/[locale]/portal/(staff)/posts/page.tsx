import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { PostsTable } from '@/components/portal/PostsTable'
import { Link } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import type { Locale } from '@/i18n/routing'
import { isPortalPostType, PORTAL_POST_TYPES } from '@/lib/portal/post-types'
import { getCommitteePostCounts, getCommitteePosts } from '@/lib/portal/posts'
import { requireStaffSession } from '@/lib/portal/session'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string; q?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalPosts' })
  return { title: t('metaTitle') }
}

export default async function StaffPostsPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  const { type: rawType, q } = await searchParams
  const type = isPortalPostType(rawType) ? rawType : undefined
  const search = q?.trim().slice(0, 100) || undefined

  const [counts, posts] = await Promise.all([
    getCommitteePostCounts(session, search),
    getCommitteePosts(session, { type, search }),
  ])

  const t = await getTranslations('portalPosts')
  const tPortal = await getTranslations('portal')
  const format = await getFormatter()

  const tabs = ['all', ...PORTAL_POST_TYPES] as const
  const current = type ?? 'all'
  const tabHref = (tab: (typeof tabs)[number]) => ({
    pathname: '/portal/posts',
    query: {
      ...(tab === 'all' ? {} : { type: tab }),
      ...(search ? { q: search } : {}),
    },
  })

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <nav
            aria-label="Breadcrumb"
            className="mb-2 flex items-center gap-2 text-label-sm text-on-surface-variant"
          >
            <Link href="/portal" className="hover:text-primary">
              {tPortal('breadcrumbHome')}
            </Link>
            <span aria-hidden="true" className="text-outline-variant">
              /
            </span>
            <span aria-current="page" className="font-bold text-primary">
              {t(`tabs.${current}`)}
            </span>
          </nav>
          <h1 className="text-headline-lg text-primary">{t(`titles.${current}`)}</h1>
        </div>
        <Link
          href={type ? { pathname: '/portal/posts/new', query: { type } } : '/portal/posts/new'}
          className="self-start rounded-sm bg-sand px-6 py-3 text-label-md text-white shadow-sm transition-colors hover:bg-sand-hover"
        >
          {tPortal('addPost')}
        </Link>
      </div>

      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-4 border-b border-surface-variant p-6 md:flex-row md:items-center md:justify-between">
          <nav aria-label={t('filterLabel')} className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <Link
                key={tab}
                href={tabHref(tab)}
                aria-current={tab === current ? 'page' : undefined}
                className={`rounded-sm px-4 py-2 text-label-md ${
                  tab === current
                    ? 'bg-primary text-white'
                    : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container'
                }`}
              >
                {t(`tabs.${tab}`)}{' '}
                <span className="opacity-70">({format.number(counts[tab], digits(locale))})</span>
              </Link>
            ))}
          </nav>
          <form role="search" className="w-full md:w-72">
            {type ? <input type="hidden" name="type" value={type} /> : null}
            <label htmlFor="posts-search" className="sr-only">
              {t('searchLabel')}
            </label>
            <input
              id="posts-search"
              name="q"
              type="search"
              defaultValue={search}
              placeholder={t('search')}
              className="h-11 w-full rounded-sm border border-outline-variant px-4 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none"
            />
          </form>
        </div>
        <PostsTable posts={posts} emptyText={search ? t('noResults') : undefined} />
      </div>
    </div>
  )
}
