import type { IconName } from '@/components/ui/Icon'
import type { Place } from '@/payload-types'

export type MapFilter = 'all' | 'health' | 'schools' | 'police' | 'parks'

/** Which home map filter each place category belongs to, with its marker colour and icon. */
export const CATEGORY_STYLE: Partial<
  Record<Place['category'], { filter: Exclude<MapFilter, 'all'>; color: string; icon: IconName }>
> = {
  hospital: { filter: 'health', color: '#116e68', icon: 'local_hospital' },
  'health-center': { filter: 'health', color: '#116e68', icon: 'health_and_safety' },
  pharmacy: { filter: 'health', color: '#116e68', icon: 'health_and_safety' },
  school: { filter: 'schools', color: '#b79f7d', icon: 'school' },
  university: { filter: 'schools', color: '#b79f7d', icon: 'school' },
  kindergarten: { filter: 'schools', color: '#b79f7d', icon: 'school' },
  police: { filter: 'police', color: '#014260', icon: 'local_police' },
  'civil-defense': { filter: 'police', color: '#014260', icon: 'local_police' },
  park: { filter: 'parks', color: '#2e7d32', icon: 'park' },
  beach: { filter: 'parks', color: '#2e7d32', icon: 'nature_people' },
}

export const DEFAULT_STYLE: { filter?: Exclude<MapFilter, 'all'>; color: string; icon: IconName } =
  {
    color: '#014260',
    icon: 'location_on',
  }

export const FILTERS: Array<{ key: MapFilter; dot?: string }> = [
  { key: 'all' },
  { key: 'health', dot: '#116e68' },
  { key: 'schools', dot: '#b79f7d' },
  { key: 'police', dot: '#014260' },
  { key: 'parks', dot: '#2e7d32' },
]

/** Centre of Wilayat Seeb, used before the markers are fitted. */
export const SEEB_CENTER: [number, number] = [23.665, 58.19]

// Map tiles. Both need visible attribution (shown in the bottom corner of the map).
export const TILES = {
  map: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '© OpenStreetMap contributors © CARTO',
    maxZoom: 19,
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri, Maxar, Earthstar Geographics',
    maxZoom: 18,
  },
} as const

export const directionsUrl = (lat: number, lng: number) =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
