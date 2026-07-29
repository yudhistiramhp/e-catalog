export interface ProdukJenis {
  id: string
  title: string
  colors: { name: string; hex: string; imageUrl: string }[]
}

export interface Produk {
  id: string
  name: string
  categoryId: string  // ref ke dokumen Kategori
  categoryName: string // denormalized untuk display
  price: number
  description: string
  jenis: ProdukJenis[]
  stock: number
  createdAt: number
  updatedAt: number
}

export interface ProdukInput {
  name: string
  categoryId: string
  price: number
  description?: string
  jenis: Omit<ProdukJenis, 'id'>[]
  stock?: number
}
