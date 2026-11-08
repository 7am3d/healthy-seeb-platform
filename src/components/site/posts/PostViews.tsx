'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import type { SitePost } from '@/lib/site/types'

import { fileSize, formatMonthYear, formatPostDate, isRecent } from './format'
import { PostModal } from './PostModal'

/** Shared state: which post's details dialog is open. */
function usePostDialog() {
  const [post, setPost] = useState<SitePost | null>(null)
  return {
    open: setPost,
    dialog: <PostModal post={post} onClose={() => setPost(null)} />,
  }
}

const onEnterOrSpace = (action: () => void) => (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    action()
  }
}

function Cover({ post, className }: { post: SitePost; className: string }) {
  if (!post.cover) return null
  return (
    // Payload media URLs; next/image is not used so the prototype's object-cover sizing stays the same.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={post.cover.cardUrl ?? post.cover.url}
      alt={post.cover.alt || post.title}
      className={className}
    />
  )
}

/** Home page: "Latest events" cards. */
export function HomeEventCards({ posts }: { posts: SitePost[] }) {
  const t = useTranslations('site')
  const locale = useLocale()
  const { open, dialog } = usePostDialog()

  return (
    <>
      <div className="grid grid-cols-1 gap-gutter md:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            className="flex cursor-pointer flex-col overflow-hidden rounded-lg border border-gray-100 bg-white text-start shadow-sm transition-all hover:shadow-md"
            onClick={() => open(post)}
          >
            <div className="relative h-52 w-full overflow-hidden bg-surface-container-high">
              <Cover post={post} className="h-full w-full object-cover" />
            </div>
            <div className="flex flex-1 flex-col justify-between p-space-lg">
              <div>
                <span className="mb-space-xs inline-block text-label-sm font-bold text-sand">
                  {formatPostDate(locale, post.date)}
                </span>
                <h3 className="mb-space-sm text-headline-md leading-snug font-bold text-primary">
                  {post.title}
                </h3>
              </div>
              <div className="pt-space-md">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation()
                    open(post)
                  }}
                  className="text-label-md font-bold text-secondary transition-colors hover:text-primary"
                >
                  {t('post.readDetails')}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>
      {dialog}
    </>
  )
}

/** Committee page / news page: event cards with the date badge on the photo. */
export function EventCards({ posts }: { posts: SitePost[] }) {
  const t = useTranslations('site')
  const locale = useLocale()
  const { open, dialog } = usePostDialog()

  return (
    <>
      <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <article
            key={post.id}
            role="button"
            tabIndex={0}
            onClick={() => open(post)}
            onKeyDown={onEnterOrSpace(() => open(post))}
            aria-label={post.title}
            className="group flex cursor-pointer flex-col justify-between overflow-hidden rounded-sm bg-surface-container-lowest shadow-sm transition-shadow hover:shadow-md"
          >
            <div>
              <div className="relative h-48 w-full overflow-hidden bg-surface-container">
                <Cover
                  post={post}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
                <span className="absolute start-space-sm top-space-sm rounded-xs bg-secondary px-space-sm py-1 text-label-sm font-bold text-white shadow-sm">
                  {formatPostDate(locale, post.date)}
                </span>
              </div>
              <div className="p-space-md">
                <h4 className="mb-space-xs text-section-title leading-snug font-bold text-primary">
                  {post.title}
                </h4>
                <p className="line-clamp-3 text-body-sm leading-relaxed text-on-surface-variant">
                  {post.summary}
                </p>
              </div>
            </div>
            <div className="p-space-md pt-0">
              <span className="inline-block text-label-md font-bold text-secondary hover:text-primary">
                {t('post.details')}
              </span>
            </div>
          </article>
        ))}
      </div>
      {dialog}
    </>
  )
}

/** Committee page: announcement rows with the "New" badge. */
export function AnnouncementList({ posts }: { posts: SitePost[] }) {
  const t = useTranslations('site')
  const locale = useLocale()
  const { open, dialog } = usePostDialog()

  return (
    <>
      <div className="flex flex-col gap-space-sm">
        {posts.map((post) => (
          <div
            key={post.id}
            role="button"
            tabIndex={0}
            onClick={() => open(post)}
            onKeyDown={onEnterOrSpace(() => open(post))}
            className="flex cursor-pointer flex-col justify-between gap-space-md rounded-sm bg-surface-container-lowest p-space-md shadow-sm transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center"
          >
            <div className="flex items-center gap-space-md">
              <span className="text-label-md font-bold whitespace-nowrap text-primary">
                {formatPostDate(locale, post.date)}
              </span>
              <div className="flex items-center gap-space-xs">
                {isRecent(post.date) ? (
                  <span className="rounded-xs bg-sand px-space-xs py-0.5 text-label-sm font-bold text-primary">
                    {t('post.new')}
                  </span>
                ) : null}
                <h4 className="text-body-lg font-bold text-on-surface">{post.title}</h4>
              </div>
            </div>
            <span className="text-label-sm font-bold whitespace-nowrap text-secondary underline underline-offset-4 hover:text-primary">
              {t('post.viewDetails')}
            </span>
          </div>
        ))}
      </div>
      {dialog}
    </>
  )
}

/** Committee page: report rows with publication month, size and "View and download". */
export function ReportList({
  posts,
  labels,
}: {
  posts: SitePost[]
  labels: { published: string; size: string; format: string; viewDownload: string }
}) {
  const t = useTranslations('site')
  const locale = useLocale()
  const { open, dialog } = usePostDialog()

  return (
    <>
      <div className="flex flex-col gap-space-sm">
        {posts.map((post) => {
          const size = fileSize(locale, post.attachment?.filesize)
          return (
            <div
              key={post.id}
              role="button"
              tabIndex={0}
              onClick={() => open(post)}
              onKeyDown={onEnterOrSpace(() => open(post))}
              className="flex cursor-pointer flex-col justify-between gap-space-md rounded-sm bg-surface-container-lowest p-space-md shadow-sm transition-colors hover:bg-surface-container-low sm:flex-row sm:items-center"
            >
              <div className="flex flex-col">
                <h4 className="mb-1 text-body-lg font-bold text-primary">{post.title}</h4>
                <div className="flex flex-wrap items-center gap-space-md text-body-sm text-outline">
                  <span>
                    {labels.published.replace('{date}', formatMonthYear(locale, post.date))}
                  </span>
                  {size ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>
                        {labels.size.replace(
                          '{size}',
                          t(`fileSize.${size.unit}`, { size: size.size }),
                        )}
                      </span>
                    </>
                  ) : null}
                  {post.attachment ? (
                    <>
                      <span aria-hidden="true">•</span>
                      <span>{labels.format}</span>
                    </>
                  ) : null}
                </div>
              </div>
              <span className="rounded-sm border border-secondary px-space-md py-space-xs text-center text-label-md font-bold text-secondary transition-colors hover:bg-mint">
                {labels.viewDownload}
              </span>
            </div>
          )
        })}
      </div>
      {dialog}
    </>
  )
}
