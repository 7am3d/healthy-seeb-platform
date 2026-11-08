'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useState, useTransition } from 'react'

import { saveFollowUp } from '@/app/(frontend)/[locale]/portal/(staff)/referrals/actions'
import { Dialog, DialogCloseButton } from '@/components/ui/Dialog'
import { useRouter } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import {
  FOLLOW_UP_STATUSES,
  type FollowUpStatus,
  type Referral,
  REFERRAL_TYPES,
} from '@/lib/portal/referrals'

import { useToast } from './Toast'

const DOT: Record<FollowUpStatus, string> = {
  new: 'bg-primary',
  contacted: 'bg-sand',
  'in-progress': 'bg-sand',
  completed: 'bg-secondary',
}

const selectClass =
  'w-full rounded-sm border-outline-variant text-body-md focus:border-secondary focus:ring-secondary'

/** Staff "Referred requests": follow-up status tabs, type filter, and a details / follow-up dialog. */
export function ReferralsList({
  referrals: initial,
  committeeName,
}: {
  referrals: Referral[]
  committeeName: string
}) {
  const t = useTranslations('portalReferrals')
  const locale = useLocale()
  const router = useRouter()
  const { toast, show } = useToast()
  const [referrals, setReferrals] = useState(initial)
  const [tab, setTab] = useState<FollowUpStatus | 'all'>('all')
  const [type, setType] = useState<string>('')
  const [openId, setOpenId] = useState<number | null>(null)
  const [status, setStatus] = useState<FollowUpStatus>('new')
  const [note, setNote] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  const number = (value: number) => new Intl.NumberFormat(locale, digits(locale)).format(value)
  const date = (iso: string) =>
    new Intl.DateTimeFormat(locale, {
      ...digits(locale),
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(iso))

  const open = referrals.find((referral) => referral.id === openId) ?? null
  const visible = referrals.filter(
    (referral) =>
      (tab === 'all' || referral.followUpStatus === tab) && (!type || referral.type === type),
  )

  const mailto = (referral: Referral) =>
    `mailto:${referral.email}?subject=${encodeURIComponent(
      t('details.mailSubject', { committee: committeeName }),
    )}`

  const tags = (referral: Referral) => (
    <>
      <span className="text-xs font-bold text-on-surface-variant">
        {t(`types.${referral.type}`)}
      </span>
      <span className="text-xs text-outline">{t(`submitters.${referral.submitterType}`)}</span>
      <span className="inline-flex items-center gap-1.5 text-xs font-bold whitespace-nowrap text-on-surface-variant">
        <span className={`h-2 w-2 rounded-full ${DOT[referral.followUpStatus]}`} />
        {t(`followUp.${referral.followUpStatus}`)}
      </span>
    </>
  )

  function view(referral: Referral) {
    setOpenId(referral.id)
    setStatus(referral.followUpStatus)
    setNote('')
    setError(null)
  }

  function save() {
    if (!open) return
    const statusChanged = status !== open.followUpStatus
    if (!statusChanged && !note.trim()) {
      setOpenId(null)
      show(t('toast.nothing'))
      return
    }
    startTransition(async () => {
      const result = await saveFollowUp({ id: open.id, followUpStatus: status, note })
      if (!result.ok) {
        setError(t(`errors.${result.error}`))
        return
      }
      setReferrals((current) =>
        current.map((referral) =>
          referral.id === result.referral.id ? result.referral : referral,
        ),
      )
      setOpenId(null)
      show(statusChanged ? t('toast.status', { status: t(`followUp.${status}`) }) : t('toast.note'))
      // Updates the "new" badge in the sidebar.
      router.refresh()
    })
  }

  return (
    <>
      <div className="overflow-hidden rounded-lg bg-surface-container-lowest shadow-sm">
        <div className="flex flex-col gap-4 border-b border-surface-variant p-4 lg:flex-row lg:items-center lg:justify-between">
          <div role="group" aria-label={t('statusFilter')} className="flex flex-wrap gap-2">
            {(['all', ...FOLLOW_UP_STATUSES] as const).map((key) => {
              const count =
                key === 'all'
                  ? referrals.length
                  : referrals.filter((referral) => referral.followUpStatus === key).length
              const active = tab === key
              return (
                <button
                  key={key}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setTab(key)}
                  className={`flex items-center gap-2 rounded-sm px-4 py-2 text-label-md ${
                    active
                      ? 'bg-primary text-white'
                      : 'bg-surface-container-low text-on-surface-variant hover:bg-surface-container-high'
                  }`}
                >
                  {key === 'all' ? t('all') : t(`followUp.${key}`)}
                  <span
                    className={`rounded-full px-2 text-xs ${active ? 'bg-white/20' : 'bg-white'}`}
                  >
                    {number(count)}
                  </span>
                </button>
              )
            })}
          </div>
          <select
            aria-label={t('typeFilter')}
            value={type}
            onChange={(event) => setType(event.target.value)}
            className={`${selectClass} lg:w-48`}
          >
            <option value="">{t('allTypes')}</option>
            {REFERRAL_TYPES.map((key) => (
              <option key={key} value={key}>
                {t(`types.${key}`)}
              </option>
            ))}
          </select>
        </div>

        {visible.length ? (
          <ul className="divide-y divide-surface-variant/60">
            {visible.map((referral) => (
              <li
                key={referral.id}
                className={`flex flex-col gap-4 p-5 hover:bg-surface-container-low/40 md:flex-row md:items-center ${
                  referral.followUpStatus === 'new' ? 'bg-[#f5faff]' : ''
                }`}
              >
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    {tags(referral)}
                  </div>
                  <span className="text-label-md leading-snug text-primary">{referral.title}</span>
                  <span className="text-body-sm text-on-surface-variant">
                    {referral.name || t('anonymous')} · {date(referral.referredAt)}
                  </span>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() => view(referral)}
                    className="rounded-sm border border-outline-variant px-4 py-2 text-sm text-primary hover:bg-surface-container-low"
                  >
                    {t('view')}
                  </button>
                  {referral.email ? (
                    <a
                      href={mailto(referral)}
                      aria-label={t('contactLabel', { name: referral.name || referral.email })}
                      className="rounded-sm bg-secondary px-4 py-2 text-sm text-white hover:bg-[#0d5651]"
                    >
                      {t('contact')}
                    </a>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="p-12 text-center text-on-surface-variant">{t('empty')}</div>
        )}
      </div>

      <Dialog
        open={open !== null}
        onClose={() => setOpenId(null)}
        labelledBy="referral-title"
        baseClassName="m-auto max-h-[88vh] w-[calc(100%-2rem)] overflow-y-auto"
        className="max-w-3xl rounded-2xl bg-white shadow-2xl"
      >
        {open ? (
          <>
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-surface-variant bg-surface-container-low p-5">
              <h3 className="text-section-title text-primary">{t('details.title')}</h3>
              <DialogCloseButton
                onClick={() => setOpenId(null)}
                label={t('details.close')}
                className="h-9 w-9 rounded-full bg-white text-xl font-bold hover:bg-surface-container-high"
              />
            </div>
            <div className="p-6">
              <div className="mb-3 flex flex-wrap items-center gap-2">{tags(open)}</div>
              <h4
                id="referral-title"
                className="mb-4 text-headline-md leading-snug font-bold text-primary"
              >
                {open.title}
              </h4>
              <dl className="mb-4 grid grid-cols-1 gap-3 text-body-sm sm:grid-cols-3">
                <div className="rounded-sm bg-surface-container-low p-3">
                  <dt className="text-outline">{t('details.submitter')}</dt>
                  <dd className="font-bold text-primary">{open.name || t('noName')}</dd>
                </div>
                <div className="rounded-sm bg-surface-container-low p-3">
                  <dt className="text-outline">{t('details.email')}</dt>
                  <dd dir="ltr" className="font-bold break-all text-primary rtl:text-right">
                    {open.email || '—'}
                    {open.phone ? <span className="block font-normal">{open.phone}</span> : null}
                  </dd>
                </div>
                <div className="rounded-sm bg-surface-container-low p-3">
                  <dt className="text-outline">{t('details.referredAt')}</dt>
                  <dd className="font-bold text-primary">{date(open.referredAt)}</dd>
                </div>
              </dl>
              <p
                dir="auto"
                className="mb-4 rounded-sm border border-surface-variant p-4 text-body-md leading-relaxed whitespace-pre-line"
              >
                {open.message}
              </p>
              {open.referralNote ? (
                <p className="mb-4 rounded-sm bg-[#fbf4ea] p-3 text-sm text-[#6b5232]">
                  {t('details.adminNote', { note: open.referralNote })}
                </p>
              ) : null}
              <div className="mb-4">
                <div className="mb-2 text-label-md text-primary">{t('details.log')}</div>
                <ul className="flex flex-col gap-2 text-body-sm text-on-surface-variant">
                  {open.notes.length ? (
                    open.notes.map((entry) => (
                      <li key={entry.id} className="rounded-xs bg-surface-container-low p-2">
                        {date(entry.date)} – {entry.note}
                      </li>
                    ))
                  ) : (
                    <li className="text-outline">{t('details.noNotes')}</li>
                  )}
                </ul>
              </div>
              <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <label className="flex flex-col gap-1">
                  <span className="text-label-md">{t('details.status')}</span>
                  <select
                    value={status}
                    onChange={(event) => setStatus(event.target.value as FollowUpStatus)}
                    className={selectClass}
                  >
                    {FOLLOW_UP_STATUSES.map((key) => (
                      <option key={key} value={key}>
                        {t(`followUp.${key}`)}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 sm:col-span-2">
                  <span className="text-label-md">{t('details.note')}</span>
                  <input
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    maxLength={1000}
                    placeholder={t('details.notePlaceholder')}
                    dir="auto"
                    className={selectClass}
                  />
                </label>
              </div>
              {error ? (
                <p
                  role="alert"
                  className="mb-4 rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
                >
                  {error}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-end gap-2 border-t border-surface-variant pt-4">
                {open.email ? (
                  <a
                    href={mailto(open)}
                    className="me-auto rounded-sm border border-outline-variant px-5 py-2.5 text-label-md text-primary hover:bg-surface-container-low"
                  >
                    {t('details.mail')}
                  </a>
                ) : null}
                <button
                  type="button"
                  onClick={() => setOpenId(null)}
                  className="rounded-sm border border-outline-variant px-5 py-2.5 text-label-md text-primary hover:bg-surface-container-low"
                >
                  {t('details.close')}
                </button>
                <button
                  type="button"
                  disabled={pending}
                  onClick={save}
                  className="rounded-sm bg-primary px-5 py-2.5 text-label-md text-white hover:bg-[#013550] disabled:cursor-wait disabled:opacity-70"
                >
                  {pending ? t('details.saving') : t('details.save')}
                </button>
              </div>
            </div>
          </>
        ) : null}
      </Dialog>
      {toast}
    </>
  )
}
