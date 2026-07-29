import { useAuthSession } from '@/composables/useSession'
import { isPublicRoute } from '@/utils/route-policy'

export default defineNuxtRouteMiddleware(async (to) => {
  const isLogin = to.path === '/login'
  const isPrivate = !isPublicRoute(to.path)

  if (!isLogin && !isPrivate) return

  const { user, refresh } = useAuthSession()

  if (user.value === undefined) {
    await refresh()
  }

  if (isLogin && user.value) {
    return navigateTo('/dashboard')
  }

  if (isPrivate && !user.value) {
    return navigateTo('/login')
  }
})
