import React from 'react'

// Layout for the public website pages (home, about, committees, contact, ...).
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* Public website header goes here */}
      <main id="main-content">{children}</main>
      {/* Public website footer goes here */}
    </>
  )
}
