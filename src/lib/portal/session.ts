import config from '@payload-config'
import { headers as getHeaders } from 'next/headers'
import { getPayload } from 'payload'
import { cache } from 'react'

import { redirect as localeRedirect } from '@/i18n/navigation'
import { redirect as nextRedirect } from 'next/navigation'
import type { Locale } from '@/i18n/routing'
import type { Committee, CommitteeMembership, User } from '@/payload-types'

import { PORTAL_ADMIN_HOME, PORTAL_LOGIN, PORTAL_STAFF_HOME } from './routes'

export type ActiveMembership = Omit<CommitteeMembership, 'committee'> & { committee: Committee }

export type PortalSession = {
  user: User
  isAdmin: boolean
  /** The staff member's active committee membership (their first one if they have several). */
  membership: ActiveMembership | null
}

export const getPayloadClient = cache(() => getPayload({ config }))

export const isAdministrator = (user: Pick<User, 'globalRole'> | null | undefined) =>
  user?.globalRole === 'super-admin'

/** Builds the portal session for a user: their role and active committee membership. */
export async function buildPortalSession(user: User): Promise<PortalSession> {
  const payload = await getPayloadClient()

  // Staff cannot read the memberships collection themselves (admin only),
  // so this trusted server-side query looks up only this user's own memberships.
  const { docs } = await payload.find({
    collection: 'committee-memberships',
    where: {
      and: [{ user: { equals: user.id } }, { isActive: { equals: true } }],
    },
    depth: 1,
    limit: 10,
    sort: 'createdAt',
    overrideAccess: true,
  })

  const membership =
    (docs.find((doc) => typeof doc.committee === 'object' && doc.committee?.isActive) as
      ActiveMembership | undefined) ?? null

  return { user, isAdmin: isAdministrator(user), membership }
}

/** Reads the logged-in user from the Payload auth cookie. Cached for one request. */
export const getPortalSession = cache(async (): Promise<PortalSession | null> => {
  const payload = await getPayloadClient()
  const { user } = await payload.auth({ headers: await getHeaders() })

  if (!user || user.collection !== 'users') return null

  return buildPortalSession(user)
})

/** Where a user should land after signing in, or null if they cannot use the portal. */
export function portalHomeFor(session: PortalSession): string | null {
  if (!session.user.isActive) return null
  if (session.isAdmin) return PORTAL_ADMIN_HOME
  if (session.membership) return PORTAL_STAFF_HOME
  return null
}

export type StaffSession = PortalSession & { membership: ActiveMembership }

/**
 * Use at the top of every staff portal page/layout.
 * Sends visitors who are not signed in (or not active committee members) to the login page.
 */
export async function requireStaffSession(locale: Locale): Promise<StaffSession> {
  const session = await getPortalSession()

  if (!session) {
    return localeRedirect({ href: PORTAL_LOGIN, locale })
  }

  if (!session.user.isActive) {
    return localeRedirect({
      href: { pathname: PORTAL_LOGIN, query: { error: 'inactive' } },
      locale,
    })
  }

  if (!session.membership) {
    if (session.isAdmin) return nextRedirect(PORTAL_ADMIN_HOME)

    return localeRedirect({
      href: { pathname: PORTAL_LOGIN, query: { error: 'noCommittee' } },
      locale,
    })
  }

  return session as StaffSession
}

/** For server actions: the signed-in, active committee member, or null (never redirects). */
export async function getStaffSession(): Promise<StaffSession | null> {
  const session = await getPortalSession()
  if (!session?.user.isActive || !session.membership) return null
  return session as StaffSession
}

/** The assigned staff member can edit their committee's public page. */
export const canEditCommitteePage = (_session: StaffSession) => true


/** Restricts the custom admin portal to the single super-admin account. */
export async function requireAdminSession(locale: Locale): Promise<PortalSession & { isAdmin: true }> {
  const session = await getPortalSession()

  if (!session) {
    return localeRedirect({ href: PORTAL_LOGIN, locale })
  }

  if (!session.user.isActive) {
    return localeRedirect({
      href: { pathname: PORTAL_LOGIN, query: { error: 'inactive' } },
      locale,
    })
  }

  if (!session.isAdmin) {
    return localeRedirect({ href: PORTAL_STAFF_HOME, locale })
  }

  return session as PortalSession & { isAdmin: true }
}

