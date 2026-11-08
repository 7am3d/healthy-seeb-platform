'use client'

import Image from 'next/image'
import { useLocale, useTranslations } from 'next-intl'
import { useState } from 'react'

import { Link, usePathname } from '@/i18n/navigation'
import { routing } from '@/i18n/routing'

type NavKey = 'home' | 'about' | 'committees' | 'news' | 'map' | 'contact'

// Same links as the prototype: sections of the home page, the About page, and the footer.
const NAV: Array<{ key: NavKey; href: string; matches?: (path: string) => boolean }> = [
  { key: 'home', href: '/', matches: (path) => path === '/' },
  { key: 'about', href: '/about', matches: (path) => path.startsWith('/about') },
  { key: 'committees', href: '/#committees-section' },
  { key: 'news', href: '/#events-section' },
  { key: 'map', href: '/#map-section' },
  { key: 'contact', href: '#footer-section' },
]

export function SiteHeader() {
  const t = useTranslations('site')
  const locale = useLocale()
  const pathname = usePathname()
  const [menuFor, setMenuFor] = useState<string | null>(null)
  // The menu belongs to the page it was opened on, so it closes after navigating.
  const menuOpen = menuFor === pathname
  const otherLocale = routing.locales.find((l) => l !== locale) ?? routing.defaultLocale

  const linkClass = (active: boolean) =>
    `px-space-md py-space-xs rounded-sm text-label-md transition-all duration-200 ${
      active ? 'bg-primary text-white' : 'text-primary hover:text-secondary hover:bg-mint'
    }`

  return (
    <header className="fixed start-0 end-0 top-0 z-50 w-full border-b border-primary/10 bg-white/95 shadow-sm backdrop-blur-md">
      <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-margin">
        <div className="flex items-center gap-space-lg">
          <Link className="flex items-center gap-3" href="/">
            <Image
              src="/brand/logo-horizontal.png"
              alt={t('logoAlt')}
              width={290}
              height={120}
              priority
              className="h-14 w-auto object-contain"
            />
          </Link>
        </div>

        <nav
          aria-label={t('nav.label')}
          className="absolute left-1/2 hidden -translate-x-1/2 items-center gap-2 lg:flex"
        >
          {NAV.map((item) => {
            const active = item.matches?.(pathname) ?? false
            return (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={linkClass(active)}
              >
                {t(`nav.${item.key}`)}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-2">
          {/* Language switch (not in the prototype; needed for the bilingual site) */}
          <Link
            href={pathname}
            locale={otherLocale}
            lang={otherLocale}
            hrefLang={otherLocale}
            aria-label={t('nav.switchLanguageLabel')}
            className="rounded-sm px-space-sm py-space-xs text-label-md text-primary transition-colors hover:bg-mint hover:text-secondary"
          >
            {t('nav.switchLanguage')}
          </Link>
          {/* Phone/tablet menu (the prototype has no menu below desktop width) */}
          <button
            type="button"
            onClick={() => setMenuFor(menuOpen ? null : pathname)}
            aria-label={menuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
            aria-expanded={menuOpen}
            aria-controls="site-mobile-menu"
            className="flex h-10 w-10 flex-col items-center justify-center gap-1 rounded-sm border border-outline-variant lg:hidden"
          >
            <span className="block h-0.5 w-5 bg-primary" />
            <span className="block h-0.5 w-5 bg-primary" />
            <span className="block h-0.5 w-5 bg-primary" />
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="site-mobile-menu"
          aria-label={t('nav.label')}
          className="border-t border-primary/10 bg-white px-margin py-3 lg:hidden"
        >
          <ul className="mx-auto flex max-w-[1280px] flex-col gap-1">
            {NAV.map((item) => {
              const active = item.matches?.(pathname) ?? false
              return (
                <li key={item.key}>
                  <Link
                    href={item.href}
                    onClick={() => setMenuFor(null)}
                    aria-current={active ? 'page' : undefined}
                    className={`block ${linkClass(active)}`}
                  >
                    {t(`nav.${item.key}`)}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      ) : null}
    </header>
  )
}
