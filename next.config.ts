import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

const nextConfig: NextConfig = {
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        // Logos and other site images in /public/brand
        pathname: '/brand/**',
      },
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  turbopack: {
    root: path.resolve(dirname),
  },
  experimental: {
    // Staff upload post photos (up to 5 MB) and PDF reports (up to 20 MB) one file at a time
    // through a server action (src/app/(frontend)/[locale]/portal/(staff)/posts/actions.ts).
    // Next.js allows 1 MB by default; leave room for the form-data overhead.
    serverActions: { bodySizeLimit: '21mb' },
    // The language proxy (src/proxy.ts) also runs on portal pages and buffers request bodies.
    proxyClientMaxBodySize: '21mb',
  },
}

// Connects next-intl (Arabic/English) to the app. See src/i18n/request.ts.
const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts')

export default withPayload(withNextIntl(nextConfig), { devBundleServerPackages: false })
