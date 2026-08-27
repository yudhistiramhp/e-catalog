import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, addDoc, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const firebaseConfig = config.public.firebase

  let app = getApps().find((a) => a.name === 'server')
  if (!app) {
    app = initializeApp(firebaseConfig, 'server')
  }
  const db = getFirestore(app)

  const ip =
    (event.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      event.headers.get('cf-connecting-ip') ??
      event.clientAddress ??
      'unknown')

  if (ip !== 'unknown') {
    const viewerRef = doc(db, 'viewers', ip)
    const snap = await getDoc(viewerRef)
    const now = Date.now()
    const threshold = 12 * 60 * 60 * 1000

    if (snap.exists()) {
      const data = snap.data()
      if (data.lastView && data.lastView.toMillis && now - data.lastView.toMillis() < threshold) {
        return { incremented: false, reason: 'Duplicate IP' }
      }
    }

    await setDoc(viewerRef, { ip, lastView: serverTimestamp() }, { merge: true })
  }

  const statsRef = doc(db, 'stats', 'site')
  await updateDoc(statsRef, { totalViews: increment(1) }).catch(async (e) => {
    if (e.code === 'not-found') {
      await setDoc(statsRef, { totalViews: 1 })
    } else {
      throw e
    }
  })

  await addDoc(collection(db, 'views'), { timestamp: serverTimestamp() })

  return { incremented: true }
})