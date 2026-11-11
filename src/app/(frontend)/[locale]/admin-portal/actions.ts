
'use server'

import { revalidatePath } from 'next/cache'

import { getPayloadClient, getPortalSession } from '@/lib/portal/session'

export type ReviewPostResult =
  | { ok: true }
  | { ok: false; error: 'auth' | 'invalid' | 'notFound' | 'generic' }

type ReviewPostInput = {
  id: number
  decision: 'approved' | 'rejected'
  rejectionReason?: string
}

export async function reviewPost(
  input: ReviewPostInput,
): Promise<ReviewPostResult> {
  const session = await getPortalSession()

  if (!session?.user.isActive || !session.isAdmin) {
    return { ok: false, error: 'auth' }
  }

  if (!Number.isSafeInteger(input.id) || input.id <= 0) {
    return { ok: false, error: 'invalid' }
  }

  if (input.decision !== 'approved' && input.decision !== 'rejected') {
    return { ok: false, error: 'invalid' }
  }

  const reason = input.rejectionReason?.trim() ?? ''

  if (input.decision === 'rejected' && !reason) {
    return { ok: false, error: 'invalid' }
  }

  if (reason.length > 2000) {
    return { ok: false, error: 'invalid' }
  }

  try {
    const payload = await getPayloadClient()

    const post = await payload.findByID({
      collection: 'posts',
      id: input.id,
      depth: 0,
      user: session.user,
      overrideAccess: false,
    })

    if (post.status !== 'submitted') {
      return { ok: false, error: 'invalid' }
    }

    await payload.update({
    collection: 'posts',
    id: input.id,
    data: {
        status: input.decision,
        rejectionReason: input.decision === 'rejected' ? reason : null,
    },
    user: session.user,
    overrideAccess: false,
    })

    revalidatePath('/[locale]/admin-portal', 'page')
    revalidatePath('/[locale]/admin-portal/approvals', 'page')

    return { ok: true }
  } catch (error) {
    const status = (error as { status?: number }).status

    if (status === 404) {
      return { ok: false, error: 'notFound' }
    }

    console.error('Admin post review failed:', error)
    return { ok: false, error: 'generic' }
  }
}

export type UpdateCommitteeResult =
  | { ok: true }
  | { ok: false; error: 'auth' | 'invalid' | 'notFound' | 'generic' }

export type UpdateCommitteeInput = {
  id: number
  description: string
  shortDescription: string
  email: string
  chairName: string
  chairEmail: string
  chairTitle: string
  rapporteurName: string
  rapporteurTitle: string
  members: { name: string; title: string }[]
  responsibilities: { text: string }[]
  suggestionsPrompt: string
  suggestionsText: string
}

export async function updateCommittee(
  input: UpdateCommitteeInput,
): Promise<UpdateCommitteeResult> {
  const session = await getPortalSession()

  if (!session?.user.isActive || !session.isAdmin) {
    return { ok: false, error: 'auth' }
  }

  if (!Number.isSafeInteger(input.id) || input.id <= 0) {
    return { ok: false, error: 'invalid' }
  }

  const fields = [
    input.description,
    input.shortDescription,
    input.email,
    input.chairName,
    input.chairEmail,
    input.chairTitle,
    input.rapporteurName,
    input.rapporteurTitle,
    input.suggestionsPrompt,
    input.suggestionsText,
  ]

  if (
    fields.some((value) => typeof value !== 'string') ||
    input.description.length > 300 ||
    input.shortDescription.length > 160 ||
    input.chairName.length > 150 ||
    input.rapporteurName.length > 150 ||
    input.chairTitle.length > 250 ||
    input.rapporteurTitle.length > 250 ||
    input.suggestionsPrompt.length > 2000 ||
    input.suggestionsText.length > 10000 ||
    input.members.length > 60 ||
    input.responsibilities.length > 40
  ) {
    return { ok: false, error: 'invalid' }
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (
    (input.email && !emailPattern.test(input.email)) ||
    (input.chairEmail && !emailPattern.test(input.chairEmail))
  ) {
    return { ok: false, error: 'invalid' }
  }

  if (
    input.members.some(
      (member) =>
        typeof member.name !== 'string' ||
        typeof member.title !== 'string' ||
        !member.name.trim() ||
        member.name.length > 150 ||
        member.title.length > 250,
    ) ||
    input.responsibilities.some(
      (item) =>
        typeof item.text !== 'string' ||
        !item.text.trim() ||
        item.text.length > 600,
    )
  ) {
    return { ok: false, error: 'invalid' }
  }

  try {
    const payload = await getPayloadClient()

    await payload.update({
      collection: 'committees',
      id: input.id,
      data: {
        description: input.description.trim(),
        shortDescription: input.shortDescription.trim(),
        email: input.email.trim() || null,
        chairName: input.chairName.trim(),
        chairEmail: input.chairEmail.trim() || null,
        chairTitle: input.chairTitle.trim(),
        rapporteurName: input.rapporteurName.trim(),
        rapporteurTitle: input.rapporteurTitle.trim(),
        members: input.members.map((member) => ({
          name: member.name.trim(),
          title: member.title.trim(),
        })),
        responsibilities: input.responsibilities.map((item) => ({
          text: item.text.trim(),
        })),
        suggestionsPrompt: input.suggestionsPrompt.trim(),
        suggestionsText: input.suggestionsText.trim(),
      },
      user: session.user,
      overrideAccess: false,
    })

    revalidatePath('/[locale]/admin-portal', 'page')
    revalidatePath('/[locale]/admin-portal/committees', 'page')

    return { ok: true }
  } catch (error) {
    const status = (error as { status?: number }).status

    if (status === 404) {
      return { ok: false, error: 'notFound' }
    }

    console.error('Admin committee update failed:', error)
    return { ok: false, error: 'generic' }
  }
}

