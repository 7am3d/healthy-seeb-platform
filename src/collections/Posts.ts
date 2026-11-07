
import type { CollectionConfig, Where } from 'payload'
import { APIError } from 'payload'

const isAdministrator = (user: any) =>
  user?.globalRole === 'super-admin' ||
  user?.globalRole === 'administrator'

const getID = (value: any): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') return value

  if (value && typeof value === 'object' && 'id' in value) {
    return getID(value.id)
  }

  return undefined
}

const getActiveMembership = async (
  req: any,
  committeeID: string | number,
) => {
  const result = await req.payload.find({
    collection: 'committee-memberships',
    where: {
      and: [
        { user: { equals: req.user.id } },
        { committee: { equals: committeeID } },
        { isActive: { equals: true } },
      ],
    },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  })

  return result.docs[0] ?? null
}

export const Posts: CollectionConfig = {
  slug: 'posts',

  admin: {
    useAsTitle: 'title',
    defaultColumns: [
      'title',
      'committee',
      'type',
      'status',
      'updatedAt',
    ],
    group: 'Healthy Seeb',
  },

    access: {
    create: ({ req }) => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true

      return Boolean((req.user as any).isActive)
    },

    read: ({ req }): boolean | Where => {
      if (!req.user) {
        return { status: { equals: 'approved' } }
      }

      if (isAdministrator(req.user)) return true

      if (!(req.user as any).isActive) return false

      const where: Where = {
        author: { equals: req.user.id },
      }

      return where
    },

    update: ({ req }): boolean | Where => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true

      if (!(req.user as any).isActive) return false

      const where: Where = {
        and: [
          { author: { equals: req.user.id } },
          { status: { in: ['draft', 'rejected'] } },
        ],
      }

      return where
    },

    delete: ({ req }) => isAdministrator(req.user),
  },

  hooks: {
    beforeChange: [
      async ({ data, originalDoc, operation, req }) => {
        if (!req.user) {
          throw new APIError('Authentication is required.', 401)
        }

        const admin = isAdministrator(req.user)
        const userID = getID(req.user.id)

        if (!admin && !(req.user as any).isActive) {
          throw new APIError('Your account is inactive.', 403)
        }

        const committeeID = getID(
          data?.committee ?? originalDoc?.committee,
        )

        if (!committeeID) {
          throw new APIError('A committee must be selected.', 400)
        }

        const currentStatus = originalDoc?.status ?? 'draft'
        const requestedStatus = data?.status ?? currentStatus

        // Administrators can edit submissions and make decisions.
        if (admin) {
          if (operation === 'create' && !data.author) {
            data.author = userID
          }

          if (operation === 'update') {
            // Preserve the original author.
            data.author = getID(originalDoc?.author)
          }

          if (requestedStatus === 'submitted' &&
              currentStatus !== 'submitted') {
            data.submittedAt = new Date().toISOString()
          }

          if (requestedStatus === 'approved' ||
              requestedStatus === 'rejected') {
            if (
              requestedStatus === 'rejected' &&
              !String(data.rejectionReason ?? originalDoc?.rejectionReason ?? '').trim()
            ) {
              throw new APIError(
                'A rejection reason is required.',
                400,
              )
            }

            if (currentStatus !== requestedStatus) {
              data.reviewedBy = userID
              data.reviewedAt = new Date().toISOString()
            }
          }

          return data
        }

        // Staff must belong to the selected committee.
        const membership = await getActiveMembership(req, committeeID)

        if (!membership) {
          throw new APIError(
            'You are not an active member of this committee.',
            403,
          )
        }

        // Staff cannot modify another person's post.
        if (
          operation === 'update' &&
          getID(originalDoc?.author) !== userID
        ) {
          throw new APIError(
            'You can only edit your own submissions.',
            403,
          )
        }

        // Staff cannot move a post to another committee.
        if (
          operation === 'update' &&
          getID(data?.committee) &&
          getID(data.committee) !== getID(originalDoc?.committee)
        ) {
          throw new APIError(
            'You cannot move a post to another committee.',
            403,
          )
        }

        // Staff can create or edit drafts and rejected posts only.
        if (
          operation === 'update' &&
          !['draft', 'rejected'].includes(currentStatus)
        ) {
          throw new APIError(
            'Submitted posts cannot be edited by Staff.',
            403,
          )
        }

        if (!['draft', 'submitted'].includes(requestedStatus)) {
          throw new APIError(
            'Staff can only save drafts or submit posts.',
            403,
          )
        }

       // A new post must be a draft or a submission.
        if (operation === 'create') {
            if (!['draft', 'submitted'].includes(requestedStatus)) {
            throw new APIError(
            'Staff can only create draft or submitted posts.',
            403,
            )
        }

        data.author = userID
        } else {
            data.author = getID(originalDoc?.author)
        }

        // Staff cannot supply reviewer or approval information.
        data.reviewedBy = null
        data.reviewedAt = null
        data.rejectionReason = null

        return data
      },
    ],
  },

  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      maxLength: 180,
    },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      index: true,
    },
    {
      name: 'summary',
      type: 'textarea',
      maxLength: 500,
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
    },
    {
      name: 'type',
      type: 'select',
      required: true,
      defaultValue: 'general',
      options: [
        { label: 'Announcement', value: 'announcement' },
        { label: 'News', value: 'news' },
        { label: 'Activity', value: 'activity' },
        { label: 'General', value: 'general' },
      ],
    },
    {
      name: 'committee',
      type: 'relationship',
      relationTo: 'committees',
      required: true,
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      admin: { readOnly: true },
    },
    {
  name: 'status',
  type: 'select',
  required: true,
  defaultValue: 'draft',
  access: {
    update: ({ req }) => isAdministrator(req.user),
  },
  options: [
    { label: 'Draft', value: 'draft' },
    { label: 'Submitted', value: 'submitted' },
    { label: 'Approved', value: 'approved' },
    { label: 'Rejected', value: 'rejected' },
  ],
},
    {
      name: 'submittedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'reviewedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: { readOnly: true },
    },
    {
      name: 'reviewedAt',
      type: 'date',
      admin: { readOnly: true },
    },
    {
      name: 'rejectionReason',
      type: 'textarea',
      label: 'Rejection Reason / Admin Notes',
    },
  ],
}
