/**
 * The UI/UX design shows Arabic-Indic digits (٢٠٢٦) on Arabic pages.
 * Modern browsers default to Western digits (2026) for "ar", so pass these
 * options whenever you format a number or a date:
 *
 *   format.number(count, digits(locale))
 *   format.dateTime(date, { ...digits(locale), day: '2-digit', month: 'long', year: 'numeric' })
 */
export const digits = (locale: string) =>
  ({ numberingSystem: locale === 'ar' ? 'arab' : 'latn' }) as const
