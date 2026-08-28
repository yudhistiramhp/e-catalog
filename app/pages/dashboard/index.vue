<script setup lang="ts">
import {
  Boxes,
  Eye,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  ShoppingBag,
  Tags,
  TriangleAlert,
} from '@lucide/vue'
import { signOut } from 'firebase/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import Pagination from '@/components/ui/pagination.vue'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar'
import { useAuthSession } from '@/composables/useSession'
import { useKategori } from '@/composables/useKategori'
import { useProduk } from '@/composables/useProduk'
import { useStats } from '@/composables/useStats'
import type { Kategori } from '@/types/kategori'
import type { Produk } from '@/types/produk'

const { $firebaseAuth } = useNuxtApp()
const { user, setUser } = useAuthSession()
const isLoading = ref(false)
const errorMessage = ref('')
const produkList = ref<Produk[]>([])
const kategoriList = ref<Kategori[]>([])

const produkService = useProduk()
const kategoriService = useKategori()
const statsService = useStats()

const loadingStats = ref(true)
const dailyChartData = ref<{ date: string; count: number }[]>([])
const chartLoading = ref(true)
const startDate = ref(new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10))
const endDate = ref(new Date().toISOString().slice(0, 10))
const selectedRange = ref<'day' | 'week' | 'month'>('month')

function setRange(range: 'day' | 'week' | 'month') {
  selectedRange.value = range
  const now = new Date()
  if (range === 'day') {
    startDate.value = new Date(now).toISOString().slice(0, 10)
  } else if (range === 'week') {
    startDate.value = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10)
  } else {
    startDate.value = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10)
  }
  endDate.value = new Date().toISOString().slice(0, 10)
  loadChartData()
}

async function loadChartData() {
  chartLoading.value = true
  const start = new Date(startDate.value)
  const end = new Date(endDate.value)
  end.setHours(23, 59, 59, 999)
  const daily = await statsService.getDailyViews(start, end)
  const sorted = Object.entries(daily)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, count]) => ({ date, count }))
  dailyChartData.value = sorted
  chartLoading.value = false
}

onMounted(() => {
  kategoriService.subscribe((items) => { kategoriList.value = items })
  const unsub = produkService.subscribe((items) => { produkList.value = items })
  onUnmounted(unsub)

  loadChartData()
})

const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, href: '/dashboard', active: true, disabled: false },
  { label: 'Produk', icon: ShoppingBag, href: '/dashboard/produk', active: false, disabled: false },
  { label: 'Kategori', icon: Tags, href: '/dashboard/kategori', active: false, disabled: false },
]

const lowStockThreshold = 4
const lowStockCount = computed(() => produkList.value.filter(p => {
  const colors = p.jenis?.flatMap(j => j.colors) ?? []
  return colors.some(c => (c.stock ?? 0) <= lowStockThreshold)
}).length)

const stockBreakdown = (p: Produk) => p.jenis?.flatMap(j =>
  j.colors.map(c => `${c.name || '—'} ${c.stock ?? 0}`)
).join(' · ') ?? ''

const isLowStock = (p: Produk) => {
  const colors = p.jenis?.flatMap(j => j.colors) ?? []
  return colors.some(c => (c.stock ?? 0) <= lowStockThreshold)
}

const stats = computed(() => [
  { label: 'Total Produk', value: String(produkList.value.length), note: 'Seluruh produk terdaftar', icon: Boxes },
  { label: 'Total Kategori', value: String(kategoriList.value.length), note: 'Kategori aktif', icon: Tags },
  { label: 'Stok Menipis', value: String(lowStockCount.value), note: `Stok ≤ ${lowStockThreshold}`, icon: TriangleAlert },
])

const chartTitle = computed(() => {
  const map = { day: 'Harian', week: 'Mingguan', month: 'Bulanan' }
  return `Grafik Views ${map[selectedRange.value]}`
})
const totalViewsSum = computed(() => dailyChartData.value.reduce((sum, d) => sum + d.count, 0))
const maxCount = computed(() => Math.max(...dailyChartData.value.map(d => d.count), 1))

// --- Hover tooltip pada grafik ---
const hoveredIndex = ref<number | null>(null)

const pointX = (idx: number) => 40 + (idx / Math.max(dailyChartData.value.length - 1, 1)) * 740
const pointY = (count: number) => 280 - (count / maxCount.value) * 260

const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  const item = dailyChartData.value[hoveredIndex.value]
  if (!item) return null
  const x = pointX(hoveredIndex.value)
  const y = pointY(item.count)
  return {
    x,
    y,
    tooltipX: Math.min(Math.max(x, 75), 745),
    flip: y < 45, // terlalu dekat batas atas, tampilkan tooltip di bawah titik
    date: item.date,
    count: item.count,
  }
})

const currentPage = ref(1)
const perPage = 10
const products = computed(() => {
  const start = (currentPage.value - 1) * perPage
  return produkList.value.slice(start, start + perPage)
})
const totalPages = computed(() => Math.max(1, Math.ceil(produkList.value.length / perPage)))

const featuredCount = computed(() => produkList.value.filter(p => p.featured).length)
const isFeaturedDisabled = (product: Produk) =>
  featuredCount.value >= 3 && !(product.featured ?? false)

const toggleFeatured = async (product: Produk) => {
  if (isFeaturedDisabled(product)) return
  await produkService.toggleFeatured(product.id, !(product.featured ?? false))
}

const userInitials = computed(() => {
  const source = user.value?.name || user.value?.email || 'Admin'
  return source
    .split(/\s+/)
    .map(part => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
})

const logout = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/logout', { method: 'POST' })
  }
  catch {
    errorMessage.value = 'Logout gagal. Silakan coba lagi.'
    isLoading.value = false
    return
  }

  await signOut($firebaseAuth).catch(() => undefined)
  setUser(null)
  await navigateTo('/login')
}
</script>

<template>
  <SidebarProvider
    class="min-h-[calc(100svh-78px)] bg-cream"
    :style="{
      '--color-sidebar': 'var(--color-brown-950)',
      '--color-sidebar-foreground': 'var(--color-cream)',
      '--color-sidebar-accent': 'var(--color-brown-800)',
      '--color-sidebar-accent-foreground': 'var(--color-gold-soft)',
      '--color-sidebar-border': 'var(--color-brown-border)',
      '--color-sidebar-ring': 'var(--color-gold)',
      '--color-sidebar-primary': 'var(--color-gold)',
      '--color-sidebar-primary-foreground': 'var(--color-brown-950)',
    }"
  >
    <Sidebar
      collapsible="icon"
      class="top-0 h-full! border-brown-border bg-brown-950"
    >
      <SidebarHeader class="border-b border-brown-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child tooltip="Agung Prada Bali">
              <NuxtLink to="/dashboard">
                <img src="/logo.png" alt="Agung Prada Bali" class="size-8 shrink-0 rounded-sm object-contain" />
                <span class="grid flex-1 text-left leading-tight">
                  <span class="truncate font-display text-sm tracking-wide text-cream">Agung Prada Bali</span>
                </span>
              </NuxtLink>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel class="uppercase tracking-[0.18em] text-gold-soft/70">
            Manajemen
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navItems" :key="item.label">
                <SidebarMenuButton
                  v-if="!item.disabled"
                  as-child
                  :is-active="item.active"
                  :tooltip="item.label"
                  class="text-cream hover:bg-brown-800 hover:text-gold-soft data-[active=true]:bg-gold data-[active=true]:text-brown-950"
                >
                  <NuxtLink :to="item.href">
                    <component :is="item.icon" aria-hidden="true" />
                    <span>{{ item.label }}</span>
                  </NuxtLink>
                </SidebarMenuButton>
                <SidebarMenuButton
                  v-else
                  disabled
                  aria-disabled="true"
                  class="text-text-muted opacity-55"
                >
                  <component :is="item.icon" aria-hidden="true" />
                  <span>{{ item.label }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter class="border-t border-brown-border p-3">
        <div class="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar class="size-8 shrink-0 rounded-none border border-gold/50">
            <AvatarImage
              v-if="user?.picture"
              :src="user.picture"
              :alt="`Foto profil ${user.name || user.email || 'admin'}`"
              referrerpolicy="no-referrer"
            />
            <AvatarFallback class="rounded-none bg-brown-800 text-xs text-gold-soft">
              {{ userInitials }}
            </AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p class="truncate text-sm font-medium text-cream">
              {{ user?.name || 'Admin' }}
            </p>
            <p class="truncate text-xs text-text-muted">
              {{ user?.email || 'Administrator' }}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="ghost"
          class="w-full justify-start text-cream hover:bg-brown-800 hover:text-gold-soft group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
          :disabled="isLoading"
          :aria-busy="isLoading"
          @click="logout"
        >
          <LogOut aria-hidden="true" />
          <span class="group-data-[collapsible=icon]:hidden">
            {{ isLoading ? 'Keluar...' : 'Logout' }}
          </span>
        </Button>
        <p
          v-if="errorMessage"
          class="px-2 pt-2 text-xs text-gold-soft group-data-[collapsible=icon]:sr-only"
          role="alert"
          aria-live="polite"
        >
          {{ errorMessage }}
        </p>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset class="min-w-0 bg-cream">
      <header class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-gray-light bg-cream/95 px-4 backdrop-blur sm:px-6">
        <SidebarTrigger
          class="text-brown-700 hover:bg-gold/15 hover:text-gold"
          aria-label="Buka atau tutup sidebar"
        />
        <span class="h-5 w-px bg-gray-light" aria-hidden="true"></span>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage class="font-display text-brown-950">
                Dashboard Admin
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button as-child type="button" class="ml-auto rounded-none bg-brown-950 text-cream hover:bg-brown-700">
          <NuxtLink to="/dashboard/produk">
            <PackagePlus aria-hidden="true" />
            <span class="max-sm:hidden">Tambah Produk</span>
          </NuxtLink>
        </Button>
      </header>

      <div class="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="dashboard-title">
          <p class="mb-3 text-xs italic uppercase tracking-[0.18em] text-gold">
            Ringkasan Toko
          </p>
          <h1 id="dashboard-title" class="font-display text-3xl text-brown-950 sm:text-4xl">
            Selamat datang, {{ user?.name || 'Admin' }}
          </h1>
          <p class="mt-3 max-w-2xl text-sm leading-relaxed text-brown-700">
            Pantau katalog, pesanan, dan ketersediaan produk Agung Prada Bali dari satu tempat.
          </p>

          <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Card
              v-for="stat in stats"
              :key="stat.label"
              class="relative overflow-hidden rounded-none border-gray-light bg-cream text-brown-950 shadow-none transition-colors hover:border-gold"
            >
              <component
                :is="stat.icon"
                class="absolute -right-3 -top-3 size-20 text-gold/10"
                aria-hidden="true"
              />
              <CardHeader class="relative">
                <CardTitle class="font-display text-4xl text-brown-950">
                  {{ stat.value }}
                </CardTitle>
                <CardDescription class="mt-1 text-brown-700">
                  {{ stat.label }}
                </CardDescription>
              </CardHeader>
              <CardContent class="relative text-xs text-gray">
                {{ stat.note }}
              </CardContent>
            </Card>
          </div>

          <!-- Grafik Views -->
          <div class="mt-10">
            <div class="flex flex-wrap items-end gap-4 mb-4">
              <div class="flex gap-1">
                <button @click="setRange('day')" class="rounded-none border border-gray-light px-3 py-1.5 text-sm" :class="selectedRange === 'day' ? 'bg-brown-950 text-cream' : 'bg-white text-brown-700 hover:border-brown-950'">Hari</button>
                <button @click="setRange('week')" class="rounded-none border border-gray-light px-3 py-1.5 text-sm" :class="selectedRange === 'week' ? 'bg-brown-950 text-cream' : 'bg-white text-brown-700 hover:border-brown-950'">Minggu</button>
                <button @click="setRange('month')" class="rounded-none border border-gray-light px-3 py-1.5 text-sm" :class="selectedRange === 'month' ? 'bg-brown-950 text-cream' : 'bg-white text-brown-700 hover:border-brown-950'">Bulan</button>
              </div>
              <div class="flex gap-2 items-end">
                <div>
                  <label class="block text-xs font-medium text-brown-700 mb-1">Mulai</label>
                  <input type="date" v-model="startDate" class="border border-gray-light rounded px-3 py-1.5 text-sm bg-white text-brown-950" />
                </div>
                <div>
                  <label class="block text-xs font-medium text-brown-700 mb-1">Sampai</label>
                  <input type="date" v-model="endDate" class="border border-gray-light rounded px-3 py-1.5 text-sm bg-white text-brown-950" />
                </div>
                <button @click="loadChartData" class="rounded-none bg-brown-950 px-4 py-1.5 text-sm text-cream hover:bg-brown-700">Terapkan</button>
              </div>
            </div>
            <h2 class="font-display text-xl text-brown-950 mb-4">{{ chartTitle }}</h2>
            <div class="rounded-none border border-gray-light bg-cream p-4">
              <div class="w-full relative max-h-72" :class="{ 'opacity-50 pointer-events-none': chartLoading }" style="aspect-ratio: 800/250;">
                <svg class="w-full h-full" viewBox="0 0 800 300" preserveAspectRatio="xMidYMid meet">
                  <!-- sumbu Y -->
                  <line x1="40" y1="20" x2="40" y2="280" stroke="#cbd5e1" stroke-width="1" />
                  <line x1="40" y1="280" x2="780" y2="280" stroke="#cbd5e1" stroke-width="1" />
                  <!-- label sumbu Y -->
                  <text x="30" y="20" text-anchor="end" font-size="10" fill="#64748b">{{ dailyChartData.length ? Math.max(...dailyChartData.map(d => d.count), 0) : 0 }}</text>
                  <text x="30" y="150" text-anchor="end" font-size="10" fill="#64748b">{{ dailyChartData.length ? Math.round(Math.max(...dailyChartData.map(d => d.count), 0) / 2) : 0 }}</text>
                  <text x="30" y="280" text-anchor="end" font-size="10" fill="#64748b">0</text>
                  <!-- total views -->
                  <g v-if="dailyChartData.length">
                    <rect x="371" y="258" width="78" height="18" fill="#fdfaf3" opacity="0.9" />
                    <text x="410" y="270" text-anchor="middle" font-size="12" fill="#b89a5a" font-weight="bold">Total: {{ totalViewsSum }}</text>
                  </g>
                  <!-- jika tidak ada data -->
                  <text v-if="dailyChartData.length === 0" x="400" y="150" text-anchor="middle" font-size="14" fill="#94a3b8">Belum ada data views</text>
                  <!-- line chart -->
                  <g v-if="dailyChartData.length > 1">
                    <!-- area fill -->
                    <polygon
                      :points="dailyChartData.map((item, idx) => `${pointX(idx)},${pointY(item.count)}`).join(' ') + ` ${40 + 740},280 40,280`"
                      fill="rgba(184,154,90,0.15)"
                      stroke="none"
                    />
                    <!-- line -->
                    <polyline
                      :points="dailyChartData.map((item, idx) => `${pointX(idx)},${pointY(item.count)}`).join(' ')"
                      fill="none"
                      stroke="#b89a5a"
                      stroke-width="2"
                      stroke-linejoin="round"
                      stroke-linecap="round"
                    />
                    <!-- circles -->
                    <circle
                      v-for="(item, idx) in dailyChartData"
                      :key="item.date"
                      :cx="pointX(idx)"
                      :cy="pointY(item.count)"
                      :r="hoveredIndex === idx ? 5 : 3"
                      fill="#b89a5a"
                      stroke="white"
                      stroke-width="1"
                    />
                    <!-- hit area untuk hover (lebih besar agar mudah di-hover) -->
                    <circle
                      v-for="(item, idx) in dailyChartData"
                      :key="`hit-${item.date}`"
                      :cx="pointX(idx)"
                      :cy="pointY(item.count)"
                      r="10"
                      fill="transparent"
                      style="cursor: pointer;"
                      @mouseenter="hoveredIndex = idx"
                      @mouseleave="hoveredIndex = null"
                    />
                  </g>
                  <!-- satu data point -->
                  <circle v-if="dailyChartData.length === 1" :cx="40" :cy="280 - (dailyChartData[0].count / maxCount) * 260" r="4" fill="#b89a5a" />
                  <!-- label tanggal -->
                  <g v-if="dailyChartData.length">
                    <text
                      v-for="(item, idx) in dailyChartData"
                      :key="`label-${item.date}`"
                      v-show="idx % Math.max(1, Math.floor(dailyChartData.length / 10)) === 0 || idx === dailyChartData.length - 1"
                      :x="40 + (idx / Math.max(dailyChartData.length - 1, 1)) * 740"
                      y="295"
                      text-anchor="middle"
                      font-size="8"
                      fill="#64748b"
                    >{{ item.date.slice(5) }}</text>
                  </g>
                 <!-- tooltip hover -->
                  <g v-if="hoveredPoint" :transform="`translate(${hoveredPoint.tooltipX}, ${hoveredPoint.y})`" style="pointer-events: none;">
                    <rect x="-38" :y="hoveredPoint.flip ? 10 : -40" width="76" height="30" rx="3" fill="#3b2a1a" opacity="0.92" />
                    <text x="0" :y="hoveredPoint.flip ? 25 : -25" text-anchor="middle" font-size="10" font-weight="bold" fill="#f5efe0">{{ hoveredPoint.count }} views</text>
                    <text x="0" :y="hoveredPoint.flip ? 37 : -13" text-anchor="middle" font-size="8" fill="#e0d4bb">{{ hoveredPoint.date }}</text>
                  </g>
                  <circle v-if="hoveredPoint" :cx="hoveredPoint.x" :cy="hoveredPoint.y" r="4" fill="#b89a5a" stroke="white" stroke-width="1.5" style="pointer-events: none;" />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <Card class="mt-8 rounded-none border-gray-light bg-cream text-brown-950 shadow-none">
          <CardHeader class="border-b border-gray-light">
            <CardTitle class="font-display text-2xl text-brown-950">
              Produk Featured
              <span class="ml-2 rounded-full border px-2.5 py-0.5 text-sm font-normal" :class="featuredCount >= 3 ? 'border-gold bg-gold/10 text-gold' : 'border-gray-light text-brown-700'">
                {{ featuredCount }}/3
              </span>
            </CardTitle>
            <CardDescription class="text-brown-700">
              Centang produk yang ingin ditampilkan di halaman utama. Maksimal 3 produk.
            </CardDescription>
          </CardHeader>
          <CardContent class="overflow-x-auto p-0">
            <table class="min-w-180 w-full text-left text-sm">
              <thead class="border-b border-gray-light bg-[#F3EEE3] text-xs uppercase tracking-wider text-brown-700">
                <tr>
                  <th scope="col" class="px-6 py-4 font-medium">Produk</th>
                  <th scope="col" class="px-6 py-4 font-medium">Kategori</th>
                  <th scope="col" class="px-6 py-4 font-medium">Harga</th>
                  <th scope="col" class="px-6 py-4 font-medium">Stok</th>
                  <th scope="col" class="px-6 py-4 font-medium">Tampil di Home</th>
                  <th scope="col" class="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-light">
                <tr v-for="product in products" :key="product.name" class="transition-colors hover:bg-[#F3EEE3]/60">
                  <td class="px-6 py-4 font-medium text-brown-950">{{ product.name }}</td>
                  <td class="px-6 py-4 text-brown-700">{{ product.categoryName }}</td>
                  <td class="px-6 py-4 text-brown-700">Rp {{ product.price.toLocaleString('id-ID') }}</td>
                  <td class="px-6 py-4 text-brown-700">{{ stockBreakdown(product) }}</td>
                  <td class="px-18 py-4">
                    <input
                      type="checkbox"
                      :checked="product.featured ?? false"
                      :disabled="isFeaturedDisabled(product)"
                      class="size-4 accent-gold"
                      :class="isFeaturedDisabled(product) ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'"
                      :aria-label="`Tampilkan ${product.name} di halaman utama`"
                      @change="toggleFeatured(product)"
                    />
                  </td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex whitespace-nowrap border px-2.5 py-1 text-xs"
                      :class="isLowStock(product)
                        ? 'border-gold bg-gold/10 text-brown-700'
                        : 'border-gray-light bg-white text-brown-700'"
                    >
                      {{ isLowStock(product) ? 'Stok menipis' : 'Tersedia' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <Pagination
              :total="produkList.length"
              :per-page="perPage"
              v-model="currentPage"
            />
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>