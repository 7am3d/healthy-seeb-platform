import { digits } from '@/lib/format'

/** "24 November 2026" / "٢٤ نوفمبر ٢٠٢٦" */
export const formatPostDate = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, {
    ...digits(locale),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(iso))

/** "November 2026" / "نوفمبر ٢٠٢٦" */
export const formatMonthYear = (locale: string, iso: string) =>
  new Intl.DateTimeFormat(locale, { ...digits(locale), month: 'long', year: 'numeric' }).format(
    new Date(iso),
  )

/** File size as { value, unit } so the unit label can be translated: 4.2 + 'mb'. */
export function fileSize(
  locale: string,
  bytes?: number | null,
): { size: string; unit: 'mb' | 'kb' } | null {
  if (!bytes) return null
  const format = (value: number) =>
    new Intl.NumberFormat(locale, { ...digits(locale), maximumFractionDigits: 1 }).format(value)
  return bytes >= 1024 * 1024
    ? { size: format(bytes / (1024 * 1024)), unit: 'mb' }
    : { size: format(Math.max(1, bytes / 1024)), unit: 'kb' }
}

/** Announcements from the last 30 days get the "New" badge. */
export const isRecent = (iso: string) =>
  Date.now() - new Date(iso).getTime() < 30 * 24 * 60 * 60 * 1000
