'use client'

import { useFormatter, useLocale, useTranslations } from 'next-intl'
import { useRef, useState } from 'react'

import { Link } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import { isEditableStatus, type PortalPost } from '@/lib/portal/post-types'

import { StatusChip } from './StatusChip'

/** Posts table used on the dashboard and the posts page, with a "View" dialog. */
export function PostsTable({ posts, emptyText }: { posts: PortalPost[]; emptyText?: string }) {
  const t = useTranslations('portal')
  const format = useFormatter()
  const locale = useLocale()
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [viewing, setViewing] = useState<PortalPost | null>(null)

  const formatDate = (value: string) =>
    format.dateTime(new Date(value), {
      ...digits(locale),
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    })

  const openView = (post: PortalPost) => {
    setViewing(post)
    dialogRef.current?.showModal()
  }

  return (
    <>
      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-start">
          <thead>
            <tr className="bg-surface-container-low text-label-md text-on-surface-variant">
              <th scope="col" className="px-8 py-4 text-start">
                {t('table.title')}
              </th>
              <th scope="col" className="w-28 px-6 py-4 text-start">
                {t('table.type')}
              </th>
              <th scope="col" className="w-40 px-6 py-4 text-start">
                {t('table.date')}
              </th>
              <th scope="col" className="w-40 px-6 py-4 text-start">
                {t('table.status')}
              </th>
              <th scope="col" className="w-36 px-8 py-4 text-end">
                {t('table.actions')}
              </th>
            </tr>
          </thead>
          <tbody className="text-body-md text-on-surface">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-8 py-10 text-center text-on-surface-variant">
                  {emptyText ?? t('table.empty')}
                </td>
              </tr>
            ) : (
              posts.map((post, index) => (
                <tr
                  key={post.id}
                  className={`transition-colors hover:bg-surface-container-low/50 ${index % 2 ? 'bg-surface-container-low/20' : ''}`}
                >
                  <td className="min-w-64 px-8 py-5 text-label-md text-primary">{post.title}</td>
                  <td className="px-6 py-5 text-on-surface-variant">
                    {t(`postTypes.${post.type}`)}
                  </td>
                  <td className="px-6 py-5 text-body-sm whitespace-nowrap text-outline">
                    {formatDate(post.createdAt)}
                  </td>
                  <td className="px-6 py-5">
                    <StatusChip status={post.status} />
                  </td>
                  <td className="px-8 py-5 text-end whitespace-nowrap">
                    {isEditableStatus(post.status) ? (
                      <>
                        <Link
                          href={`/portal/posts/${post.id}/edit`}
                          className="text-label-md text-secondary hover:text-primary"
                        >
                          {t('table.edit')}
                        </Link>
                        <span aria-hidden="true" className="mx-1 text-outline-variant">
                          |
                        </span>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={() => openView(post)}
                      className="cursor-pointer text-label-md text-outline hover:text-primary"
                    >
                      {t('table.view')}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <dialog
        ref={dialogRef}
        onClose={() => setViewing(null)}
        onClick={(event) => {
          if (event.target === dialogRef.current) dialogRef.current?.close()
        }}
        aria-labelledby="view-post-title"
        className="m-auto max-h-[88vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-0 text-start shadow-2xl backdrop:bg-black/60 backdrop:backdrop-blur-sm"
      >
        {viewing ? (
          <>
            <div className="sticky top-0 flex items-center justify-between border-b border-surface-variant bg-surface-container-low p-5">
              <div className="flex items-center gap-2">
                <span className="rounded-xs bg-secondary px-3 py-1 text-label-sm text-white">
                  {t(`postTypes.${viewing.type}`)}
                </span>
                <StatusChip status={viewing.status} />
              </div>
              <button
                type="button"
                onClick={() => dialogRef.current?.close()}
                aria-label={t('view.close')}
                className="h-9 w-9 rounded-full bg-white text-xl font-bold hover:bg-surface-container-high"
              >
                ×
              </button>
            </div>
            <div className="flex flex-col gap-5 p-6 lg:p-8">
              <h2 id="view-post-title" className="text-headline-lg leading-snug text-primary">
                {viewing.title}
              </h2>
              <div className="flex flex-wrap gap-4 border-b border-surface-variant pb-3 text-body-sm text-on-surface-variant">
                <span>
                  {t('view.date')}:{' '}
                  <b className="text-on-surface">{formatDate(viewing.createdAt)}</b>
                </span>
              </div>
              <p className="text-body-md leading-relaxed text-on-surface">
                {viewing.summary || t('view.noContent')}
              </p>
              {viewing.status === 'rejected' && viewing.rejectionReason ? (
                <div className="rounded-sm border border-error/20 bg-error-container p-4 text-body-sm text-on-error-container">
                  <b>{t('view.rejectionReason')}:</b> {viewing.rejectionReason}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-surface-variant pt-3">
                <span className="text-body-sm text-outline">
                  {viewing.status === 'approved' ? t('view.publicNote') : t('view.previewNote')}
                </span>
                {isEditableStatus(viewing.status) ? (
                  <Link
                    href={`/portal/posts/${viewing.id}/edit`}
                    className="rounded-sm border border-outline-variant px-5 py-2.5 text-label-md text-primary hover:bg-surface-container-low"
                  >
                    {t('table.edit')}
                  </Link>
                ) : null}
              </div>
            </div>
          </>
        ) : null}
      </dialog>
    </>
  )
}
