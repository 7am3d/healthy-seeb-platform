// Data for the public website. Every query runs as an anonymous visitor
// (overrideAccess: false, no user), so the collections' access rules guarantee that
// only active committees, published committee pages and approved posts are shown.
import config from '@payload-config'
import { convertLexicalToHTML } from '@payloadcms/richtext-lexical/html'
import type { SerializedEditorState } from '@payloadcms/richtext-lexical/lexical'
import { getPayload, type Where } from 'payload'
import { cache } from 'react'

import type { Committee, Media, Place, Post } from '@/payload-types'

import type { SiteCommittee, SiteFile, SiteImage, SitePlace, SitePost } from './types'

const getClient = cache(() => getPayload({ config }))
const asVisitor = { overrideAccess: false } as const

// ---------- helpers ----------

const toImage = (media: number | Media | null | undefined): SiteImage | null => {
  if (!media || typeof media !== 'object' || !media.url) return null
  return {
    url: media.url,
    alt: media.alt ?? '',
    width: media.width,
    height: media.height,
    cardUrl: media.sizes?.card?.url ?? null,
  }
}

const toFile = (media: number | Media | null | undefined): SiteFile | null => {
  if (!media || typeof media !== 'object' || !media.url) return null
  return { url: media.url, filename: media.filename ?? 'document.pdf', filesize: media.filesize }
}

export function toSitePost(post: Post): SitePost {
  const committee = typeof post.committee === 'object' ? post.committee : null
  let contentHtml = ''
  try {
    contentHtml = post.content
      ? convertLexicalToHTML({
          data: post.content as unknown as SerializedEditorState,
          disableContainer: true,
        })
      : ''
  } catch {
    contentHtml = ''
  }
  return {
    id: post.id,
    title: post.title,
    summary: post.summary ?? '',
    contentHtml,
    type: post.type,
    date: post.eventDate ?? post.createdAt,
    location: post.location ?? null,
    committee: committee ? { name: committee.name, code: committee.code } : null,
    cover: toImage(post.coverImage),
    gallery: (post.gallery ?? [])
      .map((item) => toImage(item.image))
      .filter((image): image is SiteImage => !!image),
    attachment: toFile(post.attachment),
    links: post.links ?? {},
  }
}

const committeeSelect = {
  name: true,
  code: true,
  description: true,
  shortDescription: true,
  icon: true,
  chairName: true,
  chairTitle: true,
  chairEmail: true,
  email: true,
  rapporteurName: true,
  rapporteurTitle: true,
  members: true,
  responsibilities: true,
  suggestionsPrompt: true,
  suggestionsText: true,
} as const

// ---------- committees ----------

export const getSiteCommittees = cache(async (): Promise<SiteCommittee[]> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'committees',
    sort: 'sortOrder',
    limit: 50,
    depth: 0,
    select: committeeSelect,
    ...asVisitor,
  })
  return docs as SiteCommittee[]
})

export const getSiteCommittee = cache(async (code: string): Promise<SiteCommittee | null> => {
  const payload = await getClient()
  const { docs } = await payload.find({
    collection: 'committees',
    where: { code: { equals: code } },
    limit: 1,
    depth: 0,
    select: committeeSelect,
    ...asVisitor,
  })
  return (docs[0] as SiteCommittee | undefined) ?? null
})

// ---------- posts ----------

export async function getSitePosts(options: {
  committee?: Committee['id']
  type?: Post['type'] | Post['type'][]
  limit?: number
  page?: number
}): Promise<{ posts: SitePost[]; totalDocs: number; totalPages: number; page: number }> {
  const payload = await getClient()
  const and: Where[] = []
  if (options.committee) and.push({ committee: { equals: options.committee } })
  if (options.type) {
    and.push({
      type: Array.isArray(options.type) ? { in: options.type } : { equals: options.type },
    })
  }

  const result = await payload.find({
    collection: 'posts',
    where: and.length ? { and } : undefined,
    sort: ['-eventDate', '-createdAt'],
    limit: options.limit ?? 12,
    page: options.page ?? 1,
    depth: 1,
    ...asVisitor,
  })

  return {
    posts: result.docs.map(toSitePost),
    totalDocs: result.totalDocs,
    totalPages: result.totalPages,
    page: result.page ?? 1,
  }
}

// ---------- map places ----------

const toSitePlace = (place: Place): SitePlace => ({
  id: place.id,
  name: place.name,
  category: place.category,
  label: place.label,
  address: place.address,
  latitude: place.latitude,
  longitude: place.longitude,
  phone: place.phone,
  hours: place.hours,
  open24h: place.open24h,
  services: place.services,
  googleMapsUrl: place.googleMapsUrl,
  photo: toImage(place.photo),
})

export async function getSitePlaces(options: { homeMap?: boolean; committee?: Committee['id'] }) {
  const payload = await getClient()
  const and: Where[] = []
  if (options.homeMap) and.push({ showOnHomeMap: { equals: true } })
  if (options.committee) and.push({ committees: { in: [options.committee] } })

  const { docs } = await payload.find({
    collection: 'places',
    where: and.length ? { and } : undefined,
    sort: 'name',
    limit: 500,
    depth: 1,
    ...asVisitor,
  })
  return docs.map(toSitePlace)
}
