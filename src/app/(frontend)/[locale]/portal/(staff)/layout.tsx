import { getTranslations } from 'next-intl/server'
import React, { Suspense } from 'react'

import type { Locale } from '@/i18n/routing'
import { PortalShell } from '@/components/portal/PortalShell'
import { getPayloadClient, requireStaffSession } from '@/lib/portal/session'

type Props = {
  children: React.ReactNode
  params: Promise<{ locale: string }>
}

// Every page in this folder requires a signed-in, active committee member.
export default async function StaffPortalLayout({ children, params }: Props) {
  const { locale } = await params
  const session = await requireStaffSession(locale as Locale)
  const t = await getTranslations('portal')

  const { user, membership } = session

  // Sidebar badge: referred requests the committee has not followed up yet.
  const payload = await getPayloadClient()
  const { totalDocs: newReferrals } = await payload.count({
    collection: 'requests',
    where: {
      and: [
        { committee: { equals: membership.committee.id } },
        { followUpStatus: { equals: 'new' } },
      ],
    },
    user,
    overrideAccess: false,
  })

  return (
    <Suspense>
      <PortalShell
        committeeName={membership.committee.name}
        userName={user.name || user.email}
        roleLabel={t(`roles.${membership.role}`)}
        referralsBadge={newReferrals}
      >
        {children}
      </PortalShell>
    </Suspense>
  )
}
