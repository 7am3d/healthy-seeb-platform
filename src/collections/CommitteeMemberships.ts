
import type { CollectionConfig } from 'payload'
import { APIError } from 'payload'

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

        const role = data?.role ?? originalDoc?.role
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
          })

          if (!user.isActive) {
            throw new APIError(
              'Inactive users cannot have active memberships.',
              400,
            )
          }

          const committee = await req.payload.findByID({
            collection: 'committees',
            id: committeeID,
            depth: 0,
            overrideAccess: true,
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
                { user: { equals: userID } },
                { committee: { equals: committeeID } },
                { isActive: { equals: true } },
              ],
            },
            limit: 100,
            depth: 0,
            overrideAccess: true,
          })

          const duplicate = existingMemberships.docs.some(
            (membership) => membership.id !== originalDoc?.id,
          )

          if (duplicate) {
            throw new APIError(
              'This user already has an active membership in this committee.',
              400,
            )
          }

          if (role === 'chair') {
            const existingChairs = await req.payload.find({
              collection: 'committee-memberships',
              where: {
                and: [
                  { committee: { equals: committeeID } },
                  { role: { equals: 'chair' } },
                  { isActive: { equals: true } },
                ],
              },
              limit: 100,
              depth: 0,
              overrideAccess: true,
            })

            const anotherChair = existingChairs.docs.some(
              (membership) => membership.id !== originalDoc?.id,
            )

            if (anotherChair) {
              throw new APIError(
                'This committee already has an active Chair.',
                400,
              )
            }
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
