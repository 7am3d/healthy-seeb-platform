import { useTranslations } from 'next-intl'

import type { Post } from '@/payload-types'

const STATUS_STYLES: Record<Post['status'], string> = {
  approved: 'bg-success-container text-success',
  submitted: 'bg-info-container text-primary',
  draft: 'bg-warning-container text-warning',
  rejected: 'bg-error-container text-on-error-container',
}

/** Coloured pill for a post's status: Draft, Awaiting approval, Published, Rejected. */
export function StatusChip({ status }: { status: Post['status'] }) {
  const t = useTranslations('portal.statuses')
  return (
    <span
      className={`inline-block rounded-full px-3 py-1 text-label-sm whitespace-nowrap ${STATUS_STYLES[status]}`}
    >
      {t(status)}
    </span>
  )
}
