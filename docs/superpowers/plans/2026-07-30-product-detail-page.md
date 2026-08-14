# Dynamic Product Detail Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengganti halaman detail produk dummy dengan data Firestore nyata dan galeri foto setiap jenis/warna produk.

**Architecture:** `useProduk` mendapat satu API baru, `subscribeOne`, yang mengikuti pola realtime subscription yang sudah dipakai koleksi produk. Route `/products/:id` memakai API itu, menyimpan produk serta foto aktif sebagai state lokal, lalu merender satu foto utama dan galeri thumbnail yang dikelompokkan berdasarkan jenis. Modal katalog tidak berubah; link detail yang sudah ada menjadi pintu masuk.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, TypeScript 5.9, Firebase Firestore 12, Tailwind CSS 4.

## Global Constraints

- Ubah hanya `app/composables/useProduk.ts` dan `app/pages/products/[id].vue`.
- Jangan ubah `app/pages/catalog.vue`; modal dan link `/products/${selectedProduct.id}` tetap dipakai.
- Jangan menambah dependency, test framework, related-products query, cart, image upload, atau field model baru.
- Gunakan tipe `Produk` dan `ProdukJenis` yang sudah ada di `app/types/produk.ts`.
- Tampilkan hanya field nyata: nama, kategori, harga, deskripsi, jenis/warna, stok.
- Warna tanpa `imageUrl` tetap terlihat sebagai swatch + nama, tetapi tidak menjadi pemilih foto.
- Produk tanpa foto memakai fallback SVG dengan warna pertama, atau `#3E2A1B` bila tidak ada warna.
- State wajib: loading, Firestore error, produk tidak ditemukan, produk ditemukan.
- Pertahankan CTA WhatsApp dan link kembali ke katalog.
- Verifikasi kompilasi memakai `npm run build`; proyek tidak memiliki Vue test framework.
- Jangan menyentuh perubahan lokal user di file lain.

## File Structure

- Modify: `app/composables/useProduk.ts` — API realtime satu dokumen `subscribeOne(id, onData, onError)`.
- Modify: `app/pages/products/[id].vue` — subscription route, reactive head metadata, status halaman, detail nyata, foto utama, galeri jenis/warna.

---

### Task 1: Tambah Subscription Satu Produk

**Files:**
- Modify: `app/composables/useProduk.ts:14-53`

**Interfaces:**
- Consumes: `doc(fs, 'produk', id)`, `onSnapshot`, tipe `Produk`.
- Produces: `subscribeOne(id: string, onData: (item: Produk | null) => void, onError: (err: Error) => void): () => void`.

- [ ] **Step 1: Catat baseline build**

Run:

```bash
npm run build
```

Expected: PASS. Jika gagal karena perubahan lokal yang sudah ada, simpan error baseline. Jangan memperbaiki file di luar scope.

- [ ] **Step 2: Tambah `subscribeOne` setelah `subscribe`**

Tambahkan kode berikut di `app/composables/useProduk.ts` setelah deklarasi `subscribe`:

```ts
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
```

Ubah return composable:

```ts
  return { subscribe, subscribeOne, add, update, remove }
```

Jangan mengubah perilaku `subscribe`, `add`, `update`, atau `remove`.

- [ ] **Step 3: Jalankan build untuk memverifikasi API baru**

Run:

```bash
npm run build
```

Expected: PASS tanpa error TypeScript pada `subscribeOne`, `doc`, `snap.exists()`, atau return object.

- [ ] **Step 4: Commit task**

```bash
git add app/composables/useProduk.ts
git commit -m "feat: add single product subscription"
```

---

### Task 2: Ganti Halaman Dummy dengan Detail Produk Realtime

**Files:**
- Modify: `app/pages/products/[id].vue:1-110`

**Interfaces:**
- Consumes: `useProduk().subscribeOne(id, onData, onError)` dari Task 1 dan tipe `Produk`.
- Produces: route `/products/:id` dengan status loading/error/not-found, foto utama, thumbnail per jenis/warna, detail produk nyata, CTA WhatsApp.

- [ ] **Step 1: Ganti seluruh `<script setup>`**

Ganti blok script lama dengan:

```vue
<script setup lang="ts">
import { useProduk } from '@/composables/useProduk'
import type { Produk } from '@/types/produk'

const route = useRoute()
const produkService = useProduk()

const product = ref<Produk | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedImage = ref('')

const id = computed(() => String(route.params.id))
const colors = computed(() => product.value?.jenis?.flatMap(jenis => jenis.colors) ?? [])
const fallbackColor = computed(() => colors.value[0]?.hex ?? '#3E2A1B')
const selectedImageAlt = computed(() => {
  const colorName = colors.value.find(color => color.imageUrl === selectedImage.value)?.name
  return colorName ? `${product.value?.name} - ${colorName}` : (product.value?.name ?? 'Foto produk')
})

onMounted(() => {
  const unsub = produkService.subscribeOne(
    id.value,
    (item) => {
      product.value = item
      selectedImage.value = item?.jenis
        ?.flatMap(jenis => jenis.colors)
        .find(color => color.imageUrl)?.imageUrl ?? ''
      loading.value = false
    },
    (err) => {
      console.error('[product detail] subscribe error:', err)
      error.value = 'Gagal memuat produk.'
      loading.value = false
    },
  )

  onUnmounted(unsub)
})

useHead(() => ({
  title: product.value ? `${product.value.name} — Agung Prada Bali` : 'Agung Prada Bali',
  meta: [{
    name: 'description',
    content: product.value?.description?.slice(0, 160) ?? 'Detail produk Agung Prada Bali.',
  }],
}))
</script>
```

Catatan wajib:

- Route ID tetap string; Firebase document ID bukan angka.
- `colors` meratakan seluruh warna lintas jenis hanya untuk fallback dan alt text.
- Foto awal adalah `imageUrl` valid pertama.
- Firestore error ditampilkan kepada user; detail error tetap dicatat di console.

- [ ] **Step 2: Ganti seluruh `<template>` dengan status halaman dan detail nyata**

Gunakan template berikut:

```vue
<template>
  <main>
    <div class="mx-auto max-w-screen-xl px-6 pb-0 pt-4">
      <nav class="text-sm text-gray" aria-label="Breadcrumb">
        <NuxtLink to="/" class="text-gold transition-colors hover:text-brown-950">Beranda</NuxtLink>
        <span class="mx-1.5 text-gray-light">›</span>
        <NuxtLink to="/catalog" class="text-gold transition-colors hover:text-brown-950">Produk</NuxtLink>
        <template v-if="product">
          <span class="mx-1.5 text-gray-light">›</span>
          <span>{{ product.name }}</span>
        </template>
      </nav>
    </div>

    <section v-if="loading" class="px-6 py-20 text-center">
      <p class="text-gray">Memuat produk...</p>
    </section>

    <section v-else-if="error" class="px-6 py-20 text-center">
      <p class="text-gray">{{ error }}</p>
      <NuxtLink to="/catalog" class="mt-4 inline-block border border-gold px-7 py-3 text-sm transition hover:bg-gold hover:text-white">
        Kembali ke Katalog
      </NuxtLink>
    </section>

    <section v-else-if="!product" class="px-6 py-20 text-center">
      <p class="text-gray">Produk tidak ditemukan.</p>
      <NuxtLink to="/catalog" class="mt-4 inline-block border border-gold px-7 py-3 text-sm transition hover:bg-gold hover:text-white">
        Kembali ke Katalog
      </NuxtLink>
    </section>

    <section v-else class="px-6 pb-20 pt-10 max-sm:py-5">
      <div class="mx-auto grid max-w-screen-xl gap-16 lg:grid-cols-[1.1fr_.9fr] max-lg:gap-10">
        <div>
          <div class="aspect-4/3 overflow-hidden border border-brown-border bg-brown-card">
            <img
              v-if="selectedImage"
              :src="selectedImage"
              :alt="selectedImageAlt"
              class="h-full w-full object-cover"
            />
            <svg v-else viewBox="0 0 600 450" class="h-full w-full" role="img" :aria-label="`Warna ${fallbackColor}`">
              <rect width="600" height="450" :fill="fallbackColor" />
              <pattern id="product-fallback" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.6" fill="#D9BD8E" />
                <path d="M20 8L23 18L33 20L23 22L20 32L17 22L7 20L17 18Z" fill="none" stroke="#D9BD8E" opacity=".6" />
              </pattern>
              <rect width="600" height="450" fill="url(#product-fallback)" />
              <rect x="20" y="20" width="560" height="410" fill="none" stroke="#B8935A" opacity=".5" />
            </svg>
          </div>

          <div v-if="product.jenis?.length" class="mt-6 space-y-6">
            <section v-for="jenis in product.jenis" :key="jenis.id">
              <h2 class="mb-3 font-display text-lg text-brown-950">{{ jenis.title }}</h2>
              <div class="flex flex-wrap gap-3">
                <button
                  v-for="color in jenis.colors.filter(item => item.imageUrl)"
                  :key="`${jenis.id}-${color.name}-${color.hex}`"
                  type="button"
                  class="w-24 border bg-cream p-2 text-left transition hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  :class="selectedImage === color.imageUrl ? 'border-gold' : 'border-brown-border'"
                  :aria-pressed="selectedImage === color.imageUrl"
                  :aria-label="`Tampilkan ${jenis.title}, warna ${color.name}`"
                  @click="selectedImage = color.imageUrl"
                >
                  <img :src="color.imageUrl" :alt="`${product.name} - ${jenis.title} - ${color.name}`" class="mb-2 aspect-square w-full object-cover" />
                  <span class="flex items-center gap-1.5 text-xs text-brown-700">
                    <span class="size-3 shrink-0 rounded-full border border-brown-border" :style="{ backgroundColor: color.hex }"></span>
                    <span class="truncate">{{ color.name }}</span>
                  </span>
                </button>

                <div
                  v-for="color in jenis.colors.filter(item => !item.imageUrl)"
                  :key="`${jenis.id}-${color.name}-${color.hex}-no-image`"
                  class="flex min-w-24 items-center gap-2 border border-brown-border bg-cream p-3 text-xs text-brown-700"
                >
                  <span class="size-5 shrink-0 rounded-full border border-brown-border" :style="{ backgroundColor: color.hex }"></span>
                  <span>{{ color.name }}</span>
                </div>
              </div>
            </section>
          </div>
        </div>

        <div class="pt-2">
          <span class="mb-3.5 inline-block text-xs italic uppercase tracking-[.18em] text-gold">Agung Prada Bali</span>
          <h1 class="mb-4 font-display text-4xl leading-tight max-sm:text-2xl">{{ product.name }}</h1>
          <div class="mb-6 font-display text-2xl text-gold">Rp {{ product.price.toLocaleString('id-ID') }}</div>
          <p class="mb-7 whitespace-pre-line leading-relaxed text-brown-700">{{ product.description }}</p>

          <dl class="mb-8 space-y-3 border-t border-gray-light pt-5 text-sm">
            <div class="flex justify-between gap-4">
              <dt class="text-gray">Kategori</dt>
              <dd class="text-right font-medium text-brown-950">{{ product.categoryName }}</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-gray">Varian</dt>
              <dd class="text-right font-medium text-brown-950">{{ product.jenis?.length ?? 0 }} jenis</dd>
            </div>
            <div class="flex justify-between gap-4">
              <dt class="text-gray">Stok</dt>
              <dd class="text-right font-medium text-brown-950">
                {{ product.stock > 0 ? `${product.stock} tersedia` : 'Habis' }}
              </dd>
            </div>
          </dl>

          <div class="flex flex-wrap gap-3 max-sm:flex-col">
            <a
              :href="`https://wa.me/628123968327?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(product.name)}`"
              target="_blank"
              rel="noopener"
              class="flex-1 bg-brown-950 px-7 py-3 text-center text-sm text-cream transition hover:bg-brown-700"
            >
              Hubungi via WhatsApp
            </a>
            <NuxtLink to="/catalog" class="flex-1 border border-gold bg-transparent px-7 py-3 text-center text-sm transition hover:bg-gold hover:text-white">
              Lihat Semua Produk
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>
  </main>
</template>
```

Aksesibilitas minimum yang tidak boleh dibuang:

- Thumbnail memakai elemen `button`, `type="button"`, `aria-pressed`, dan label yang menyebut jenis + warna.
- Gambar memiliki alt text produk + jenis + warna.
- Swatch tetap ditemani nama warna; informasi tidak hanya disampaikan lewat warna.
- Breadcrumb memakai `aria-label="Breadcrumb"`.
- Deskripsi mempertahankan newline memakai `whitespace-pre-line`.

- [ ] **Step 3: Jalankan build final**

Run:

```bash
npm run build
```

Expected: PASS. Tidak ada error Vue template, TypeScript, composable auto-import, atau Tailwind compilation.

- [ ] **Step 4: Jalankan pemeriksaan manual**

Run:

```bash
npm run dev
```

Buka satu ID Firestore nyata melalui modal katalog: `/catalog` → klik produk → `Lihat Detail Lengkap`.

Expected:

1. URL berbentuk `/products/<firebase-document-id>`, tanpa konversi ID ke angka.
2. Produk menampilkan nama, kategori, harga, deskripsi, jumlah jenis, stok nyata.
3. Foto pertama otomatis menjadi foto utama.
4. Semua `jenis` tampil sebagai grup.
5. Setiap warna dengan `imageUrl` tampil sebagai thumbnail; klik mengganti foto utama dan border aktif.
6. Warna tanpa foto tetap tampil sebagai nama + swatch, tanpa tombol kosong.
7. Produk tanpa foto menampilkan fallback SVG memakai warna pertama.
8. `/products/id-yang-tidak-ada` menampilkan "Produk tidak ditemukan."
9. CTA WhatsApp membuka tab baru; `Lihat Semua Produk` menuju `/catalog`.

Hentikan dev server setelah pemeriksaan.

- [ ] **Step 5: Commit task**

```bash
git add 'app/pages/products/[id].vue'
git commit -m "feat: add dynamic product detail gallery"
```

---

### Task 3: Review Scope dan Verifikasi Akhir

**Files:**
- Verify only: `app/composables/useProduk.ts`
- Verify only: `app/pages/products/[id].vue`
- Verify unchanged: `app/pages/catalog.vue`

**Interfaces:**
- Consumes: hasil Task 1–2.
- Produces: bukti scope dan build final sebelum integrasi.

- [ ] **Step 1: Pastikan diff hanya menyentuh dua file implementasi**

Run:

```bash
git diff HEAD~2 -- app/composables/useProduk.ts 'app/pages/products/[id].vue' app/pages/catalog.vue
```

Expected:

- `useProduk.ts` hanya mendapat `subscribeOne` + return export.
- `[id].vue` hanya berisi data realtime + gallery baru.
- `catalog.vue` tidak berubah dalam dua commit fitur. Jika file itu memiliki perubahan user sebelumnya, jangan stage, reset, atau edit.

- [ ] **Step 2: Jalankan build bersih final**

Run:

```bash
npm run build
```

Expected: PASS dengan exit code 0.

- [ ] **Step 3: Periksa working tree tanpa mengubah perubahan user**

Run:

```bash
git status --short
```

Expected: commit fitur bersih; perubahan lokal user yang sudah ada tetap terlihat dan tidak tersentuh.
