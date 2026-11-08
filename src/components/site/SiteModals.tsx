'use client'

import { useTranslations } from 'next-intl'
import React, { createContext, useActionState, useContext, useState } from 'react'

import {
  submitContribution,
  type ContributionState,
} from '@/app/(frontend)/[locale]/(site)/actions'
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'
import { usePathname } from '@/i18n/navigation'

type CommitteeOption = { code: string; name: string }

type SiteModalsContext = {
  openContribute: (committeeCode?: string) => void
  openTerms: () => void
}

const Context = createContext<SiteModalsContext | null>(null)

/** Opens the "Contribute with us" and "Terms" dialogs from anywhere on the public site. */
export function useSiteModals() {
  const context = useContext(Context)
  if (!context) throw new Error('useSiteModals must be used inside <SiteModalsProvider>')
  return context
}

export const INFO_EMAIL = 'info@seebhealthy.om'

export function SiteModalsProvider({
  committees,
  children,
}: {
  committees: CommitteeOption[]
  children: React.ReactNode
}) {
  const [contribute, setContribute] = useState<{ open: boolean; committee: string; key: number }>({
    open: false,
    committee: '',
    key: 0,
  })
  const [termsOpen, setTermsOpen] = useState(false)

  const value: SiteModalsContext = {
    // A new key resets the form each time it opens, like the prototype.
    openContribute: (committee = '') =>
      setContribute((s) => ({ open: true, committee, key: s.key + 1 })),
    openTerms: () => setTermsOpen(true),
  }

  return (
    <Context.Provider value={value}>
      {children}
      <ContributeDialog
        key={contribute.key}
        open={contribute.open}
        committee={contribute.committee}
        committees={committees}
        onClose={() => setContribute((s) => ({ ...s, open: false }))}
        onOpenTerms={() => setTermsOpen(true)}
      />
      <TermsDialog open={termsOpen} onClose={() => setTermsOpen(false)} />
    </Context.Provider>
  )
}

/** Buttons and links that open the dialogs (usable inside server components). */
export function OpenContributeButton({
  committee,
  className,
  children,
}: {
  committee?: string
  className?: string
  children: React.ReactNode
}) {
  const { openContribute } = useSiteModals()
  return (
    <button type="button" onClick={() => openContribute(committee)} className={className}>
      {children}
    </button>
  )
}

export function OpenTermsButton({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { openTerms } = useSiteModals()
  return (
    <button type="button" onClick={openTerms} className={className}>
      {children}
    </button>
  )
}

// ---------- Terms and conditions ----------

function TermsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useTranslations('site')
  const items = t.raw('terms.items') as string[]

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="terms-title"
      className="z-[60] max-h-[85vh] max-w-2xl rounded-2xl bg-white p-6 shadow-2xl md:p-8"
    >
      <div className="relative">
        <DialogCloseButton
          onClick={onClose}
          label={t('close')}
          className="absolute -top-2 -end-2 h-9 w-9 rounded-xl bg-surface-container-low text-xl font-bold hover:bg-surface-container-high"
        />
        <h3 id="terms-title" className="mb-1 text-headline-md font-bold text-primary">
          {t('terms.title')}
        </h3>
        <p className="mb-5 text-body-sm text-outline">{t('terms.intro')}</p>
        <ol className="flex list-decimal flex-col gap-3 ps-5 text-body-md leading-relaxed text-on-surface-variant">
          {items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ol>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full rounded-sm bg-primary py-3 font-bold text-white transition-colors hover:bg-secondary"
        >
          {t('terms.ok')}
        </button>
      </div>
    </Dialog>
  )
}

// ---------- Contribute with us ----------

const inputClass =
  'w-full rounded-sm border border-outline-variant bg-white px-3 py-2.5 text-body-md focus:border-secondary focus:ring-secondary'

function ContributeDialog({
  open,
  committee,
  committees,
  onClose,
  onOpenTerms,
}: {
  open: boolean
  committee: string
  committees: CommitteeOption[]
  onClose: () => void
  onOpenTerms: () => void
}) {
  const t = useTranslations('site')
  const pathname = usePathname()
  const [state, formAction, pending] = useActionState<ContributionState, FormData>(
    submitContribution,
    undefined,
  )
  const [who, setWho] = useState<'individual' | 'organization'>('individual')
  const [type, setType] = useState('volunteering')
  // Controlled fields keep what the visitor typed when the server returns a validation error.
  const [fields, setFields] = useState({
    name: '',
    email: '',
    phone: '',
    description: '',
    agree: false,
  })
  const field = (name: keyof typeof fields) => ({
    name,
    value: fields[name] as string,
    onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setFields((current) => ({ ...current, [name]: event.target.value })),
  })
  const [committeeCode, setCommitteeCode] = useState(committee)

  const chooseWho = (value: 'individual' | 'organization') => {
    setWho(value)
    // Same behaviour as the prototype: organisations default to sponsorship, individuals to volunteering.
    if (value === 'organization' && type === 'volunteering') setType('sponsorship')
    if (value === 'individual') setType('volunteering')
  }

  const done = state?.ok === true

  return (
    <Dialog
      open={open}
      onClose={onClose}
      labelledBy="contribute-title"
      className="z-[55] max-w-xl rounded-2xl bg-white p-6 shadow-2xl md:p-8"
    >
      <div className="relative">
        <DialogCloseButton
          onClick={onClose}
          label={t('close')}
          className="absolute -top-2 -end-2 h-9 w-9 rounded-xl bg-surface-container-low text-xl font-bold hover:bg-surface-container-high"
        />

        {done ? (
          <div className="py-6 text-center" role="status">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg bg-mint text-2xl font-bold text-secondary">
              ✓
            </div>
            <h3 id="contribute-title" className="mb-2 text-headline-md font-bold text-primary">
              {t('contribute.doneTitle')}
            </h3>
            <p className="mb-6 text-body-md text-on-surface-variant">{t('contribute.doneText')}</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-sm bg-primary px-6 py-2.5 font-bold text-white transition-colors hover:bg-secondary"
            >
              {t('close')}
            </button>
          </div>
        ) : (
          <>
            <h3 id="contribute-title" className="mb-1 text-headline-md font-bold text-primary">
              {t('contribute.title')}
            </h3>
            <p className="mb-5 text-body-sm text-outline">{t('contribute.intro')}</p>

            <form action={formAction} noValidate className="flex flex-col gap-4">
              <input type="hidden" name="sourcePage" value={pathname} />
              <input type="hidden" name="who" value={who} />
              <div aria-hidden="true" className="hidden">
                <label>
                  Website
                  <input name="website" tabIndex={-1} autoComplete="off" />
                </label>
              </div>

              <div
                className="grid grid-cols-2 gap-2"
                role="radiogroup"
                aria-label={t('contribute.whoLabel')}
              >
                {(['individual', 'organization'] as const).map((value) => (
                  <label key={value} className="cursor-pointer">
                    <input
                      type="radio"
                      name="who-choice"
                      value={value}
                      checked={who === value}
                      onChange={() => chooseWho(value)}
                      className="peer sr-only"
                    />
                    <span className="block rounded-sm border border-outline-variant px-3 py-2.5 text-center text-label-md peer-checked:border-secondary peer-checked:bg-mint peer-checked:text-secondary peer-focus-visible:outline-2 peer-focus-visible:outline-secondary">
                      {t(`contribute.${value}`)}
                    </span>
                  </label>
                ))}
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-label-md">
                  {who === 'organization'
                    ? t('contribute.nameOrganization')
                    : t('contribute.nameIndividual')}
                </span>
                <input
                  {...field('name')}
                  autoComplete={who === 'organization' ? 'organization' : 'name'}
                  className={inputClass}
                />
              </label>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">{t('contribute.email')}</span>
                  <input
                    {...field('email')}
                    type="email"
                    dir="ltr"
                    autoComplete="email"
                    placeholder={t('contribute.emailPlaceholder')}
                    className={`${inputClass} text-left`}
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">
                    {t('contribute.phone')}{' '}
                    <span className="font-normal text-outline">{t('contribute.optional')}</span>
                  </span>
                  <input
                    {...field('phone')}
                    type="tel"
                    dir="ltr"
                    autoComplete="tel"
                    placeholder={t('contribute.phonePlaceholder')}
                    className={`${inputClass} text-left`}
                  />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">{t('contribute.type')}</span>
                  <select
                    name="type"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className={inputClass}
                  >
                    {(['volunteering', 'sponsorship', 'partnership', 'donation'] as const).map(
                      (value) => (
                        <option key={value} value={value}>
                          {t(`contribute.types.${value}`)}
                        </option>
                      ),
                    )}
                  </select>
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">{t('contribute.committee')}</span>
                  <select
                    name="committee"
                    value={committeeCode}
                    onChange={(e) => setCommitteeCode(e.target.value)}
                    className={inputClass}
                  >
                    <option value="">{t('contribute.committeeNone')}</option>
                    {committees.map((option) => (
                      <option key={option.code} value={option.code}>
                        {option.name}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <label className="flex flex-col gap-1">
                <span className="text-label-md">{t('contribute.description')}</span>
                <textarea
                  {...field('description')}
                  rows={3}
                  placeholder={t('contribute.descriptionPlaceholder')}
                  className={inputClass}
                />
              </label>

              <label className="flex items-start gap-2 text-body-sm text-on-surface-variant">
                <input
                  name="agree"
                  type="checkbox"
                  checked={fields.agree}
                  onChange={(e) =>
                    setFields((current) => ({ ...current, agree: e.target.checked }))
                  }
                  className="mt-1 rounded-xs border-outline-variant text-secondary focus:ring-secondary"
                />
                <span>
                  {t('contribute.agreeBefore')}{' '}
                  <button type="button" onClick={onOpenTerms} className="text-secondary underline">
                    {t('contribute.terms')}
                  </button>
                </span>
              </label>

              {state?.ok === false ? (
                <p
                  role="alert"
                  className="rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
                >
                  {t(`contribute.errors.${state.error}`)}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={pending}
                className="w-full rounded-sm bg-primary py-3 font-bold text-white transition-colors hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t('contribute.submitting') : t('contribute.submit')}
              </button>
              <p className="text-center text-body-sm text-outline">
                {t('contribute.orEmail')}{' '}
                <a href={`mailto:${INFO_EMAIL}`} dir="ltr" className="font-bold text-primary">
                  {INFO_EMAIL}
                </a>
              </p>
            </form>
          </>
        )}
      </div>
    </Dialog>
  )
}
