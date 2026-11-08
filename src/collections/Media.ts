import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  access: {
    read: () => true,
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
