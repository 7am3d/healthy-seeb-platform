'use client'

import { useTranslations } from 'next-intl'
import { useState } from 'react'

import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'

/** Button that opens the "Contact" dialog with a copyable email address (prototype: email-modal). */
export function EmailButton({
  name,
  email,
  className,
  children,
}: {
  /** Shown under the dialog title, e.g. the person or committee. */
  name: string
  email: string
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations('site')
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email)
    } finally {
      setCopied(true)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setCopied(false)
          setOpen(true)
        }}
        className={className}
      >
        {children}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="email-dialog-title"
        className="max-w-md rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="relative">
          <DialogCloseButton
            onClick={() => setOpen(false)}
            label={t('close')}
            className="absolute -top-2 -end-2 h-9 w-9 rounded-xl bg-surface-container-low text-xl font-bold hover:bg-surface-container-high"
          />
          <h3 id="email-dialog-title" className="text-headline-md font-bold text-primary">
            {t('emailModal.title')}
          </h3>
          <p className="mb-5 text-body-sm text-outline">{name}</p>
          <div className="mb-4 flex items-center justify-between gap-3 rounded-lg border border-secondary/20 bg-mint p-3">
            <span dir="ltr" className="text-sm font-bold break-all text-primary">
              {email}
            </span>
            <button
              type="button"
              onClick={copy}
              aria-live="polite"
              className="flex-shrink-0 rounded-sm border border-outline-variant bg-white px-3 py-1.5 text-sm font-bold text-secondary hover:bg-surface-container-low"
            >
              {copied ? t('emailModal.copied') : t('emailModal.copy')}
            </button>
          </div>
          <a
            href={`mailto:${email}`}
            className="block w-full rounded-sm bg-primary py-3 text-center font-bold text-white transition-colors hover:bg-secondary"
          >
            {t('emailModal.open')}
          </a>
        </div>
      </Dialog>
    </>
  )
}
