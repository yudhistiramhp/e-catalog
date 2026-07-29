import type { DecodedIdToken } from 'firebase-admin/auth'
import type { H3Event } from 'h3'
import { firebaseAdminAuth } from './firebase-admin'
import { SESSION_MAX_AGE_SECONDS } from './session-policy'

export const SESSION_COOKIE_NAME = '__session'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
}

export const toSessionUser = (token: DecodedIdToken) => ({
  uid: token.uid,
  name: token.name ?? null,
  email: token.email ?? null,
  picture: token.picture ?? null,
})

export const setSessionCookie = (event: H3Event, value: string) =>
  setCookie(event, SESSION_COOKIE_NAME, value, cookieOptions)

export const clearSessionCookie = (event: H3Event) =>
  deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })

export const getSessionUser = async (event: H3Event) => {
  const cookie = getCookie(event, SESSION_COOKIE_NAME)

  if (!cookie) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    return toSessionUser(await firebaseAdminAuth.verifySessionCookie(cookie))
  }
  catch {
    clearSessionCookie(event)
    throw createError({ statusCode: 401, statusMessage: 'Invalid session' })
  }
}
