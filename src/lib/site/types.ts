// Plain data shapes passed from server pages to browser components on the public website.
import type { Committee, Place, Post } from '@/payload-types'

export type SiteImage = {
  url: string
  alt: string
  width?: number | null
  height?: number | null
  /** Smaller copy for cards, when available. */
  cardUrl?: string | null
}

export type SiteFile = {
  url: string
  filename: string
  filesize?: number | null
}

export type SitePost = {
  id: number
  title: string
  summary: string
  /** Post body as HTML, converted on the server from the rich text editor. */
  contentHtml: string
  type: Post['type']
  /** ISO date: the event date, or the creation date if none was set. */
  date: string
  location: string | null
  committee: { name: string; code: string } | null
  cover: SiteImage | null
  gallery: SiteImage[]
  attachment: SiteFile | null
  links: {
    instagram?: string | null
    youtube?: string | null
    x?: string | null
    press?: string | null
  }
}

export type SiteCommittee = Pick<
  Committee,
  | 'id'
  | 'name'
  | 'code'
  | 'description'
  | 'shortDescription'
  | 'icon'
  | 'chairName'
  | 'chairTitle'
  | 'chairEmail'
  | 'email'
  | 'rapporteurName'
  | 'rapporteurTitle'
  | 'members'
  | 'responsibilities'
  | 'suggestionsPrompt'
  | 'suggestionsText'
>

export type SitePlace = Pick<
  Place,
  | 'id'
  | 'name'
  | 'category'
  | 'label'
  | 'address'
  | 'latitude'
  | 'longitude'
  | 'phone'
  | 'hours'
  | 'open24h'
  | 'services'
  | 'googleMapsUrl'
> & { photo: SiteImage | null }
