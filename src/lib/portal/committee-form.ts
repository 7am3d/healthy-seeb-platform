// Shared by the staff "Committee page" editor, its page and its server action.

export type CommitteePageValues = {
  description: string
  chairName: string
  chairEmail: string
  rapporteurName: string
  rapporteurTitle: string
  /** `key` only keeps React rows stable while editing. */
  members: { key: string; name: string; title: string }[]
  responsibilities: { key: string; text: string }[]
}

export type SaveCommitteeResult =
  | { ok: true; savedAt: string }
  | { ok: false; error: 'auth' | 'forbidden' | 'invalid' | 'generic'; fields?: string[] }

export const COMMITTEE_LIMITS = {
  description: 300,
  name: 150,
  title: 250,
  responsibility: 600,
  members: 60,
  responsibilities: 40,
} as const

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
