<script setup lang="ts">
import {
  Boxes,
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

onMounted(() => {
  kategoriService.subscribe((items) => { kategoriList.value = items })
  const unsub = produkService.subscribe((items) => { produkList.value = items })
  onUnmounted(unsub)
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
