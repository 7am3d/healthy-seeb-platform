import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import path from 'path'
import { buildConfig } from 'payload'
import { fileURLToPath } from 'url'
import sharp from 'sharp'

import { Users } from './collections/Users'
import { Media } from './collections/Media'
import { Committees } from './collections/Committees'
import { CommitteeMemberships } from './collections/CommitteeMemberships'
import { Posts } from './collections/Posts'
import { Places } from './collections/Places'
import { Requests } from './collections/Requests'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    user: Users.slug,
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  collections: [
  Users,
  Media,
  Committees,
  CommitteeMemberships,
  Posts,
  Requests,
  Places,
],
  upload: {
    // Matches the portal form limits: 5 MB images, 20 MB PDFs.
    limits: { fileSize: 20_000_000 },
  },
  editor: lexicalEditor(),
  secret: process.env.PAYLOAD_SECRET || '',
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URL || '',
    },
  }),
  sharp,
  plugins: [],
})
