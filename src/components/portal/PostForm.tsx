'use client'

import { useLocale, useTranslations } from 'next-intl'
import { useRef, useState, useTransition } from 'react'

import { savePost, uploadPostFile } from '@/app/(frontend)/[locale]/portal/(staff)/posts/actions'
import { Link, useRouter } from '@/i18n/navigation'
import { digits } from '@/lib/format'
import {
  IMAGE_TYPES,
  isHttpUrl,
  MAX_GALLERY_PHOTOS,
  MAX_IMAGE_BYTES,
  MAX_PDF_BYTES,
  PDF_TYPE,
  POST_LINK_KEYS,
  type PostFormValues,
  type UploadedFile,
} from '@/lib/portal/post-form'
import { PORTAL_POST_TYPES } from '@/lib/portal/post-types'

import { useToast } from './Toast'

const inputClass =
  'h-12 w-full rounded-sm border border-outline-variant bg-surface-container-lowest px-4 text-body-md text-on-surface transition-colors focus:border-primary focus:outline-none'
const dropZoneClass =
  'relative flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed bg-surface-container-low/40 text-center transition-colors hover:bg-surface-container-low focus-within:border-primary'
const toolbarButtonClass =
  'rounded-xs border border-outline-variant bg-surface-container-lowest px-3 py-1 text-label-sm text-primary transition-colors hover:bg-surface-container-high'

type UploadKind = 'image' | 'pdf'
type FileStatus = { text: string; tone: 'muted' | 'ok' | 'error' }

/** A dashed drop zone that opens the file picker on click and accepts dropped files. */
function DropZone({
  id,
  accept,
  multiple,
  prompt,
  status,
  className,
  onFiles,
  disabled,
}: {
  id: string
  accept: string
  multiple?: boolean
  prompt: string
  status: FileStatus
  className: string
  onFiles: (files: File[]) => void
  disabled?: boolean
}) {
  const [over, setOver] = useState(false)
  const tone =
    status.tone === 'ok'
      ? 'font-bold text-secondary'
      : status.tone === 'error'
        ? 'font-bold text-error'
        : 'text-on-surface-variant'

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault()
        setOver(true)
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(event) => {
        event.preventDefault()
        setOver(false)
        if (!disabled) onFiles([...event.dataTransfer.files])
      }}
      className={`${dropZoneClass} ${over ? 'border-primary bg-surface-container-low' : 'border-outline-variant'} ${className}`}
    >
      <input
        id={id}
        type="file"
        accept={accept}
        multiple={multiple}
        disabled={disabled}
        className="sr-only"
        onChange={(event) => {
          onFiles([...(event.target.files ?? [])])
          event.target.value = ''
        }}
      />
      <span className="mb-1 text-label-md text-primary">{prompt}</span>
      <span aria-live="polite" className={`text-body-sm ${tone}`}>
        {status.text}
      </span>
    </label>
  )
}

/** "Add post" / "Edit post" form (staff portal). Content is saved as Payload rich text. */
export function PostForm({ postId, initial }: { postId?: number; initial: PostFormValues }) {
  const t = useTranslations('portalPostForm')
  const locale = useLocale()
  const router = useRouter()
  const { toast, show } = useToast()
  const [values, setValues] = useState(initial)
  const [id, setId] = useState(postId)
  const [invalid, setInvalid] = useState<string[]>([])
  const [formError, setFormError] = useState<string | null>(null)
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [statuses, setStatuses] = useState<Record<string, FileStatus | undefined>>({})
  const [pending, startTransition] = useTransition()
  const contentRef = useRef<HTMLTextAreaElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)

  const number = (value: number) => new Intl.NumberFormat(locale, digits(locale)).format(value)
  const set = <K extends keyof PostFormValues>(key: K, value: PostFormValues[K]) =>
    setValues((current) => ({ ...current, [key]: value }))
  const isInvalid = (field: string) => invalid.includes(field)
  const busy = pending || Object.values(uploading).some(Boolean)

  async function upload(file: File, kind: UploadKind): Promise<UploadedFile | string> {
    const allowed = kind === 'pdf' ? [PDF_TYPE] : IMAGE_TYPES
    if (!allowed.includes(file.type)) return t('errors.type')
    if (file.size > (kind === 'pdf' ? MAX_PDF_BYTES : MAX_IMAGE_BYTES)) return t('errors.size')

    const data = new FormData()
    data.set('file', file)
    data.set('kind', kind)
    data.set('alt', values.title || file.name)
    try {
      const result = await uploadPostFile(data)
      if (result.ok) return result.file
      return result.error === 'auth'
        ? t('errors.auth')
        : t(`errors.${result.error === 'generic' ? 'upload' : result.error}`)
    } catch {
      return t('errors.upload')
    }
  }

  async function chooseSingle(field: 'cover' | 'attachment', files: File[]) {
    const file = files[0]
    if (!file) return
    setUploading((current) => ({ ...current, [field]: true }))
    setStatuses((current) => ({ ...current, [field]: { text: t('uploading'), tone: 'muted' } }))
    const result = await upload(file, field === 'cover' ? 'image' : 'pdf')
    setUploading((current) => ({ ...current, [field]: false }))
    if (typeof result === 'string') {
      setStatuses((current) => ({ ...current, [field]: { text: result, tone: 'error' } }))
      return
    }
    set(field, result)
    setStatuses((current) => ({
      ...current,
      [field]: { text: t('fileChosen', { name: file.name }), tone: 'ok' },
    }))
  }

  async function chooseGallery(files: File[]) {
    if (!files.length) return
    const total = values.gallery.length + files.length
    if (total > MAX_GALLERY_PHOTOS) {
      setStatuses((current) => ({
        ...current,
        gallery: { text: t('galleryTooMany', { countText: number(total) }), tone: 'error' },
      }))
      return
    }
    setUploading((current) => ({ ...current, gallery: true }))
    setStatuses((current) => ({ ...current, gallery: { text: t('uploading'), tone: 'muted' } }))
    const added: UploadedFile[] = []
    let error: string | null = null
    for (const file of files) {
      const result = await upload(file, 'image')
      if (typeof result === 'string') {
        error = result
        break
      }
      added.push(result)
    }
    setUploading((current) => ({ ...current, gallery: false }))
    const gallery = [...values.gallery, ...added]
    setValues((current) => ({ ...current, gallery: [...current.gallery, ...added] }))
    setStatuses((current) => ({
      ...current,
      gallery: error
        ? { text: error, tone: 'error' }
        : {
            text: t('galleryCount', { count: gallery.length, countText: number(gallery.length) }),
            tone: 'ok',
          },
    }))
  }

  /** Toolbar: wraps the selected text in the formatting marks (see src/lib/portal/rich-text.ts). */
  function format(command: 'bold' | 'italic' | 'list' | 'alignStart' | 'center') {
    const area = contentRef.current
    if (!area) return
    const { selectionStart: start, selectionEnd: end, value } = area

    if (command === 'alignStart' || command === 'center') {
      // Applies to every line touched by the selection.
      const lineStart = value.lastIndexOf('\n', start - 1) + 1
      const nextBreak = value.indexOf('\n', end)
      const lineEnd = nextBreak === -1 ? value.length : nextBreak
      const lines = value
        .slice(lineStart, lineEnd)
        .split('\n')
        .map((line) => {
          const plain = line.replace(/^->\s?(.*?)\s?<-$/, '$1')
          return command === 'center' && plain.trim() ? `->${plain}<-` : plain
        })
        .join('\n')
      area.setRangeText(lines, lineStart, lineEnd, 'select')
    } else {
      const selected = value.slice(start, end)
      const replacement = {
        bold: `**${selected || t('toolbar.boldSample')}**`,
        italic: `*${selected || t('toolbar.italicSample')}*`,
        list: `${start > 0 && value[start - 1] !== '\n' ? '\n' : ''}- ${selected || t('toolbar.listSample')}`,
      }[command]
      area.setRangeText(replacement, start, end, 'select')
    }
    set('content', area.value)
    area.focus()
  }

  function validate() {
    const fields: string[] = []
    if (!values.title.trim()) fields.push('title')
    if (!values.content.trim()) fields.push('content')
    for (const key of POST_LINK_KEYS) {
      const link = values.links[key].trim()
      if (link && !isHttpUrl(link)) fields.push(key)
    }
    setInvalid(fields)
    if (fields.length) {
      const first = document.getElementById(`post-${fields[0]}`)
      ;(fields[0] === 'title' ? titleRef.current : first)?.focus()
    }
    return fields.length === 0
  }

  function save(submit: boolean) {
    setFormError(null)
    if (!validate()) return
    startTransition(async () => {
      const result = await savePost({
        id,
        type: values.type,
        title: values.title,
        date: values.date,
        location: values.location,
        content: values.content,
        links: values.links,
        coverId: values.cover?.id ?? null,
        galleryIds: values.gallery.map((photo) => photo.id),
        attachmentId: values.attachment?.id ?? null,
        submit,
      })

      if (!result.ok) {
        setInvalid(result.fields ?? [])
        setFormError(t(`errors.${result.error}`))
        return
      }

      if (result.status === 'submitted') {
        show(t('toast.submitted'))
        setTimeout(() => router.push('/portal'), 1800)
        return
      }

      show(t('toast.draft'))
      if (!id) {
        // Later saves update this draft instead of creating another post.
        setId(result.id)
        router.replace(`/portal/posts/${result.id}/edit`, { scroll: false })
      }
    })
  }

  const coverStatus: FileStatus = statuses.cover ?? {
    text: values.cover ? t('coverCurrent') : t('coverHint'),
    tone: 'muted',
  }
  const pdfStatus: FileStatus = statuses.attachment ?? {
    text: values.attachment ? t('pdfCurrent', { name: values.attachment.filename }) : t('pdfHint'),
    tone: 'muted',
  }
  const galleryStatus: FileStatus = statuses.gallery ?? {
    text: values.gallery.length
      ? t('galleryCount', {
          count: values.gallery.length,
          countText: number(values.gallery.length),
        })
      : t('galleryHint'),
    tone: 'muted',
  }

  const removeButton = (onClick: () => void) => (
    <button
      type="button"
      onClick={onClick}
      className="self-start text-label-sm text-error underline underline-offset-4 hover:text-on-error-container"
    >
      {t('remove')}
    </button>
  )

  return (
    <>
      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault()
          save(true)
        }}
        className="flex flex-col gap-10 rounded-2xl bg-surface-container-lowest p-8 shadow-sm"
      >
        {/* Basic information */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-surface-variant pb-3">
            <h2 className="text-section-title text-primary">{t('sections.basic')}</h2>
          </div>

          <fieldset className="flex flex-col gap-3">
            <legend className="mb-3 text-label-md text-primary">{t('type')}</legend>
            <div className="flex flex-wrap items-center gap-3">
              {PORTAL_POST_TYPES.map((type) => (
                <label key={type} className="relative cursor-pointer">
                  <input
                    type="radio"
                    name="post_type"
                    value={type}
                    checked={values.type === type}
                    onChange={() => set('type', type)}
                    className="peer sr-only"
                  />
                  <span className="inline-block rounded-sm border border-outline-variant bg-surface-container-lowest px-6 py-2.5 text-label-md text-on-surface-variant transition-all peer-checked:border-primary-container peer-checked:bg-primary-container peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-secondary">
                    {t(`types.${type}`)}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-col gap-2">
            <label htmlFor="post-title" className="text-label-md text-primary">
              {t('postTitle')}
            </label>
            <input
              ref={titleRef}
              id="post-title"
              value={values.title}
              onChange={(event) => set('title', event.target.value)}
              maxLength={180}
              required
              placeholder={t('postTitlePlaceholder')}
              dir="auto"
              aria-invalid={isInvalid('title') || undefined}
              aria-describedby={isInvalid('title') ? 'post-title-error' : undefined}
              className={`${inputClass} ${isInvalid('title') ? 'border-error' : ''}`}
            />
            {isInvalid('title') ? (
              <span id="post-title-error" className="text-xs text-error">
                {t('errors.title')}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <label htmlFor="post-date" className="text-label-md text-primary">
                {t('date')}
              </label>
              <input
                id="post-date"
                type="date"
                value={values.date}
                onChange={(event) => set('date', event.target.value)}
                className={inputClass}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="post-location" className="text-label-md text-primary">
                {t('location')}
              </label>
              <input
                id="post-location"
                value={values.location}
                onChange={(event) => set('location', event.target.value)}
                maxLength={180}
                placeholder={t('locationPlaceholder')}
                dir="auto"
                className={inputClass}
              />
            </div>
          </div>
        </section>

        {/* Media and content */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-surface-variant pb-3">
            <h2 className="text-section-title text-primary">{t('sections.media')}</h2>
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-md text-primary">{t('cover')}</span>
            <DropZone
              id="post-cover"
              accept="image/png, image/jpeg, image/webp"
              prompt={t('coverPrompt')}
              status={coverStatus}
              disabled={uploading.cover}
              className={`min-h-[140px] p-8 ${isInvalid('cover') ? 'border-error' : ''}`}
              onFiles={(files) => chooseSingle('cover', files)}
            />
            {values.cover && !uploading.cover
              ? removeButton(() => {
                  set('cover', null)
                  setStatuses((current) => ({ ...current, cover: undefined }))
                })
              : null}
          </div>

          <div className="flex flex-col gap-2">
            <label htmlFor="post-content" className="text-label-md text-primary">
              {t('content')}
            </label>
            <div
              className={`overflow-hidden rounded-sm border bg-surface-container-lowest transition-colors focus-within:border-primary ${
                isInvalid('content') ? 'border-error' : 'border-outline-variant'
              }`}
            >
              <div
                role="toolbar"
                aria-label={t('toolbar.label')}
                aria-controls="post-content"
                className="flex flex-wrap items-center gap-2 border-b border-surface-variant bg-surface-container-low/50 p-2"
              >
                <button
                  type="button"
                  onClick={() => format('bold')}
                  className={`${toolbarButtonClass} font-bold`}
                >
                  {t('toolbar.bold')}
                </button>
                <button
                  type="button"
                  onClick={() => format('italic')}
                  className={`${toolbarButtonClass} italic`}
                >
                  {t('toolbar.italic')}
                </button>
                <button type="button" onClick={() => format('list')} className={toolbarButtonClass}>
                  {t('toolbar.list')}
                </button>
                <div className="mx-1 h-5 w-px bg-outline-variant" />
                <button
                  type="button"
                  onClick={() => format('alignStart')}
                  className={toolbarButtonClass}
                >
                  {t('toolbar.alignStart')}
                </button>
                <button
                  type="button"
                  onClick={() => format('center')}
                  className={toolbarButtonClass}
                >
                  {t('toolbar.center')}
                </button>
              </div>
              <textarea
                ref={contentRef}
                id="post-content"
                value={values.content}
                onChange={(event) => set('content', event.target.value)}
                rows={8}
                maxLength={20000}
                placeholder={t('contentPlaceholder')}
                dir="auto"
                aria-invalid={isInvalid('content') || undefined}
                aria-describedby={isInvalid('content') ? 'post-content-error' : undefined}
                className="w-full resize-y bg-surface-container-lowest p-4 text-body-md text-on-surface focus:ring-0 focus:outline-none"
              />
            </div>
            {isInvalid('content') ? (
              <span id="post-content-error" className="text-xs text-error">
                {t('errors.content')}
              </span>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-md text-primary">{t('gallery')}</span>
            <DropZone
              id="post-gallery"
              accept="image/png, image/jpeg, image/webp"
              multiple
              prompt={t('galleryPrompt')}
              status={galleryStatus}
              disabled={uploading.gallery}
              className={`min-h-[120px] p-8 ${isInvalid('gallery') ? 'border-error' : ''}`}
              onFiles={chooseGallery}
            />
            {values.gallery.length ? (
              <ul className="flex flex-wrap gap-3">
                {values.gallery.map((photo, index) => (
                  <li
                    key={photo.id}
                    className="relative h-16 w-24 overflow-hidden rounded-sm bg-surface-container"
                  >
                    {photo.previewUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo.previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : null}
                    <button
                      type="button"
                      aria-label={t('removePhoto', { number: number(index + 1) })}
                      onClick={() => {
                        const gallery = values.gallery.filter((item) => item.id !== photo.id)
                        set('gallery', gallery)
                        setStatuses((current) => ({ ...current, gallery: undefined }))
                      }}
                      className="absolute end-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-black/60 text-sm font-bold text-white hover:bg-black/80"
                    >
                      ×
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-label-md text-primary">{t('pdf')}</span>
            <DropZone
              id="post-attachment"
              accept="application/pdf"
              prompt={t('pdfPrompt')}
              status={pdfStatus}
              disabled={uploading.attachment}
              className={`p-6 ${isInvalid('attachment') ? 'border-error' : ''}`}
              onFiles={(files) => chooseSingle('attachment', files)}
            />
            {values.attachment && !uploading.attachment
              ? removeButton(() => {
                  set('attachment', null)
                  setStatuses((current) => ({ ...current, attachment: undefined }))
                })
              : null}
          </div>
        </section>

        {/* Social media links */}
        <section className="flex flex-col gap-6">
          <div className="border-b border-surface-variant pb-3">
            <h2 className="text-section-title text-primary">{t('sections.links')}</h2>
            <p className="mt-1 text-body-sm text-on-surface-variant">{t('sections.linksHint')}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {POST_LINK_KEYS.map((key) => (
              <div key={key} className="flex flex-col gap-2">
                <label htmlFor={`post-${key}`} className="text-label-md text-primary">
                  {t(`links.${key}`)}
                </label>
                <input
                  id={`post-${key}`}
                  type="url"
                  dir="ltr"
                  value={values.links[key]}
                  onChange={(event) => set('links', { ...values.links, [key]: event.target.value })}
                  placeholder={
                    {
                      instagram: 'https://instagram.com/...',
                      youtube: 'https://youtube.com/...',
                      x: 'https://x.com/...',
                      press: 'https://omandaily.om/...',
                    }[key]
                  }
                  aria-invalid={isInvalid(key) || undefined}
                  className={`${inputClass} text-left ${isInvalid(key) ? 'border-error' : ''}`}
                />
                {isInvalid(key) ? (
                  <span className="text-xs text-error">{t('errors.url')}</span>
                ) : null}
              </div>
            ))}
          </div>
        </section>

        {formError ? (
          <p
            role="alert"
            className="rounded-sm bg-error-container p-3 text-sm font-bold text-on-error-container"
          >
            {formError}
          </p>
        ) : null}

        {/* Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-surface-variant pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <button
              type="submit"
              disabled={busy}
              className="rounded-sm bg-primary px-8 py-3.5 text-label-md text-white transition-colors hover:bg-secondary disabled:cursor-wait disabled:opacity-70"
            >
              {pending ? t('saving') : t('submit')}
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => save(false)}
              className="rounded-sm border border-outline-variant bg-surface-container-lowest px-6 py-3.5 text-label-md text-on-surface transition-colors hover:bg-surface-container-low disabled:cursor-wait disabled:opacity-70"
            >
              {t('saveDraft')}
            </button>
          </div>
          <Link
            href="/portal"
            className="text-body-md text-outline transition-colors hover:text-primary"
          >
            {t('cancel')}
          </Link>
        </div>
      </form>
      {toast}
    </>
  )
}
