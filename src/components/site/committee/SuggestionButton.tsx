'use client'

import { useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'

import { submitSuggestion, type SuggestionState } from '@/app/(frontend)/[locale]/(site)/actions'
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'
import { usePathname } from '@/i18n/navigation'

const inputClass =
  'rounded-sm border-outline-variant font-normal focus:border-secondary focus:ring-secondary'

function SuggestionForm({ committeeCode }: { committeeCode: string }) {
  const t = useTranslations('site.suggest')
  const pathname = usePathname()
  const [state, formAction, pending] = useActionState<SuggestionState, FormData>(
    submitSuggestion,
    undefined,
  )
  const [fields, setFields] = useState({ name: '', email: '', message: '' })
  const bind = (name: keyof typeof fields) => ({
    name,
    value: fields[name],
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((current) => ({ ...current, [name]: event.target.value })),
  })
  const invalid = (name: string) => state?.ok === false && state.fields?.includes(name)

  if (state?.ok) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-mint text-3xl font-bold text-secondary">
          ✓
        </div>
        <p className="text-headline-md font-bold text-primary">{t('done')}</p>
      </div>
    )
  }

  return (
    <form action={formAction} noValidate className="flex flex-col gap-4">
      <input type="hidden" name="committee" value={committeeCode} />
      <input type="hidden" name="sourcePage" value={pathname} />
      <div aria-hidden="true" className="hidden">
        <label>
          Website
          <input name="website" tabIndex={-1} autoComplete="off" />
        </label>
      </div>
      <label className="flex flex-col gap-1 text-label-md text-on-surface">
        <span>
          {t('name')} <span className="font-normal text-outline">{t('optional')}</span>
        </span>
        <input {...bind('name')} autoComplete="name" className={inputClass} />
      </label>
      <label className="flex flex-col gap-1 text-label-md text-on-surface">
        {t('email')}
        <input
          {...bind('email')}
          type="email"
          required
          dir="ltr"
          autoComplete="email"
          aria-invalid={invalid('email') || undefined}
          className={`${inputClass} text-left rtl:text-right`}
        />
        {invalid('email') ? (
          <span className="text-xs font-normal text-error">{t('errors.email')}</span>
        ) : null}
      </label>
      <label className="flex flex-col gap-1 text-label-md text-on-surface">
        {t('message')}
        <textarea
          {...bind('message')}
          rows={4}
          required
          aria-invalid={invalid('message') || undefined}
          className={inputClass}
        />
        {invalid('message') ? (
          <span className="text-xs font-normal text-error">{t('errors.message')}</span>
        ) : null}
      </label>
      {state?.ok === false && (state.error === 'rateLimit' || state.error === 'generic') ? (
        <p
          role="alert"
          className="rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
        >
          {t(`errors.${state.error}`)}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-sm bg-primary py-3 font-bold text-white transition-colors hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}

/** "Submit a suggestion" button + dialog. The suggestion is saved for the admin inbox. */
export function SuggestionButton({
  committeeCode,
  committeeName,
  className,
  children,
}: {
  committeeCode: string
  committeeName: string
  className?: string
  children: React.ReactNode
}) {
  const t = useTranslations('site')
  const [open, setOpen] = useState(false)
  const [formKey, setFormKey] = useState(0)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setFormKey((key) => key + 1)
          setOpen(true)
        }}
        className={className}
      >
        {children}
      </button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        labelledBy="suggest-title"
        className="max-w-lg rounded-2xl bg-white p-6 shadow-2xl"
      >
        <div className="relative">
          <DialogCloseButton
            onClick={() => setOpen(false)}
            label={t('close')}
            className="absolute -top-2 -end-2 h-9 w-9 rounded-xl bg-surface-container-low text-xl font-bold hover:bg-surface-container-high"
          />
          <h3 id="suggest-title" className="text-headline-md font-bold text-primary">
            {t('suggest.title')}
          </h3>
          <p className="mb-5 text-body-sm text-outline">{committeeName}</p>
          <SuggestionForm key={formKey} committeeCode={committeeCode} />
        </div>
      </Dialog>
    </>
  )
}
