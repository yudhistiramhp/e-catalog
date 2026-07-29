import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
  type Firestore,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Kategori, KategoriInput } from '@/types/kategori'

// ponytail: in-memory cache, add invalidation when data grows large
const cache = new Map<string, Kategori>()

export const useKategori = () => {
  const fs = useNuxtApp().$firestore as unknown as Firestore

  const getKategoriRef = () => collection(fs, 'kategori')

  // Sync: fetch all once
  const fetchAll = async (): Promise<Kategori[]> => {
    const snap = await getDocs(query(getKategoriRef()))
    return snap.docs.map(d => ({ id: d.id, ...d.data() } as Kategori))
  }

  // Reactive: subscribe to real-time updates
  const subscribe = (cb: (items: Kategori[]) => void): Unsubscribe => {
    const unsub = onSnapshot(getKategoriRef(), (snap) => {
      const items = snap.docs.map(d => ({ id: d.id, ...d.data() } as Kategori))
      items.sort((a, b) => b.createdAt - a.createdAt)
      cache.clear()
      items.forEach(k => cache.set(k.id, k))
      cb(items)
    }, (err) => {
      console.error('[useKategori] subscribe error:', err)
    })

    return unsub
  }

  const add = async (input: KategoriInput): Promise<string> => {
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    const ref = await addDoc(getKategoriRef(), {
      name: input.name,
      slug,
      description: input.description ?? '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  const update = async (id: string, input: KategoriInput): Promise<void> => {
    const slug = input.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    await updateDoc(doc(fs, 'kategori', id), {
      name: input.name,
      slug,
      description: input.description ?? '',
      updatedAt: serverTimestamp(),
    })
    cache.delete(id)
  }

  const remove = async (id: string): Promise<void> => {
    await deleteDoc(doc(fs, 'kategori', id))
    cache.delete(id)
  }

  // Check if name already exists (exclude current id when editing)
  const nameExists = async (name: string, excludeId?: string): Promise<boolean> => {
    const snap = await getDocs(query(getKategoriRef(), where('slug', '==', name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''))))
    return snap.docs.some(d => d.id !== excludeId)
  }

  return { fetchAll, subscribe, add, update, remove, nameExists }
}
