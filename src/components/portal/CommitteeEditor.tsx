'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'

import { saveCommitteePage } from '@/app/(frontend)/[locale]/portal/(staff)/committee/actions'
import { useRouter } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import {
  COMMITTEE_LIMITS,
  type CommitteePageValues,
  EMAIL_PATTERN,
} from '@/lib/portal/committee-form'

import { useToast } from './Toast'

const fieldClass =
  'w-full rounded-sm border-0 bg-surface-container-low px-space-md py-3 text-body-md text-on-surface transition-colors focus:bg-surface-container-lowest focus:ring-1 focus:ring-secondary focus:outline-none disabled:opacity-70'
const rowInputClass =
  'w-full rounded-sm border border-outline-variant/60 bg-surface-container-lowest px-space-md py-2.5 text-body-md text-on-surface focus:border-outline-variant/60 focus:ring-1 focus:ring-secondary focus:outline-none disabled:opacity-70'
const deleteClass =
  'shrink-0 rounded-sm px-space-sm text-label-md text-error hover:bg-error-container disabled:hidden'
const addClass =
  'cursor-pointer py-1 text-label-md text-secondary transition-colors hover:text-primary disabled:hidden'

function Card({
  accent,
  children,
}: {
  accent: 'primary' | 'secondary'
  children: React.ReactNode
}) {
  return (
    <section className="relative overflow-hidden rounded-lg bg-surface-container-lowest p-space-lg shadow-sm">
      <div
        aria-hidden="true"
        className={`absolute start-0 end-0 top-0 h-1 ${accent === 'primary' ? 'bg-primary' : 'bg-secondary'}`}
      />
      {children}
    </section>
  )
}

let nextKey = 0
const newKey = () => `new-${++nextKey}`

/** Staff "Committee page" editor. Saves a draft that an administrator publishes. */
export function CommitteeEditor({
  committeeName,
  initial,
  canEdit,
}: {
  committeeName: string
  initial: CommitteePageValues
  canEdit: boolean
}) {
  const t = useTranslations('portalCommittee')
  const locale = useLocale()
  const router = useRouter()
  const { toast, show } = useToast()
  const [values, setValues] = useState(initial)
  const [invalid, setInvalid] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const listEnd = useRef<{ members?: HTMLInputElement | null; items?: HTMLTextAreaElement | null }>(
    {},
  )

  const number = (value: number, pad = false) =>
    new Intl.NumberFormat(locale, {
      ...digits(locale),
      ...(pad ? { minimumIntegerDigits: 2 } : {}),
    }).format(value)
  const set = <K extends keyof CommitteePageValues>(key: K, value: CommitteePageValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))
  const isInvalid = (field: string) => invalid.includes(field)
  const disabled = !canEdit || pending

  function save() {
    setFormError(null)
    const fields: string[] = []
    if (values.chairEmail.trim() && !EMAIL_PATTERN.test(values.chairEmail.trim()))
      fields.push('chairEmail')
    if (values.description.trim().length > COMMITTEE_LIMITS.description) fields.push('description')
    setInvalid(fields)
    if (fields.length) {
      document.getElementById(`committee-${fields[0]}`)?.focus()
      return
    }

    startTransition(async () => {
      const result = await saveCommitteePage(values)
      if (!result.ok) {
        setInvalid(result.fields ?? [])
        setFormError(t(`errors.${result.error}`))
        return
      }
      show(t('toast'))
      router.refresh()
    })
  }

  const descriptionLength = values.description.length

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          save()
        }}
        className="flex flex-col gap-space-xl"
      >
        {/* Description */}
        <Card accent="secondary">
          <div className="mb-space-md">
            <label
              htmlFor="committee-description"
              className="mb-1 block text-headline-md text-primary"
            >
              {t('description.label')}
            </label>
            <p id="committee-description-hint" className="text-body-sm text-on-surface-variant">
              {t('description.hint')}
            </p>
          </div>
          <textarea
            id="committee-description"
            rows={4}
            value={values.description}
            onChange={(event) => set('description', event.target.value)}
            disabled={disabled}
            maxLength={COMMITTEE_LIMITS.description}
            aria-describedby="committee-description-hint committee-description-count"
            aria-invalid={isInvalid('description') || undefined}
            dir="auto"
            className={`${fieldClass} resize-y p-space-md shadow-inner`}
          />
          <div className="mt-space-xs flex items-center justify-between text-outline">
            <span className="text-label-sm">{t('description.limit')}</span>
            <span
              id="committee-description-count"
              className={`text-label-sm ${descriptionLength > 150 ? 'text-sand' : ''}`}
            >
              {t('description.count', { countText: number(descriptionLength) })}
            </span>
          </div>
        </Card>

        {/* Leadership */}
        <Card accent="primary">
          <div className="mb-space-lg">
            <h2 className="mb-1 text-headline-md text-primary">{t('leadership.title')}</h2>
            <p className="text-body-sm text-on-surface-variant">{t('leadership.hint')}</p>
          </div>
          <div className="mb-space-lg grid grid-cols-1 gap-space-lg md:grid-cols-2">
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="committee-chairName" className="text-label-md text-primary">
                {t('leadership.chair')}
              </label>
              <input
                id="committee-chairName"
                value={values.chairName}
                onChange={(event) => set('chairName', event.target.value)}
                disabled={disabled}
                maxLength={COMMITTEE_LIMITS.name}
                dir="auto"
                className={fieldClass}
              />
              <span className="text-label-sm text-outline">{t('leadership.chairHint')}</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="committee-chairEmail" className="text-label-md text-primary">
                {t('leadership.chairEmail')}
              </label>
              <input
                id="committee-chairEmail"
                type="email"
                dir="ltr"
                value={values.chairEmail}
                onChange={(event) => set('chairEmail', event.target.value)}
                disabled={disabled}
                aria-invalid={isInvalid('chairEmail') || undefined}
                className={`${fieldClass} text-left rtl:text-right ${isInvalid('chairEmail') ? 'ring-1 ring-error' : ''}`}
              />
              <span
                className={`text-label-sm ${isInvalid('chairEmail') ? 'text-error' : 'text-outline'}`}
              >
                {isInvalid('chairEmail') ? t('errors.email') : t('leadership.chairEmailHint')}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-space-lg md:grid-cols-2">
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="committee-rapporteurName" className="text-label-md text-primary">
                {t('leadership.rapporteur')}
              </label>
              <input
                id="committee-rapporteurName"
                value={values.rapporteurName}
                onChange={(event) => set('rapporteurName', event.target.value)}
                disabled={disabled}
                maxLength={COMMITTEE_LIMITS.name}
                dir="auto"
                className={fieldClass}
              />
              <span className="text-label-sm text-outline">{t('leadership.rapporteurHint')}</span>
            </div>
            <div className="flex flex-col gap-space-xs">
              <label htmlFor="committee-rapporteurTitle" className="text-label-md text-primary">
                {t('leadership.rapporteurTitle')}
              </label>
              <input
                id="committee-rapporteurTitle"
                value={values.rapporteurTitle}
                onChange={(event) => set('rapporteurTitle', event.target.value)}
                disabled={disabled}
                maxLength={COMMITTEE_LIMITS.title}
                dir="auto"
                className={fieldClass}
              />
              <span className="text-label-sm text-outline">
                {t('leadership.rapporteurTitleHint')}
              </span>
            </div>
          </div>
        </Card>

        {/* Members */}
        <Card accent="secondary">
          <div className="mb-space-lg flex items-center justify-between gap-space-md">
            <div>
              <h2 className="mb-1 text-headline-md text-primary">{t('members.title')}</h2>
              <p className="text-body-sm text-on-surface-variant">{t('members.hint')}</p>
            </div>
            <span className="shrink-0 rounded-xs bg-surface-container px-space-md py-1 text-label-md text-secondary">
              {t('members.count', {
                count: values.members.length,
                countText: number(values.members.length),
              })}
            </span>
          </div>
          <div className="mb-space-sm hidden grid-cols-12 gap-space-md rounded-sm bg-surface-container-low px-space-md py-space-sm text-label-md text-primary md:grid">
            <div className="col-span-5">{t('members.name')}</div>
            <div className="col-span-6">{t('members.jobTitle')}</div>
            <div className="col-span-1 text-end">{t('members.action')}</div>
          </div>
          <ul className="flex flex-col gap-space-sm">
            {values.members.map((member, index) => (
              <li
                key={member.key}
                className="grid grid-cols-1 items-center gap-space-sm rounded-sm bg-surface p-space-md transition-colors hover:bg-surface-container-low md:grid-cols-12 md:gap-space-md"
              >
                <div className="md:col-span-5">
                  <input
                    ref={(element) => {
                      if (index === values.members.length - 1) listEnd.current.members = element
                    }}
                    value={member.name}
                    onChange={(event) =>
                      set(
                        'members',
                        values.members.map((row) =>
                          row.key === member.key ? { ...row, name: event.target.value } : row,
                        ),
                      )
                    }
                    disabled={disabled}
                    maxLength={COMMITTEE_LIMITS.name}
                    placeholder={t('members.namePlaceholder')}
                    aria-label={t('members.nameLabel', { number: number(index + 1) })}
                    dir="auto"
                    className={rowInputClass}
                  />
                </div>
                <div className="md:col-span-6">
                  <input
                    value={member.title}
                    onChange={(event) =>
                      set(
                        'members',
                        values.members.map((row) =>
                          row.key === member.key ? { ...row, title: event.target.value } : row,
                        ),
                      )
                    }
                    disabled={disabled}
                    maxLength={COMMITTEE_LIMITS.title}
                    placeholder={t('members.jobTitlePlaceholder')}
                    aria-label={t('members.jobTitleLabel', { number: number(index + 1) })}
                    dir="auto"
                    className={rowInputClass}
                  />
                </div>
                <div className="flex md:col-span-1 md:justify-end">
                  <button
                    type="button"
                    disabled={disabled}
                    onClick={() =>
                      set(
                        'members',
                        values.members.filter((row) => row.key !== member.key),
                      )
                    }
                    aria-label={t('deleteMember', { number: number(index + 1) })}
                    className={`${deleteClass} py-1.5`}
                  >
                    {t('delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-space-md pt-space-sm">
            <button
              type="button"
              disabled={disabled || values.members.length >= COMMITTEE_LIMITS.members}
              onClick={() => {
                set('members', [...values.members, { key: newKey(), name: '', title: '' }])
                setTimeout(() => listEnd.current.members?.focus())
              }}
              className={addClass}
            >
              {t('members.add')}
            </button>
          </div>
        </Card>

        {/* Responsibilities */}
        <Card accent="secondary">
          <div className="mb-space-lg flex items-center justify-between gap-space-md">
            <div>
              <h2 className="mb-1 text-headline-md text-primary">{t('responsibilities.title')}</h2>
              <p className="text-body-sm text-on-surface-variant">
                {t('responsibilities.hint', { committee: committeeName })}
              </p>
            </div>
            <span className="shrink-0 rounded-xs bg-surface-container px-space-md py-1 text-label-md text-secondary">
              {t('responsibilities.count', {
                count: values.responsibilities.length,
                countText: number(values.responsibilities.length),
              })}
            </span>
          </div>
          <ol className="flex flex-col gap-space-sm">
            {values.responsibilities.map((item, index) => (
              <li
                key={item.key}
                className="flex items-start gap-space-md rounded-sm bg-surface p-space-md transition-colors hover:bg-surface-container-low"
              >
                <span
                  aria-hidden="true"
                  className="mt-2.5 w-6 shrink-0 text-center text-label-md text-sand"
                >
                  {number(index + 1, true)}
                </span>
                <textarea
                  ref={(element) => {
                    if (index === values.responsibilities.length - 1)
                      listEnd.current.items = element
                  }}
                  rows={2}
                  value={item.text}
                  onChange={(event) =>
                    set(
                      'responsibilities',
                      values.responsibilities.map((row) =>
                        row.key === item.key ? { ...row, text: event.target.value } : row,
                      ),
                    )
                  }
                  disabled={disabled}
                  maxLength={COMMITTEE_LIMITS.responsibility}
                  placeholder={t('responsibilities.placeholder')}
                  aria-label={t('responsibilities.itemLabel', { number: number(index + 1) })}
                  dir="auto"
                  className={`${rowInputClass} resize-y`}
                />
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() =>
                    set(
                      'responsibilities',
                      values.responsibilities.filter((row) => row.key !== item.key),
                    )
                  }
                  aria-label={t('deleteItem', { number: number(index + 1) })}
                  className={`${deleteClass} py-2`}
                >
                  {t('delete')}
                </button>
              </li>
            ))}
          </ol>
          <div className="mt-space-md pt-space-sm">
            <button
              type="button"
              disabled={
                disabled || values.responsibilities.length >= COMMITTEE_LIMITS.responsibilities
              }
              onClick={() => {
                set('responsibilities', [...values.responsibilities, { key: newKey(), text: '' }])
                setTimeout(() => listEnd.current.items?.focus())
              }}
              className={addClass}
            >
              {t('responsibilities.add')}
            </button>
          </div>
        </Card>

        {formError ? (
          <p
            role="alert"
            className="rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
          >
            {formError}
          </p>
        ) : null}

        {/* Save bar */}
        <div className="flex flex-col items-center justify-between gap-space-md rounded-lg bg-surface-container-lowest p-space-lg shadow-sm sm:flex-row">
          <div className="flex items-center gap-space-sm">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full bg-secondary" />
            <span className="text-body-sm text-on-surface-variant">{t('footerNote')}</span>
          </div>
          {canEdit ? (
            <div className="flex w-full items-center justify-end gap-space-md sm:w-auto">
              <button
                type="button"
                disabled={pending}
                onClick={() => {
                  setValues(initial)
                  setInvalid([])
                  setFormError(null)
                }}
                className="cursor-pointer rounded-sm bg-surface-container px-6 py-3.5 text-label-md text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-primary"
              >
                {t('cancel')}
              </button>
              <button
                type="submit"
                disabled={pending}
                className="cursor-pointer rounded-sm bg-primary-container px-8 py-3.5 text-label-md text-white shadow-sm transition-colors hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
              >
                {pending ? t('saving') : t('save')}
              </button>
            </div>
          ) : null}
        </div>
      </form>
      {toast}
    </>
  )
}
