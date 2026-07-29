import { clearSessionCookie } from '../../utils/session'
import { isSameOrigin } from '../../utils/session-policy'

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')
  const requestOrigin = getRequestURL(event).origin

  if (!isSameOrigin(origin, requestOrigin)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin' })
  }

  clearSessionCookie(event)
  return { ok: true }
})
