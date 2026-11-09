
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'
import { isAdministrator } from '../access/roles'

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

export const CommitteeMemberships: CollectionConfig = {
  slug: 'committee-memberships',

  admin: {
    useAsTitle: 'id',
    defaultColumns: ['user', 'committee', 'role', 'isActive'],
    group: 'Healthy Seeb',
  },

  access: {
    read: ({ req }) => isAdministrator(req.user),
    create: ({ req }) => isAdministrator(req.user),
    update: ({ req }) => isAdministrator(req.user),
    delete: ({ req }) => isAdministrator(req.user),
  },

  hooks: {
    beforeChange: [
      async ({ data, originalDoc, req }) => {
        const userID = getRelationshipID(
          data?.user ?? originalDoc?.user,
        )

        const committeeID = getRelationshipID(
          data?.committee ?? originalDoc?.committee,
        )

        const isActive = data?.isActive ?? originalDoc?.isActive ?? true

        if (!userID || !committeeID) {
          throw new APIError(
            'A user and committee must be selected.',
            400,
          )
        }

        if (isActive) {
          const user = await req.payload.findByID({
            collection: 'users',
            id: userID,
            depth: 0,
            overrideAccess: true,
            req,
          })

          if (!user.isActive || user.globalRole !== 'staff') {
            throw new APIError(
              'Only active staff accounts can have active committee memberships.',
              400,
            )
          }

          const committee = await req.payload.findByID({
            collection: 'committees',
            id: committeeID,
            depth: 0,
            overrideAccess: true,
            req,
          })

          if (!committee.isActive) {
            throw new APIError(
              'Inactive committees cannot have active memberships.',
              400,
            )
          }

          const existingMemberships = await req.payload.find({
            collection: 'committee-memberships',
            where: {
              and: [
                { isActive: { equals: true } },
                {
                  or: [
                    { user: { equals: userID } },
                    { committee: { equals: committeeID } },
                  ],
                },
              ],
            },
            limit: 100,
            depth: 0,
            overrideAccess: true,
            req,
          })

          const conflictingMembership = existingMemberships.docs.find(
            (membership) => membership.id !== originalDoc?.id,
          )

          if (conflictingMembership) {
            throw new APIError(
              'Each staff account can belong to only one committee, and each committee can have only one active staff account.',
              400,
            )
          }
        }

        return data
      },
    ],
  },

  fields: [
    {
      name: 'user',
      type: 'relationship',
      relationTo: 'users',
      required: true,
      label: 'User',
    },
    {
      name: 'committee',
      type: 'relationship',
      relationTo: 'committees',
      required: true,
      label: 'Committee',
    },
    {
      name: 'role',
      type: 'select',
      required: true,
      defaultValue: 'member',
      options: [
        { label: 'Chair', value: 'chair' },
        { label: 'Rapporteur', value: 'rapporteur' },
        { label: 'Member', value: 'member' },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active Membership',
      defaultValue: true,
    },
    {
      name: 'startDate',
      type: 'date',
      label: 'Membership Start Date',
    },
    {
      name: 'endDate',
      type: 'date',
      label: 'Membership End Date',
    },
  ],
}
