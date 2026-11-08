// Requests referred to a committee (the staff "Referred requests" page).
import type { Request } from '@/payload-types'

export const FOLLOW_UP_STATUSES = ['new', 'contacted', 'in-progress', 'completed'] as const
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number]

/** Request types in the order of the prototype's type filter. */
export const REFERRAL_TYPES = [
  'partnership',
  'sponsorship',
  'donation',
  'volunteering',
  'suggestion',
  'complaint',
] as const satisfies Request['type'][]

export type Referral = {
  id: number
  type: Request['type']
  submitterType: Request['submitterType']
  /** First line of the message, used as the title (the public forms have no title field). */
  title: string
  message: string
  name: string
  email: string
  phone: string
  referredAt: string
  followUpStatus: FollowUpStatus
  referralNote: string
  notes: { id: string; note: string; date: string }[]
}

export type SaveFollowUpResult =
  | { ok: true; referral: Referral }
  | { ok: false; error: 'auth' | 'forbidden' | 'invalid' | 'generic' }

export const isFollowUpStatus = (value: unknown): value is FollowUpStatus =>
  FOLLOW_UP_STATUSES.includes(value as FollowUpStatus)

export function toReferral(request: Request): Referral {
  const message = request.message.trim()
  const [firstLine, ...rest] = message.split('\n')
  const title = firstLine.length > 120 ? `${firstLine.slice(0, 117)}…` : firstLine
  return {
    id: request.id,
    type: request.type,
    submitterType: request.submitterType,
    title,
    // When the first line is the title, the details are the rest of the message.
    message: rest.join('\n').trim() || message,
    name: request.name ?? '',
    email: request.email ?? '',
    phone: request.phone ?? '',
    referredAt: request.referredAt ?? request.createdAt,
    followUpStatus: isFollowUpStatus(request.followUpStatus) ? request.followUpStatus : 'new',
    referralNote: request.referralNote ?? '',
    notes: (request.followUpNotes ?? []).map((note, index) => ({
      id: note.id ?? String(index),
      note: note.note,
      date: note.date ?? request.updatedAt,
    })),
  }
}
