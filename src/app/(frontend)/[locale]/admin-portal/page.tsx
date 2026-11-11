
import type { Metadata } from 'next'
import { setRequestLocale } from 'next-intl/server'

import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { getPayloadClient, requireAdminSession } from '@/lib/portal/session'

export const metadata: Metadata = {
  title: 'Dashboard | Healthy Seeb Administration',
}

type Props = {
  params: Promise<{ locale: string }>
}

function formatDate(value: string | null | undefined, locale: Locale) {
  if (!value) return '—'

  return new Intl.DateTimeFormat(locale === 'ar' ? 'ar-OM' : 'en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value))
}

export default async function AdminDashboardPage({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  const ar = locale === 'ar'

  setRequestLocale(locale)
  await requireAdminSession(locale)

  const payload = await getPayloadClient()

  const [submittedPosts, allPosts, approvedPosts, committees, staff] =
    await Promise.all([
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'submitted' } },
        sort: '-submittedAt',
        limit: 5,
        depth: 1,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'posts',
        where: { status: { equals: 'approved' } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'committees',
        where: { isActive: { equals: true } },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
      payload.find({
        collection: 'users',
        where: {
          and: [
            { globalRole: { equals: 'staff' } },
            { isActive: { equals: true } },
          ],
        },
        limit: 1,
        depth: 0,
        overrideAccess: true,
      }),
    ])

  const stats = [
    {
      label: ar ? 'إجمالي المنشورات' : 'Total Posts',
      value: allPosts.totalDocs,
      color: 'bg-primary',
    },
    {
      label: ar ? 'بانتظار الموافقة' : 'Pending Approval',
      value: submittedPosts.totalDocs,
      color: 'bg-warning',
    },
    {
      label: ar ? 'المنشورات المعتمدة' : 'Approved Posts',
      value: approvedPosts.totalDocs,
      color: 'bg-success',
    },
    {
      label: ar ? 'اللجان النشطة' : 'Active Committees',
      value: committees.totalDocs,
      color: 'bg-secondary',
    },
    {
      label: ar ? 'المستخدمون النشطون' : 'Active Staff',
      value: staff.totalDocs,
      color: 'bg-sand',
    },
  ]

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-headline-xl font-bold text-primary">
          {ar ? 'لوحة التحكم' : 'Dashboard'}
        </h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {ar
            ? 'نظرة عامة على أنشطة وإدارة منصة ولاية السيب الصحية.'
            : 'An overview of the Healthy Seeb platform and its administration.'}
        </p>
      </section>

      <section
        aria-label={ar ? 'الإحصائيات' : 'Statistics'}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-xl border border-surface-variant bg-white p-5 shadow-sm"
          >
            <div className={`mb-4 h-1 w-10 rounded-full ${stat.color}`} />
            <p className="text-label-md text-on-surface-variant">
              {stat.label}
            </p>
            <p className="mt-2 text-3xl font-bold text-primary">
              {stat.value.toLocaleString(ar ? 'ar-OM' : 'en-GB')}
            </p>
          </div>
        ))}
      </section>

      <section className="overflow-hidden rounded-xl border border-surface-variant bg-white shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-surface-variant p-5">
          <div>
            <h2 className="text-section-title text-primary">
              {ar
                ? 'أحدث الطلبات بانتظار الموافقة'
                : 'Latest Submissions Awaiting Approval'}
            </h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">
              {ar
                ? 'المنشورات التي أرسلها أعضاء اللجان للمراجعة.'
                : 'Posts submitted by committee members for review.'}
            </p>
          </div>

          <Link
            href="/admin-portal/approvals"
            className="rounded-lg bg-mint px-4 py-2 text-label-md text-secondary hover:bg-secondary-container"
          >
            {ar ? 'عرض جميع الطلبات' : 'View All Submissions'}
          </Link>
        </div>

        {submittedPosts.docs.length === 0 ? (
          <div className="p-10 text-center">
            <p className="font-bold text-primary">
              {ar ? 'لا توجد طلبات معلقة' : 'No pending submissions'}
            </p>
            <p className="mt-2 text-body-sm text-on-surface-variant">
              {ar
                ? 'ستظهر هنا المنشورات الجديدة عند إرسالها للمراجعة.'
                : 'New submissions will appear here when sent for review.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[600px] text-start">
              <thead className="bg-surface-container-low text-label-sm text-on-surface-variant">
                <tr>
                  <th className="px-5 py-4 text-start">
                    {ar ? 'عنوان المنشور' : 'Post Title'}
                  </th>
                  <th className="px-5 py-4 text-start">
                    {ar ? 'اللجنة' : 'Committee'}
                  </th>
                  <th className="px-5 py-4 text-start">
                    {ar ? 'تاريخ الإرسال' : 'Submitted'}
                  </th>
                  <th className="px-5 py-4 text-start">
                    {ar ? 'الحالة' : 'Status'}
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-surface-variant">
                {submittedPosts.docs.map((post) => (
                  <tr key={post.id} className="hover:bg-surface-container-low">
                    <td className="px-5 py-4">
                      <p className="font-bold text-primary">{post.title}</p>
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                      {typeof post.committee === 'object' &&
                      post.committee !== null
                        ? post.committee.name
                        : '—'}
                    </td>
                    <td className="px-5 py-4 text-body-sm text-on-surface-variant">
                      {formatDate(post.submittedAt, locale)}
                    </td>
                    <td className="px-5 py-4">
                      <span className="inline-flex rounded-full bg-warning-container px-3 py-1 text-label-sm text-warning">
                        {ar ? 'بانتظار الموافقة' : 'Pending'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-surface-variant bg-white p-5 shadow-sm">
        <h2 className="text-section-title text-primary">
          {ar ? 'إدارة المنصة' : 'Platform Management'}
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              href: '/admin-portal/approvals',
              title: ar ? 'طلبات الموافقة' : 'Approvals',
              description: ar
                ? 'مراجعة المنشورات واتخاذ القرارات.'
                : 'Review submissions and make decisions.',
            },
            {
              href: '/admin-portal/committees',
              title: ar ? 'اللجان' : 'Committees',
              description: ar
                ? 'إدارة اللجان وبياناتها.'
                : 'Manage committees and their details.',
            },
            {
              href: '/admin-portal/users',
              title: ar ? 'المستخدمون' : 'Users',
              description: ar
                ? 'إدارة حسابات أعضاء اللجان.'
                : 'Manage committee staff accounts.',
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg border border-surface-variant p-4 transition-colors hover:border-secondary hover:bg-mint"
            >
              <h3 className="font-bold text-primary">{item.title}</h3>
              <p className="mt-2 text-body-sm text-on-surface-variant">
                {item.description}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
