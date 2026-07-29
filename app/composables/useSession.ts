import type { SessionUser } from '@/types/auth'

export const useAuthSession = () => {
  const user = useState<SessionUser | null | undefined>('session-user', () => undefined)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  const refresh = async () => {
    try {
      user.value = await $fetch<SessionUser>('/api/auth/session', {
        headers: requestHeaders,
      })
    }
    catch {
      user.value = null
    }

    return user.value
  }

  const setUser = (value: SessionUser | null) => {
    user.value = value
  }

  return { user, refresh, setUser }
}
