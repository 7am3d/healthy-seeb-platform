import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getLocale, getTranslations, setRequestLocale } from 'next-intl/server'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { CommitteeMaps } from '@/components/site/committee/CommitteeMaps'
import { CommitteeTabs } from '@/components/site/committee/CommitteeTabs'
import { SuggestionButton } from '@/components/site/committee/SuggestionButton'
import { EmailButton } from '@/components/site/EmailDialog'
import { AnnouncementList, EventCards, ReportList } from '@/components/site/posts/PostViews'
import { Icon } from '@/components/ui/Icon'
import type { Locale } from '@/i18n/routing'
import { digits } from '@/lib/format'
import { getSiteCommittee, getSitePlaces, getSitePosts } from '@/lib/site/queries'

type Props = { params: Promise<{ locale: string; code: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { code } = await params
  const committee = await getSiteCommittee(code)
  if (!committee) return {}
  return { title: committee.name, description: committee.description ?? undefined }
}

const SectionTitle = ({ title, subtitle }: { title: string; subtitle: string }) => (
  <div>
    <h3 className="text-headline-lg font-bold text-primary">{title}</h3>
    <p className="text-body-md text-on-surface-variant">{subtitle}</p>
  </div>
)

const Empty = ({ text }: { text: string }) => (
  <p className="text-body-md text-on-surface-variant">{text}</p>
)

export default async function CommitteePage({ params }: Props) {
  const { locale, code } = await params
  setRequestLocale(locale as Locale)

  const committee = await getSiteCommittee(code)
  if (!committee) notFound()

  const [t, tSite, events, announcements, reports, places] = await Promise.all([
    getTranslations('siteCommittee'),
    getTranslations('site'),
    getSitePosts({ committee: committee.id, type: 'activity', limit: 30 }),
    getSitePosts({ committee: committee.id, type: 'announcement', limit: 30 }),
    getSitePosts({ committee: committee.id, type: 'report', limit: 30 }),
    getSitePlaces({ committee: committee.id }),
  ])
  const currentLocale = await getLocale()
  const name = committee.name
  const eventCount = events.totalDocs
  const countText = new Intl.NumberFormat(currentLocale, digits(currentLocale)).format(eventCount)

  const tabs = [
    {
      key: 'events',
      label: t('tabs.events'),
      content: (
        <div className="flex flex-col gap-space-lg">
          <div className="mb-space-xs flex items-center justify-between">
            <SectionTitle
              title={t('events.title', { committee: name })}
              subtitle={t('events.subtitle')}
            />
            {eventCount ? (
              <span className="rounded-xl bg-mint px-space-md py-space-xs text-label-sm font-bold text-secondary">
                {t('events.count', { count: eventCount, countText })}
              </span>
            ) : null}
          </div>
          {events.posts.length ? (
            <EventCards posts={events.posts} />
          ) : (
            <Empty text={t('events.empty')} />
          )}
        </div>
      ),
    },
    {
      key: 'responsibilities',
      label: t('tabs.responsibilities'),
      content: (
        <div className="flex flex-col gap-space-lg">
          <div className="mb-space-xs">
            <SectionTitle
              title={t('responsibilities.title', { committee: name })}
              subtitle={t('responsibilities.subtitle')}
            />
          </div>
          {committee.responsibilities?.length ? (
            <div className="grid grid-cols-1 gap-space-md md:grid-cols-2">
              {committee.responsibilities.map((item, index) => (
                <article
                  key={item.id ?? index}
                  className="flex items-start gap-space-md rounded-sm border-s-4 border-secondary bg-surface-container-lowest p-space-lg shadow-sm"
                >
                  <span
                    className="text-display-lg leading-none font-bold text-sand select-none"
                    aria-hidden="true"
                  >
                    {new Intl.NumberFormat(currentLocale, {
                      ...digits(currentLocale),
                      minimumIntegerDigits: 2,
                    }).format(index + 1)}
                  </span>
                  <p className="text-body-lg leading-relaxed font-bold text-on-surface">
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <Empty text={t('responsibilities.empty')} />
          )}
        </div>
      ),
    },
    {
      key: 'announcements',
      label: t('tabs.announcements'),
      content: (
        <div className="flex flex-col gap-space-md">
          <div className="mb-space-xs">
            <SectionTitle title={t('announcements.title')} subtitle={t('announcements.subtitle')} />
          </div>
          {announcements.posts.length ? (
            <AnnouncementList posts={announcements.posts} />
          ) : (
            <Empty text={t('announcements.empty')} />
          )}
        </div>
      ),
    },
    {
      key: 'reports',
      label: t('tabs.reports'),
      content: (
        <div className="flex flex-col gap-space-md">
          <div className="mb-space-xs">
            <SectionTitle title={t('reports.title')} subtitle={t('reports.subtitle')} />
          </div>
          {reports.posts.length ? (
            <ReportList
              posts={reports.posts}
              labels={{
                published: t.raw('reports.published') as string,
                size: t.raw('reports.size') as string,
                format: t('reports.format'),
                viewDownload: t('reports.viewDownload'),
              }}
            />
          ) : (
            <Empty text={t('reports.empty')} />
          )}
        </div>
      ),
    },
    {
      key: 'maps',
      label: t('tabs.maps'),
      content: (
        <div className="flex flex-col gap-space-md">
          <div className="mb-space-xs">
            <SectionTitle
              title={t('maps.title', { committee: name })}
              subtitle={t('maps.subtitle')}
            />
          </div>
          <CommitteeMaps
            places={places}
            locale={currentLocale}
            frameTitle={t('maps.frameTitle', { committee: name })}
            emptyText={t('maps.empty')}
          />
        </div>
      ),
    },
  ]

  return (
    <div className="flex w-full flex-col">
      <Breadcrumbs
        items={[
          { label: tSite('breadcrumb.home'), href: '/' },
          { label: tSite('breadcrumb.committees'), href: '/#committees-section' },
          { label: name },
        ]}
      />

      {/* Banner */}
      <section className="relative w-full overflow-hidden from-primary-container via-primary to-secondary py-space-xl text-on-primary ltr:bg-gradient-to-r rtl:bg-gradient-to-l">
        <div className="pointer-events-none absolute inset-0 opacity-10" aria-hidden="true">
          <svg
            className="h-full w-full object-cover"
            fill="none"
            preserveAspectRatio="none"
            viewBox="0 0 1440 320"
          >
            <path
              d="M0,160 C320,300 420,40 720,160 C1020,280 1180,60 1440,160 L1440,320 L0,320 Z"
              fill="#ffffff"
            />
            <path
              d="M0,220 C280,100 500,260 840,180 C1120,100 1320,240 1440,200 L1440,320 L0,320 Z"
              fill="#b79f7d"
            />
          </svg>
        </div>
        <div className="relative mx-auto w-full max-w-[1280px] px-margin">
          <div className="flex items-center gap-space-md">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center rounded-lg bg-sand shadow-md">
              <Icon
                name={committee.icon ?? 'groups'}
                className="text-[38px] leading-none text-white"
              />
            </div>
            <div className="flex flex-col">
              <h1 className="mb-space-xs text-display-lg-mobile font-bold tracking-tight text-white sm:text-display-lg">
                {name}
              </h1>
              {committee.description ? (
                <p className="max-w-2xl text-body-lg leading-relaxed text-inverse-on-surface/90">
                  {committee.description}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </section>

      {/* Members */}
      <section className="w-full bg-mint py-space-xl">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <div className="mb-space-lg">
            <h2 className="inline-block text-headline-xl font-bold text-primary">
              {t('membersTitle')}
            </h2>
            <div className="mt-space-xs h-1 w-16 rounded-xl bg-sand" />
          </div>
          {committee.chairName || committee.rapporteurName ? (
            <div className="mb-space-md grid grid-cols-1 gap-space-md lg:grid-cols-2">
              {committee.chairName ? (
                <article className="relative h-full overflow-hidden rounded-2xl border border-primary/5 bg-white p-6 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-secondary" />
                  <div className="mb-3 flex items-center justify-between gap-space-sm">
                    <span className="inline-block rounded-full bg-secondary/10 px-2.5 py-0.5 text-xs font-bold text-secondary">
                      {t('chairRole')}
                    </span>
                    {committee.chairEmail ? (
                      <EmailButton
                        name={tSite('emailModal.chairOf', { committee: name })}
                        email={committee.chairEmail}
                        className="cursor-pointer rounded-sm border border-secondary px-4 py-1.5 text-sm font-bold text-secondary transition-colors hover:bg-mint"
                      >
                        {t('contactChair')}
                      </EmailButton>
                    ) : null}
                  </div>
                  <h3 className="text-[20px] leading-8 font-bold text-primary">
                    {committee.chairName}
                  </h3>
                  {committee.chairTitle ? (
                    <p className="mt-1 text-[15px] text-on-surface-variant">
                      {committee.chairTitle}
                    </p>
                  ) : null}
                </article>
              ) : null}
              {committee.rapporteurName ? (
                <article className="relative h-full overflow-hidden rounded-2xl border border-primary/5 bg-white p-6 shadow-sm">
                  <span className="absolute inset-x-0 top-0 h-1 bg-sand" />
                  <div className="mb-3">
                    <span className="inline-block rounded-full bg-sand/15 px-2.5 py-0.5 text-xs font-bold text-warning">
                      {t('rapporteurRole')}
                    </span>
                  </div>
                  <h3 className="text-[20px] leading-8 font-bold text-primary">
                    {committee.rapporteurName}
                  </h3>
                  {committee.rapporteurTitle ? (
                    <p className="mt-1 text-[15px] text-on-surface-variant">
                      {committee.rapporteurTitle}
                    </p>
                  ) : null}
                </article>
              ) : null}
            </div>
          ) : null}
          {committee.members?.length ? (
            <div className="flex flex-wrap justify-center gap-space-md">
              {committee.members.map((member, index) => (
                <article
                  key={member.id ?? index}
                  className="w-full rounded-lg border border-t-2 border-primary/5 border-t-outline-variant/60 bg-white p-5 shadow-sm transition-colors hover:border-t-secondary sm:w-[calc(50%-0.5rem)] lg:w-[calc(33.333%-0.67rem)]"
                >
                  <span className="mb-1 block text-xs font-bold text-outline">
                    {t('memberRole')}
                  </span>
                  <h4 className="text-[16px] leading-7 font-bold text-primary">{member.name}</h4>
                  {member.title ? (
                    <p className="mt-0.5 text-[13px] text-on-surface-variant">{member.title}</p>
                  ) : null}
                </article>
              ))}
            </div>
          ) : null}
        </div>
      </section>

      {/* Tabs */}
      <section className="w-full bg-surface py-space-xl">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <CommitteeTabs tabs={tabs} label={t('tabsLabel')} />
        </div>
      </section>

      {/* Suggestions */}
      <section className="w-full border-t border-outline-variant/30 bg-surface-container-low py-space-xl">
        <div className="mx-auto w-full max-w-[1280px] px-margin">
          <div className="flex flex-col items-start justify-between gap-space-lg rounded-sm bg-primary p-space-xl text-on-primary shadow-sm lg:flex-row lg:items-center">
            <div className="max-w-2xl">
              <h3 className="mb-space-xs text-headline-lg font-bold text-white">
                {committee.suggestionsPrompt || t('cta.defaultPrompt')}
              </h3>
              <p className="text-body-md leading-relaxed text-inverse-on-surface/90">
                {committee.suggestionsText || t('cta.defaultText', { committee: name })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-space-md">
              <SuggestionButton
                committeeCode={committee.code}
                committeeName={name}
                className="cursor-pointer rounded-sm bg-sand px-space-lg py-space-sm text-label-md font-bold text-primary transition-all hover:brightness-105"
              >
                {t('cta.suggest')}
              </SuggestionButton>
              {committee.email ? (
                <EmailButton
                  name={name}
                  email={committee.email}
                  className="cursor-pointer rounded-sm border border-white bg-transparent px-space-lg py-space-sm text-label-md font-bold text-white transition-all hover:bg-white/10"
                >
                  {t('cta.contact')}
                </EmailButton>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
