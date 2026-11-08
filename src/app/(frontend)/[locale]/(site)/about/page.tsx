import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { Breadcrumbs } from '@/components/site/Breadcrumbs'
import { EmailButton } from '@/components/site/EmailDialog'
import { HERO_BACKGROUND, WaveDivider } from '@/components/site/WaveDivider'
import { Icon } from '@/components/ui/Icon'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getSiteCommittees } from '@/lib/site/queries'

type Props = { params: Promise<{ locale: string }> }

export const dynamic = 'force-dynamic'

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'siteAbout' })
  return { title: t('metaTitle') }
}

const GOLD_BAR =
  'absolute start-0 end-0 top-0 h-1.5 bg-gradient-to-r from-primary via-[#c5a880] to-secondary'
const ROLE_PILL =
  'mb-5 inline-flex items-center justify-center rounded-xl bg-[#f4ebe1] px-4 py-1.5 text-label-md font-bold tracking-wide text-[#916b38]'

export default async function AboutPage({ params }: Props) {
  const { locale } = await params
  setRequestLocale(locale as Locale)

  const [t, tSite, committees] = await Promise.all([
    getTranslations('siteAbout'),
    getTranslations('site'),
    getSiteCommittees(),
  ])

  const values = t.raw('values') as Array<{ title: string; text: string }>
  const members = t.raw('executive.members') as Array<{ org: string; name: string; role: string }>
  const valueColors = ['#014260', '#116e68', '#014260', '#116e68']

  return (
    <div className="flex w-full flex-col text-on-surface antialiased">
      <Breadcrumbs
        items={[{ label: tSite('breadcrumb.home'), href: '/' }, { label: t('breadcrumb') }]}
        className="w-full bg-surface-container-lowest py-4"
        textClassName="text-label-sm text-outline [&_a]:text-on-surface-variant"
      />

      {/* Hero */}
      <section
        className="relative w-full overflow-hidden text-primary"
        style={{ background: HERO_BACKGROUND }}
      >
        <div className="relative z-10 mx-auto flex max-w-[1440px] flex-col items-center px-margin pt-16 pb-28 text-center lg:pt-20 lg:pb-36">
          <span className="mb-3 inline-block text-label-md font-bold tracking-widest text-primary uppercase">
            {t('slogan')}
          </span>
          <h1 className="mb-4 text-display-lg-mobile font-extrabold tracking-tight text-primary drop-shadow-sm sm:text-display-lg">
            {t('title')}
          </h1>
          <p className="max-w-3xl text-body-lg leading-relaxed text-on-surface-variant opacity-95">
            {t('subtitle')}
          </p>
        </div>
        <WaveDivider />
      </section>

      {/* Introduction, vision, mission and values */}
      <section className="w-full bg-background py-16">
        <div className="mx-auto max-w-[1440px] px-margin">
          <div className="mx-auto mb-12 max-w-4xl text-center">
            <p className="mb-4 text-headline-md leading-relaxed font-bold text-primary">
              {t('introTitle')}
            </p>
            <p className="text-body-lg leading-relaxed text-on-surface-variant">{t('introText')}</p>
          </div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-8 md:grid-cols-2">
            {(['vision', 'mission'] as const).map((key) => {
              return (
                <div
                  key={key}
                  className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div
                    className={`absolute start-0 end-0 top-0 h-1 ${key === 'vision' ? 'bg-primary' : 'bg-secondary'}`}
                  />
                  <div
                    className={`mb-4 inline-block rounded-xl px-3 py-1 text-label-sm font-bold ${
                      key === 'vision'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-secondary/10 text-secondary'
                    }`}
                  >
                    {t(`${key}.badge`)}
                  </div>
                  <h2
                    className={`mb-4 text-headline-lg font-bold ${key === 'vision' ? 'text-primary' : 'text-secondary'}`}
                  >
                    {t(`${key}.title`)}
                  </h2>
                  <p className="text-body-md leading-relaxed text-on-surface-variant">
                    {t(`${key}.text`)}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="mx-auto mt-16 max-w-5xl">
            <div className="mb-8 text-center">
              <h2 className="mb-3 text-headline-xl font-bold text-primary">{t('valuesTitle')}</h2>
              <div className="mx-auto h-1 w-16 rounded-xl bg-primary" />
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {values.map((value, index) => (
                <div
                  key={value.title}
                  className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 text-center shadow-sm transition-all duration-300 hover:shadow-md"
                >
                  <div
                    className="absolute start-0 end-0 top-0 h-1"
                    style={{ background: valueColors[index % 4] }}
                  />
                  <h3
                    className="mb-2 text-headline-md font-bold"
                    style={{ color: valueColors[index % 4] }}
                  >
                    {value.title}
                  </h3>
                  <p className="text-body-md leading-relaxed text-on-surface-variant">
                    {value.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Global affiliation */}
      <section className="w-full bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-[1440px] px-margin">
          <div className="relative mx-auto max-w-4xl overflow-hidden rounded-2xl bg-surface-container-low p-8 text-center shadow-sm md:p-10">
            <div className={GOLD_BAR} />
            <h2 className="mb-3 text-headline-xl-mobile font-bold text-primary sm:text-headline-xl">
              {t('affiliation.title')}
            </h2>
            <div className="mx-auto mb-5 h-1 w-16 rounded-xl bg-primary" />
            <p className="text-body-lg leading-relaxed text-on-surface-variant">
              {t('affiliation.text')}
            </p>
          </div>
        </div>
      </section>

      {/* Executive committee */}
      <section className="w-full bg-surface-container-low py-20">
        <div className="mx-auto max-w-[1440px] px-margin">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-3 text-headline-xl font-bold text-primary">{t('executive.title')}</h2>
            <div className="mx-auto mb-4 h-1 w-16 rounded-xl bg-primary" />
            <p className="text-body-md text-on-surface-variant">{t('executive.subtitle')}</p>
          </div>

          <div className="mx-auto mb-6 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2">
            {(['chair', 'vice'] as const).map((key) => (
              <div
                key={key}
                className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-8 text-center shadow-sm md:p-10"
              >
                <div className={GOLD_BAR} />
                <div className={ROLE_PILL}>{t(`executive.${key}.role`)}</div>
                <h3 className="mb-3 text-headline-lg font-extrabold text-primary">
                  {t(`executive.${key}.name`)}
                </h3>
                <p className="mx-auto max-w-xl text-section-title font-bold text-secondary">
                  {t(`executive.${key}.title`)}
                </p>
              </div>
            ))}
          </div>

          <div className="mx-auto mb-10 max-w-xl">
            <div className="relative overflow-hidden rounded-2xl bg-surface-container-lowest p-6 text-center shadow-sm">
              <div className={GOLD_BAR} />
              <div className={ROLE_PILL}>{t('executive.office.role')}</div>
              <h3 className="mb-3 text-headline-md font-extrabold text-primary">
                {t('executive.office.name')}
              </h3>
              <p className="mx-auto max-w-xl text-body-md font-bold text-secondary">
                {t('executive.office.title')}
              </p>
              <EmailButton
                name={t('executive.office.name')}
                email={t('executive.office.email')}
                className="mt-5 cursor-pointer rounded-sm border border-secondary px-4 py-1.5 text-sm font-bold text-secondary transition-colors hover:bg-mint"
              >
                {t('executive.office.contact')}
              </EmailButton>
            </div>
          </div>

          <div className="mx-auto grid w-full grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {members.map((member) => (
              <div
                key={member.name}
                className="flex flex-col justify-between rounded-sm bg-surface-container-lowest p-6 shadow-sm transition-shadow duration-200 hover:shadow-md"
              >
                <div>
                  <h4 className="mb-1 text-section-title font-bold text-[#0f172a]">{member.org}</h4>
                  <div className="mb-2 text-label-md font-bold text-[#bfa175]">{member.name}</div>
                </div>
                {member.role ? (
                  <p className="mt-2 rounded-xs bg-surface-container-low/40 px-2.5 py-1.5 pt-2 text-body-sm leading-relaxed text-outline">
                    {member.role}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Subcommittees */}
      <section className="w-full bg-surface-container-lowest py-20">
        <div className="mx-auto max-w-[1440px] px-margin">
          <div className="mx-auto mb-14 max-w-3xl text-center">
            <h2 className="mb-3 text-headline-xl font-bold text-primary">
              {t('subcommittees.title')}
            </h2>
            <div className="mx-auto mb-4 h-1 w-16 rounded-xl bg-primary" />
            <p className="text-body-md text-on-surface-variant">{t('subcommittees.subtitle')}</p>
          </div>
          <div className="grid grid-cols-1 items-stretch gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7">
            {committees.map((committee) => (
              <Link
                key={committee.code}
                href={`/committees/${committee.code}`}
                className="group flex flex-col items-center rounded-sm bg-surface-container-low p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:bg-surface-container hover:shadow-md"
              >
                <div className="mb-4 flex h-[52px] w-[52px] items-center justify-center rounded-sm bg-sand transition-transform group-hover:scale-105">
                  <Icon name={committee.icon ?? 'groups'} className="text-[28px] text-white" />
                </div>
                <h3 className="mb-2 text-section-title leading-snug font-bold text-primary transition-colors group-hover:text-secondary">
                  {committee.name}
                </h3>
                <span className="mt-auto pt-2 text-label-sm text-outline transition-colors group-hover:text-primary">
                  {t('subcommittees.viewDetails')}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
