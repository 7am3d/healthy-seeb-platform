import type { Metadata } from 'next'
import Image from 'next/image'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { redirect as localeRedirect } from '@/i18n/navigation'
import { redirect as nextRedirect } from 'next/navigation'
import type { Locale } from '@/i18n/routing'
import { digits } from '@/lib/format'
import { getPortalSession, portalHomeFor } from '@/lib/portal/session'

import type { LoginError } from '../actions'
import { LoginForm } from './LoginForm'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ error?: string }>
}

const KNOWN_ERRORS: LoginError[] = ['inactive', 'noCommittee']

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalLogin' })
  return { title: t('metaTitle') }
}

export default async function PortalLoginPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  // Already signed in with portal access: go straight to the portal.
const session = await getPortalSession()
const home = session ? portalHomeFor(session) : null

if (home) {
  if (session?.isAdmin) {
    nextRedirect(home)
  }

  localeRedirect({ href: home, locale })
}

  const { error } = await searchParams
  const initialError = KNOWN_ERRORS.find((known) => known === error)
  const t = await getTranslations('portalLogin')

  return (
    <main
      id="main-content"
      className="flex min-h-screen w-full flex-col overflow-hidden bg-white md:flex-row"
    >
      {/* Brand side (right in Arabic, left in English) */}
      <div
        className="relative flex min-h-[420px] w-full flex-col items-center justify-center overflow-hidden p-8 text-primary select-none md:min-h-screen md:w-1/2 md:p-12"
        style={{
          background: 'radial-gradient(ellipse at 50% 45%, #F3F9F5 0%, #E2EFE7 45%, #BFDDCB 100%)',
        }}
      >
        <div className="relative z-10 flex flex-col items-center justify-center text-center">
          <Image
            src="/brand/logo-stacked.png"
            alt={t('title')}
            width={700}
            height={898}
            priority
            className="pointer-events-none mb-8 h-auto w-44 object-contain md:w-52"
          />
          <p className="text-[22px] font-medium md:text-[24px]">{t('slogan')}</p>
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-0 w-full overflow-hidden leading-none">
          <svg
            aria-hidden="true"
            className="relative block h-24 w-full md:h-36"
            preserveAspectRatio="none"
            viewBox="0 0 1200 120"
          >
            <path
              d="M0,0 C150,90 350,-40 500,60 C650,160 900,10 1200,40 L1200,120 L0,120 Z"
              fill="#b79f7d"
              fillOpacity="0.35"
            />
            <path
              d="M0,20 C200,100 450,10 650,70 C850,130 1050,40 1200,60 L1200,120 L0,120 Z"
              fill="#116e68"
              fillOpacity="0.15"
            />
          </svg>
        </div>
      </div>

      {/* Form side */}
      <div className="flex min-h-screen w-full flex-col items-center justify-between bg-white p-8 md:w-1/2 lg:p-16">
        <div className="hidden w-full md:block" />
        <div className="my-auto flex w-full max-w-[400px] flex-col py-8">
          <div className="mb-8">
            <h1 className="mb-2 text-[32px] leading-tight font-bold text-primary">{t('title')}</h1>
            <p className="text-[15px] text-slate-500 md:text-[16px]">{t('subtitle')}</p>
          </div>
          <LoginForm initialError={initialError} />
        </div>
        <div className="w-full pb-4 text-center">
          <p className="text-xs text-slate-400">
            {t('copyright', {
              year: new Intl.NumberFormat(locale, { ...digits(locale), useGrouping: false }).format(
                new Date().getFullYear(),
              ),
            })}
          </p>
        </div>
      </div>
    </main>
  )
}
