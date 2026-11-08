import type { CollectionConfig, FieldAccess, Where } from 'payload'
import { APIError } from 'payload'

import { activeCommitteeIDs, isAdministrator } from '../access/roles'

const adminOnlyField: FieldAccess = ({ req }) => isAdministrator(req.user)

/** Icons available for committees (Material Symbols names used by the UI/UX design). */
export const COMMITTEE_ICONS = [
  'vital_signs',
  'school',
  'groups',
  'eco',
  'campaign',
  'trending_up',
  'warning',
] as const

export const Committees: CollectionConfig = {
  slug: 'committees',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'code', 'isActive', '_status'],
    group: 'Healthy Seeb',
  },

  // Committee members edit their public page as a draft; an administrator publishes it.
  // Public pages always show the last published version.
  versions: {
    drafts: true,
    maxPerDoc: 20,
  },

  access: {
    read: async ({ req }): Promise<boolean | Where> => {
      // Public website: active committees only.
      if (!req.user) return { isActive: { equals: true } }

      if (isAdministrator(req.user)) return true

      const committeeIDs = await activeCommitteeIDs(req)

      return {
        or: [{ isActive: { equals: true } }, { id: { in: committeeIDs } }],
      }
    },

    create: ({ req }) => isAdministrator(req.user),

    // Chairs and rapporteurs can edit their own committee page (as a draft, see hook below).
    update: async ({ req }): Promise<boolean | Where> => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true
      if (!(req.user as { isActive?: boolean }).isActive) return false

      const committeeIDs = await activeCommitteeIDs(req, ['chair', 'rapporteur'])
      if (committeeIDs.length === 0) return false

      return { id: { in: committeeIDs } }
    },

    delete: ({ req }) => isAdministrator(req.user),

    readVersions: async ({ req }): Promise<boolean | Where> => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true
      const committeeIDs = await activeCommitteeIDs(req, ['chair', 'rapporteur'])
      return committeeIDs.length > 0 ? { parent: { in: committeeIDs } } : false
    },
  },

  hooks: {
    beforeChange: [
      ({ data, req }) => {
        // Staff changes must wait for an administrator's approval.
        // (No user = trusted server code such as the seed script; API calls without a user are blocked by `access`.)
        if (req.user && !isAdministrator(req.user) && data?._status !== 'draft') {
          throw new APIError(
            'Committee page changes must be saved as a draft for administrator approval.',
            403,
          )
        }
        return data
      },
    ],
  },

  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'Committee Name',
      required: true,
      unique: true,
      access: { update: adminOnlyField },
    },
    {
      name: 'code',
      type: 'text',
      label: 'Committee Code',
      required: true,
      unique: true,
      access: { update: adminOnlyField },
      admin: {
        description:
          'Lowercase English, used in the website address, e.g. "health" → /ar/committees/health',
      },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'Description',
      maxLength: 300,
      admin: { description: 'Shown under the committee name on its public page.' },
    },
    {
      name: 'isActive',
      type: 'checkbox',
      label: 'Active Committee',
      defaultValue: true,
      access: { update: adminOnlyField },
    },

    // ----- Public website profile (staff portal: "Committee page") -----
    {
      type: 'collapsible',
      label: 'Public page',
      fields: [
        {
          name: 'shortDescription',
          type: 'textarea',
          label: 'Short description (home page card)',
          maxLength: 160,
        },
        {
          name: 'icon',
          type: 'select',
          label: 'Icon',
          defaultValue: 'groups',
          options: COMMITTEE_ICONS.map((value) => ({ label: value, value })),
          access: { update: adminOnlyField },
        },
        {
          name: 'sortOrder',
          type: 'number',
          label: 'Display order',
          defaultValue: 0,
          access: { update: adminOnlyField },
        },
        {
          type: 'row',
          fields: [
            { name: 'chairName', type: 'text', label: 'Chair' },
            { name: 'chairEmail', type: 'email', label: 'Chair email' },
          ],
        },
        { name: 'chairTitle', type: 'text', label: 'Chair job title' },
        {
          type: 'row',
          fields: [
            { name: 'rapporteurName', type: 'text', label: 'Rapporteur' },
            { name: 'rapporteurTitle', type: 'text', label: 'Rapporteur job title' },
          ],
        },
        {
          name: 'members',
          type: 'array',
          label: 'Committee members',
          labels: { singular: 'Member', plural: 'Members' },
          fields: [
            {
              type: 'row',
              fields: [
                { name: 'name', type: 'text', required: true },
                { name: 'title', type: 'text', label: 'Job title and organisation' },
              ],
            },
          ],
        },
        {
          name: 'responsibilities',
          type: 'array',
          label: 'Responsibilities',
          labels: { singular: 'Responsibility', plural: 'Responsibilities' },
          fields: [{ name: 'text', type: 'textarea', required: true }],
        },
        {
          name: 'suggestionsPrompt',
          type: 'text',
          label: 'Suggestions box heading',
          admin: {
            description:
              'Optional. E.g. "Do you have a suggestion for a cleaner environment in Seeb?"',
          },
        },
        {
          name: 'suggestionsText',
          type: 'textarea',
          label: 'Suggestions box text',
        },
      ],
    },
  ],
}
