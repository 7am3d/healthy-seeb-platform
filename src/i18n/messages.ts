/**
 * All website text lives in /messages/<language>/<namespace>.json.
 * Each page or feature has its own namespace file, so two developers
 * rarely edit the same file.
 *
 * To add a namespace (e.g. "contact"):
 *   1. Create messages/en/contact.json and messages/ar/contact.json
 *   2. Import both below and add them to `en` and `ar` (keep the lists alphabetical)
 *   3. Use it in a page: const t = await getTranslations('contact')
 *
 * TypeScript checks that the Arabic files contain every key that the
 * English files have, so a missing translation is a build error.
 */
import arCommon from '../../messages/ar/common.json'
import arHome from '../../messages/ar/home.json'
import arPortal from '../../messages/ar/portal.json'
import arPortalDashboard from '../../messages/ar/portalDashboard.json'
import arPortalLogin from '../../messages/ar/portalLogin.json'
import arPortalPosts from '../../messages/ar/portalPosts.json'
import enCommon from '../../messages/en/common.json'
import enHome from '../../messages/en/home.json'
import enPortal from '../../messages/en/portal.json'
import enPortalDashboard from '../../messages/en/portalDashboard.json'
import enPortalLogin from '../../messages/en/portalLogin.json'
import enPortalPosts from '../../messages/en/portalPosts.json'

import type { Locale } from './routing'

const en = {
  common: enCommon,
  home: enHome,
  portal: enPortal,
  portalDashboard: enPortalDashboard,
  portalLogin: enPortalLogin,
  portalPosts: enPortalPosts,
}

export type Messages = typeof en

const ar: Messages = {
  common: arCommon,
  home: arHome,
  portal: arPortal,
  portalDashboard: arPortalDashboard,
  portalLogin: arPortalLogin,
  portalPosts: arPortalPosts,
}

export const messages: Record<Locale, Messages> = { ar, en }
