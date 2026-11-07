
import type { CollectionConfig } from 'payload'

const isAdministrator = (user: any) =>
  user?.globalRole === 'super-admin' ||
  user?.globalRole === 'administrator'

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

    delete: ({ req }) => isAdministrator(req.user),
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
        update: ({ req }) => isAdministrator(req.user),
      },
      options: [
        {
          label: 'Super Administrator',
          value: 'super-admin',
        },
        {
          label: 'Administrator',
          value: 'administrator',
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
