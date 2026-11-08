import type { CollectionConfig } from 'payload'

import { isAdministrator } from '../access/roles'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
    // Any signed-in user can upload (staff add photos and PDFs to their posts);
    // only administrators can change or delete files.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => isAdministrator(req.user),
    delete: ({ req }) => isAdministrator(req.user),
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      required: true,
    },
  ],
  upload: {
    // Photos for posts and map places, and PDF attachments.
    mimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'],
    // Smaller copies so cards and galleries load fast.
    imageSizes: [
      { name: 'thumbnail', width: 400, height: 300, position: 'centre' },
      { name: 'card', width: 800, height: 450, position: 'centre' },
    ],
  },
}
