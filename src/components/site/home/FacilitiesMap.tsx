'use client'

import 'leaflet/dist/leaflet.css'

import L from 'leaflet'
import { useLocale, useTranslations } from 'next-intl'
import { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, TileLayer, useMap } from 'react-leaflet'

import { Icon } from '@/components/ui/Icon'
import { ICON_PATHS } from '@/components/ui/icon-paths'
import type { SitePlace } from '@/lib/site/types'

import {
  CATEGORY_STYLE,
  DEFAULT_STYLE,
  directionsUrl,
  FILTERS,
  type MapFilter,
  SEEB_CENTER,
  TILES,
} from './map-config'

const escapeHtml = (value: string) =>
  value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`)

const styleFor = (place: SitePlace) => CATEGORY_STYLE[place.category] ?? DEFAULT_STYLE

/** Marker from the prototype: name label, coloured circle with icon, small pointer. */
function markerIcon(place: SitePlace, selected: boolean) {
  const { color, icon } = styleFor(place)
  const big = selected
  const html = `
    <div class="${big ? 'z-20' : 'z-10'} relative -translate-x-1/2 -translate-y-full cursor-pointer transition-transform hover:scale-110">
      <div class="flex flex-col items-center">
        <div class="mb-1 flex items-center gap-1.5 rounded-full border border-slate-200 whitespace-nowrap font-bold text-primary ${
          big
            ? 'bg-white px-2.5 py-1 text-xs shadow-md'
            : 'bg-white/95 px-2 py-0.5 text-[11px] shadow-sm'
        }">
          <span class="${big ? 'h-2 w-2' : 'h-1.5 w-1.5'} rounded-full" style="background:${color}"></span>
          <span>${escapeHtml(place.name)}</span>
        </div>
        <div class="relative flex items-center justify-center">
          <div class="flex items-center justify-center rounded-full text-white ${
            big ? 'h-8 w-8 shadow-lg ring-4 ring-white' : 'h-6 w-6 shadow ring-2 ring-white'
          }" style="background:${color}">
            <svg viewBox="0 -960 960 960" fill="currentColor" class="${big ? 'h-[19px] w-[19px]' : 'h-[15px] w-[15px]'}" aria-hidden="true"><path d="${ICON_PATHS[icon]}"/></svg>
          </div>
        </div>
        <div class="-mt-1 h-2 w-2 rotate-45 ring-1 ring-white" style="background:${color}"></div>
      </div>
    </div>`
  return L.divIcon({ html, className: '', iconSize: [0, 0], iconAnchor: [0, 0] })
}

/** Keeps a reference to the Leaflet map so the overlay buttons can control it. */
function MapRef({ onReady }: { onReady: (map: L.Map) => void }) {
  const map = useMap()
  useEffect(() => onReady(map), [map, onReady])
  return null
}

export function FacilitiesMap({ places }: { places: SitePlace[] }) {
  const t = useTranslations('siteHome.map')
  const tSite = useTranslations('site')
  const locale = useLocale()
  const [map, setMap] = useState<L.Map | null>(null)
  const [filter, setFilter] = useState<MapFilter>('all')
  const [query, setQuery] = useState('')
  const [layer, setLayer] = useState<'map' | 'satellite'>('map')
  const [selectedId, setSelectedId] = useState<SitePlace['id'] | null>(null)
  const [me, setMe] = useState<[number, number] | null>(null)
  const [locationError, setLocationError] = useState(false)

  const visible = useMemo(
    () => places.filter((place) => filter === 'all' || styleFor(place).filter === filter),
    [places, filter],
  )

  const results = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q
      ? visible.filter((p) => `${p.name} ${p.address ?? ''}`.toLowerCase().includes(q))
      : visible
    return list.slice(0, q ? 6 : 3)
  }, [visible, query])

  const selected = places.find((place) => place.id === selectedId) ?? null

  // Fit the map to the visible markers whenever the filter changes.
  useEffect(() => {
    if (!map || !visible.length) return
    const bounds = L.latLngBounds(visible.map((p) => [p.latitude, p.longitude]))
    map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15 })
  }, [map, visible])

  const select = (place: SitePlace) => {
    setSelectedId(place.id)
    map?.flyTo([place.latitude, place.longitude], Math.max(map.getZoom(), 14), { duration: 0.6 })
  }

  const locate = () => {
    setLocationError(false)
    if (!navigator.geolocation) return setLocationError(true)
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const position: [number, number] = [coords.latitude, coords.longitude]
        setMe(position)
        map?.flyTo(position, 14, { duration: 0.6 })
      },
      () => setLocationError(true),
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }

  const tiles = TILES[layer]

  return (
    <>
      <MapContainer
        center={SEEB_CENTER}
        zoom={12}
        zoomControl={false}
        attributionControl={false}
        scrollWheelZoom={false}
        className="absolute inset-0 z-0 h-full w-full"
      >
        <MapRef onReady={setMap} />
        <TileLayer key={layer} url={tiles.url} maxZoom={tiles.maxZoom} />
        {visible.map((place) => (
          <Marker
            key={place.id}
            position={[place.latitude, place.longitude]}
            icon={markerIcon(place, place.id === selectedId)}
            zIndexOffset={place.id === selectedId ? 1000 : 0}
            title={place.name}
            alt={place.name}
            keyboard
            eventHandlers={{ click: () => select(place) }}
          />
        ))}
        {me ? (
          <CircleMarker
            center={me}
            radius={8}
            pathOptions={{ color: '#ffffff', weight: 3, fillColor: '#1a73e8', fillOpacity: 1 }}
          />
        ) : null}
      </MapContainer>

      {/* Search and filters (top start corner) */}
      <div className="absolute start-4 top-4 z-[1000] flex w-80 max-w-[calc(100%-2rem)] flex-col gap-2">
        <div className="relative overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-lg">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Icon name="search" className="text-xl text-slate-400" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              aria-label={t('searchLabel')}
              placeholder={t('searchPlaceholder')}
              className="w-full border-0 bg-transparent p-0 text-xs text-slate-800 placeholder-slate-400 focus:ring-0 focus:outline-none"
            />
            {query ? (
              <button
                type="button"
                onClick={() => setQuery('')}
                aria-label={t('clear')}
                className="flex items-center text-slate-400 hover:text-slate-600"
              >
                <Icon name="close" className="text-base" />
              </button>
            ) : null}
            <span className="h-4 w-px bg-slate-200" />
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query || (locale === 'ar' ? 'ولاية السيب' : 'Seeb, Oman'))}`}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t('openInGoogle')}
              title={t('openInGoogle')}
              className="flex items-center text-secondary hover:text-primary"
            >
              <Icon name="directions" className="text-lg" />
            </a>
          </div>
          <div className="border-t border-slate-100 bg-white py-1">
            {results.length ? (
              results.map((place) => {
                const style = styleFor(place)
                const active = place.id === selectedId
                return (
                  <button
                    key={place.id}
                    type="button"
                    onClick={() => select(place)}
                    className={`flex w-full cursor-pointer items-center gap-2.5 border-s-2 px-3 py-2 text-start transition-colors hover:bg-slate-50 ${
                      active ? 'border-secondary' : 'border-transparent'
                    }`}
                  >
                    <span style={{ color: style.color }} className="flex">
                      <Icon name={style.icon} className="text-base" />
                    </span>
                    <span className="flex flex-col text-start">
                      <span
                        className={`text-xs font-bold ${active ? 'text-primary' : 'text-slate-700'}`}
                      >
                        {place.name}
                      </span>
                      {place.address ? (
                        <span className="text-[10px] text-slate-400">{place.address}</span>
                      ) : null}
                    </span>
                  </button>
                )
              })
            ) : (
              <p className="px-3 py-2 text-xs text-slate-500">{t('noResults')}</p>
            )}
          </div>
        </div>
        <div
          role="group"
          aria-label={t('filtersLabel')}
          className="flex items-center gap-1.5 overflow-x-auto pb-1 select-none"
        >
          {FILTERS.map((item) => {
            const active = filter === item.key
            return (
              <button
                key={item.key}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(item.key)}
                className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-primary px-3 text-white shadow-md'
                    : 'border border-slate-200/80 bg-white text-slate-700 shadow hover:bg-slate-50'
                }`}
              >
                {item.dot && !active ? (
                  <span className="h-2 w-2 rounded-full" style={{ background: item.dot }} />
                ) : null}
                <span>{t(`filters.${item.key}`)}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Map / satellite switch (top end corner) */}
      <div role="group" aria-label={t('layersLabel')} className="absolute end-4 top-4 z-[1000]">
        <div className="inline-flex rounded-sm border border-slate-200/80 bg-white p-0.5 text-xs font-bold shadow-md">
          {(['map', 'satellite'] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={layer === value}
              onClick={() => setLayer(value)}
              className={`flex items-center gap-1 rounded-xs px-3 py-1 transition-colors ${
                layer === value
                  ? 'bg-primary text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Icon name={value === 'map' ? 'map' : 'satellite_alt'} className="text-sm" />
              <span>{value === 'map' ? t('mapView') : t('satellite')}</span>
            </button>
          ))}
        </div>
      </div>

      {/* My location + zoom (bottom end corner) */}
      <div className="absolute end-4 bottom-8 z-[1000] flex flex-col gap-2">
        <button
          type="button"
          onClick={locate}
          title={t('myLocation')}
          aria-label={t('myLocation')}
          className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200/80 bg-white text-slate-700 shadow-md transition-colors hover:text-primary"
        >
          <Icon name="my_location" className="text-xl" />
        </button>
        <div className="flex flex-col overflow-hidden rounded-lg border border-slate-200/80 bg-white shadow-md">
          <button
            type="button"
            onClick={() => map?.zoomIn()}
            title={t('zoomIn')}
            aria-label={t('zoomIn')}
            className="flex h-9 w-10 items-center justify-center border-b border-slate-100 font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Icon name="add" className="text-base" />
          </button>
          <button
            type="button"
            onClick={() => map?.zoomOut()}
            title={t('zoomOut')}
            aria-label={t('zoomOut')}
            className="flex h-9 w-10 items-center justify-center font-bold text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Icon name="remove" className="text-base" />
          </button>
        </div>
      </div>
      {locationError ? (
        <p
          role="alert"
          className="absolute end-16 bottom-10 z-[1000] rounded-sm bg-white px-3 py-1.5 text-xs font-bold text-error shadow-md"
        >
          {t('locationError')}
        </p>
      ) : null}

      {/* Selected place card */}
      {selected ? (
        <div
          role="dialog"
          aria-label={selected.name}
          className="absolute inset-x-4 bottom-4 z-[1000] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:inset-x-auto sm:end-24 sm:top-24 sm:bottom-auto sm:w-80 lg:end-32"
        >
          <div className="relative h-32 w-full overflow-hidden bg-slate-100">
            {selected.photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={selected.photo.cardUrl ?? selected.photo.url}
                alt={selected.name}
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="h-full w-full bg-gradient-to-br from-primary to-secondary opacity-80" />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              title={t('close')}
              aria-label={t('close')}
              className="absolute end-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-xl bg-black/50 text-white transition-colors hover:bg-black/75"
            >
              <Icon name="close" className="text-base" />
            </button>
            <div className="absolute start-3 bottom-2.5 text-white">
              <span
                className="inline-block rounded-xs px-2 py-0.5 text-[10px] font-bold"
                style={{ background: styleFor(selected).color }}
              >
                {selected.label || tSite(`placeCategories.${selected.category}`)}
              </span>
            </div>
          </div>
          <div className="p-3.5 text-start">
            <h3 className="mb-1 text-sm leading-snug font-bold text-primary">{selected.name}</h3>
            {selected.open24h ? (
              <div className="mb-2.5 text-[11px] font-bold text-emerald-700">{t('open24h')}</div>
            ) : null}
            <div className="mb-3 space-y-1.5 text-[11px] text-slate-600">
              {selected.address ? (
                <div className="flex items-start gap-1.5">
                  <Icon name="location_on" className="mt-0.5 text-sm text-slate-400" />
                  <span className="flex-1 leading-tight">{selected.address}</span>
                </div>
              ) : null}
              {selected.hours ? (
                <div className="flex items-center gap-1.5">
                  <Icon name="schedule" className="text-sm text-slate-400" />
                  <span>{t('hours', { hours: selected.hours })}</span>
                </div>
              ) : null}
              {selected.phone ? (
                <div className="flex items-center gap-1.5">
                  <Icon name="call" className="text-sm text-slate-400" />
                  <span dir="ltr">{selected.phone}</span>
                </div>
              ) : null}
            </div>
            <div
              className={`grid gap-2 border-t border-slate-100 pt-2 ${selected.phone ? 'grid-cols-2' : 'grid-cols-1'}`}
            >
              <a
                href={directionsUrl(selected.latitude, selected.longitude)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-secondary"
              >
                <Icon name="directions" className="text-sm" />
                <span>{t('directions')}</span>
              </a>
              {selected.phone ? (
                <a
                  href={`tel:${selected.phone.replace(/\s/g, '')}`}
                  className="flex items-center justify-center gap-1.5 rounded-sm border border-slate-200 px-3 py-1.5 text-xs font-bold text-primary transition-colors hover:bg-slate-50"
                >
                  <Icon name="call" className="text-sm" />
                  <span>{t('call')}</span>
                </a>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {/* Required map data credit */}
      <div
        className="absolute start-3 bottom-2 z-[1000] rounded-xs border border-slate-200/60 bg-white/90 px-2 py-0.5 text-[10px] text-slate-500 backdrop-blur-sm"
        dir="ltr"
      >
        {tiles.attribution}
      </div>
    </>
  )
}
