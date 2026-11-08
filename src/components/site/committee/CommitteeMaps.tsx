'use client'

import { useTranslations } from 'next-intl'
import { useMemo, useState } from 'react'

import type { SitePlace } from '@/lib/site/types'

const embedUrl = (place: SitePlace, locale: string) =>
  `https://maps.google.com/maps?q=${place.latitude},${place.longitude}&hl=${locale}&z=15&output=embed`

const googleUrl = (place: SitePlace) =>
  place.googleMapsUrl && /^https?:\/\//.test(place.googleMapsUrl)
    ? place.googleMapsUrl
    : `https://www.google.com/maps/search/?api=1&query=${place.latitude},${place.longitude}`

/** Committee "Maps" tab: category pills, a list of places and an embedded Google map (as in the prototype). */
export function CommitteeMaps({
  places,
  locale,
  frameTitle,
  emptyText,
}: {
  places: SitePlace[]
  locale: string
  frameTitle: string
  emptyText: string
}) {
  const t = useTranslations('site.placeCategories')
  const tCommittee = useTranslations('siteCommittee.maps')

  // Group the places by category, keeping the order they first appear in.
  const groups = useMemo(() => {
    const map = new Map<SitePlace['category'], SitePlace[]>()
    for (const place of places) map.set(place.category, [...(map.get(place.category) ?? []), place])
    return [...map.entries()]
  }, [places])

  const [groupIndex, setGroupIndex] = useState(0)
  const [placeIndex, setPlaceIndex] = useState(0)

  if (!groups.length) return <p className="text-body-md text-on-surface-variant">{emptyText}</p>

  const [, list] = groups[groupIndex]
  const selected = list[placeIndex] ?? list[0]

  return (
    <>
      <div className="flex flex-wrap items-center gap-space-sm">
        {groups.map(([category], index) => (
          <button
            key={category}
            type="button"
            aria-pressed={index === groupIndex}
            onClick={() => {
              setGroupIndex(index)
              setPlaceIndex(0)
            }}
            className={`cursor-pointer rounded-xl px-space-md py-space-xs text-label-md font-bold transition-colors ${
              index === groupIndex ? 'bg-primary text-white' : 'bg-mint text-secondary'
            }`}
          >
            {t(category)}
          </button>
        ))}
      </div>
      <div className="mt-space-md grid grid-cols-1 items-start gap-space-md lg:grid-cols-3">
        <div className="order-2 flex flex-col gap-space-sm lg:order-1 lg:max-h-[480px] lg:overflow-y-auto">
          {list.map((place, index) => (
            <div
              key={place.id}
              className={`flex flex-col gap-3 rounded-lg border p-4 ${
                index === placeIndex
                  ? 'border-secondary bg-mint'
                  : 'border-outline-variant/40 bg-surface-container-lowest'
              }`}
            >
              <button
                type="button"
                onClick={() => setPlaceIndex(index)}
                className="text-start"
                aria-pressed={index === placeIndex}
              >
                <span className="block text-label-md font-bold text-primary">{place.name}</span>
                {place.address ? (
                  <span className="block text-body-sm text-outline">{place.address}</span>
                ) : null}
              </button>
              <a
                href={googleUrl(place)}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 self-start rounded-sm bg-primary px-3 py-1.5 text-sm font-bold text-white transition-colors hover:bg-secondary"
              >
                {tCommittee('openInGoogle')}
              </a>
            </div>
          ))}
        </div>
        <div className="order-1 overflow-hidden rounded-sm bg-surface-container-lowest shadow-sm lg:order-2 lg:col-span-2">
          <iframe
            key={selected.id}
            title={frameTitle}
            src={embedUrl(selected, locale)}
            className="h-[480px] w-full border-0"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            allowFullScreen
          />
        </div>
      </div>
    </>
  )
}
