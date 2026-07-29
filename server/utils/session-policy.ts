export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60
export const RECENT_LOGIN_MAX_AGE_SECONDS = 5 * 60

export const isRecentLogin = (
  authTime: number,
  now = Math.floor(Date.now() / 1_000),
) => Math.abs(now - authTime) <= RECENT_LOGIN_MAX_AGE_SECONDS

export const isSameOrigin = (
  origin: string | undefined,
  requestOrigin: string,
) => origin === requestOrigin
