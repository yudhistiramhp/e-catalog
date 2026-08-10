<script setup lang="ts">
import { useKategori } from '@/composables/useKategori'
import { useProduk } from '@/composables/useProduk'
import type { Kategori } from '@/types/kategori'
import type { Produk } from '@/types/produk'

const activeCategory = ref('Semua')
const searchQuery = ref('')
const sortOrder = ref<'newest' | 'oldest'>('newest')

const produkList = ref<Produk[]>([])
const kategoriList = ref<Kategori[]>([])
const loadingData = ref(true)

const produkService = useProduk()
const kategoriService = useKategori()

onMounted(() => {
  kategoriService.subscribe((items) => { kategoriList.value = items })
  const unsub = produkService.subscribe((items) => {
    produkList.value = items
    loadingData.value = false
  })
  onUnmounted(unsub)
})

const categories = computed(() =>
  ['Semua', ...kategoriList.value.map(k => k.name)]
)

// Ambil gambar & warna pertama dari jenis pertama (fallback bila kosong)
const firstImage = (p: Produk) => p.jenis?.[0]?.colors?.find(c => c.imageUrl)?.imageUrl
const firstColor = (p: Produk) => p.jenis?.[0]?.colors?.[0]?.hex ?? '#3E2A1B'

const hasStock = (p: Produk) => p.jenis?.some(j => j.colors.some(c => (c.stock ?? 0) > 0)) ?? false

const filtered = computed(() => {
  let result = activeCategory.value === 'Semua'
    ? [...produkList.value]
    : produkList.value.filter(p => p.categoryName === activeCategory.value)

  if (searchQuery.value.trim()) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(p => p.name.toLowerCase().includes(q))
  }

  result.sort((a, b) =>
    sortOrder.value === 'newest'
      ? (b.createdAt ?? 0) - (a.createdAt ?? 0)
      : (a.createdAt ?? 0) - (b.createdAt ?? 0),
  )
  return result
})

const selectedProduct = ref<Produk | null>(null)
const showModal = ref(false)

const selectedJenisIndex = ref(0)
const selectedImage = ref('')
const selectedColorIndex = ref(0)

const modalJenisList = computed(() => selectedProduct.value?.jenis ?? [])
const modalJenis = computed(() => modalJenisList.value[selectedJenisIndex.value])
const modalColors = computed(() => modalJenis.value?.colors ?? [])
const modalImageColors = computed(() => modalColors.value.filter(c => c.imageUrl))
const modalFallbackColor = computed(() => modalColors.value[0]?.hex ?? '#3E2A1B')
const modalImageAlt = computed(() => {
  const colorName = modalColors.value.find(c => c.imageUrl === selectedImage.value)?.name
  return colorName ? `${selectedProduct.value?.name} - ${colorName}` : (selectedProduct.value?.name ?? 'Foto produk')
})

const selectedColorStock = computed(() => {
  const color = modalColors.value[selectedColorIndex.value]
  return color ? color.stock : 0
})

function selectJenis(index: number) {
  selectedJenisIndex.value = index
  selectedColorIndex.value = 0
  selectedImage.value = modalJenisList.value[index]?.colors.find(c => c.imageUrl)?.imageUrl ?? ''
}

function selectColor(index: number) {
  selectedColorIndex.value = index
  const color = modalColors.value[index]
  if (color?.imageUrl) selectedImage.value = color.imageUrl
}

function openModal(product: Produk) {
  selectedProduct.value = product
  selectedJenisIndex.value = 0
  selectedColorIndex.value = 0
  selectedImage.value = product.jenis?.[0]?.colors.find(c => c.imageUrl)?.imageUrl ?? ''
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  showModal.value = false
  document.body.style.overflow = ''
}

useHead({
  title: 'Katalog — Agung Prada Bali',
  meta: [{ name: 'description', content: 'Jelajahi koleksi kain prada, songket, dan perlengkapan upacara khas Bali.' }],
})
</script>

<template>
  <main id="top">
    <section class="px-6 pb-10 pt-12 max-sm:pb-6 max-sm:pt-8">
      <div class="mx-auto max-w-7xl">
        <span class="mb-3.5 inline-block text-xs italic uppercase tracking-[.18em] text-gold">Agung Prada Bali</span>
        <h1 class="mb-4 font-display text-4xl max-sm:text-3xl">Katalog Produk</h1>
        <p class="max-w-[50ch] text-brown-700">Jelajahi koleksi kain prada, songket, dan perlengkapan upacara khas Bali. Semua produk dikerjakan tangan oleh perajin berpengalaman.</p>
      </div>
    </section>

    <section class="px-6 pb-20 max-sm:pb-12">
      <div class="mx-auto max-w-7xl">
        <div class="mb-6 flex flex-wrap gap-4">
          <input
            v-model="searchQuery"
            type="search"
            placeholder="Cari produk..."
            class="w-full max-w-xs border border-brown-800/30 px-4 py-2 text-sm text-brown-950 placeholder:text-brown-400 focus:border-gold focus:outline-none sm:w-auto"
          />
          <select
            v-model="sortOrder"
            class="border border-brown-800/30 px-4 py-2 text-sm text-brown-950 focus:border-gold focus:outline-none max-sm:w-full"
          >
            <option value="newest">Terbaru</option>
            <option value="oldest">Terlama</option>
          </select>
        </div>

        <div class="mb-8 flex flex-wrap gap-2">
          <button
            v-for="cat in categories" :key="cat"
            @click="activeCategory = cat"
            class="px-5 py-2 text-sm transition-all hover:bg-brown-800 hover:text-cream"
            :class="activeCategory === cat ? 'bg-brown-800 text-cream' : 'border border-brown-800/30 text-brown-700 hover:border-brown-800'"
          >{{ cat }}</button>
        </div>

        <div v-if="loadingData" class="py-20 text-center text-sm text-gray">Memuat produk...</div>

        <div v-else class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-sm:gap-5">
          <article
            v-for="product in filtered" :key="product.id"
            class="group cursor-pointer overflow-hidden border border-brown-border bg-cream transition-all hover:-translate-y-1.5 hover:border-gold hover:shadow-2xl hover:shadow-brown-950/20"
            @click="openModal(product)"
          >
            <div class="relative aspect-4/3 overflow-hidden">
              <img
                v-if="firstImage(product)"
                :src="firstImage(product)"
                :alt="product.name"
                class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <svg v-else viewBox="0 0 400 300" class="h-full w-full transition-transform duration-500 group-hover:scale-105">
                <rect width="400" height="300" :fill="firstColor(product)"/>
                <pattern :id="`cat-${product.id}`" width="40" height="40" patternUnits="userSpaceOnUse">
                  <circle cx="20" cy="20" r="1.6" fill="#D9BD8E"/>
                  <path d="M20 8L23 18L33 20L23 22L20 32L17 22L7 20L17 18Z" fill="none" stroke="#D9BD8E" opacity=".6"/>
                </pattern>
                <rect width="400" height="300" :fill="`url(#cat-${product.id})`"/>
                <rect x="16" y="16" width="368" height="268" fill="none" stroke="#B89A5A" opacity=".4"/>
              </svg>
              <div class="absolute inset-0 flex items-center justify-center bg-black/0 transition-all group-hover:bg-black/20">
                <span class="translate-y-4 text-5xl text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">+</span>
              </div>
            </div>
            <div class="p-5">
              <div class="mb-1.5 text-xs font-medium uppercase tracking-wider text-gold">{{ product.categoryName }}</div>
              <h3 class="mb-2 font-display text-lg leading-tight text-brown-950">{{ product.name }}</h3>
              <p class="mb-3 line-clamp-2 text-xs leading-relaxed text-brown-700">{{ product.description }}</p>
              <div class="flex items-center justify-between border-t border-gray-light pt-3">
                <span class="font-display text-lg text-gold">Rp {{ product.price.toLocaleString('id-ID') }}</span>
                <span class="text-xs text-gray">{{ hasStock(product) ? 'Tersedia' : 'Habis' }}</span>
              </div>
            </div>
          </article>
        </div>

        <div v-if="!loadingData && filtered.length === 0" class="py-20 text-center">
          <p class="text-gray">Tidak ada produk dalam kategori ini.</p>
        </div>
      </div>
    </section>

   <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-[60] flex overflow-y-auto bg-black/70 p-4 backdrop-blur-md" @click.self="closeModal">
          <div v-if="selectedProduct" class="relative m-auto flex max-h-[calc(100dvh-2rem)] min-h-0 w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-cream shadow-[0_25px_70px_-15px_rgba(0,0,0,0.5)] ring-1 ring-brown-border/40">
            <button @click="closeModal" class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-cream/90 text-brown-700 shadow-md backdrop-blur transition-all duration-200 hover:rotate-90 hover:bg-brown-950 hover:text-cream max-sm:h-8 max-sm:w-8 max-sm:text-sm">✕</button>
            <div class="grid min-h-0 flex-1 overflow-y-auto md:grid-cols-2" style="-webkit-overflow-scrolling: touch;">
              <div class="relative overflow-hidden md:rounded-l-2xl">
                <img
                  v-if="selectedImage"
                  :src="selectedImage"
                  :alt="modalImageAlt"
                  class="h-full w-full object-cover max-md:h-64"
                />
                <svg v-else viewBox="0 0 500 400" class="w-full">
                  <rect width="500" height="400" :fill="modalFallbackColor"/>
                  <pattern :id="`modal-${selectedProduct.id}`" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="2" fill="#D9BD8E"/>
                    <path d="M25 10L29 23L42 25L29 27L25 40L21 27L8 25L21 23Z" fill="none" stroke="#D9BD8E" opacity=".6"/>
                  </pattern>
                  <rect width="500" height="400" :fill="`url(#modal-${selectedProduct.id})`"/>
                  <rect x="24" y="24" width="452" height="352" fill="none" stroke="#B89A5A" opacity=".5"/>
                </svg>
                <div class="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent md:bg-gradient-to-r"></div>
              </div>
              <div class="overflow-y-auto p-8 max-md:p-6">
                <div class="mb-2 flex items-center gap-2 text-xs font-medium uppercase tracking-wider text-gold">
                  <span class="h-1.5 w-1.5 rounded-full bg-gold"></span>
                  {{ selectedProduct.categoryName }}
                </div>
                <h2 class="mb-3 font-display text-2xl leading-tight text-brown-950 max-sm:text-xl">{{ selectedProduct.name }}</h2>
                <div class="mb-5 font-display text-3xl font-semibold text-gold">Rp {{ selectedProduct.price.toLocaleString('id-ID') }}</div>
                <p class="mb-6 leading-relaxed text-brown-700">{{ selectedProduct.description }}</p>
                <dl class="mb-8 grid grid-cols-3 gap-3 rounded-xl border border-brown-border/50 bg-white/60 p-4 text-sm">
                  <div class="flex flex-col gap-1">
                    <dt class="text-[11px] uppercase tracking-wide text-gray">Kategori</dt>
                    <dd class="font-medium text-brown-950">{{ selectedProduct.categoryName }}</dd>
                  </div>
                  <div class="flex flex-col gap-1">
                    <dt class="text-[11px] uppercase tracking-wide text-gray">Varian</dt>
                    <dd class="font-medium text-brown-950">{{ selectedProduct.jenis?.length ?? 0 }} jenis</dd>
                  </div>
                  <div class="flex flex-col gap-1">
                    <dt class="text-[11px] uppercase tracking-wide text-gray">Stok</dt>
                    <dd class="flex items-center gap-1.5 font-medium" :class="(selectedColorStock ?? 0) > 0 ? 'text-emerald-700' : 'text-red-600'">
                      <span class="h-1.5 w-1.5 rounded-full" :class="(selectedColorStock ?? 0) > 0 ? 'bg-emerald-600' : 'bg-red-500'"></span>
                      {{ (selectedColorStock ?? 0) > 0 ? 'Tersedia' : 'Habis' }}
                    </dd>
                  </div>
                </dl>

                <div v-if="modalJenisList.length" class="mb-6 rounded-xl border border-brown-border/70 bg-cream p-4 shadow-sm">
                  <div class="mb-4">
                    <h3 class="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-brown-700">Jenis</h3>
                    <div class="flex flex-wrap gap-2" role="group" aria-label="Pilihan jenis produk">
                      <button
                        v-for="(jenis, index) in modalJenisList"
                        :key="jenis.id ?? index"
                        type="button"
                        class="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                        :class="selectedJenisIndex === index
                          ? 'border-brown-950 bg-brown-950 text-cream shadow-md scale-105'
                          : 'border-brown-border bg-white text-brown-700 hover:border-gold hover:text-brown-950 hover:shadow-sm'"
                        :aria-pressed="selectedJenisIndex === index"
                        @click="selectJenis(index)"
                      >
                        {{ jenis.title }}
                      </button>
                    </div>
                  </div>

                  <div v-if="modalJenis" class="border-t border-brown-border/60 pt-4">
                    <h3 class="mb-3 text-[11px] font-medium uppercase tracking-widest text-brown-700">
                      Pilih Warna <span class="normal-case tracking-normal text-gray">— {{ modalJenis.title }}</span>
                    </h3>

                    <div v-if="modalColors.length" class="flex flex-wrap gap-3">
                      <button
                        v-for="color in modalImageColors"
                        :key="`${modalJenis.id}-${color.name}-${color.hex}`"
                        type="button"
                        class="group w-14 text-left focus-visible:outline-none"
                        :aria-pressed="selectedImage === color.imageUrl"
                        :aria-label="`Tampilkan ${modalJenis.title}, warna ${color.name}`"
                        @click="selectColor(modalColors.findIndex(c => c === color))"
                      >
                        <span
                          class="mb-1.5 block aspect-square w-full overflow-hidden rounded-lg ring-1 ring-brown-border/60 ring-offset-2 ring-offset-cream transition-all duration-200 group-focus-visible:ring-2 group-focus-visible:ring-gold"
                          :class="selectedImage === color.imageUrl ? 'ring-2 ring-gold shadow-md' : 'group-hover:ring-gold group-hover:shadow-sm'"
                        >
                          <img
                            :src="color.imageUrl"
                            :alt="`${selectedProduct.name} - ${modalJenis.title} - ${color.name}`"
                            class="size-full object-cover transition duration-300 group-hover:scale-110"
                          />
                        </span>
                        <span class="block truncate text-center text-[10px]" :class="selectedImage === color.imageUrl ? 'font-semibold text-brown-950' : 'text-brown-700'">
                          {{ color.name }} <span class="text-[9px] text-gray">({{ color.stock ?? 0 }})</span>
                        </span>
                      </button>

                      <div
                        v-for="color in modalColors.filter(item => !item.imageUrl)"
                        :key="`${modalJenis.id}-${color.name}-${color.hex}-no-image`"
                        class="flex w-14 flex-col items-center gap-1.5"
                      >
                        <span class="aspect-square w-full rounded-lg ring-1 ring-brown-border/60" :style="{ backgroundColor: color.hex }"></span>
                        <span class="block w-full truncate text-center text-[10px] text-brown-700">{{ color.name }}  <span class="text-[9px] text-gray">({{ color.stock ?? 0 }})</span> </span>
                      </div>
                    </div>
                    <p v-else class="text-xs text-gray">Belum ada pilihan warna.</p>
                  </div>
                </div>

                <div class="space-y-3">
                  <a :href="`https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(selectedProduct.name)}`" target="_blank" rel="noopener" class="flex w-full items-center justify-center gap-2 rounded-lg bg-brown-950 px-6 py-3 text-center text-sm text-cream shadow-md transition-all duration-200 hover:bg-brown-800 hover:shadow-lg max-sm:py-2.5">
                    <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 24 24"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.71.45 3.38 1.3 4.85L2 22l5.36-1.4a9.9 9.9 0 0 0 4.68 1.19h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0 0 12.04 2m0 1.67c2.2 0 4.27.86 5.83 2.42a8.2 8.2 0 0 1 2.42 5.83c0 4.55-3.7 8.24-8.25 8.24a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.55 3.7-8.25 8.24-8.25Z"/></svg>
                    Hubungi via WhatsApp
                  </a>
                  <!-- <NuxtLink :to="`/products/${selectedProduct.id}`" class="block w-full rounded-lg border border-gold bg-transparent px-6 py-3 text-center text-sm font-medium text-gold transition-all duration-200 hover:bg-gold hover:text-white max-sm:py-2.5" @click="closeModal">Lihat Detail Lengkap</NuxtLink> -->
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </main>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from,
.modal-leave-to { opacity: 0; }
.modal-enter-from > div,
.modal-leave-to > div { transform: scale(0.95); }
</style>