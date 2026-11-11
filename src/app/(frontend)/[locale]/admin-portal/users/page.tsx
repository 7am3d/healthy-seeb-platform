
import { setRequestLocale } from 'next-intl/server'

import { UserManagement } from '@/components/admin/UserManagement'
import { getPayloadClient, requireAdminSession } from '@/lib/portal/session'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AdminUsersPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  setRequestLocale(locale)
  await requireAdminSession(locale)

  const payload = await getPayloadClient()

  const [{ docs: users }, { docs: memberships }, { docs: committees }] =
    await Promise.all([
      payload.find({
        collection: 'users',
        where: { globalRole: { equals: 'staff' } },
        limit: 500,
        sort: 'name',
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'committee-memberships',
        limit: 500,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'committees',
        where: { isActive: { equals: true } },
        limit: 100,
        sort: 'sortOrder',
        depth: 0,
        overrideAccess: true,
      }),
    ])

  const userSummaries = users.map((user) => {
    const membership = memberships.find((item) => {
      const userId =
        typeof item.user === 'object' ? item.user.id : item.user

      return userId === user.id && item.isActive
    })

    const committee =
      membership && typeof membership.committee === 'object'
        ? membership.committee
        : null

    return {
      id: user.id,
      name: user.name ?? '',
      email: user.email,
      phone: user.phone ?? '',
      isActive: user.isActive ?? false,
      createdAt: user.createdAt,
      membership: membership
        ? {
            id: membership.id,
            committeeId:
              typeof membership.committee === 'object'
                ? membership.committee.id
                : membership.committee,
            committeeName: committee?.name ?? '',
            role: membership.role,
            startDate: membership.startDate ?? '',
            endDate: membership.endDate ?? '',
          }
        : null,
    }
  })

  const committeeOptions = committees.map((committee) => ({
    id: committee.id,
    name: committee.name,
  }))

  return (
    <UserManagement
      users={userSummaries}
      committees={committeeOptions}
      locale={locale}
    />
  )
}
