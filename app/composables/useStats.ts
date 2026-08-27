import { doc, collection, addDoc, query, where, getDocs, onSnapshot, increment, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore'

export const useStats = () => {
  const { $firestore } = useNuxtApp()
  const fs = $firestore as any

  const getStatsRef = () => doc(fs, 'stats', 'site')
  const viewsRef = () => collection(fs, 'views')

  const subscribe = (cb: (data: { totalViews: number }) => void) => {
    return onSnapshot(getStatsRef(), (snap) => {
      if (snap.exists()) {
        cb(snap.data() as { totalViews: number })
      } else {
        cb({ totalViews: 0 })
      }
    })
  }

  const incrementView = async () => {
    const statsRef = getStatsRef()
    try {
      await updateDoc(statsRef, {
        totalViews: increment(1),
      })
    } catch (e: any) {
      if (e.code === 'not-found') {
        await setDoc(statsRef, { totalViews: 1 })
      } else {
        console.error('Failed to increment view:', e)
      }
    }
    // Record daily view
    try {
      await addDoc(viewsRef(), { timestamp: serverTimestamp() })
    } catch (e) {
      console.error('Failed to record view:', e)
    }
  }

  const getViewsByRange = async (start: Date, end: Date) => {
    const q = query(
      viewsRef(),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
    )
    const snap = await getDocs(q)
    return snap.size
  }

  const getDailyViews = async (start: Date, end: Date) => {
    const q = query(
      viewsRef(),
      where('timestamp', '>=', start),
      where('timestamp', '<=', end),
    )
    const snap = await getDocs(q)
    const daily: { [date: string]: number } = {}
    snap.docs.forEach((doc) => {
      const data = doc.data()
      const ts = data.timestamp?.toDate?.() || data.timestamp
      if (ts) {
        const date = ts.toISOString().slice(0, 10)
        daily[date] = (daily[date] || 0) + 1
      }
    })
    return daily
  }

  return { subscribe, incrementView, getViewsByRange, getDailyViews }
}