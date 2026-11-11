
'use client'

import { useState } from 'react'

import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'
import { Icon, type IconName } from '@/components/ui/Icon'
import type { Locale } from '@/i18n/routing'
import { CommitteeEditForm } from '@/components/admin/CommitteeEditForm'

type CommitteeSummary = {
  id: number
  name: string
  code: string
  description: string
  shortDescription: string
  icon: IconName
  isActive: boolean
  sortOrder: number
  email: string
  chairName: string
  chairEmail: string
  chairTitle: string
  rapporteurName: string
  rapporteurTitle: string
  members: { name: string; title: string }[]
  responsibilities: { text: string }[]
  suggestionsPrompt: string
  suggestionsText: string
  approvedPosts: number
  pendingPosts: number
}

type Props = {
  committees: CommitteeSummary[]
  locale: Locale
}

const icons: IconName[] = [
  'vital_signs',
  'school',
  'groups',
  'eco',
  'campaign',
  'trending_up',
  'warning',
]

function Stat({
  label,
  value,
}: {
  label: string
  value: number
}) {
  return (
    <div className="rounded-lg bg-surface-container-low p-3">
      <p className="text-2xl font-bold text-primary">{value}</p>
      <p className="mt-1 text-label-sm text-on-surface-variant">{label}</p>
    </div>
  )
}

export function CommitteesList({ committees, locale }: Props) {
  const ar = locale === 'ar'
  const [selected, setSelected] = useState<CommitteeSummary | null>(null)
  const [editing, setEditing] = useState<CommitteeSummary | null>(null)
  

  const number = (value: number) =>
    new Intl.NumberFormat(ar ? 'ar-OM' : 'en-GB').format(value)

  const labels = {
    title: ar ? 'إدارة اللجان' : 'Committee Management',
    description: ar
      ? 'إدارة اللجان وبياناتها ومتابعة أنشطتها.'
      : 'Manage committee profiles, leadership and activity.',
    total: ar ? 'إجمالي اللجان' : 'Total committees',
    active: ar ? 'لجان نشطة' : 'Active committees',
    inactive: ar ? 'غير نشطة' : 'Inactive',
    members: ar ? 'الأعضاء' : 'Public members',
    approved: ar ? 'منشورات معتمدة' : 'Approved posts',
    pending: ar ? 'بانتظار الاعتماد' : 'Pending approvals',
    chair: ar ? 'رئيس اللجنة' : 'Committee chair',
    rapporteur: ar ? 'مقرر اللجنة' : 'Rapporteur',
    details: ar ? 'عرض التفاصيل' : 'View details',
    edit: ar ? 'تعديل' : 'Edit',
    activeStatus: ar ? 'نشطة' : 'Active',
    inactiveStatus: ar ? 'غير نشطة' : 'Inactive',
    noName: ar ? 'غير محدد' : 'Not specified',
    noCommittees: ar ? 'لا توجد لجان مسجلة.' : 'No committees found.',
    close: ar ? 'إغلاق' : 'Close',
    code: ar ? 'رمز اللجنة' : 'Committee code',
    contact: ar ? 'البريد الإلكتروني' : 'Contact email',
    chairEmail: ar ? 'البريد الإلكتروني للرئيس' : 'Chair email',
    membersSection: ar ? 'أعضاء اللجنة' : 'Committee members',
    responsibilities: ar ? 'المهام والمسؤوليات' : 'Responsibilities',
    publicDescription: ar ? 'نبذة عن اللجنة' : 'Committee description',
    suggestions: ar ? 'المقترحات' : 'Suggestions',
    order: ar ? 'ترتيب العرض' : 'Display order',
  }

  const activeCount = committees.filter((committee) => committee.isActive).length
  const totalApproved = committees.reduce(
    (sum, committee) => sum + committee.approvedPosts,
    0,
  )
  const totalPending = committees.reduce(
    (sum, committee) => sum + committee.pendingPosts,
    0,
  )

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-headline-xl text-primary">{labels.title}</h1>
        <p className="mt-2 text-body-md text-on-surface-variant">
          {labels.description}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label={labels.total} value={committees.length} />
        <Stat label={labels.active} value={activeCount} />
        <Stat label={labels.approved} value={totalApproved} />
        <Stat label={labels.pending} value={totalPending} />
      </div>

      {committees.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-white p-12 text-center text-on-surface-variant">
          {labels.noCommittees}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {committees.map((committee) => (
            <article
              key={committee.id}
              className="flex flex-col overflow-hidden rounded-xl border border-outline-variant/60 bg-white shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex flex-1 flex-col p-5">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-mint text-2xl text-secondary">
                    <Icon name={icons.includes(committee.icon) ? committee.icon : 'groups'} />
                  </div>

                  <span
                    className={`rounded-full px-3 py-1 text-label-sm ${
                      committee.isActive
                        ? 'bg-mint text-secondary'
                        : 'bg-surface-container text-on-surface-variant'
                    }`}
                  >
                    {committee.isActive ? labels.activeStatus : labels.inactiveStatus}
                  </span>
                </div>

                <h2 className="text-headline-md text-primary">
                  {committee.name}
                </h2>

                <p className="mt-1 text-label-sm text-outline">
                  {committee.code}
                </p>

                <p className="mt-3 min-h-12 text-body-sm leading-6 text-on-surface-variant">
                  {committee.shortDescription || committee.description || '—'}
                </p>

                <div className="mt-5 grid grid-cols-3 gap-2">
                  <Stat label={labels.members} value={committee.members.length} />
                  <Stat label={labels.approved} value={committee.approvedPosts} />
                  <Stat label={labels.pending} value={committee.pendingPosts} />
                </div>

                <div className="mt-5 space-y-3 border-t border-outline-variant/50 pt-4">
                  <div>
                    <p className="text-label-sm text-outline">{labels.chair}</p>
                    <p className="mt-1 text-body-sm font-bold text-primary">
                      {committee.chairName || labels.noName}
                    </p>
                  </div>
                  <div>
                    <p className="text-label-sm text-outline">{labels.rapporteur}</p>
                    <p className="mt-1 text-body-sm font-bold text-primary">
                      {committee.rapporteurName || labels.noName}
                    </p>
                  </div>
                </div>
              </div>

                <div className="flex gap-3 border-t border-outline-variant/50 bg-surface-container-low/50 p-4">
                <button
                    type="button"
                    onClick={() => setSelected(committee)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-label-md text-white transition-colors hover:bg-secondary"
                >
                    <Icon name="groups" />
                    {labels.details}
                </button>

                <button
                    type="button"
                    onClick={() => setEditing(committee)}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-primary px-4 py-3 text-label-md text-primary transition-colors hover:bg-mint"
                >
                    {labels.edit}
                </button>
                </div>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={selected !== null}
        onClose={() => setSelected(null)}
        labelledBy="committee-details-title"
        className="max-w-3xl rounded-xl bg-white shadow-xl"
      >
        {selected && (
          <div className="relative p-6 sm:p-8">
            <DialogCloseButton
              onClick={() => setSelected(null)}
              label={labels.close}
            />

            <div className="mb-7 flex items-center gap-4 pe-10">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-mint text-3xl text-secondary">
                <Icon name={selected.icon} />
              </div>
              <div>
                <h2 id="committee-details-title" className="text-headline-lg text-primary">
                  {selected.name}
                </h2>
                <p className="text-label-sm text-outline">{selected.code}</p>
              </div>
            </div>

            <div className="mb-7 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Stat label={labels.members} value={selected.members.length} />
              <Stat label={labels.approved} value={selected.approvedPosts} />
              <Stat label={labels.pending} value={selected.pendingPosts} />
              <Stat label={labels.order} value={selected.sortOrder} />
            </div>

            <div className="space-y-7">
              <section>
                <h3 className="mb-3 text-headline-md text-primary">
                  {labels.publicDescription}
                </h3>
                <p className="whitespace-pre-wrap text-body-md leading-7 text-on-surface-variant">
                  {selected.description || selected.shortDescription || '—'}
                </p>
              </section>

              <section>
                <h3 className="mb-3 text-headline-md text-primary">
                  {labels.chair} {`& ${labels.rapporteur}`}
                </h3>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="rounded-lg bg-surface-container-low p-4">
                    <p className="text-label-sm text-outline">{labels.chair}</p>
                    <p className="mt-2 font-bold text-primary">
                      {selected.chairName || labels.noName}
                    </p>
                    {selected.chairTitle && (
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {selected.chairTitle}
                      </p>
                    )}
                    {selected.chairEmail && (
                      <a
                        href={`mailto:${selected.chairEmail}`}
                        dir="ltr"
                        className="mt-2 block text-body-sm text-secondary"
                      >
                        {selected.chairEmail}
                      </a>
                    )}
                  </div>

                  <div className="rounded-lg bg-surface-container-low p-4">
                    <p className="text-label-sm text-outline">{labels.rapporteur}</p>
                    <p className="mt-2 font-bold text-primary">
                      {selected.rapporteurName || labels.noName}
                    </p>
                    {selected.rapporteurTitle && (
                      <p className="mt-1 text-body-sm text-on-surface-variant">
                        {selected.rapporteurTitle}
                      </p>
                    )}
                  </div>
                </div>
              </section>

              <section>
                <h3 className="mb-3 text-headline-md text-primary">
                  {labels.membersSection}
                </h3>
                {selected.members.length ? (
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {selected.members.map((member, index) => (
                      <li
                        key={`${member.name}-${index}`}
                        className="rounded-lg bg-surface-container-low p-3"
                      >
                        <p className="font-bold text-primary">{member.name}</p>
                        {member.title && (
                          <p className="mt-1 text-body-sm text-on-surface-variant">
                            {member.title}
                          </p>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">—</p>
                )}
              </section>

              <section>
                <h3 className="mb-3 text-headline-md text-primary">
                  {labels.responsibilities}
                </h3>
                {selected.responsibilities.length ? (
                  <ol className="list-inside list-decimal space-y-2 text-body-md leading-7 text-on-surface-variant">
                    {selected.responsibilities.map((item, index) => (
                      <li key={index}>{item.text}</li>
                    ))}
                  </ol>
                ) : (
                  <p className="text-body-sm text-on-surface-variant">—</p>
                )}
              </section>

              <section className="grid gap-4 sm:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-label-md text-primary">{labels.contact}</h3>
                  {selected.email ? (
                    <a
                      href={`mailto:${selected.email}`}
                      dir="ltr"
                      className="text-body-sm text-secondary"
                    >
                      {selected.email}
                    </a>
                  ) : (
                    <p className="text-body-sm text-on-surface-variant">—</p>
                  )}
                </div>
                <div>
                  <h3 className="mb-2 text-label-md text-primary">{labels.suggestions}</h3>
                  <p className="text-body-sm text-on-surface-variant">
                    {selected.suggestionsPrompt || selected.suggestionsText || '—'}
                  </p>
                </div>
              </section>
            </div>

            <div className="mt-8 flex justify-end border-t border-outline-variant/50 pt-5">
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="rounded-lg bg-surface-container px-6 py-3 text-label-md text-primary hover:bg-surface-container-high"
              >
                {labels.close}
              </button>
            </div>
          </div>
        )}
      </Dialog>
      {editing && (
  <CommitteeEditForm
    committee={editing}
    locale={locale}
    onClose={() => setEditing(null)}
    onSaved={() => setEditing(null)}
  />
)}
    </div>
  )
}
