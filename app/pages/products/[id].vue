<script setup lang="ts">
import { useProduk } from '@/composables/useProduk'
import type { Produk } from '@/types/produk'

const route = useRoute()
const produkService = useProduk()

const product = ref<Produk | null>(null)
const loading = ref(true)
const error = ref<string | null>(null)
const selectedJenisIndex = ref(0)
const selectedImage = ref('')

const id = computed(() => String(route.params.id))
const jenisList = computed(() => product.value?.jenis ?? [])
const selectedJenis = computed(() => jenisList.value[selectedJenisIndex.value])
const colors = computed(() => selectedJenis.value?.colors ?? [])
const imageColors = computed(() => colors.value.filter(c => c.imageUrl))
const fallbackColor = computed(() => colors.value[0]?.hex ?? '#3E2A1B')
const selectedImageAlt = computed(() => {
  const colorName = colors.value.find(color => color.imageUrl === selectedImage.value)?.name
  return colorName ? `${product.value?.name} - ${colorName}` : (product.value?.name ?? 'Foto produk')
})

function selectJenis(index: number) {
  selectedJenisIndex.value = index
  selectedImage.value = jenisList.value[index]?.colors.find(c => c.imageUrl)?.imageUrl ?? ''
}

let unsubscribe: (() => void) | undefined

onMounted(() => {
  unsubscribe = produkService.subscribeOne(
    id.value,
    (item) => {
      product.value = item
      selectedJenisIndex.value = 0
      selectedImage.value = item?.jenis?.[0]?.colors.find(c => c.imageUrl)?.imageUrl ?? ''
      loading.value = false
    },
    (err) => {
      console.error('[product detail] subscribe error:', err)
      error.value = 'Gagal memuat produk.'
      loading.value = false
    },
  )
})

onUnmounted(() => unsubscribe?.())

useHead(() => ({
  title: product.value ? `${product.value.name} — Agung Prada Bali` : 'Agung Prada Bali',
  meta: [{
    name: 'description',
    content: product.value?.description?.slice(0, 160) ?? 'Detail produk Agung Prada Bali.',
  }],
}))
</script>

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
      <div class="mx-auto grid max-w-screen-xl gap-x-16 gap-y-10 lg:grid-cols-2">
        <!-- KIRI: Foto saja, sticky -->
        <div class="lg:self-start">
          <div class="aspect-4/3 overflow-hidden rounded-sm border border-brown-border bg-brown-card shadow-sm">
            <img
              v-if="selectedImage"
              :src="selectedImage"
              :alt="selectedImageAlt"
              class="h-full w-full object-cover transition duration-300"
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
        </div>

        <!-- KANAN: Pilihan jenis/warna + info produk -->
        <div class="pt-2">
          <div v-if="jenisList.length" class="mb-8 rounded-lg border border-brown-border/70 bg-cream p-5">
            <div class="mb-5">
              <h2 class="mb-2.5 text-[11px] font-medium uppercase tracking-widest text-brown-700">Jenis</h2>
              <div class="flex flex-wrap gap-2" role="group" aria-label="Pilihan jenis produk">
                <button
                  v-for="(jenis, index) in jenisList"
                  :key="jenis.id ?? index"
                  type="button"
                  class="shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  :class="selectedJenisIndex === index
                    ? 'border-brown-950 bg-brown-950 text-cream'
                    : 'border-brown-border bg-white text-brown-700 hover:border-gold hover:text-brown-950'"
                  :aria-pressed="selectedJenisIndex === index"
                  @click="selectJenis(index)"
                >
                  {{ jenis.title }}
                </button>
              </div>
            </div>

            <div v-if="selectedJenis" class="border-t border-brown-border/60 pt-5">
              <h2 class="mb-3 text-[11px] font-medium uppercase tracking-widest text-brown-700">
                Pilih Warna <span class="normal-case tracking-normal text-gray">— {{ selectedJenis.title }}</span>
              </h2>

              <div v-if="colors.length" class="flex flex-wrap gap-3">
                <button
                  v-for="color in imageColors"
                  :key="`${selectedJenis.id}-${color.name}-${color.hex}`"
                  type="button"
                  class="group w-16 text-left focus-visible:outline-none"
                  :aria-pressed="selectedImage === color.imageUrl"
                  :aria-label="`Tampilkan ${selectedJenis.title}, warna ${color.name}`"
                  @click="selectedImage = color.imageUrl"
                >
                  <span
                    class="mb-1.5 block aspect-square w-full overflow-hidden rounded-md ring-1 ring-brown-border/60 ring-offset-2 ring-offset-cream transition group-focus-visible:ring-2 group-focus-visible:ring-gold"
                    :class="selectedImage === color.imageUrl ? 'ring-2 ring-gold' : 'group-hover:ring-gold'"
                  >
                    <img
                      :src="color.imageUrl"
                      :alt="`${product.name} - ${selectedJenis.title} - ${color.name}`"
                      class="size-full object-cover transition duration-300 group-hover:scale-105"
                    />
                  </span>
                  <span class="block truncate text-center text-[10px]" :class="selectedImage === color.imageUrl ? 'font-medium text-brown-950' : 'text-brown-700'">
                    {{ color.name }}
                  </span>
                </button>

                <div
                  v-for="color in colors.filter(item => !item.imageUrl)"
                  :key="`${selectedJenis.id}-${color.name}-${color.hex}-no-image`"
                  class="flex w-16 flex-col items-center gap-1.5"
                >
                  <span class="aspect-square w-full rounded-md ring-1 ring-brown-border/60" :style="{ backgroundColor: color.hex }"></span>
                  <span class="block w-full truncate text-center text-[10px] text-brown-700">{{ color.name }}</span>
                </div>
              </div>
              <p v-else class="text-xs text-gray">Belum ada pilihan warna.</p>
            </div>
          </div>

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
            
            <a :href="`https://wa.me/628123968327?text=Halo,%20saya%20tertarik%20dengan%20${encodeURIComponent(product.name)}`"
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
