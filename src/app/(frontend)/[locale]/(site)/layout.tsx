import React from 'react'

import { SiteFooter } from '@/components/site/SiteFooter'
import { SiteHeader } from '@/components/site/SiteHeader'
import { SiteModalsProvider } from '@/components/site/SiteModals'
import { getSiteCommittees } from '@/lib/site/queries'

// Layout for the public website: fixed header, page content, footer,
// and the "Contribute with us" / "Terms" dialogs that any page can open.
export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const committees = await getSiteCommittees()

  return (
    <SiteModalsProvider committees={committees.map(({ code, name }) => ({ code, name }))}>
      <SiteHeader />
      <main id="main-content" className="min-h-screen w-full bg-background pt-20">
        {children}
      </main>
      <SiteFooter />
    </SiteModalsProvider>
  )
}
