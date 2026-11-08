import type { Metadata } from 'next'
import React from 'react'

// Portal pages are private: keep them out of search engines.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function PortalRootLayout({ children }: { children: React.ReactNode }) {
  return children
}
