import React from 'react'

/** Section title with the short sand underline used across the public site. */
export function SectionHeading({
  title,
  subtitle,
  id,
  className = 'mb-space-xl',
}: {
  title: React.ReactNode
  subtitle?: React.ReactNode
  id?: string
  className?: string
}) {
  return (
    <div className={`text-start ${className}`}>
      <div className="mb-space-xs inline-block">
        <h2 id={id} className="text-headline-xl font-bold text-primary">
          {title}
        </h2>
        <div className="mt-2 h-1 w-12 rounded-xl bg-sand" />
      </div>
      {subtitle ? <p className="mt-2 text-body-md text-on-surface-variant">{subtitle}</p> : null}
    </div>
  )
}
