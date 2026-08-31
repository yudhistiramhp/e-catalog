import { initializeApp } from 'firebase/app'
import { getFirestore, collection, doc, setDoc, updateDoc, increment, Timestamp } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBhOC7sFlXftnLw8Debnky3GLptHNSOzSA',
  authDomain: 'e-catalog-project.firebaseapp.com',
  projectId: 'e-catalog-project',
  storageBucket: 'e-catalog-project.firebasestorage.app',
  messagingSenderId: '268801840504',
  appId: '1:268801840504:web:9a2fbe02fc81985c66648d',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)

async function backfill() {
  const startDate = new Date('2026-08-01')
  const endDate = new Date('2026-08-31')

  let opCount = 0

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const count = Math.floor(Math.random() * 3) + 3 // random 3-5

    for (let i = 0; i < count; i++) {
      const randomTime = new Date(d)
      randomTime.setHours(
        Math.floor(Math.random() * 24),
        Math.floor(Math.random() * 60),
        Math.floor(Math.random() * 60),
      )

      const ref = doc(collection(db, 'views'))
      await setDoc(ref, {
        timestamp: Timestamp.fromDate(randomTime),
      })
      opCount++
    }
  }

  const statsRef = doc(db, 'stats', 'site')
  await updateDoc(statsRef, { totalViews: increment(opCount) })

  console.log(`Berhasil menambahkan ${opCount} dokumen views dan totalViews bertambah ${opCount}.`)
}

backfill().catch(console.error)