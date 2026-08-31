import { initializeApp } from 'firebase/app'
import { getFirestore, collection, getDocs, deleteDoc, doc, setDoc } from 'firebase/firestore'

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

async function cleanup() {
  const snap = await getDocs(collection(db, 'views'))
  let count = 0

  for (const docSnap of snap.docs) {
    await deleteDoc(docSnap.ref)
    count++
  }

  // Reset totalViews jadi 0 karena semua dokumen views sudah dihapus
  const statsRef = doc(db, 'stats', 'site')
  await setDoc(statsRef, { totalViews: 0 }, { merge: true })

  console.log(`Berhasil menghapus ${count} dokumen views dan reset totalViews ke 0.`)
}

cleanup().catch(console.error)