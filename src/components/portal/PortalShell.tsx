'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useSearchParams } from 'next/navigation'
import React, { useState } from 'react'

import { logoutAction } from '@/app/(frontend)/[locale]/portal/actions'
import { Link, usePathname } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import { PORTAL_SUPPORT_EMAIL } from '@/lib/portal/routes'

type NavItem = {
  key: 'dashboard' | 'committee' | 'events' | 'announcements' | 'reports' | 'referrals'
  href: string
  /** Matches /portal/posts?type=<postType> */
  postType?: string
  badge?: number
}

type Props = {
  committeeName: string
  userName: string
  roleLabel: string
  referralsBadge?: number
  children: React.ReactNode
}

/** Staff portal frame: sidebar (off-canvas on mobile), top header and the page content. */
export function PortalShell({
  committeeName,
  userName,
  roleLabel,
  referralsBadge,
  children,
}: Props) {
  const t = useTranslations('portal')
  const locale = useLocale()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  // The mobile menu remembers the page it was opened on, so it closes by itself after navigating.
  const currentPage = `${pathname}?${searchParams.toString()}`
  const [menuOpenedOn, setMenuOpenedOn] = useState<string | null>(null)
  const menuOpen = menuOpenedOn === currentPage
  const setMenuOpen = (open: boolean) => setMenuOpenedOn(open ? currentPage : null)

  const nav: NavItem[] = [
    { key: 'dashboard', href: '/portal' },
    { key: 'committee', href: '/portal/committee' },
    { key: 'events', href: '/portal/posts?type=activity', postType: 'activity' },
    { key: 'announcements', href: '/portal/posts?type=announcement', postType: 'announcement' },
    { key: 'reports', href: '/portal/posts?type=report', postType: 'report' },
    { key: 'referrals', href: '/portal/referrals', badge: referralsBadge },
  ]

  const isActive = (item: NavItem) => {
    if (item.postType) {
      return pathname.startsWith('/portal/posts') && searchParams.get('type') === item.postType
    }
    if (item.href === '/portal') return pathname === '/portal'
    return pathname.startsWith(item.href)
  }

  const initial = userName.trim().charAt(0)

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside
        id="portal-sidebar"
        className={`fixed start-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col justify-between overflow-y-auto bg-surface-container-lowest shadow-[0_1px_8px_rgba(0,0,0,0.04)] transition-transform duration-300 ${
          menuOpen ? 'translate-x-0' : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
        }`}
      >
        <div className="flex flex-col">
          <div className="flex h-20 items-center gap-2 px-6">
            <div className="h-7 w-1.5 rounded-sm bg-secondary" />
            <div>
              <span className="block text-section-title text-primary">{t('title')}</span>
              <span className="block text-label-sm text-on-surface-variant">{t('orgName')}</span>
            </div>
          </div>
          <div className="px-4 pt-2 pb-1">
            <div className="px-2 text-label-sm text-outline">{t('nav.label')}</div>
          </div>
          <nav aria-label={t('nav.label')} className="flex flex-col gap-1 px-4">
            {nav.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.key}
                  href={item.href}
                  aria-current={active ? 'page' : undefined}
                  className={`flex items-center justify-between rounded-sm px-4 py-2 text-body-md transition-colors ${
                    active
                      ? 'bg-mint font-bold text-secondary'
                      : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
                  }`}
                >
                  <span>{t(`nav.${item.key}`)}</span>
                  {item.badge ? <FormattedBadge value={item.badge} /> : null}
                </Link>
              )
            })}
          </nav>
        </div>
        <div className="p-4">
          <div className="mb-2 rounded-sm bg-surface-container-low p-2">
            <div className="mb-1 text-label-sm text-secondary">{t('support.title')}</div>
            <a
              href={`mailto:${PORTAL_SUPPORT_EMAIL}`}
              dir="ltr"
              className="text-body-sm text-primary underline underline-offset-4"
            >
              {PORTAL_SUPPORT_EMAIL}
            </a>
          </div>
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="flex w-full items-center rounded-sm px-4 py-2 text-body-md text-error transition-colors hover:bg-error-container hover:text-on-error-container"
            >
              {t('logout')}
            </button>
          </form>
        </div>
      </aside>

      {/* Dark overlay behind the open mobile menu */}
      {menuOpen ? (
        <div
          aria-hidden="true"
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-[45] bg-black/40 lg:hidden"
        />
      ) : null}

      <div className="lg:ps-72">
        {/* Header */}
        <header className="fixed start-0 end-0 top-0 z-40 h-20 bg-surface-container-lowest/90 shadow-[0_1px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl lg:start-72">
          <div className="flex h-20 w-full items-center justify-between gap-3 px-4 lg:px-10">
            <div className="flex min-w-0 items-center gap-3 lg:gap-6">
              <button
                type="button"
                onClick={() => setMenuOpen(!menuOpen)}
                aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
                aria-expanded={menuOpen}
                aria-controls="portal-sidebar"
                className="flex h-10 w-10 shrink-0 flex-col items-center justify-center gap-1 rounded-sm border border-outline-variant lg:hidden"
              >
                <span className="block h-0.5 w-5 bg-primary" />
                <span className="block h-0.5 w-5 bg-primary" />
                <span className="block h-0.5 w-5 bg-primary" />
              </button>
              <Image
                src="/brand/logo-horizontal.png"
                alt={t('logoAlt')}
                width={290}
                height={120}
                priority
                className="h-9 w-auto object-contain lg:h-12"
              />
              <div className="hidden h-6 w-px bg-surface-variant sm:block" />
              <div className="hidden min-w-0 flex-col sm:flex">
                <span className="truncate text-section-title text-primary">{committeeName}</span>
                <span className="text-label-sm text-secondary">{t('location')}</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="hidden flex-col text-start md:flex">
                <span className="text-label-md text-primary">{userName}</span>
                <span className="text-body-sm text-on-surface-variant">{roleLabel}</span>
              </div>
              <div
                aria-hidden="true"
                className="flex h-9 w-9 items-center justify-center rounded-full bg-primary font-bold text-white"
              >
                {initial}
              </div>
            </div>
          </div>
        </header>

        <main
          id="main-content"
          className="relative min-h-screen w-full bg-background px-4 pt-20 lg:px-10"
        >
          <div className="mx-auto w-full max-w-7xl min-w-0 pt-6 pb-16 lg:pt-8">{children}</div>
        </main>
      </div>
    </div>
  )
}

function FormattedBadge({ value }: { value: number }) {
  const locale = useLocale()
  return (
    <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-sand px-2 text-xs font-bold text-white">
      {new Intl.NumberFormat(locale, digits(locale)).format(value)}
    </span>
  )
}
