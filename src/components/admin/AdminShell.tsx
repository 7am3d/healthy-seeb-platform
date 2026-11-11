
'use client'

import Image from 'next/image'
import { useLocale } from 'next-intl'
import { usePathname } from 'next/navigation'
import { useState } from 'react'

import { Link } from '@/i18n/navigation'
import { logoutAction } from '@/app/(frontend)/[locale]/portal/actions'

type Props = {
  userName: string
  children: React.ReactNode
}

export function AdminShell({ userName, children }: Props) {
  const locale = useLocale()
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)
  const ar = locale === 'ar'

  const nav = [
    { href: '/admin-portal', ar: 'لوحة التحكم', en: 'Dashboard' },
    { href: '/admin-portal/approvals', ar: 'الاعتمادات', en: 'Approvals' },
    { href: '/admin-portal/committees', ar: 'اللجان', en: 'Committees' },
    { href: '/admin-portal/users', ar: 'المستخدمون', en: 'Users' },
  ]

  return (
    <div className="min-h-screen bg-background">
      <aside
        className={`fixed start-0 top-0 z-50 flex h-full w-72 flex-col bg-white shadow-sm transition-transform lg:translate-x-0 ${
          menuOpen ? 'translate-x-0' : 'max-lg:ltr:-translate-x-full max-lg:rtl:translate-x-full'
        }`}
      >
        <div className="border-b border-surface-variant p-6">
          <h2 className="text-section-title text-primary">
            {ar ? 'إدارة ولاية السيب الصحية' : 'Healthy Seeb Administration'}
          </h2>
          <p className="text-label-sm text-secondary">
            {ar ? 'بوابة المسؤول' : 'Administrator Portal'}
          </p>
        </div>

        <nav className="flex flex-1 flex-col gap-2 p-4">
          {nav.map((item) => {
            const active =
              pathname === `/${locale}${item.href}` ||
              (item.href !== '/admin-portal' &&
                pathname.startsWith(`/${locale}${item.href}/`))

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className={`rounded-lg px-4 py-3 text-body-md ${
                  active
                    ? 'bg-mint font-bold text-secondary'
                    : 'text-on-surface-variant hover:bg-surface-container-low'
                }`}
              >
                {ar ? item.ar : item.en}
              </Link>
            )
          })}
        </nav>

        <div className="border-t border-surface-variant p-4">
          <form action={logoutAction}>
            <input type="hidden" name="locale" value={locale} />
            <button
              type="submit"
              className="w-full rounded-lg px-4 py-3 text-start text-error hover:bg-error-container"
            >
              {ar ? 'تسجيل الخروج' : 'Sign out'}
            </button>
          </form>
        </div>
      </aside>

      {menuOpen && (
        <button
          type="button"
          aria-label={ar ? 'إغلاق القائمة' : 'Close menu'}
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
        />
      )}

      <div className="lg:ps-72">
        <header className="sticky top-0 z-30 flex h-20 items-center justify-between gap-4 border-b border-surface-variant bg-white px-5 lg:px-10">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              className="rounded-lg border border-outline-variant px-3 py-2 lg:hidden"
            >
              ☰
            </button>

            <Image
              src="/brand/logo-horizontal.png"
              alt="Healthy Seeb"
              width={290}
              height={120}
              className="h-11 w-auto object-contain"
              priority
            />
          </div>

          <div className="text-end">
            <p className="text-label-md text-primary">{userName}</p>
            <p className="text-label-sm text-secondary">
              {ar ? 'المسؤول العام' : 'Super Administrator'}
            </p>
          </div>
        </header>

        <main id="main-content" className="mx-auto max-w-7xl px-5 py-8 lg:px-10">
          {children}
        </main>
      </div>
    </div>
  )
}
