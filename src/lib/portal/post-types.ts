// Post helpers that are safe to use in both server and browser components.
import type { Post } from '@/payload-types'

/** The three post types shown in the staff portal, in tab order. */
export const PORTAL_POST_TYPES = [
  'activity',
  'announcement',
  'report',
] as const satisfies Post['type'][]
export type PortalPostType = (typeof PORTAL_POST_TYPES)[number]

export const isPortalPostType = (value: unknown): value is PortalPostType =>
  PORTAL_POST_TYPES.includes(value as PortalPostType)

/** Posts a staff member can edit (the Posts collection only allows these statuses). */
export const isEditableStatus = (status: Post['status']) =>
  status === 'draft' || status === 'rejected'

/** The fields the portal tables and the view dialog need. */
export type PortalPost = Pick<
  Post,
  'id' | 'title' | 'summary' | 'type' | 'status' | 'rejectionReason' | 'createdAt' | 'updatedAt'
>
