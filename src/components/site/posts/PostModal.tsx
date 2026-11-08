'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useCallback, useEffect, useState } from 'react'

import { Dialog } from '@/components/ui/Dialog'
import { Icon } from '@/components/ui/Icon'
import { digits } from '@/lib/format'
import type { SitePost } from '@/lib/site/types'

import { fileSize, formatPostDate } from './format'

const SOCIAL: Array<{ key: 'instagram' | 'youtube' | 'x' | 'press'; color: string; path: string }> =
  [
    {
      key: 'instagram',
      color: 'text-pink-600',
      path: 'M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z',
    },
    {
      key: 'youtube',
      color: 'text-red-600',
      path: 'M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z',
    },
    {
      key: 'x',
      color: 'text-gray-900',
      path: 'M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z',
    },
    {
      key: 'press',
      color: 'text-emerald-700',
      path: 'M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-5 14H7v-2h7v2zm3-4H7v-2h10v2zm0-4H7V7h10v2z',
    },
  ]

const isSafeUrl = (value?: string | null) => !!value && /^https?:\/\//i.test(value)

/** Full post details dialog (prototype: "post-details-modal") with a photo viewer. */
export function PostModal({ post, onClose }: { post: SitePost | null; onClose: () => void }) {
  const t = useTranslations('site')
  const locale = useLocale()
  const [viewer, setViewer] = useState<number | null>(null)

  const images = post ? [...(post.cover ? [post.cover] : []), ...post.gallery] : []
  const size = post?.attachment ? fileSize(locale, post.attachment.filesize) : null
  const links = post ? SOCIAL.filter((item) => isSafeUrl(post.links[item.key])) : []

  return (
    <>
      <Dialog
        open={!!post}
        onClose={() => {
          setViewer(null)
          onClose()
        }}
        labelledBy="post-modal-title"
        baseClassName="m-auto w-[calc(100%-2rem)] max-h-[calc(100vh-3rem)] overflow-hidden"
        className="max-w-5xl rounded-2xl border border-outline-variant/30 bg-surface-container-lowest shadow-2xl"
      >
        {post ? (
          <div className="flex max-h-[calc(100vh-3rem)] flex-col">
            <div className="flex items-center justify-between border-b border-outline-variant/30 bg-surface-container-low p-space-md sm:p-space-lg">
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-secondary px-space-sm py-1 text-label-sm font-bold text-white">
                  {t(`post.types.${post.type}`)}
                </span>
                {post.committee ? (
                  <span className="rounded-xs bg-mint px-space-sm py-1 text-label-sm font-bold text-primary">
                    {post.committee.name}
                  </span>
                ) : null}
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label={t('post.close')}
                className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-xl bg-white text-xl font-bold text-on-surface transition-colors hover:bg-surface-container-high"
              >
                ×
              </button>
            </div>

            <div className="flex flex-col gap-6 overflow-y-auto p-space-md sm:p-space-lg lg:px-10 lg:py-8">
              <h3
                id="post-modal-title"
                className="text-headline-lg leading-snug font-bold text-primary"
              >
                {post.title}
              </h3>

              <div className="flex flex-wrap items-center gap-space-md border-b border-outline-variant/20 pb-space-xs text-body-sm text-on-surface-variant">
                <div className="flex items-center gap-1.5">
                  <svg
                    className="h-4 w-4 flex-shrink-0 text-secondary"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <rect x="3" y="4" width="18" height="18" rx="2" strokeWidth="2" />
                    <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" />
                  </svg>
                  <span className="sr-only">{t('post.date')}: </span>
                  <span className="font-bold text-on-surface">
                    {formatPostDate(locale, post.date)}
                  </span>
                </div>
                {post.location ? (
                  <>
                    <span aria-hidden="true" className="text-outline-variant select-none">
                      •
                    </span>
                    <div className="flex items-center gap-1.5">
                      <svg
                        className="h-4 w-4 flex-shrink-0 text-secondary"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
                          strokeWidth="2"
                        />
                        <circle cx="12" cy="9" r="2.5" strokeWidth="2" />
                      </svg>
                      <span className="sr-only">{t('post.location')}: </span>
                      <span className="text-on-surface-variant">{post.location}</span>
                    </div>
                  </>
                ) : null}
              </div>

              {post.cover ? (
                <button
                  type="button"
                  onClick={() => setViewer(0)}
                  className="group relative aspect-[16/9] w-full shrink-0 cursor-zoom-in overflow-hidden rounded-2xl bg-surface-container shadow-md"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={post.cover.url}
                    alt={post.cover.alt || t('post.coverAlt')}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                  />
                  <span className="absolute end-3 bottom-3 flex items-center gap-1 rounded-xl bg-black/55 px-3 py-1.5 text-xs font-bold text-white opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                    {t('post.viewImage')}
                  </span>
                </button>
              ) : null}

              {post.contentHtml ? (
                <div
                  className="text-body-md leading-relaxed text-on-surface [&_a]:text-secondary [&_a]:underline [&_ol]:list-decimal [&_ol]:ps-6 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:ps-6"
                  // Generated on the server by Payload's rich text converter (escaped text, no raw HTML input).
                  dangerouslySetInnerHTML={{ __html: post.contentHtml }}
                />
              ) : (
                <p className="text-body-md leading-relaxed text-on-surface">{post.summary}</p>
              )}

              {post.gallery.length ? (
                <div className="flex shrink-0 flex-col gap-3">
                  <span className="text-lg font-bold text-primary">{t('post.gallery')}</span>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                    {post.gallery.map((image, index) => (
                      <button
                        key={image.url}
                        type="button"
                        onClick={() => setViewer(index + (post.cover ? 1 : 0))}
                        className="cursor-zoom-in"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={image.cardUrl ?? image.url}
                          alt={
                            image.alt ||
                            t('post.galleryAlt', { number: index + 1, title: post.title })
                          }
                          className="aspect-[4/3] w-full rounded-lg object-cover shadow-sm ring-1 ring-black/5 transition duration-300 hover:scale-[1.03] hover:shadow-lg"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              {post.attachment ? (
                <div className="flex items-center justify-between gap-4 rounded-sm border border-outline-variant/30 bg-surface-container-low p-space-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-sm bg-error-container text-xs font-bold text-error uppercase">
                      PDF
                    </div>
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-label-md font-bold text-primary" dir="auto">
                        {post.attachment.filename}
                      </span>
                      <span className="text-body-sm text-outline">
                        {size ? `${t(`fileSize.${size.unit}`, { size: size.size })} • ` : ''}
                        {t('post.officialDocument')}
                      </span>
                    </div>
                  </div>
                  <a
                    href={post.attachment.url}
                    download={post.attachment.filename}
                    className="rounded-sm bg-primary px-space-md py-1.5 text-label-md font-bold text-white transition-colors hover:bg-secondary"
                  >
                    {t('post.download')}
                  </a>
                </div>
              ) : null}

              {links.length ? (
                <div className="flex flex-col gap-2 border-t border-outline-variant/30 pt-space-xs">
                  <span className="text-label-md font-bold text-primary">{t('post.watchOn')}</span>
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {links.map((item) => (
                      <a
                        key={item.key}
                        href={post.links[item.key]!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 rounded-sm border border-outline-variant/30 bg-surface-container p-2 text-label-sm font-bold text-on-surface transition-all hover:bg-mint hover:text-secondary"
                      >
                        <svg
                          className={`h-4 w-4 ${item.color}`}
                          viewBox="0 0 24 24"
                          fill="currentColor"
                          aria-hidden="true"
                        >
                          <path d={item.path} />
                        </svg>
                        {t(`post.links.${item.key}`)}
                      </a>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </Dialog>

      <Lightbox images={images} index={viewer} onChange={setViewer} />
    </>
  )
}

function Lightbox({
  images,
  index,
  onChange,
}: {
  images: SitePost['gallery']
  index: number | null
  onChange: (index: number | null) => void
}) {
  const t = useTranslations('site')
  const locale = useLocale()
  const count = images.length
  const step = useCallback(
    (direction: 1 | -1) => {
      if (index === null || !count) return
      onChange((index + direction + count) % count)
    },
    [index, count, onChange],
  )

  // Arrow keys move in reading direction: in Arabic, → is "previous".
  useEffect(() => {
    if (index === null) return
    const rtl = document.documentElement.dir === 'rtl'
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') step(rtl ? -1 : 1)
      if (event.key === 'ArrowLeft') step(rtl ? 1 : -1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [index, step])

  const image = index !== null ? images[index] : null
  const number = (value: number) => new Intl.NumberFormat(locale, digits(locale)).format(value)

  return (
    <Dialog
      open={index !== null && !!image}
      onClose={() => onChange(null)}
      baseClassName="m-0 h-screen max-h-none w-screen max-w-none overflow-hidden"
      className="bg-transparent"
      backdropClassName="backdrop:bg-black/90"
    >
      {image ? (
        <div
          className="relative flex h-screen w-screen items-center justify-center"
          onClick={(event) => {
            if (event.target === event.currentTarget) onChange(null)
          }}
        >
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label={t('post.close')}
            className="absolute end-4 top-4 flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl text-white hover:bg-white/25"
          >
            ×
          </button>
          {count > 1 ? (
            <button
              type="button"
              onClick={() => step(-1)}
              aria-label={t('post.previous')}
              className="absolute start-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-3xl text-white hover:bg-white/25"
            >
              <Icon name="chevron_left" className="rtl:-scale-x-100" />
            </button>
          ) : null}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={image.url}
            alt={image.alt}
            className="max-h-[82vh] max-w-[90vw] rounded-sm object-contain shadow-2xl select-none"
          />
          {count > 1 ? (
            <button
              type="button"
              onClick={() => step(1)}
              aria-label={t('post.next')}
              className="absolute end-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-xl bg-white/10 text-3xl text-white hover:bg-white/25"
            >
              <Icon name="chevron_right" className="rtl:-scale-x-100" />
            </button>
          ) : null}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-xl bg-white/10 px-4 py-1.5 text-sm font-bold text-white">
            {number((index ?? 0) + 1)} / {number(count)}
          </div>
        </div>
      ) : null}
    </Dialog>
  )
}
