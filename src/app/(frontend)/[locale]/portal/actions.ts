'use server'

import config from '@payload-config'
import { login, logout } from '@payloadcms/next/auth'
import { cookies } from 'next/headers'
import { hasLocale } from 'next-intl'

import { redirect as localeRedirect } from '@/i18n/navigation'
import { redirect as nextRedirect } from 'next/navigation'
import { routing } from '@/i18n/routing'
import { buildPortalSession, getPayloadClient, portalHomeFor } from '@/lib/portal/session'
import { PORTAL_ADMIN_HOME, PORTAL_LOGIN } from '@/lib/portal/routes'

export type LoginError = 'required' | 'invalid' | 'inactive' | 'noCommittee' | 'locked' | 'generic'
export type LoginState = { error?: LoginError; email?: string } | undefined

const toLocale = (value: FormDataEntryValue | null) => {
  const locale = String(value ?? '')
  return hasLocale(routing.locales, locale) ? locale : routing.defaultLocale
}

export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const email = String(formData.get('email') ?? '')
    .trim()
    .toLowerCase()
  const password = String(formData.get('password') ?? '')
  const remember = formData.get('remember') === 'on'
  const locale = toLocale(formData.get('locale'))

  if (!email || !password) return { error: 'required', email }

  let user
  try {
    ;({ user } = await login({ collection: 'users', config, email, password }))
  } catch (error) {
    const name = (error as { name?: string })?.name
    if (name === 'LockedAuth') return { error: 'locked', email }
    if (name === 'AuthenticationError' || name === 'ValidationError')
      return { error: 'invalid', email }
    console.error('Portal login failed', error)
    return { error: 'generic', email }
  }

  const payload = await getPayloadClient()
  const cookieStore = await cookies()
  const cookieName = `${payload.config.cookiePrefix}-token`

  // Without "Remember me", turn the login cookie into a session cookie
  // (deleted when the browser closes). With it, the cookie lasts until the token expires.
  if (!remember) {
    const token = cookieStore.get(cookieName)
    if (token) {
      cookieStore.set(cookieName, token.value, {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/',
      })
    }
  }

  // The new login cookie is not part of this request yet, so use the user returned by login().
  const session = user ? await buildPortalSession(user) : null
  const home = session ? portalHomeFor(session) : null

  if (!session || !home) {
    // Signed in, but not allowed to use the portal: remove the login cookie and explain why.
    cookieStore.delete(cookieName)
    return { error: session && !session.user.isActive ? 'inactive' : 'noCommittee', email }
  }

  if (session.isAdmin) {
  return nextRedirect(PORTAL_ADMIN_HOME)
}

return localeRedirect({ href: home, locale })
}

export async function logoutAction(formData: FormData) {
  const locale = toLocale(formData.get('locale'))
  await logout({ config })
  return localeRedirect({ href: PORTAL_LOGIN, locale })
}
