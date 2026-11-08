import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getTranslations, setRequestLocale } from 'next-intl/server'

import { PostForm } from '@/components/portal/PostForm'
import { PostFormHeader } from '@/components/portal/PostFormHeader'
import { redirect } from '@/i18n/navigation'
import type { Locale } from '@/i18n/routing'
import { toUploadedFile, type UploadedFile } from '@/lib/portal/post-form'
import { isEditableStatus, isPortalPostType } from '@/lib/portal/post-types'
import { lexicalToText } from '@/lib/portal/rich-text'
import { getPayloadClient, requireStaffSession } from '@/lib/portal/session'
import type { Post } from '@/payload-types'

type Props = { params: Promise<{ locale: string; id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params
  const t = await getTranslations({ locale: locale as Locale, namespace: 'portalPostForm' })
  return { title: t('metaTitleEdit') }
}

export default async function EditPostPage({ params }: Props) {
  const { locale: rawLocale, id } = await params
  const locale = rawLocale as Locale
  setRequestLocale(locale)

  const session = await requireStaffSession(locale)
  if (!/^\d+$/.test(id)) notFound()

  // Loaded with the staff member's own permissions: they can only open their own posts.
  const payload = await getPayloadClient()
  let post: Post
  try {
    post = await payload.findByID({
      collection: 'posts',
      id: Number(id),
      depth: 1,
      user: session.user,
      overrideAccess: false,
    })
  } catch {
    notFound()
  }

  const committeeID = typeof post.committee === 'object' ? post.committee.id : post.committee
  if (committeeID !== session.membership.committee.id || !isPortalPostType(post.type)) notFound()

  // Submitted and approved posts can no longer be changed by staff.
  if (!isEditableStatus(post.status)) {
    return redirect({ href: { pathname: '/portal/posts', query: { type: post.type } }, locale })
  }

  return (
    <div className="flex w-full flex-col pb-16">
      <PostFormHeader
        mode="edit"
        committeeName={session.membership.committee.name}
        rejection={post.status === 'rejected' ? (post.rejectionReason ?? '') : undefined}
      />
      <PostForm
        postId={post.id}
        initial={{
          type: post.type,
          title: post.title,
          date: post.eventDate ? post.eventDate.slice(0, 10) : '',
          location: post.location ?? '',
          content: lexicalToText(post.content),
          cover: toUploadedFile(post.coverImage),
          gallery: (post.gallery ?? [])
            .map((row) => toUploadedFile(row.image))
            .filter((file): file is UploadedFile => file !== null),
          attachment: toUploadedFile(post.attachment),
          links: {
            instagram: post.links?.instagram ?? '',
            youtube: post.links?.youtube ?? '',
            x: post.links?.x ?? '',
            press: post.links?.press ?? '',
          },
        }}
      />
    </div>
  )
}
