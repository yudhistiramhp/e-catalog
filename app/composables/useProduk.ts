import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  increment,
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

  const subscribeOne = (
    id: string,
    onData: (item: Produk | null) => void,
    onError: (err: Error) => void,
  ) =>
    onSnapshot(
      doc(fs, 'produk', id),
      (snap) => onData(snap.exists() ? ({ id: snap.id, ...snap.data() } as Produk) : null),
      onError,
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

  const toggleFeatured = async (id: string, featured: boolean): Promise<void> => {
    await updateDoc(doc(fs, 'produk', id), { featured })
  }

  const uploadImage = async (
    file: File,
    onProgress?: (pct: number) => void,
  ): Promise<string> => {
    const body = new FormData()
    body.append('file', file)
    const res = await $fetch('/api/upload', {
      method: 'POST',
      body,
      onResponseProgress(progress) {
        if (onProgress && progress.total) {
          onProgress(Math.round((progress.loaded / progress.total) * 100))
        }
      },
    })
    return res.url
  }

  const incrementWhatsappClick = async (id: string): Promise<void> => {
    await updateDoc(doc(fs, 'produk', id), {
      whatsappClicks: increment(1)
    })
  }

  const incrementProductView = async (id: string): Promise<void> => {
    try {
      await $fetch('/api/stats/product-view', {
        method: 'POST',
        body: { productId: id }
      })
    } catch (e) {
      console.error('Failed to record product view:', e)
    }
  }

  return { subscribe, subscribeOne, add, update, remove, toggleFeatured, uploadImage, incrementWhatsappClick, incrementProductView }
}
