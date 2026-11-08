'use server'

import {
  isFollowUpStatus,
  type FollowUpStatus,
  type SaveFollowUpResult,
  toReferral,
} from '@/lib/portal/referrals'
import { getPayloadClient, getStaffSession } from '@/lib/portal/session'

/** "Save follow-up" in the referred request dialog: new status and/or a new note. */
export async function saveFollowUp(input: {
  id: number
  followUpStatus: FollowUpStatus
  note: string
}): Promise<SaveFollowUpResult> {
  const session = await getStaffSession()
  if (!session) return { ok: false, error: 'auth' }

  const note = typeof input.note === 'string' ? input.note.trim().slice(0, 1000) : ''
  if (!Number.isInteger(input.id) || !isFollowUpStatus(input.followUpStatus)) {
    return { ok: false, error: 'invalid' }
  }

  const payload = await getPayloadClient()
  const asUser = { user: session.user, overrideAccess: false } as const

  try {
    // Staff can only read and update requests referred to their own committee (Requests access).
    const current = await payload.findByID({
      collection: 'requests',
      id: input.id,
      depth: 0,
      ...asUser,
    })
    const updated = await payload.update({
      collection: 'requests',
      id: input.id,
      data: {
        followUpStatus: input.followUpStatus,
        // The collection keeps earlier notes as they are; the author and date are filled in.
        ...(note ? { followUpNotes: [...(current.followUpNotes ?? []), { note }] } : {}),
      },
      depth: 0,
      ...asUser,
    })
    return { ok: true, referral: toReferral(updated) }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) return { ok: false, error: 'forbidden' }
    console.error('Saving a follow-up failed', error)
    return { ok: false, error: 'generic' }
  }
}
