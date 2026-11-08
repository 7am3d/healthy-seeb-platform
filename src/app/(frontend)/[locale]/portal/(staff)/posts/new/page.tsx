import type { Metadata } from 'next'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PostForm } from '@/components/portal/PostForm'
import { PostFormHeader } from '@/components/portal/PostFormHeader'
import type { Locale } from '@/i18n/routing'
import { isPortalPostType } from '@/lib/portal/post-types'
import { requireStaffSession } from '@/lib/portal/session'

type Props = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ type?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalPostForm' })
  return { title: t('metaTitleNew') }
}

export default async function NewPostPage({ params, searchParams }: Props) {
  const { locale: rawLocale } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  const { type } = await searchParams

  return (
    <div className="flex w-full flex-col pb-16">
      <PostFormHeader mode="new" committeeName={session.membership.committee.name} />
      <PostForm
        initial={{
          // "+ Add" on the Events / Announcements / Reports list pre-selects that type.
          type: isPortalPostType(type) ? type : 'activity',
          title: '',
          date: '',
          location: '',
          content: '',
          cover: null,
          gallery: [],
          attachment: null,
          links: { instagram: '', youtube: '', x: '', press: '' },
        }}
      />
    </div>
  )
}
