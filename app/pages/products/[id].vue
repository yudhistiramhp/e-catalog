<script setup lang="ts">
const route = useRoute()
const id = computed(() => Number(route.params.id))

const products = [
  { id: 1, name: 'Prada Klasik Emas', description: 'Motif bunga dan sulur emas di atas dasar merah marun. Cocok untuk busana upacara dan kain penghias pelinggih.\n\nKain prada ini dibuat dengan teknik sepuhan emas tradisional Bali, menggunakan kain tenun katun berkualitas tinggi. Setiap helai kain dikerjakan secara manual oleh perajin berpengalaman.', price: 850000, material: 'Tenun katun, sepuhan emas', size: '2,5 m × 1,1 m', color: '#6B2A2A', pattern: 'classic' },
  { id: 2, name: 'Prada Patra Punggel', description: 'Motif ukiran patra klasik di atas dasar hitam pekat. Umum dipakai sebagai kain gantung dan penghias altar.', price: 780000, material: 'Tenun katun, sepuhan emas', size: '2 m × 1 m', color: '#1C1912', pattern: 'patra' },
  { id: 3, name: 'Prada Songket Kombinasi', description: 'Perpaduan tenun songket dan sentuhan prada di atas dasar coklat tua. Pilihan istimewa untuk kebaya dan kamen.', price: 1200000, material: 'Songket, sepuhan emas', size: '2,3 m × 1,1 m', color: '#4A2E1B', pattern: 'dots' },
]

const product = computed(() => {
  const p = products.find(p => p.id === id.value)
  if (!p) return null
  return p
})

const related = computed(() => products.filter(p => p.id !== id.value).slice(0, 3))

useHead({
  title: () => product.value ? `${product.value.name} — Griya Prada Bali` : 'Griya Prada Bali',
  meta: [{ name: 'description', content: product.value?.description?.slice(0, 160) }],
})
</script>

<template>
  <main>
    <div class="mx-auto max-w-screen-xl px-6 pt-4 pb-0">
      <nav class="text-sm text-gray" aria-label="Breadcrumb">
        <NuxtLink to="/" class="text-gold transition-colors hover:text-brown-950">Beranda</NuxtLink>
        <span class="mx-1.5 text-gray-light">›</span>
        <span class="text-gold">Produk</span>
        <span class="mx-1.5 text-gray-light">›</span>
        {{ product?.name }}
      </nav>
    </div>

    <template v-if="product">
      <section class="px-6 py-10 pb-20 max-sm:py-5">
        <div class="mx-auto grid max-w-screen-xl gap-16 lg:grid-cols-[1.1fr_.9fr]">
          <div class="overflow-hidden border border-brown-border bg-brown-card">
            <svg viewBox="0 0 600 450" class="w-full">
              <rect width="600" height="450" :fill="product.color"/>
              <pattern :id="`dp-${product.pattern}`" width="40" height="40" patternUnits="userSpaceOnUse">
                <circle cx="20" cy="20" r="1.6" fill="#D9BD8E"/>
                <path d="M20 8L23 18L33 20L23 22L20 32L17 22L7 20L17 18Z" fill="none" stroke="#D9BD8E" opacity=".6"/>
              </pattern>
              <rect width="600" height="450" :fill="`url(#dp-${product.pattern})`"/>
              <rect x="20" y="20" width="560" height="410" fill="none" stroke="#B8935A" opacity=".5"/>
            </svg>
          </div>
          <div class="pt-2">
            <span class="mb-3.5 inline-block text-xs italic uppercase tracking-[.18em] text-gold">Griya Prada Bali</span>
            <h1 class="mb-4 font-display text-4xl leading-tight max-sm:text-2xl">{{ product.name }}</h1>
            <div class="mb-6 font-display text-2xl text-gold">Rp {{ product.price.toLocaleString('id-ID') }}</div>
            <div class="mb-7 leading-relaxed text-brown-700">{{ product.description }}</div>
            <dl class="mb-8 border-t border-gray-light pt-5">
              <dt class="text-xs uppercase tracking-wider text-gray">Kategori</dt>
              <dd class="mb-4 text-brown-950">Kain Prada</dd>
              <dt class="text-xs uppercase tracking-wider text-gray">Bahan</dt>
              <dd class="mb-4 text-brown-950">{{ product.material }}</dd>
              <dt class="text-xs uppercase tracking-wider text-gray">Ukuran</dt>
              <dd class="mb-4 text-brown-950">{{ product.size }}</dd>
              <dt class="text-xs uppercase tracking-wider text-gray">Pembuatan</dt>
              <dd class="mb-4 text-brown-950">Dikerjakan tangan oleh perajin Bali</dd>
              <dt class="text-xs uppercase tracking-wider text-gray">Pemesanan</dt>
              <dd class="text-brown-950">Berdasarkan pesanan, motif dan ukuran dapat disesuaikan</dd>
            </dl>
            <div class="flex flex-wrap gap-3 max-sm:flex-col">
              <a :href="`https://wa.me/6281234567890?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(product.name)}`" target="_blank" rel="noopener" class="flex-1 bg-brown-950 px-7 py-3 text-center text-sm text-cream transition hover:bg-brown-700">Hubungi via WhatsApp</a>
              <NuxtLink to="/" class="flex-1 border border-gold bg-transparent px-7 py-3 text-center text-sm transition hover:bg-gold hover:text-white">Lihat Semua Produk</NuxtLink>
            </div>
          </div>
        </div>
      </section>

      <section v-if="related.length" class="bg-brown-950 px-6 py-16 pb-20">
        <div class="mx-auto max-w-screen-xl">
          <span class="mb-3.5 inline-block text-xs italic uppercase tracking-[.18em] text-gold-soft">Produk Lainnya</span>
          <h2 class="mb-10 font-display text-3xl text-white">Anda Mungkin Juga Suka</h2>
          <div class="grid gap-7 md:grid-cols-3">
            <NuxtLink v-for="r in related" :key="r.id" :to="`/products/${r.id}`" class="overflow-hidden border border-brown-border bg-brown-card transition hover:-translate-y-1 hover:border-gold">
              <div class="aspect-[4/3] w-full overflow-hidden">
                <svg viewBox="0 0 400 300" class="h-full w-full">
                  <rect width="400" height="300" :fill="r.color"/>
                  <pattern :id="`rel-${r.id}`" width="34" height="34" patternUnits="userSpaceOnUse">
                    <rect x="15" y="6" width="4" height="4" fill="#D9BD8E" opacity=".8"/>
                    <rect x="4" y="18" width="4" height="4" fill="#D9BD8E" opacity=".55"/>
                    <rect x="26" y="18" width="4" height="4" fill="#D9BD8E" opacity=".55"/>
                  </pattern>
                  <rect width="400" height="300" fill="#3E2A1B"/>
                  <rect width="400" height="300" :fill="`url(#rel-${r.id})`"/>
                </svg>
              </div>
              <div class="p-5">
                <h3 class="mb-2 font-display text-lg text-white">{{ r.name }}</h3>
                <p class="mb-3 line-clamp-2 text-sm text-text-muted">{{ r.description }}</p>
                <span class="block w-full border border-gold px-5 py-2.5 text-center text-xs text-gold-soft transition hover:bg-gold hover:text-white">Lihat Detail</span>
              </div>
            </NuxtLink>
          </div>
        </div>
      </section>
    </template>

    <section v-else class="px-6 py-20 text-center">
      <p class="text-gray">Produk tidak ditemukan.</p>
      <NuxtLink to="/" class="mt-4 inline-block border border-gold px-7 py-3 text-sm transition hover:bg-gold hover:text-white">Kembali ke Beranda</NuxtLink>
    </section>
  </main>
</template>