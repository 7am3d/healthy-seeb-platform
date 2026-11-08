import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { FacilitiesMapSection } from '@/components/site/home/FacilitiesMapSection'
import { HomeEventCards } from '@/components/site/posts/PostViews'
import { SectionHeading } from '@/components/site/SectionHeading'
import { HERO_BACKGROUND, WaveDivider } from '@/components/site/WaveDivider'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getSiteCommittees, getSitePlaces, getSitePosts } from '@/lib/site/queries'

type Props = { params: Promise<{ locale: string }> }

// Committee pages and posts change when staff publish, so render on each request.
export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'site' })
  return { title: { absolute: t('brand') } }
}

export default async function HomePage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [t, committees, { posts: events }, places] = await Promise.all([
    getTranslations('siteHome'),
    getSiteCommittees(),
    getSitePosts({ type: 'activity', limit: 3 }),
    getSitePlaces({ homeMap: true }),
  ])

  return (
    <div id="top">
      {/* Hero */}
      <section
        className="relative w-full overflow-hidden py-24 sm:py-32"
        style={{ background: HERO_BACKGROUND }}
      >
        <WaveDivider />
        <div className="relative z-10 mx-auto flex w-full max-w-[1280px] flex-col items-center px-margin text-center">
          <Image
            src="/brand/logo-stacked.png"
            alt={t('hero.title')}
            width={700}
            height={898}
            priority
            className="pointer-events-none mb-8 h-auto w-44 object-contain select-none md:w-52"
          />
          <span className="mb-space-sm inline-block text-headline-md font-bold tracking-wide text-primary">
            {t('hero.slogan')}
          </span>
          <h1 className="mb-space-md max-w-4xl text-display-lg-mobile font-bold tracking-tight text-primary sm:text-display-lg">
            {t('hero.title')}
          </h1>
          <p className="mx-auto mb-space-xl max-w-2xl text-body-lg leading-relaxed text-on-surface-variant">
            {t('hero.intro')}
          </p>
          <div>
            <a
              href="#committees-section"
              className="inline-flex items-center justify-center rounded-sm bg-sand px-8 py-3 text-base font-bold text-primary shadow-md transition-all duration-200 hover:brightness-105"
            >
              {t('hero.cta')}
            </a>
          </div>
        </div>
      </section>

      {/* Committees strip */}
      <nav aria-label={t('committeesNav')} className="w-full border-b border-primary/10 bg-white">
        <div className="mx-auto w-full max-w-[1280px] overflow-x-auto px-margin py-3">
          <div className="flex items-center justify-start gap-3 text-label-md whitespace-nowrap lg:justify-center">
            {committees.map((committee, index) => (
              <span key={committee.code} className="contents">
                {index > 0 ? (
                  <span aria-hidden="true" className="text-sand select-none">
                    |
                  </span>
                ) : null}
                <Link
                  href={`/committees/${committee.code}`}
                  className="rounded-sm px-2 py-1 text-primary transition-colors hover:bg-mint hover:text-secondary"
                >
                  {committee.name}
                </Link>
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* About */}
      <section id="about-section" className="w-full bg-mint py-20">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <div className="mb-space-xl max-w-3xl text-start">
            <div className="mb-space-md inline-block">
              <h2 className="text-headline-xl font-bold text-primary">{t('about.title')}</h2>
              <div className="mt-2 h-1 w-12 rounded-xl bg-sand" />
            </div>
            <p className="text-body-lg leading-relaxed text-on-surface-variant">
              {t('about.intro')}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-gutter md:grid-cols-2">
            <div className="flex flex-col justify-between rounded-lg border-t-4 border-primary bg-white p-space-lg text-start shadow-sm">
              <div>
                <h3 className="mb-space-sm text-headline-md font-bold text-primary">
                  {t('about.visionTitle')}
                </h3>
                <p className="text-body-md leading-relaxed text-on-surface-variant">
                  {t('about.vision')}
                </p>
              </div>
            </div>
            <div className="flex flex-col justify-between rounded-lg border-t-4 border-secondary bg-white p-space-lg text-start shadow-sm">
              <div>
                <h3 className="mb-space-sm text-headline-md font-bold text-primary">
                  {t('about.missionTitle')}
                </h3>
                <p className="text-body-md leading-relaxed text-on-surface-variant">
                  {t('about.mission')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Committees */}
      <section id="committees-section" className="w-full scroll-mt-20 bg-white py-24">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <SectionHeading title={t('committees.title')} subtitle={t('committees.subtitle')} />
          {/* 4 cards in the first row, 3 centred in the second (desktop) */}
          <div className="flex flex-wrap justify-center gap-6">
            {committees.map((committee) => (
              <div
                key={committee.code}
                className="flex w-full flex-col justify-between rounded-lg border border-t-4 border-gray-100 border-t-secondary bg-white p-space-lg text-start shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-xl sm:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.125rem)]"
              >
                <div>
                  <div className="mb-space-md flex items-center justify-start">
                    <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-sand shadow-sm">
                      <Icon
                        name={committee.icon ?? 'groups'}
                        className="text-[32px] leading-none text-white"
                      />
                    </div>
                  </div>
                  <h3 className="mb-space-xs text-headline-md font-bold text-primary">
                    {committee.name}
                  </h3>
                  <p className="mb-space-lg text-body-sm leading-relaxed text-on-surface-variant">
                    {committee.shortDescription}
                  </p>
                </div>
                <div>
                  <div className="mb-space-md h-px w-full bg-surface-container-highest" />
                  <Link
                    href={`/committees/${committee.code}`}
                    className="inline-block text-label-md font-bold text-secondary transition-colors hover:text-primary"
                  >
                    {t('committees.explore')}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Latest events */}
      <section id="events-section" className="w-full scroll-mt-20 bg-mint py-20">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <div className="mb-space-xl flex flex-col justify-between gap-space-md text-start sm:flex-row sm:items-end">
            <SectionHeading
              title={t('events.title')}
              subtitle={t('events.subtitle')}
              className=""
            />
            <div>
              <Link
                href="/news?type=activity"
                className="text-label-md font-bold text-primary underline underline-offset-8 transition-colors hover:text-secondary"
              >
                {t('events.viewAll')}
              </Link>
            </div>
          </div>
          {events.length ? (
            <HomeEventCards posts={events} />
          ) : (
            <p className="text-body-md text-on-surface-variant">{t('events.empty')}</p>
          )}
        </div>
      </section>

      {/* Map */}
      <FacilitiesMapSection places={places} />
    </div>
  )
}
