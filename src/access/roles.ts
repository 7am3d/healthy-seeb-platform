import type { PayloadRequest } from 'payload'

type MaybeUser = { globalRole?: string | null; isActive?: boolean | null } | null | undefined

/** Super-admins and administrators manage the whole portal. */
export const isAdministrator = (user: unknown) =>
  (user as MaybeUser)?.globalRole === 'super-admin' ||
  (user as MaybeUser)?.globalRole === 'administrator'

/** The ID of a relationship value, whether it is populated or not. */
export const getRelationshipID = (value: unknown): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') return value
  if (value && typeof value === 'object' && 'id' in value) {
    return getRelationshipID((value as { id: unknown }).id)
  }
  return undefined
}

/**
 * IDs of the committees where the signed-in user has an active membership.
 * Pass `roles` to only count some roles, e.g. ['chair', 'rapporteur'].
 * Cached on the request so access checks in one request share one query.
 */
export async function activeCommitteeIDs(
  req: PayloadRequest,
  roles?: Array<'chair' | 'rapporteur' | 'member'>,
): Promise<Array<string | number>> {
  if (!req.user) return []

  const cacheKey = `activeCommitteeIDs:${roles?.join(',') ?? 'all'}`
  const cached = req.context[cacheKey] as Array<string | number> | undefined
  if (cached) return cached

  const memberships = await req.payload.find({
    collection: 'committee-memberships',
    where: {
      and: [
        { user: { equals: req.user.id } },
        { isActive: { equals: true } },
        ...(roles ? [{ role: { in: roles } }] : []),
      ],
    },
    depth: 0,
    limit: 100,
    overrideAccess: true,
    req,
  })

  const ids = memberships.docs
    .map((membership) => getRelationshipID(membership.committee))
    .filter((id): id is string | number => id !== undefined)

  req.context[cacheKey] = ids
  return ids
}
