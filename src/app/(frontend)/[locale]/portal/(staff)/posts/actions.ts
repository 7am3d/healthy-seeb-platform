'use server'

import type { Media } from '@/payload-types'
import {
  IMAGE_TYPES,
  isHttpUrl,
  MAX_GALLERY_PHOTOS,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  PDF_TYPE,
  POST_LINK_KEYS,
  type SavePostInput,
  type SavePostResult,
  toUploadedFile,
  type UploadResult,
} from '@/lib/portal/post-form'
import { isPortalPostType } from '@/lib/portal/post-types'
import { plainText, textToLexical } from '@/lib/portal/rich-text'
import { getPayloadClient, getStaffSession } from '@/lib/portal/session'

/**
 * Uploads one photo or PDF for a post. Each file is sent on its own, so one request stays small.
 * The file is checked here and again by the Media collection (allowed file types).
 */
export async function uploadPostFile(formData: FormData): Promise<UploadResult> {
  const session = await getStaffSession()
  if (!session) return { ok: false, error: 'auth' }

  const file = formData.get('file')
  const kind = formData.get('kind') === 'pdf' ? 'pdf' : 'image'
  if (!(file instanceof File) || file.size === 0) return { ok: false, error: 'generic' }

  const allowed = kind === 'pdf' ? [PDF_TYPE] : IMAGE_TYPES
  if (!allowed.includes(file.type)) return { ok: false, error: 'type' }
  if (file.size > (kind === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES)) {
    return { ok: false, error: 'size' }
  }

  try {
    const payload = await getPayloadClient()
    const alt = String(formData.get('alt') ?? '').trim() || file.name
    const media = await payload.create({
      collection: 'media',
      data: { alt: alt.slice(0, 180) },
      file: {
        data: Buffer.from(await file.arrayBuffer()),
        mimetype: file.type,
        name: file.name,
        size: file.size,
      },
      user: session.user,
      overrideAccess: false,
    })
    const uploaded = toUploadedFile(media)
    return uploaded ? { ok: true, file: uploaded } : { ok: false, error: 'generic' }
  } catch (error) {
    console.error('Post file upload failed', error)
    return { ok: false, error: 'generic' }
  }
}

const clean = (value: unknown, max: number) =>
  (typeof value === 'string' ? value.trim() : '').slice(0, max)
const isID = (value: unknown): value is number => Number.isInteger(value) && (value as number) > 0

/** "Save as draft" and "Submit for approval" on the Add / edit post page. */
export async function savePost(input: SavePostInput): Promise<SavePostResult> {
  const session = await getStaffSession()
  if (!session) return { ok: false, error: 'auth' }

  const title = clean(input.title, 180)
  const content = clean(input.content, 20_000)
  const location = clean(input.location, 180)
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date ?? '') ? input.date : ''
  const links = Object.fromEntries(
    POST_LINK_KEYS.map((key) => [key, clean(input.links?.[key], 500)]),
  ) as Record<(typeof POST_LINK_KEYS)[number], string>

  const fields: string[] = []
  if (!isPortalPostType(input.type)) fields.push('type')
  if (!title) fields.push('title')
  if (!plainText(content)) fields.push('content')
  for (const key of POST_LINK_KEYS) if (links[key] && !isHttpUrl(links[key])) fields.push(key)

  const coverId = isID(input.coverId) ? input.coverId : null
  const attachmentId = isID(input.attachmentId) ? input.attachmentId : null
  const galleryIds = (Array.isArray(input.galleryIds) ? input.galleryIds : []).filter(isID)
  if (galleryIds.length > MAX_GALLERY_PHOTOS) fields.push('gallery')

  const payload = await getPayloadClient()

  // The chosen files must exist and be the right kind (photos for cover/gallery, a PDF attachment).
  const mediaIDs = [coverId, attachmentId, ...galleryIds].filter(isID)
  if (mediaIDs.length) {
    const { docs } = await payload.find({
      collection: 'media',
      where: { id: { in: mediaIDs } },
      select: { mimeType: true },
      limit: mediaIDs.length,
      depth: 0,
    })
    const mime = new Map(docs.map((doc) => [doc.id, (doc as Pick<Media, 'mimeType'>).mimeType]))
    const isImage = (id: number) => IMAGE_TYPES.includes(mime.get(id) ?? '')
    if (coverId && !isImage(coverId)) fields.push('cover')
    if (galleryIds.some((id) => !isImage(id))) fields.push('gallery')
    if (attachmentId && mime.get(attachmentId) !== PDF_TYPE) fields.push('attachment')
  }

  if (fields.length) return { ok: false, error: 'invalid', fields }

  const status = input.submit ? 'submitted' : 'draft'
  const summary = plainText(content).slice(0, 220)
  const data = {
    type: input.type,
    title,
    summary: summary.length === 220 ? `${summary.slice(0, 217)}…` : summary,
    content: textToLexical(content),
    eventDate: date ? new Date(`${date}T00:00:00.000Z`).toISOString() : null,
    location,
    coverImage: coverId,
    gallery: galleryIds.map((image) => ({ image })),
    attachment: attachmentId,
    links,
    status,
  } as const

  const asUser = { user: session.user, overrideAccess: false } as const

  try {
    if (isID(input.id)) {
      // The Posts access rules only let staff edit their own drafts and rejected posts.
      const post = await payload.update({ collection: 'posts', id: input.id, data, ...asUser })
      return { ok: true, id: post.id, status }
    }

    const committee = session.membership.committee
    const post = await payload.create({
      collection: 'posts',
      data: {
        ...data,
        committee: committee.id,
        author: session.user.id,
        slug: `${committee.code}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      },
      ...asUser,
    })
    return { ok: true, id: post.id, status }
  } catch (error) {
    const status = (error as { status?: number }).status
    if (status === 403 || status === 404) return { ok: false, error: 'forbidden' }
    console.error('Saving a post failed', error)
    return { ok: false, error: 'generic' }
  }
}
