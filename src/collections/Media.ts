import type { CollectionConfig, PayloadRequest, Where } from 'payload'

import { activeCommitteeIDs, getRelationshipID, isAdministrator } from '../access/roles'

async function getPublicMediaIDs(req: PayloadRequest) {
  const ids = new Set<number>()

  // Only media attached to approved posts can be accessed publicly.
  let page = 1
  let hasNextPage = true

  while (hasNextPage) {
    const result = await req.payload.find({
      collection: 'posts',
      where: { status: { equals: 'approved' } },
      select: {
        coverImage: true,
        attachment: true,
        gallery: true,
      },
      depth: 0,
      limit: 100,
      page,
      overrideAccess: true,
      req,
    })

    for (const post of result.docs) {
      const coverID = getRelationshipID(post.coverImage)
      const attachmentID = getRelationshipID(post.attachment)

      if (typeof coverID === 'number') ids.add(coverID)
      if (typeof attachmentID === 'number') ids.add(attachmentID)

      for (const item of post.gallery ?? []) {
        const imageID = getRelationshipID(item.image)
        if (typeof imageID === 'number') ids.add(imageID)
      }
    }

    hasNextPage = result.hasNextPage
    page += 1
  }

  return [...ids]
}

export const Media: CollectionConfig = {
  slug: 'media',

  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      if (isAdministrator(req.user)) return true

      const publicIDs = await getPublicMediaIDs(req)

      if (!req.user || !req.user.isActive) {
        return publicIDs.length
          ? { id: { in: publicIDs } }
          : false
      }

      const committeeIDs = await activeCommitteeIDs(req)

      if (!committeeIDs.length) {
        return publicIDs.length
          ? { id: { in: publicIDs } }
          : false
      }

      return {
        or: [
          { uploadedBy: { equals: req.user.id } },
          ...(publicIDs.length ? [{ id: { in: publicIDs } }] : []),
        ],
      }
    },

    create: async ({ req }) => {
      if (isAdministrator(req.user)) return true
      if (!req.user?.isActive) return false

      const committeeIDs = await activeCommitteeIDs(req)
      return committeeIDs.length > 0
    },

    update: ({ req }) => isAdministrator(req.user),
    delete: ({ req }) => isAdministrator(req.user),
  },

  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc, req }) => {
        if (operation === 'create') {
          if (!req.user) throw new Error('Authentication is required to upload media.')
          data.uploadedBy = req.user.id
        } else {
          data.uploadedBy = originalDoc?.uploadedBy
        }

        return data
      },
    ],
  },

  fields: [
    {
      name: 'caption',
      type: 'text',
      admin: {
        hidden: true,
      },
    },
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
    {
      name: 'uploadedBy',
      type: 'relationship',
      relationTo: 'users',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
    },
  ],

  upload: {
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 450, position: 'centre' },
    ],
  },
}
