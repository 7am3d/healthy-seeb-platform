
'use client'

import { useLocale } from 'next-intl'
import { useRouter } from 'next/navigation'
import { useRef, useState, useTransition } from 'react'

import { reviewPost } from '@/app/(frontend)/[locale]/admin-portal/actions'

type ApprovalPost = {
  id: number
  title: string
  summary: string
  content: {
    root: {
      children: {
        type: any
        version: number
        [key: string]: unknown
      }[]
      [key: string]: unknown
    }
    [key: string]: unknown
  }
  type: 'announcement' | 'news' | 'activity' | 'report' | 'general'
  submittedAt: string | null
  eventDate: string | null
  location: string
  committee: string
  author: string
  rejectionReason: string
}

function extractText(node: unknown): string {
  if (!node || typeof node !== 'object') return ''
  const item = node as Record<string, unknown>
  const text = typeof item.text === 'string' ? item.text : ''
  const children = Array.isArray(item.children)
    ? item.children.map(extractText).join('')
    : ''
  return text + children + (item.type === 'paragraph' ? '\n' : '')
}

export function ApprovalsList({ posts }: { posts: ApprovalPost[] }) {
  const locale = useLocale()
  const ar = locale === 'ar'
  const router = useRouter()
  const dialogRef = useRef<HTMLDialogElement>(null)

  const [selected, setSelected] = useState<ApprovalPost | null>(null)
  const [reason, setReason] = useState('')
  const [rejecting, setRejecting] = useState(false)
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()

  const types = {
    announcement: ar ? 'إعلان' : 'Announcement',
    news: ar ? 'خبر' : 'News',
    activity: ar ? 'فعالية' : 'Activity',
    report: ar ? 'تقرير' : 'Report',
    general: ar ? 'عام' : 'General',
  }

  const formatDate = (value: string | null) =>
    value
      ? new Intl.DateTimeFormat(ar ? 'ar-OM' : 'en-GB', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(new Date(value))
      : '—'

  function openPreview(post: ApprovalPost) {
    setSelected(post)
    setReason('')
    setRejecting(false)
    setError('')
    dialogRef.current?.showModal()
  }

  function closePreview() {
    if (!pending) dialogRef.current?.close()
  }

  function submitDecision(decision: 'approved' | 'rejected') {
    if (!selected || pending) return

    if (decision === 'rejected' && !reason.trim()) {
      setError(ar ? 'يرجى كتابة سبب الرفض.' : 'Please enter a rejection reason.')
      return
    }

    setError('')

    startTransition(async () => {
      const result = await reviewPost({
        id: selected.id,
        decision,
        rejectionReason: decision === 'rejected' ? reason : undefined,
      })

      if (result.ok) {
        dialogRef.current?.close()
        setSelected(null)
        router.refresh()
      } else {
        setError(
          ar
            ? 'تعذر تنفيذ القرار. يرجى تحديث الصفحة والمحاولة مجددًا.'
            : 'Unable to complete the decision. Refresh and try again.',
        )
      }
    })
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[700px] text-start">
          <thead className="bg-surface-container-low text-label-md text-on-surface-variant">
            <tr>
              <th className="px-5 py-4 text-start">{ar ? 'المنشور' : 'Post'}</th>
              <th className="px-5 py-4 text-start">{ar ? 'اللجنة' : 'Committee'}</th>
              <th className="px-5 py-4 text-start">{ar ? 'المُرسل' : 'Submitted By'}</th>
              <th className="px-5 py-4 text-start">{ar ? 'التاريخ' : 'Date'}</th>
              <th className="px-5 py-4 text-end">{ar ? 'الإجراءات' : 'Actions'}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-variant">
            {posts.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-5 py-12 text-center text-on-surface-variant">
                  {ar ? 'لا توجد طلبات بانتظار الموافقة.' : 'No submissions awaiting approval.'}
                </td>
              </tr>
            ) : (
              posts.map((post) => (
                <tr key={post.id} className="hover:bg-surface-container-low/50">
                  <td className="px-5 py-4">
                    <p className="font-bold text-primary">{post.title}</p>
                    <p className="text-label-sm text-outline">{types[post.type]}</p>
                  </td>
                  <td className="px-5 py-4 text-body-sm">{post.committee}</td>
                  <td className="px-5 py-4 text-body-sm">{post.author}</td>
                  <td className="px-5 py-4 text-body-sm">{formatDate(post.submittedAt)}</td>
                  <td className="px-5 py-4 text-end">
                    <button
                      type="button"
                      onClick={() => openPreview(post)}
                      className="cursor-pointer rounded-lg bg-mint px-4 py-2 text-label-md text-secondary hover:bg-secondary-container"
                    >
                      {ar ? 'معاينة' : 'Preview'}
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
        onClose={() => {
          setSelected(null)
          setRejecting(false)
          setError('')
        }}
        aria-labelledby="approval-preview-title"
        className="m-auto max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl overflow-y-auto rounded-2xl bg-white p-0 text-start shadow-2xl backdrop:bg-black/60"
      >
        {selected && (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface-container-low p-5">
              <h2 id="approval-preview-title" className="text-section-title text-primary">
                {ar ? 'معاينة الطلب' : 'Submission Preview'}
              </h2>
              <button
                type="button"
                disabled={pending}
                onClick={closePreview}
                className="rounded-lg px-3 py-1 text-xl hover:bg-white"
                aria-label={ar ? 'إغلاق' : 'Close'}
              >
                ×
              </button>
            </div>

            <div className="space-y-5 p-6">
              <div>
                <span className="rounded-full bg-mint px-3 py-1 text-label-sm text-secondary">
                  {types[selected.type]}
                </span>
                <h3 className="mt-3 text-headline-md text-primary">{selected.title}</h3>
              </div>

              <div className="grid gap-3 text-body-sm text-on-surface-variant sm:grid-cols-2">
                <p><b>{ar ? 'اللجنة:' : 'Committee:'}</b> {selected.committee}</p>
                <p><b>{ar ? 'المُرسل:' : 'Submitted By:'}</b> {selected.author}</p>
                <p><b>{ar ? 'تاريخ الإرسال:' : 'Submitted:'}</b> {formatDate(selected.submittedAt)}</p>
                <p><b>{ar ? 'تاريخ الفعالية:' : 'Event Date:'}</b> {formatDate(selected.eventDate)}</p>
                {selected.location && (
                  <p><b>{ar ? 'الموقع:' : 'Location:'}</b> {selected.location}</p>
                )}
              </div>

              {selected.summary && (
                <p className="rounded-lg bg-surface-container-low p-4 text-body-md">
                  {selected.summary}
                </p>
              )}

              <div className="whitespace-pre-wrap text-body-md leading-relaxed">
                {extractText(selected.content.root)}
              </div>

              {rejecting && (
                <div>
                  <label htmlFor="rejection-reason" className="mb-2 block font-bold text-primary">
                    {ar ? 'سبب الرفض' : 'Rejection Reason'}
                  </label>
                  <textarea
                    id="rejection-reason"
                    value={reason}
                    onChange={(event) => setReason(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    disabled={pending}
                    className="w-full rounded-lg border border-outline-variant p-3"
                    placeholder={ar ? 'اكتب سبب رفض المنشور...' : 'Explain why this post is rejected...'}
                  />
                </div>
              )}

              {error && (
                <p role="alert" className="rounded-lg bg-error-container p-3 text-body-sm text-on-error-container">
                  {error}
                </p>
              )}

              <div className="flex flex-wrap justify-end gap-3 border-t border-surface-variant pt-5">
                <button
                  type="button"
                  disabled={pending}
                  onClick={closePreview}
                  className="rounded-lg border border-outline-variant px-5 py-3 text-label-md"
                >
                  {ar ? 'إلغاء' : 'Cancel'}
                </button>

                {rejecting ? (
                  <button
                    type="button"
                    disabled={pending}
                    onClick={() => submitDecision('rejected')}
                    className="rounded-lg bg-error px-5 py-3 text-label-md text-white disabled:opacity-50"
                  >
                    {pending
                      ? (ar ? 'جارٍ الحفظ...' : 'Saving...')
                      : (ar ? 'تأكيد الرفض' : 'Confirm Rejection')}
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => setRejecting(true)}
                      className="rounded-lg border border-error px-5 py-3 text-label-md text-error"
                    >
                      {ar ? 'رفض' : 'Reject'}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => submitDecision('approved')}
                      className="rounded-lg bg-secondary px-5 py-3 text-label-md text-white disabled:opacity-50"
                    >
                      {pending
                        ? (ar ? 'جارٍ الحفظ...' : 'Saving...')
                        : (ar ? 'موافقة ونشر' : 'Approve & Publish')}
                    </button>
                  </>
                )}
              </div>
            </div>
          </>
        )}
      </dialog>
    </>
  )
}
