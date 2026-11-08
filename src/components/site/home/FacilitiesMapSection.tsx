'use client'

import dynamic from 'next/dynamic'
import { useTranslations } from 'next-intl'

import type { SitePlace } from '@/lib/site/types'

import { SectionHeading } from '../SectionHeading'

// Leaflet only works in the browser, so the map is loaded on the client.
const FacilitiesMap = dynamic(() => import('./FacilitiesMap').then((m) => m.FacilitiesMap), {
  ssr: false,
  loading: () => <MapLoading />,
})

function MapLoading() {
  const t = useTranslations('siteHome.map')
  return (
    <div className="flex h-full w-full items-center justify-center text-body-sm text-on-surface-variant">
      {t('loading')}
    </div>
  )
}

/** Home page section: "Map of facilities and services in Wilayat Seeb". */
export function FacilitiesMapSection({ places }: { places: SitePlace[] }) {
  const t = useTranslations('siteHome.map')

  return (
    <section id="map-section" className="w-full scroll-mt-20 bg-white py-24">
      <div className="mx-auto w-full max-w-[1280px] px-margin text-start">
        <div className="mb-space-lg max-w-3xl">
          <SectionHeading title={t('title')} subtitle={t('subtitle')} className="" />
        </div>
        <div
          role="region"
          aria-label={t('label')}
          className="relative h-[600px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-[#e8ecef] shadow-xl select-none"
        >
          <FacilitiesMap places={places} />
        </div>
      </div>
    </section>
  )
}
