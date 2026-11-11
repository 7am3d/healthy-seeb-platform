
import { NextResponse } from 'next/server'

import { getPayloadClient, getPortalSession } from '@/lib/portal/session'

type Action = 'activate' | 'deactivate' | 'assign' | 'remove'

type RequestBody = {
  action?: Action
  userId?: number
  committeeId?: number | null
  role?: 'chair' | 'rapporteur' | 'member'
  startDate?: string
  endDate?: string
}

function validDate(value: string) {
  return !value || /^\d{4}-\d{2}-\d{2}$/.test(value)
}

export async function POST(request: Request) {
  const session = await getPortalSession()

  if (!session?.user.isActive || !session.isAdmin) {
    return NextResponse.json(
      { ok: false, error: 'auth' },
      { status: 403 },
    )
  }

  let body: RequestBody

  try {
    body = await request.json()
  } catch {
    return NextResponse.json(
      { ok: false, error: 'invalid' },
      { status: 400 },
    )
  }

  const { action, userId, committeeId, role, startDate, endDate } = body

  if (
    !['activate', 'deactivate', 'assign', 'remove'].includes(action ?? '') ||
    !Number.isSafeInteger(userId) ||
    !userId ||
    userId <= 0
  ) {
    return NextResponse.json(
      { ok: false, error: 'invalid' },
      { status: 400 },
    )
  }

  if (
    action === 'assign' &&
    (
      !Number.isSafeInteger(committeeId) ||
      !committeeId ||
      committeeId <= 0 ||
      !['chair', 'rapporteur', 'member'].includes(role ?? '') ||
      !validDate(startDate ?? '') ||
      !validDate(endDate ?? '') ||
      (startDate && endDate && endDate < startDate)
    )
  ) {
    return NextResponse.json(
      { ok: false, error: 'invalid' },
      { status: 400 },
    )
  }

  try {
    const payload = await getPayloadClient()

    const user = await payload.findByID({
      collection: 'users',
      id: userId,
      depth: 0,
      overrideAccess: true,
    })

    if (user.globalRole === 'super-admin') {
      return NextResponse.json(
        { ok: false, error: 'protectedUser' },
        { status: 403 },
      )
    }

    if (user.globalRole !== 'staff') {
      return NextResponse.json(
        { ok: false, error: 'invalid' },
        { status: 400 },
      )
    }

    if (action === 'activate' || action === 'deactivate') {
      await payload.update({
        collection: 'users',
        id: userId,
        data: {
          isActive: action === 'activate',
        },
        user: session.user,
        overrideAccess: false,
      })
    }

    if (action === 'assign') {
      const committee = await payload.findByID({
        collection: 'committees',
        id: committeeId as number,
        depth: 0,
        overrideAccess: true,
      })

      if (!committee.isActive) {
        return NextResponse.json(
          { ok: false, error: 'invalidCommittee' },
          { status: 400 },
        )
      }

      if (!user.isActive) {
        return NextResponse.json(
          { ok: false, error: 'inactiveUser' },
          { status: 400 },
        )
      }

      const existingMemberships = await payload.find({
        collection: 'committee-memberships',
        where: {
          isActive: { equals: true },
        },
        limit: 500,
        depth: 0,
        overrideAccess: true,
      })

      const existing = existingMemberships.docs.find((membership) => {
        const existingUserId =
          typeof membership.user === 'object'
            ? membership.user.id
            : membership.user

        return existingUserId === userId
      })

      const existingCommitteeId = existing
        ? typeof existing.committee === 'object'
          ? existing.committee.id
          : existing.committee
        : null

      if (existing && existingCommitteeId !== committeeId) {
        return NextResponse.json(
          { ok: false, error: 'userAssigned' },
          { status: 409 },
        )
      }

      const committeeOccupied = existingMemberships.docs.some((membership) => {
        const existingCommittee =
          typeof membership.committee === 'object'
            ? membership.committee.id
            : membership.committee

        const existingUser =
          typeof membership.user === 'object'
            ? membership.user.id
            : membership.user

        return existingCommittee === committeeId && existingUser !== userId
      })

      if (committeeOccupied) {
        return NextResponse.json(
          { ok: false, error: 'alreadyAssigned' },
          { status: 409 },
        )
      }

      const membershipData = {
        user: userId,
        committee: committeeId as number,
        role: role as 'chair' | 'rapporteur' | 'member',
        isActive: true,
        startDate: startDate || null,
        endDate: endDate || null,
      }

      if (existing) {
        await payload.update({
          collection: 'committee-memberships',
          id: existing.id,
          data: membershipData,
          overrideAccess: true,
        })
      } else {
        await payload.create({
          collection: 'committee-memberships',
          data: membershipData,
          overrideAccess: true,
        })
      }
    }

    if (action === 'remove') {
      const memberships = await payload.find({
        collection: 'committee-memberships',
        where: {
          and: [
            { user: { equals: userId } },
            { isActive: { equals: true } },
          ],
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      for (const membership of memberships.docs) {
        await payload.update({
          collection: 'committee-memberships',
          id: membership.id,
          data: { isActive: false },
          overrideAccess: true,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    const status = (error as { status?: number }).status

    if (status === 404) {
      return NextResponse.json(
        { ok: false, error: 'notFound' },
        { status: 404 },
      )
    }

    console.error('Admin user management failed:', error)

    return NextResponse.json(
      { ok: false, error: 'generic' },
      { status: 500 },
    )
  }
}
