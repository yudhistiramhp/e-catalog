import { getFirebaseAdminAuth } from '../../utils/firebase-admin'
import { setSessionCookie, toSessionUser } from '../../utils/session'
import {
  isRecentLogin,
  isSameOrigin,
  SESSION_MAX_AGE_SECONDS,
} from '../../utils/session-policy'

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, 'origin')
  const requestOrigin = getRequestURL(event).origin

  if (!isSameOrigin(origin, requestOrigin)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin' })
  }

  const body = await readBody<unknown>(event)
  const idToken = typeof body === 'object' && body !== null && 'idToken' in body
    ? (body as { idToken?: unknown }).idToken
    : undefined

  if (typeof idToken !== 'string' || idToken.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID token is required' })
  }

  let decoded
  try {
    decoded = await getFirebaseAdminAuth().verifyIdToken(idToken)
  }
  catch (error) {
    console.error('[auth/session] Firebase ID token verification failed:', error)
    throw createError({ statusCode: 401, statusMessage: 'Invalid ID token' })
  }

  if (!isRecentLogin(decoded.auth_time)) {
    const now = Math.floor(Date.now() / 1_000)
    console.warn('[auth/session] Recent login check failed:', {
      authTime: decoded.auth_time,
      now,
      ageSeconds: now - decoded.auth_time,
    })
    throw createError({ statusCode: 401, statusMessage: 'Recent login required' })
  }

  const sessionCookie = await getFirebaseAdminAuth().createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1_000,
  })

  setSessionCookie(event, sessionCookie)
  return toSessionUser(decoded)
})
