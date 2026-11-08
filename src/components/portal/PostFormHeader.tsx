import { getTranslations } from 'next-intl/server'

import { Link } from '@/i18n/navigation'

/** Breadcrumbs, title and intro above the Add / Edit post form. */
export async function PostFormHeader({
  mode,
  committeeName,
  rejection,
}: {
  mode: 'new' | 'edit'
  committeeName: string
  /** Set when editing a rejected post: the admin's reason (may be empty). */
  rejection?: string | null
}) {
  const t = await getTranslations('portalPostForm')
  const tPortal = await getTranslations('portal')

  return (
    <div className="mb-8">
      <nav
        aria-label="Breadcrumb"
        className="mb-3 flex items-center gap-2 text-label-sm text-on-surface-variant"
      >
        <Link href="/portal" className="transition-colors hover:text-primary">
          {tPortal('breadcrumbHome')}
        </Link>
        <span aria-hidden="true" className="text-outline-variant">
          /
        </span>
        <Link href="/portal/posts" className="transition-colors hover:text-primary">
          {t('crumbPosts')}
        </Link>
        <span aria-hidden="true" className="text-outline-variant">
          /
        </span>
        <span aria-current="page" className="font-bold text-primary">
          {mode === 'new' ? t('crumbNew') : t('crumbEdit')}
        </span>
      </nav>
      <h1 className="mb-2 text-headline-lg text-primary">
        {mode === 'new' ? t('titleNew') : t('titleEdit')}
      </h1>
      <p className="text-body-md text-on-surface-variant">
        {t('intro', { committee: committeeName })}
      </p>
      {rejection !== undefined ? (
        <p
          role="note"
          className="mt-4 rounded-sm bg-error-container p-4 text-body-sm font-bold text-on-error-container"
        >
          {rejection ? t('rejectedNote', { reason: rejection }) : t('rejectedNoReason')}
        </p>
      ) : null}
    </div>
  )
}
