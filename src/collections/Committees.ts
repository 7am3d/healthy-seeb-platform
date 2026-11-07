import type { CollectionConfig } from 'payload'

const isAdministrator = (user: any) =>
  user?.globalRole === 'super-admin' ||
  user?.globalRole === 'administrator'

const getRelationshipID = (
  value: unknown,
): string | number | undefined => {
  if (typeof value === 'string' || typeof value === 'number') {
    return value
  }

  if (value && typeof value === 'object' && 'id' in value) {
    const id = (value as { id: unknown }).id

    if (typeof id === 'string' || typeof id === 'number') {
      return id
    }
  }

  return undefined
}

export const Committees: CollectionConfig = {
  slug: 'committees',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'isActive'],
    group: 'Healthy Seeb',
  },

  access: {
    read: async ({ req }) => {
      if (!req.user) return false

      if (isAdministrator(req.user)) return true

      const memberships = await req.payload.find({
        collection: 'committee-memberships',
        where: {
          and: [
            { user: { equals: req.user.id } },
            { isActive: { equals: true } },
          ],
        },
        limit: 100,
        depth: 0,
        overrideAccess: true,
      })

      const committeeIDs = memberships.docs
        .map((membership) => getRelationshipID(membership.committee))
        .filter((id): id is string | number => id !== undefined)

      if (committeeIDs.length === 0) return false

      return {
        id: {
          in: committeeIDs,
        },
      }
    },

    create: ({ req }) => isAdministrator(req.user),
    update: ({ req }) => isAdministrator(req.user),
    delete: ({ req }) => isAdministrator(req.user),
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Committee Name',
      required: true,
      unique: true,
    },
    {
      name: 'code',
      type: 'text',
      label: 'Committee Code',
      required: true,
      unique: true,
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active Committee',
      defaultValue: true,
    },
  ],
}
