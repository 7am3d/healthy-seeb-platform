
import type { CollectionConfig } from 'payload'
import { isAdministrator } from '../access/roles'

export const Users: CollectionConfig = {
  slug: 'users',

  admin: {
    useAsTitle: 'email',
    defaultColumns: ['name', 'email', 'globalRole', 'isActive'],
  },

  auth: true,

  access: {
    create: ({ req }) => isAdministrator(req.user),

    read: ({ req }) => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true

      return {
        id: {
          equals: req.user.id,
        },
      }
    },

    update: ({ req }) => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true

      return {
        id: {
          equals: req.user.id,
        },
      }
    },

    delete: async ({ req, id }) => {
  if (!isAdministrator(req.user) || !id) return false

  const target = await req.payload.findByID({
    collection: 'users',
    id,
    depth: 0,
    overrideAccess: true,
    req,
  })

  return target.globalRole !== 'super-admin'
},
  },

  hooks: {
    beforeChange: [
      ({ data, operation, originalDoc }) => {
        if (operation === 'create') {
          data.globalRole = 'staff'
        } else {
          data.globalRole = originalDoc?.globalRole ?? 'staff'

          if (originalDoc?.globalRole === 'super-admin') {
            data.isActive = true
          }
        }

        return data
      },
    ],

  },

  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Full Name',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'Phone Number',
    },
    {
      name: 'globalRole',
      type: 'select',
      label: 'Global Role',
      defaultValue: 'staff',
      required: true,
      access: {
        create: () => false,
        update: () => false,
      },
      options: [
        {
          label: 'Super Administrator',
          value: 'super-admin',
        },
        {
          label: 'Staff',
          value: 'staff',
        },
      ],
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active Account',
      defaultValue: true,
      access: {
        update: ({ req }) => isAdministrator(req.user),
      },
    },
  ],
}
