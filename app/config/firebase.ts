import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export const createFirebaseClient = (options: FirebaseOptions) => {
  const app = getApps().length ? getApp() : initializeApp(options)

  return { auth: getAuth(app), firestore: getFirestore(app) }
}
