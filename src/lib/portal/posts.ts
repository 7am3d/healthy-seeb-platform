import type { Where } from 'payload'

import type { PortalPost, PortalPostType } from './post-types'
import { PORTAL_POST_TYPES } from './post-types'
import { getPayloadClient, type StaffSession } from './session'

const postSelect = {
  title: true,
  summary: true,
  type: true,
  status: true,
  rejectionReason: true,
  createdAt: true,
  updatedAt: true,
} as const

function committeeWhere(
  session: StaffSession,
  filters: { type?: PortalPostType; search?: string },
): Where {
  const and: Where[] = [{ committee: { equals: session.membership.committee.id } }]
  if (filters.type) and.push({ type: { equals: filters.type } })
  if (filters.search) and.push({ title: { like: filters.search } })
  return { and }
}

// All queries run with the user's own permissions (overrideAccess: false),
// so the Posts access rules decide what each staff member can see.
const asUser = (session: StaffSession) => ({ user: session.user, overrideAccess: false }) as const

export async function getCommitteePosts(
  session: StaffSession,
  filters: { type?: PortalPostType; search?: string; limit?: number } = {},
): Promise<PortalPost[]> {
  const payload = await getPayloadClient()
  const { docs } = await payload.find({
    collection: 'posts',
    where: committeeWhere(session, filters),
    select: postSelect,
    sort: '-createdAt',
    limit: filters.limit ?? 100,
    depth: 0,
    ...asUser(session),
  })
  return docs as PortalPost[]
}

/** Number of posts per type, plus the total, for the dashboard cards and the tabs. */
export async function getCommitteePostCounts(
  session: StaffSession,
  search?: string,
): Promise<Record<PortalPostType | 'all', number>> {
  const payload = await getPayloadClient()
  const count = async (type?: PortalPostType) =>
    (
      await payload.count({
        collection: 'posts',
        where: committeeWhere(session, { type, search }),
        ...asUser(session),
      })
    ).totalDocs

  const [all, activity, announcement, report] = await Promise.all([
    count(),
    ...PORTAL_POST_TYPES.map((type) => count(type)),
  ])

  return { all, activity, announcement, report }
}
