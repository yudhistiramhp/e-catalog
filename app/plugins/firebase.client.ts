import { createFirebaseClient } from '@/config/firebase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { auth, firestore } = createFirebaseClient(config.public.firebase)

  return {
    provide: {
      firebaseAuth: auth,
      firestore,
    },
  }
})
