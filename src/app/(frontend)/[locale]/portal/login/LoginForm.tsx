'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useActionState, useState } from 'react'

import { PORTAL_SUPPORT_EMAIL } from '@/lib/portal/routes'

import { loginAction, type LoginError, type LoginState } from '../actions'

const inputClass =
  'h-12 w-full rounded-sm border border-slate-300 px-4 text-left text-slate-800 placeholder-slate-400 transition duration-200 focus:border-secondary focus:ring-1 focus:ring-secondary focus:outline-none'

export function LoginForm({ initialError }: { initialError?: LoginError }) {
  const t = useTranslations('portalLogin')
  const locale = useLocale()
  const [state, formAction, pending] = useActionState<LoginState, FormData>(
    loginAction,
    initialError ? { error: initialError } : undefined,
  )
  const [showPassword, setShowPassword] = useState(false)
  const [showForgotHelp, setShowForgotHelp] = useState(false)

  return (
    <form action={formAction} className="flex w-full flex-col" noValidate>
      <input type="hidden" name="locale" value={locale} />

      {state?.error ? (
        <p
          role="alert"
          className="mb-4 rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
        >
          {t(`errors.${state.error}`)}
        </p>
      ) : null}

      <div className="mb-5 flex flex-col">
        <label htmlFor="staff-email" className="mb-2 text-sm font-medium text-slate-700">
          {t('email')}
        </label>
        <input
          id="staff-email"
          name="email"
          type="email"
          dir="ltr"
          autoComplete="username"
          required
          defaultValue={state?.email}
          placeholder={t('emailPlaceholder')}
          className={inputClass}
        />
      </div>

      <div className="mb-4 flex flex-col">
        <label htmlFor="staff-password" className="mb-2 text-sm font-medium text-slate-700">
          {t('password')}
        </label>
        <div className="relative w-full" dir="ltr">
          <input
            id="staff-password"
            name="password"
            type={showPassword ? 'text' : 'password'}
            autoComplete="current-password"
            required
            placeholder="••••••••"
            className={`${inputClass} pr-16`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((show) => !show)}
            aria-pressed={showPassword}
            className="absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer rounded-xs px-2 py-1 text-xs font-medium text-slate-500 transition hover:text-slate-700"
          >
            {showPassword ? t('hide') : t('show')}
          </button>
        </div>
      </div>

      <div className="mt-2 mb-6 flex items-center justify-between">
        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700 select-none">
          <input
            type="checkbox"
            name="remember"
            className="h-4 w-4 cursor-pointer rounded-xs border-slate-300 accent-secondary"
          />
          <span>{t('remember')}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowForgotHelp(true)}
          className="text-sm font-medium text-secondary transition-colors hover:underline"
        >
          {t('forgot')}
        </button>
      </div>

      {showForgotHelp ? (
        <p className="-mt-3 mb-5 text-sm text-slate-600">
          {t('forgotHelp')}{' '}
          <a dir="ltr" href={`mailto:${PORTAL_SUPPORT_EMAIL}`} className="font-bold text-secondary">
            {PORTAL_SUPPORT_EMAIL}
          </a>
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="flex h-12 w-full cursor-pointer items-center justify-center rounded-sm bg-primary text-base font-bold text-white shadow-sm transition duration-200 hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70"
      >
        {pending ? t('submitting') : t('submit')}
      </button>
    </form>
  )
}
