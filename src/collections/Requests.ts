import type { CollectionConfig, FieldAccess, Where } from 'payload'

import { activeCommitteeIDs, isAdministrator } from '../access/roles'

const adminOnlyField: FieldAccess = ({ req }) => isAdministrator(req.user)

/**
 * Messages from the public website:
 *  - "contribution": the "Contribute with us" form (volunteer, partner, sponsor, donor)
 *  - "message": a committee's "Submit a suggestion" form (suggestion or complaint)
 *
 * Workflow (UI/UX design):
 *  1. Admin inbox / approvals: reviewStatus new → referred (sent to a committee) | accepted | rejected
 *  2. Committee follow-up (staff "Referred requests", admin "Tracking"):
 *     followUpStatus new → contacted → in-progress → completed
 *
 * The public forms save through a server action (src/app/(frontend)/[locale]/(site)/actions.ts),
 * so nobody can create requests through the API directly.
 */
export const Requests: CollectionConfig = {
  slug: 'requests',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'type', 'committee', 'reviewStatus', 'followUpStatus', 'createdAt'],
    group: 'Healthy Seeb',
  },

  access: {
    create: ({ req }) => isAdministrator(req.user),

    // Admins see everything; committee members see requests referred to their committee.
    read: async ({ req }): Promise<boolean | Where> => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true
      if (!(req.user as { isActive?: boolean }).isActive) return false

      const committeeIDs = await activeCommitteeIDs(req)
      if (committeeIDs.length === 0) return false

      return {
        and: [{ committee: { in: committeeIDs } }, { reviewStatus: { equals: 'referred' } }],
      }
    },

    // Committee members may update the follow-up fields only (see field access below).
    update: async ({ req }): Promise<boolean | Where> => {
      if (!req.user) return false
      if (isAdministrator(req.user)) return true
      if (!(req.user as { isActive?: boolean }).isActive) return false

      const committeeIDs = await activeCommitteeIDs(req)
      if (committeeIDs.length === 0) return false

      return {
        and: [{ committee: { in: committeeIDs } }, { reviewStatus: { equals: 'referred' } }],
      }
    },

    delete: ({ req }) => isAdministrator(req.user),
  },

  hooks: {
    beforeChange: [
      ({ data, originalDoc, req }) => {
        // Record who referred the request and when.
        if (data.reviewStatus === 'referred' && originalDoc?.reviewStatus !== 'referred') {
          data.referredAt = new Date().toISOString()
          if (req.user) data.referredBy = req.user.id
          data.followUpStatus = data.followUpStatus ?? 'new'
        }
        return data
      },
    ],
  },

  fields: [
    {
      type: 'row',
      fields: [
        {
          name: 'kind',
          type: 'select',
          required: true,
          access: { update: adminOnlyField },
          options: [
            { label: 'Contribution', value: 'contribution' },
            { label: 'Suggestion / complaint', value: 'message' },
          ],
        },
        {
          name: 'type',
          type: 'select',
          required: true,
          access: { update: adminOnlyField },
          options: [
            { label: 'Volunteering', value: 'volunteering' },
            { label: 'Sponsorship', value: 'sponsorship' },
            { label: 'Partnership', value: 'partnership' },
            { label: 'Donation', value: 'donation' },
            { label: 'Suggestion', value: 'suggestion' },
            { label: 'Complaint', value: 'complaint' },
          ],
        },
        {
          name: 'submitterType',
          type: 'select',
          required: true,
          access: { update: adminOnlyField },
          options: [
            { label: 'Individual / volunteer', value: 'individual' },
            { label: 'Company / organisation', value: 'organization' },
            { label: 'Website visitor', value: 'visitor' },
          ],
        },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'name', type: 'text', access: { update: adminOnlyField } },
        { name: 'email', type: 'email', access: { update: adminOnlyField } },
        { name: 'phone', type: 'text', access: { update: adminOnlyField } },
      ],
    },
    {
      name: 'message',
      type: 'textarea',
      required: true,
      maxLength: 3000,
      access: { update: adminOnlyField },
    },
    {
      name: 'committee',
      type: 'relationship',
      relationTo: 'committees',
      label: 'Committee',
      admin: { description: 'The committee chosen by the visitor, or the one it is referred to.' },
      access: { update: adminOnlyField },
    },
    {
      name: 'reviewStatus',
      type: 'select',
      required: true,
      defaultValue: 'new',
      label: 'Admin review',
      access: { update: adminOnlyField },
      options: [
        { label: 'New', value: 'new' },
        { label: 'Referred to committee', value: 'referred' },
        { label: 'Accepted', value: 'accepted' },
        { label: 'Rejected', value: 'rejected' },
      ],
    },
    {
      name: 'followUpStatus',
      type: 'select',
      label: 'Committee follow-up',
      options: [
        { label: 'New', value: 'new' },
        { label: 'Contacted', value: 'contacted' },
        { label: 'In progress', value: 'in-progress' },
        { label: 'Completed', value: 'completed' },
      ],
    },
    {
      name: 'followUpNotes',
      type: 'array',
      label: 'Follow-up notes',
      fields: [
        { name: 'note', type: 'textarea', required: true },
        {
          name: 'author',
          type: 'relationship',
          relationTo: 'users',
          admin: { readOnly: true },
          hooks: {
            beforeChange: [({ value, req }) => value ?? req.user?.id],
          },
        },
        {
          name: 'date',
          type: 'date',
          admin: { readOnly: true },
          hooks: {
            beforeChange: [({ value }) => value ?? new Date().toISOString()],
          },
        },
      ],
    },
    {
      name: 'adminNotes',
      type: 'textarea',
      label: 'Admin notes / rejection reason',
      access: { read: adminOnlyField, update: adminOnlyField },
    },
    {
      type: 'row',
      fields: [
        {
          name: 'referredAt',
          type: 'date',
          admin: { readOnly: true },
          access: { update: adminOnlyField },
        },
        {
          name: 'referredBy',
          type: 'relationship',
          relationTo: 'users',
          admin: { readOnly: true },
          access: { update: adminOnlyField },
        },
      ],
    },
    {
      name: 'agreedToTerms',
      type: 'checkbox',
      defaultValue: false,
      access: { update: adminOnlyField },
    },
    {
      name: 'sourcePage',
      type: 'text',
      label: 'Sent from page',
      admin: { readOnly: true },
      access: { update: adminOnlyField },
    },
  ],
}
