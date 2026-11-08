import type { Messages } from '@/i18n/messages'
import type { Locale } from '@/i18n/routing'

// Gives autocomplete and type checking for translation keys,
// e.g. t('home.title') errors if the key does not exist.
declare module 'next-intl' {
  interface AppConfig {
    Locale: Locale
    Messages: Messages
  }
}
