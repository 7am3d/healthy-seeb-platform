import type { Metadata } from 'next'
import { getFormatter, getTranslations, setRequestLocale } from 'next-intl/server'

import { CommitteeEditor } from '@/components/portal/CommitteeEditor'
import { Link } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { digits } from '@/lib/format'
import { canEditCommitteePage, getPayloadClient, requireStaffSession } from '@/lib/portal/session'

type Props = { params: Promise<{ locale: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalCommittee' })
  return { title: t('metaTitle') }
}

export default async function CommitteePageEditor({ params }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  const committeeID = session.membership.committee.id

  // The latest saved version: a draft waiting for approval if there is one, otherwise
  // the published page. Read on the server for the member's own committee only.
  const payload = await getPayloadClient()
  const committee = await payload.findByID({
    collection: 'committees',
    id: committeeID,
    draft: true,
    depth: 0,
    overrideAccess: true,
  })
  const pendingApproval = committee._status === 'draft'

  const t = await getTranslations('portalCommittee')
  const format = await getFormatter()
  const date = format.dateTime(new Date(committee.updatedAt), {
    ...digits(locale),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="flex w-full flex-col pb-space-xl">
      <div className="mb-space-lg">
        <nav aria-label="Breadcrumb" className="mb-space-xs flex items-center gap-space-sm">
          <Link
            href="/portal"
            className="rounded-xs bg-surface-container-high px-space-sm py-1 text-label-sm text-secondary"
          >
            {t('crumbPortal')}
          </Link>
          <span aria-hidden="true" className="text-body-sm text-outline">
            /
          </span>
          <span aria-current="page" className="text-body-sm text-outline">
            {t('crumbHere')}
          </span>
        </nav>
        <h1 className="text-headline-lg tracking-tight text-primary">{t('title')}</h1>
        <p className="mt-1 text-body-md text-on-surface-variant">
          {t('intro', { committee: committee.name })}
        </p>
      </div>

      <div className="mb-space-lg flex flex-col justify-between gap-space-sm rounded-lg bg-surface-container-lowest p-space-md shadow-sm sm:flex-row sm:items-center">
        <div className="flex flex-col">
          <span className={`text-label-md ${pendingApproval ? 'text-sand' : 'text-primary'}`}>
            {pendingApproval ? t('status.pending') : t('status.published')}
          </span>
          <span className="text-body-sm text-on-surface-variant">
            {pendingApproval ? t('status.saved', { date }) : t('status.updated', { date })}
          </span>
        </div>
        <Link
          href={`/committees/${committee.code}`}
          target="_blank"
          className="self-start text-label-sm text-secondary underline underline-offset-4 hover:text-primary sm:self-center"
        >
          {t('status.viewPage')}
        </Link>
      </div>

      {canEditCommitteePage(session) ? null : (
        <p
          role="note"
          className="mb-space-lg rounded-sm bg-mint p-space-md text-body-sm text-secondary"
        >
          {t('readOnly')}
        </p>
      )}

      <CommitteeEditor
        committeeName={committee.name}
        canEdit={canEditCommitteePage(session)}
        initial={{
          description: committee.description ?? '',
          chairName: committee.chairName ?? '',
          chairEmail: committee.chairEmail ?? '',
          rapporteurName: committee.rapporteurName ?? '',
          rapporteurTitle: committee.rapporteurTitle ?? '',
          members: (committee.members ?? []).map((member, index) => ({
            key: member.id ?? `member-${index}`,
            name: member.name ?? '',
            title: member.title ?? '',
          })),
          responsibilities: (committee.responsibilities ?? []).map((item, index) => ({
            key: item.id ?? `item-${index}`,
            text: item.text ?? '',
          })),
        }}
      />
    </div>
  )
}
