import type { CollectionConfig, Where } from 'payload'

import { isAdministrator } from '../access/roles'

/**
 * Places shown on the home page map and on each committee's "Maps" tab.
 * The category decides the marker colour/icon and which map filter it belongs to.
 */
export const PLACE_CATEGORIES = [
  'hospital',
  'health-center',
  'pharmacy',
  'school',
  'university',
  'kindergarten',
  'police',
  'civil-defense',
  'park',
  'beach',
  'municipality',
  'mall',
  'bank',
  'market',
  'broadcaster',
  'media-office',
  'printing-press',
  'community-center',
  'charity',
  'club',
] as const

export const Places: CollectionConfig = {
  slug: 'places',

  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'category', 'showOnHomeMap', 'isActive'],
    group: 'Healthy Seeb',
  },

  access: {
    read: ({ req }): boolean | Where =>
      isAdministrator(req.user) ? true : { isActive: { equals: true } },
    create: ({ req }) => isAdministrator(req.user),
    update: ({ req }) => isAdministrator(req.user),
    delete: ({ req }) => isAdministrator(req.user),
  },

  fields: [
    { name: 'name', type: 'text', required: true },
    {
      type: 'row',
      fields: [
        {
          name: 'category',
          type: 'select',
          required: true,
          options: PLACE_CATEGORIES.map((value) => ({ label: value, value })),
        },
        {
          name: 'label',
          type: 'text',
          label: 'Badge text',
          admin: { description: 'Optional, e.g. "Government health facility".' },
        },
      ],
    },
    { name: 'address', type: 'text' },
    {
      type: 'row',
      fields: [
        { name: 'latitude', type: 'number', required: true, min: -90, max: 90 },
        { name: 'longitude', type: 'number', required: true, min: -180, max: 180 },
      ],
    },
    {
      type: 'row',
      fields: [
        { name: 'phone', type: 'text' },
        { name: 'hours', type: 'text', label: 'Opening hours' },
        { name: 'open24h', type: 'checkbox', label: 'Open 24 hours' },
      ],
    },
    { name: 'services', type: 'textarea' },
    { name: 'photo', type: 'upload', relationTo: 'media' },
    {
      name: 'googleMapsUrl',
      type: 'text',
      label: 'Google Maps link',
      admin: { description: 'Optional. Used for the "Open in Google Maps" link.' },
    },
    {
      name: 'committees',
      type: 'relationship',
      relationTo: 'committees',
      hasMany: true,
      label: 'Show on these committee pages',
    },
    {
      type: 'row',
      fields: [
        {
          name: 'showOnHomeMap',
          type: 'checkbox',
          label: 'Show on home page map',
          defaultValue: true,
        },
        { name: 'isActive', type: 'checkbox', defaultValue: true },
      ],
    },
  ],
}
