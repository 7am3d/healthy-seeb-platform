
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { ApprovalsList } from '@/components/admin/ApprovalsList'
import type { Locale } from '@/i18n/routing'
import { getPayloadClient, requireAdminSession } from '@/lib/portal/session'

export const metadata: Metadata = {
  title: 'Approvals | Healthy Seeb Administration',
  robots: { index: false, follow: false },
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function AdminApprovalsPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  const ar = locale === 'ar'

  setRequestLocale(locale)
  await requireAdminSession(locale)

  const payload = await getPayloadClient()

  const { docs } = await payload.find({
    collection: 'posts',
    where: { status: { equals: 'submitted' } },
    sort: '-submittedAt',
    limit: 100,
    depth: 2,
    overrideAccess: true,
  })

  const posts = docs.map((post) => ({
    id: post.id,
    title: post.title,
    summary: post.summary ?? '',
    content: post.content,
    type: post.type,
    submittedAt: post.submittedAt ?? null,
    eventDate: post.eventDate ?? null,
    location: post.location ?? '',
    committee:
      typeof post.committee === 'object' && post.committee
        ? post.committee.name
        : ar ? 'غير محدد' : 'Unknown',
    author:
      typeof post.author === 'object' && post.author
        ? post.author.name || post.author.email
        : ar ? 'غير محدد' : 'Unknown',
    rejectionReason: post.rejectionReason ?? '',
  }))

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-headline-xl font-bold text-primary">
          {ar ? 'طلبات الموافقة' : 'Approvals'}
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {ar
            ? 'مراجعة المنشورات المقدمة من أعضاء اللجان واتخاذ قرار بشأن نشرها.'
            : 'Review submissions from committee members and decide whether to publish them.'}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-surface-variant bg-white p-5 shadow-sm">
          <p className="text-label-md text-on-surface-variant">
            {ar ? 'إجمالي الطلبات المعلقة' : 'Pending Submissions'}
          </p>
          <p className="mt-2 text-3xl font-bold text-primary">
            {docs.length.toLocaleString(ar ? 'ar-OM' : 'en-GB')}
          </p>
        </div>

        <div className="rounded-xl border border-surface-variant bg-white p-5 shadow-sm">
          <p className="text-label-md text-on-surface-variant">
            {ar ? 'آخر تحديث' : 'Latest Submission'}
          </p>
          <p className="mt-2 text-lg font-bold text-primary">
            {docs[0]?.submittedAt
              ? new Intl.DateTimeFormat(ar ? 'ar-OM' : 'en-GB', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                }).format(new Date(docs[0].submittedAt))
              : '—'}
          </p>
        </div>
      </div>

      <section className="overflow-hidden rounded-xl border border-surface-variant bg-white shadow-sm">
        <div className="border-b border-surface-variant p-5">
          <h2 className="text-section-title text-primary">
            {ar ? 'المنشورات بانتظار المراجعة' : 'Submissions Awaiting Review'}
          </h2>
        </div>

        <ApprovalsList posts={posts} />
      </section>
    </div>
  )
}
