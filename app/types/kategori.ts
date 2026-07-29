export interface Kategori {
  id: string
  name: string
  slug: string
  description: string
  createdAt: number
  updatedAt: number
}

export interface KategoriInput {
  name: string
  description?: string
}
