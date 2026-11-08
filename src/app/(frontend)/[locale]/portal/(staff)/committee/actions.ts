'use server'

import {
  COMMITTEE_LIMITS as LIMITS,
  type CommitteePageValues,
  EMAIL_PATTERN,
  type SaveCommitteeResult,
} from '@/lib/portal/committee-form'
import { canEditCommitteePage, getPayloadClient, getStaffSession } from '@/lib/portal/session'

const clean = (value: unknown, max: number) =>
  (typeof value === 'string' ? value.trim() : '').slice(0, max)

/**
 * "Save changes" on the committee page editor.
 * Saved as a draft version: the public page keeps showing the published version
 * until an administrator publishes the draft (Payload admin → Committees).
 */
export async function saveCommitteePage(input: CommitteePageValues): Promise<SaveCommitteeResult> {
  const session = await getStaffSession()
  if (!session) return { ok: false, error: 'auth' }
  if (!canEditCommitteePage(session)) return { ok: false, error: 'forbidden' }

  const fields: string[] = []
  const description = typeof input.description === 'string' ? input.description.trim() : ''
  if (description.length > LIMITS.description) fields.push('description')

  const chairEmail = clean(input.chairEmail, 200)
  if (chairEmail && !EMAIL_PATTERN.test(chairEmail)) fields.push('chairEmail')

  const members = (Array.isArray(input.members) ? input.members : [])
    .map((member) => ({
      name: clean(member?.name, LIMITS.name),
      title: clean(member?.title, LIMITS.title),
    }))
    .filter((member) => member.name)
    .slice(0, LIMITS.members)

  const responsibilities = (Array.isArray(input.responsibilities) ? input.responsibilities : [])
    .map((item) => ({ text: clean(item?.text, LIMITS.responsibility) }))
    .filter((item) => item.text)
    .slice(0, LIMITS.responsibilities)

  if (fields.length) return { ok: false, error: 'invalid', fields }

  try {
    const payload = await getPayloadClient()
    const saved = await payload.update({
      collection: 'committees',
      id: session.membership.committee.id,
      draft: true,
      data: {
        _status: 'draft',
        description,
        chairName: clean(input.chairName, LIMITS.name),
        chairEmail: chairEmail || null,
        rapporteurName: clean(input.rapporteurName, LIMITS.name),
        rapporteurTitle: clean(input.rapporteurTitle, LIMITS.title),
        members,
        responsibilities,
      },
      // The Committees access rules let only the chair and rapporteur save, and only as a draft.
      user: session.user,
      overrideAccess: false,
    })
    return { ok: true, savedAt: saved.updatedAt }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) return { ok: false, error: 'forbidden' }
    console.error('Saving the committee page failed', error)
    return { ok: false, error: 'generic' }
  }
}
