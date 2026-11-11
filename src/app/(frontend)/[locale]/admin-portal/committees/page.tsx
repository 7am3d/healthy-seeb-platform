
import { setRequestLocale } from 'next-intl/server'

import { CommitteesList } from '@/components/admin/CommitteesList'
import { getPayloadClient, requireAdminSession } from '@/lib/portal/session'
import type { Locale } from '@/i18n/routing'

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AdminCommitteesPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale

  setRequestLocale(locale)
  await requireAdminSession(locale)

  const payload = await getPayloadClient()

  const { docs: committees } = await payload.find({
    collection: 'committees',
    limit: 100,
    sort: 'sortOrder',
    depth: 0,
    overrideAccess: true,
  })

  const committeeSummaries = await Promise.all(
    committees.map(async (committee) => {
      const [approved, pending] = await Promise.all([
        payload.find({
          collection: 'posts',
          where: {
            and: [
              { committee: { equals: committee.id } },
              { status: { equals: 'approved' } },
            ],
          },
          limit: 1,
          overrideAccess: true,
        }),
        payload.find({
          collection: 'posts',
          where: {
            and: [
              { committee: { equals: committee.id } },
              { status: { equals: 'submitted' } },
            ],
          },
          limit: 1,
          overrideAccess: true,
        }),
      ])

      return {
        id: committee.id,
        name: committee.name,
        code: committee.code,
        description: committee.description ?? '',
        shortDescription: committee.shortDescription ?? '',
        icon: committee.icon ?? 'groups',
        isActive: committee.isActive ?? false,
        sortOrder: committee.sortOrder ?? 0,
        email: committee.email ?? '',
        chairName: committee.chairName ?? '',
        chairEmail: committee.chairEmail ?? '',
        chairTitle: committee.chairTitle ?? '',
        rapporteurName: committee.rapporteurName ?? '',
        rapporteurTitle: committee.rapporteurTitle ?? '',
        members: (committee.members ?? []).map((member) => ({
          name: member.name,
          title: member.title ?? '',
        })),
        responsibilities: (committee.responsibilities ?? []).map((item) => ({
          text: item.text,
        })),
        suggestionsPrompt: committee.suggestionsPrompt ?? '',
        suggestionsText: committee.suggestionsText ?? '',
        approvedPosts: approved.totalDocs,
        pendingPosts: pending.totalDocs,
      }
    }),
  )

  return <CommitteesList committees={committeeSummaries} locale={locale} />
}
