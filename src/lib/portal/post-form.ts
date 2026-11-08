// Shared by the "Add / edit post" page, its form and its server actions.
import type { Media } from '@/payload-types'

import type { PortalPostType } from './post-types'

export const MAX_GALLERY_PHOTOS = 6
export const MAX_IMAGE_BYTES = 5 * 1024 * 1024
export const MAX_PDF_BYTES = 20 * 1024 * 1024
export const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const PDF_TYPE = 'application/pdf'

/** A file already uploaded to the media library. */
export type UploadedFile = {
  id: number
  filename: string
  /** Small preview for photos. */
  previewUrl: string | null
}

export type PostLinks = { instagram: string; youtube: string; x: string; press: string }
export const POST_LINK_KEYS = ['instagram', 'youtube', 'x', 'press'] as const

export type PostFormValues = {
  type: PortalPostType
  title: string
  /** yyyy-mm-dd or '' */
  date: string
  location: string
  content: string
  cover: UploadedFile | null
  gallery: UploadedFile[]
  attachment: UploadedFile | null
  links: PostLinks
}

export type SavePostInput = Omit<PostFormValues, 'cover' | 'gallery' | 'attachment'> & {
  id?: number
  coverId: number | null
  galleryIds: number[]
  attachmentId: number | null
  /** true = "Submit for approval", false = "Save as draft" */
  submit: boolean
}

export type SavePostResult =
  | { ok: true; id: number; status: 'draft' | 'submitted' }
  | { ok: false; error: 'auth' | 'invalid' | 'forbidden' | 'generic'; fields?: string[] }

export type UploadResult =
  { ok: true; file: UploadedFile } | { ok: false; error: 'auth' | 'type' | 'size' | 'generic' }

export function toUploadedFile(media: Media | number | null | undefined): UploadedFile | null {
  if (!media || typeof media !== 'object') return null
  const isImage = media.mimeType?.startsWith('image/')
  return {
    id: media.id,
    filename: media.filename ?? '',
    previewUrl: isImage ? (media.sizes?.thumbnail?.url ?? media.url ?? null) : null,
  }
}

export const isHttpUrl = (value: string) => {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
