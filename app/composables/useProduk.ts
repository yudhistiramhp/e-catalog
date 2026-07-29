import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore'
import type { Produk, ProdukInput } from '@/types/produk'

export const useProduk = () => {
  const { $firestore } = useNuxtApp()
  const fs = $firestore as any

  const ref = () => collection(fs, 'produk')

  const subscribe = (cb: (items: Produk[]) => void) =>
    onSnapshot(query(ref(), orderBy('createdAt', 'desc')),
      (snap) => {
        cb(snap.docs.map(d => ({ id: d.id, ...d.data() } as Produk)))
      },
      (err: Error) => console.error('[useProduk] subscribe error:', err),
    )

  const add = async (input: ProdukInput): Promise<string> => {
    const ref = await addDoc(collection(fs, 'produk'), {
      ...input,
      description: input.description ?? '',
      stock: input.stock ?? 0,
      jenis: input.jenis.map((j, i) => ({ ...j, id: `jenis-${i}-${Date.now()}` })),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
    return ref.id
  }

  const update = async (id: string, input: ProdukInput): Promise<void> => {
    await updateDoc(doc(fs, 'produk', id), {
      ...input,
      description: input.description ?? '',
      stock: input.stock ?? 0,
      updatedAt: serverTimestamp(),
    })
  }

  const remove = async (id: string): Promise<void> => {
    await deleteDoc(doc(fs, 'produk', id))
  }

  return { subscribe, add, update, remove }
}
