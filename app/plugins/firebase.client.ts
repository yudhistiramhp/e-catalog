import { createFirebaseClient } from '@/config/firebase'
import { getFirestore } from 'firebase/firestore'

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
