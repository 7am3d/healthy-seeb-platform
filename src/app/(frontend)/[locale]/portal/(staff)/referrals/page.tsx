import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { ReferralsList } from '@/components/portal/ReferralsList'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { toReferral } from '@/lib/portal/referrals'
import { getPayloadClient, requireStaffSession } from '@/lib/portal/session'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalReferrals' })
  return { title: t('metaTitle') }
}

export default async function ReferralsPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  const committee = session.membership.committee

  // With the member's own permissions: only requests the admin referred to their committee.
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'requests',
    where: { committee: { equals: committee.id } },
    sort: '-referredAt',
    limit: 500,
    depth: 0,
    user: session.user,
    overrideAccess: false,
  })

  const t = await getTranslations('portalReferrals')

  return (
    <div className="flex flex-col">
      <nav
        aria-label="Breadcrumb"
        className="mb-4 flex items-center gap-2 text-label-sm text-on-surface-variant"
      >
        <Link href="/portal" className="hover:text-primary">
          {t('crumbPortal')}
        </Link>
        <span aria-hidden="true" className="text-outline">
          /
        </span>
        <span aria-current="page" className="font-bold text-primary">
          {t('title')}
        </span>
      </nav>
      <div className="mb-8">
        <h1 className="text-[28px] leading-tight font-bold tracking-tight text-primary lg:text-headline-xl">
          {t('title')}
        </h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {t('intro', { committee: committee.name })}
        </p>
      </div>
      <ReferralsList referrals={docs.map(toReferral)} committeeName={committee.name} />
    </div>
  )
}
