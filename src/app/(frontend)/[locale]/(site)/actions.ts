'use server'

import config from '@payload-config'
import { headers } from 'next/headers'
import { getPayload } from 'payload'

import type { Request } from '@/payload-types'

// Public website forms. They save into the "requests" collection, which the admin
// portal (inbox / approvals) and the staff portal ("Referred requests") read from.

export type ContributionState =
  | { ok: true }
  | { ok: false; error: 'name' | 'email' | 'description' | 'terms' | 'rateLimit' | 'generic' }
  | undefined

export type SuggestionState =
  | { ok: true }
  | { ok: false; error: 'email' | 'message' | 'rateLimit' | 'generic'; fields?: string[] }
  | undefined

const EMAIL = /^[^@\s]+@[^@\s]+\.[^@\s]+$/
const CONTRIBUTION_TYPES = ['volunteering', 'sponsorship', 'partnership', 'donation'] as const

// Simple per-IP limit: at most 5 submissions per 10 minutes per server instance.
// (Behind a proxy or on several servers, add a shared limiter such as the host's WAF.)
const RECENT = new Map<string, number[]>()
const WINDOW_MS = 10 * 60 * 1000
const MAX_PER_WINDOW = 5

async function isRateLimited(): Promise<boolean> {
  const h = await headers()
  const ip = (h.get('x-forwarded-for')?.split(',')[0] ?? h.get('x-real-ip') ?? 'unknown').trim()
  const now = Date.now()
  const times = (RECENT.get(ip) ?? []).filter((time) => now - time < WINDOW_MS)
  if (times.length >= MAX_PER_WINDOW) return true
  times.push(now)
  RECENT.set(ip, times)
  return false
}

const text = (formData: FormData, name: string, max = 500) =>
  String(formData.get(name) ?? '')
    .trim()
    .slice(0, max)

async function committeeIdFor(code: string) {
  if (!code) return undefined
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'committees',
    where: { code: { equals: code } },
    limit: 1,
    depth: 0,
    overrideAccess: false,
  })
  return docs[0]?.id
}

async function saveRequest(data: Omit<Request, 'id' | 'createdAt' | 'updatedAt' | 'reviewStatus'>) {
  const payload = await getPayload({ config })
  // Created by trusted server code after validation; the API itself does not allow public creates.
  await payload.create({
    collection: 'requests',
    data: { ...data, reviewStatus: 'new' },
    overrideAccess: true,
  })
}

/** "Contribute with us" form (footer and About page). */
export async function submitContribution(
  _prev: ContributionState,
  formData: FormData,
): Promise<ContributionState> {
  // Hidden "website" field: real visitors leave it empty, spam bots fill it in.
  if (text(formData, 'website')) return { ok: true }

  const name = text(formData, 'name', 150)
  const email = text(formData, 'email', 150)
  const phone = text(formData, 'phone', 30)
  const description = text(formData, 'description', 3000)
  const who = text(formData, 'who') === 'organization' ? 'organization' : 'individual'
  const rawType = text(formData, 'type')
  const type = CONTRIBUTION_TYPES.find((value) => value === rawType) ?? 'volunteering'

  if (!name) return { ok: false, error: 'name' }
  if (!EMAIL.test(email)) return { ok: false, error: 'email' }
  if (description.length < 10) return { ok: false, error: 'description' }
  if (formData.get('agree') !== 'on') return { ok: false, error: 'terms' }
  if (await isRateLimited()) return { ok: false, error: 'rateLimit' }

  try {
    await saveRequest({
      kind: 'contribution',
      type,
      submitterType: who,
      name,
      email,
      phone: phone || undefined,
      message: description,
      committee: await committeeIdFor(text(formData, 'committee', 50)),
      agreedToTerms: true,
      sourcePage: text(formData, 'sourcePage', 200) || undefined,
    })
    return { ok: true }
  } catch (error) {
    console.error('Contribution form failed', error)
    return { ok: false, error: 'generic' }
  }
}

/** "Submit a suggestion" form on each committee page. */
export async function submitSuggestion(
  _prev: SuggestionState,
  formData: FormData,
): Promise<SuggestionState> {
  if (text(formData, 'website')) return { ok: true }

  const name = text(formData, 'name', 150)
  const email = text(formData, 'email', 150)
  const message = text(formData, 'message', 3000)

  const fields = [...(!EMAIL.test(email) ? ['email'] : []), ...(!message ? ['message'] : [])]
  if (fields.length) return { ok: false, error: fields[0] as 'email' | 'message', fields }
  if (await isRateLimited()) return { ok: false, error: 'rateLimit' }

  try {
    await saveRequest({
      kind: 'message',
      type: 'suggestion',
      submitterType: 'visitor',
      name: name || undefined,
      email,
      message,
      committee: await committeeIdFor(text(formData, 'committee', 50)),
      agreedToTerms: false,
      sourcePage: text(formData, 'sourcePage', 200) || undefined,
    })
    return { ok: true }
  } catch (error) {
    console.error('Suggestion form failed', error)
    return { ok: false, error: 'generic' }
  }
}
