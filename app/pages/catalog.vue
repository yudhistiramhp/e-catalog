<script setup lang="ts">
const categories = ['Semua', 'Kain Prada', 'Songket', 'Perlengkapan Upacara']
const activeCategory = ref('Semua')

const products = [
  { id: 1, name: 'Prada Klasik Emas', description: 'Motif bunga dan sulur emas di atas dasar merah marun. Cocok untuk busana upacara dan kain penghias pelinggih.', price: 8_500_000, material: 'Tenun katun, sepuhan emas', size: '2,5 m × 1,1 m', color: '#6B2A2A', pattern: 'classic', category: 'Kain Prada' },
  { id: 2, name: 'Prada Patra Punggel', description: 'Motif ukiran patra klasik di atas dasar hitam pekat. Umum dipakai sebagai kain gantung dan penghias altar.', price: 7_800_000, material: 'Tenun katun, sepuhan emas', size: '2 m × 1 m', color: '#1C1912', pattern: 'patra', category: 'Kain Prada' },
  { id: 3, name: 'Prada Songket Kombinasi', description: 'Perpaduan tenun songket dan sentuhan prada di atas dasar coklat tua. Pilihan istimewa untuk kebaya dan kamen.', price: 12_000_000, material: 'Songket, sepuhan emas', size: '2,3 m × 1,1 m', color: '#4A2E1B', pattern: 'dots', category: 'Kain Prada' },
  { id: 4, name: 'Songket Mewah Emas', description: 'Songket dengan sulur emas pada dasar hijau tua. Eksklusif untuk upacara adat.', price: 15_000_000, material: 'Songket asli, sepuhan emas', size: '2,5 m × 1,1 m', color: '#2A4A3E', pattern: 'classic', category: 'Songket' },
  { id: 5, name: 'Songket Songgolangit', description: 'Motif songgolangit klasik dengan kombinasi emas dan perak. Untuk kebaya pengantin.', price: 18_000_000, material: 'Songket asli', size: '2,4 m × 1,1 m', color: '#3A2A1A', pattern: 'patra', category: 'Songket' },
  { id: 6, name: 'Sangku Daksina', description: 'Wadah untuk daksina dengan ukiran khas Bali.', price: 1_200_000, material: 'Bambu anyam, sepuhan', size: '30 cm', color: '#5C3A21', pattern: 'dots', category: 'Perlengkapan Upacara' },
  { id: 7, name: 'Sabuk Prada', description: 'Kain prada pelengkap upacara dengan motif klasik.', price: 3_500_000, material: 'Tenun katun, sepuhan emas', size: '3 m × 0,3 m', color: '#4A2A1B', pattern: 'classic', category: 'Perlengkapan Upacara' },
  { id: 8, name: 'Srembeng Anyaman', description: 'Keranjang anyaman sesaji untuk upacara.', price: 800_000, material: 'Bambu anyam', size: '40 cm', color: '#6B4A2A', pattern: 'patra', category: 'Perlengkapan Upacara' },
]

const filtered = computed(() =>
  activeCategory.value === 'Semua'
    ? products
    : products.filter(p => p.category === activeCategory.value)
)

const selectedProduct = ref<typeof products[0] | null>(null)
const showModal = ref(false)

function openModal(product: typeof products[0]) {
  selectedProduct.value = product
  showModal.value = true
  document.body.style.overflow = 'hidden'
}

function closeModal() {
  showModal.value = false
  document.body.style.overflow = ''
}

useHead({
  title: 'Katalog — Griya Prada Bali',
  meta: [{ name: 'description', content: 'Jelajahi koleksi kain prada, songket, dan perlengkapan upacara khas Bali.' }],
})
</script>

<template>
  <main id="top">
    <section class="px-6 pb-10 pt-12 max-sm:pb-6 max-sm:pt-8">
      <div class="mx-auto max-w-7xl">
        <span class="mb-3.5 inline-block text-xs italic uppercase tracking-[.18em] text-gold">Griya Prada Bali</span>
        <h1 class="mb-4 font-display text-4xl max-sm:text-3xl">Katalog Produk</h1>
        <p class="max-w-[50ch] text-brown-700">Jelajahi koleksi kain prada, songket, dan perlengkapan upacara khas Bali. Semua produk dikerjakan tangan oleh perajin berpengalaman.</p>
      </div>
    </section>

    <section class="px-6 pb-20 max-sm:pb-12">
      <div class="mx-auto max-w-7xl">
        <div class="mb-10 flex flex-wrap gap-2">
          <button
            v-for="cat in categories" :key="cat"
            @click="activeCategory = cat"
            class="px-5 py-2 text-sm transition-all hover:bg-brown-800 hover:text-cream"
            :class="activeCategory === cat ? 'bg-brown-800 text-cream' : 'border border-brown-800/30 text-brown-700 hover:border-brown-800'"
          >{{ cat }}</button>
        </div>

        <div class="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 max-sm:gap-5">
          <article
            v-for="product in filtered" :key="product.id"
            class="group cursor-pointer overflow-hidden border border-brown-border bg-cream transition-all hover:-translate-y-1.5 hover:border-gold hover:shadow-2xl hover:shadow-brown-950/20"
            @click="openModal(product)"
          >
            <div class="relative aspect-4/3 overflow-hidden">
              <svg viewBox="0 0 400 300" class="h-full w-full transition-transform duration-500 group-hover:scale-105">
                <rect width="400" height="300" :fill="product.color"/>
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
              <div class="mb-1.5 text-xs font-medium uppercase tracking-wider text-gold">{{ product.category }}</div>
              <h3 class="mb-2 font-display text-lg leading-tight text-brown-950">{{ product.name }}</h3>
              <p class="mb-3 line-clamp-2 text-xs leading-relaxed text-brown-700">{{ product.description }}</p>
              <div class="flex items-center justify-between border-t border-gray-light pt-3">
                <span class="font-display text-lg text-gold">Rp {{ product.price.toLocaleString('id-ID') }}</span>
                <span class="text-xs text-gray">Tersedia</span>
              </div>
            </div>
          </article>
        </div>

        <div v-if="filtered.length === 0" class="py-20 text-center">
          <p class="text-gray">Tidak ada produk dalam kategori ini.</p>
        </div>
      </div>
    </section>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" @click.self="closeModal">
          <div v-if="selectedProduct" class="relative max-h-[90vh] w-full max-w-4xl overflow-auto bg-cream shadow-2xl">
            <button @click="closeModal" class="absolute right-4 top-4 z-10 flex h-10 w-10 items-center justify-center bg-cream text-brown-700 transition-colors hover:bg-brown-800 hover:text-cream max-sm:h-8 max-sm:w-8 max-sm:text-sm">✕</button>
            <div class="grid md:grid-cols-2">
              <div>
                <svg viewBox="0 0 500 400" class="w-full">
                  <rect width="500" height="400" :fill="selectedProduct.color"/>
                  <pattern :id="`modal-${selectedProduct.id}`" width="50" height="50" patternUnits="userSpaceOnUse">
                    <circle cx="25" cy="25" r="2" fill="#D9BD8E"/>
                    <path d="M25 10L29 23L42 25L29 27L25 40L21 27L8 25L21 23Z" fill="none" stroke="#D9BD8E" opacity=".6"/>
                  </pattern>
                  <rect width="500" height="400" :fill="`url(#modal-${selectedProduct.id})`"/>
                  <rect x="24" y="24" width="452" height="352" fill="none" stroke="#B89A5A" opacity=".5"/>
                </svg>
              </div>
              <div class="p-8 max-md:p-6">
                <div class="mb-2 text-xs font-medium uppercase tracking-wider text-gold">{{ selectedProduct.category }}</div>
                <h2 class="mb-3 font-display text-2xl leading-tight text-brown-950 max-sm:text-xl">{{ selectedProduct.name }}</h2>
                <div class="mb-5 font-display text-2xl text-gold">Rp {{ selectedProduct.price.toLocaleString('id-ID') }}</div>
                <p class="mb-6 leading-relaxed text-brown-700">{{ selectedProduct.description }}</p>
                <dl class="mb-8 space-y-2 border-t border-gray-light pt-5 text-sm">
                  <div class="flex justify-between">
                    <dt class="text-gray">Bahan</dt>
                    <dd class="font-medium text-brown-950">{{ selectedProduct.material }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray">Ukuran</dt>
                    <dd class="font-medium text-brown-950">{{ selectedProduct.size }}</dd>
                  </div>
                  <div class="flex justify-between">
                    <dt class="text-gray">Kategori</dt>
                    <dd class="font-medium text-brown-950">{{ selectedProduct.category }}</dd>
                  </div>
                </dl>
                <div class="space-y-3">
                  <a :href="`https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(selectedProduct.name)}`" target="_blank" rel="noopener" class="block w-full bg-brown-950 px-6 py-3 text-center text-sm text-cream transition hover:bg-brown-800 max-sm:py-2.5">Hubungi via WhatsApp</a>
                  <NuxtLink :to="`/products/${selectedProduct.id}`" class="block w-full border border-gold bg-transparent px-6 py-3 text-center text-sm text-gold transition hover:bg-gold hover:text-white max-sm:py-2.5" @click="closeModal">Lihat Detail Lengkap</NuxtLink>
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