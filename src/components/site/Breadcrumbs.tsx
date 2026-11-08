import { getTranslations } from 'next-intl/server'
import React from 'react'

import { Link } from '@/i18n/navigation'

/** Breadcrumb bar under the header (prototype: "مسار التصفح"). */
export async function Breadcrumbs({
  items,
  className = 'w-full border-b border-outline-variant/30 bg-surface-container-low py-space-sm',
  textClassName = 'text-body-sm text-on-surface-variant',
}: {
  items: Array<{ label: string; href?: string }>
  className?: string
  textClassName?: string
}) {
  const t = await getTranslations('site.breadcrumb')
  return (
    <section className={className}>
      <div className="mx-auto w-full max-w-[1280px] px-margin">
        <nav aria-label={t('label')} className={`flex items-center gap-space-xs ${textClassName}`}>
          {items.map((item, index) => (
            <React.Fragment key={item.label}>
              {index > 0 ? (
                <span aria-hidden="true" className="text-outline-variant select-none">
                  /
                </span>
              ) : null}
              {item.href ? (
                <Link className="transition-colors hover:text-primary" href={item.href}>
                  {item.label}
                </Link>
              ) : (
                <span aria-current="page" className="font-bold text-primary">
                  {item.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </nav>
      </div>
    </section>
  )
}
