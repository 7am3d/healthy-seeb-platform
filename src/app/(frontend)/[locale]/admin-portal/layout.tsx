
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

import { AdminShell } from '@/components/admin/AdminShell'
import type { Locale } from '@/i18n/routing'
import { requireAdminSession } from '@/lib/portal/session'

export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

type Props = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function AdminPortalLayout({ children, params }: Props) {
    const { locale: rawLocale } = await params
    const locale = rawLocale as Locale
    const session = await requireAdminSession(locale)

  return (
    <AdminShell userName={session.user.name || session.user.email}>
      {children}
    </AdminShell>
  )
}
