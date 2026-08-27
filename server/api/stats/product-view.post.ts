import { initializeApp, getApps } from 'firebase/app'
import { getFirestore, doc, getDoc, setDoc, updateDoc, increment } from 'firebase/firestore'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const productId = body.productId
  if (!productId) {
    throw createError({ statusCode: 400, message: 'productId required' })
  }

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
    const viewerRef = doc(db, 'product_viewers', `${productId}_${ip}`)
    const snap = await getDoc(viewerRef)
    const now = Date.now()
    const threshold = 12 * 60 * 60 * 1000

    if (snap.exists()) {
      const data = snap.data()
      if (data.lastView && data.lastView.toMillis && now - data.lastView.toMillis() < threshold) {
        return { incremented: false, reason: 'Duplicate IP' }
      }
    }

    await setDoc(viewerRef, { productId, ip, lastView: new Date() }, { merge: true })
  }

  const productRef = doc(db, 'produk', productId)
  await updateDoc(productRef, {
    views: increment(1)
  })

  return { incremented: true }
})