<script setup lang="ts">
import {
  Boxes,
  FolderKanban,
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

const { $firebaseAuth } = useNuxtApp()
const { user, setUser } = useAuthSession()
const isLoading = ref(false)
const errorMessage = ref('')

const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, href: '/dashboard', active: true },
  { label: 'Produk', icon: ShoppingBag, href: '/dashboard/produk' },
  { label: 'Kategori', icon: Tags, href: '/dashboard/kategori' },
  { label: 'Pesanan', icon: FolderKanban, href: '', disabled: true },
]

const stats = [
  { label: 'Total Produk', value: '24', note: '3 produk baru bulan ini', icon: Boxes },
  { label: 'Total Kategori', value: '6', note: 'Kain dan perlengkapan upacara', icon: Tags },
  { label: 'Pesanan Baru', value: '8', note: 'Menunggu konfirmasi', icon: ShoppingBag },
  { label: 'Stok Menipis', value: '3', note: 'Perlu segera diperbarui', icon: TriangleAlert },
]

const products = [
  { name: 'Prada Klasik Emas', category: 'Kain Prada', price: 'Rp1.250.000', stock: 12 },
  { name: 'Prada Patra Punggel', category: 'Kain Prada', price: 'Rp1.100.000', stock: 4 },
  { name: 'Prada Songket Kombinasi', category: 'Kain Prada', price: 'Rp1.450.000', stock: 8 },
  { name: 'Sangku Daksina', category: 'Alat Upacara', price: 'Rp275.000', stock: 3 },
  { name: 'Sabuk Prada', category: 'Pelengkap', price: 'Rp325.000', stock: 15 },
]

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

          <div class="mt-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Card
              v-for="stat in stats"
              :key="stat.label"
              class="rounded-none border-gray-light bg-cream text-brown-950 shadow-none transition-colors hover:border-gold"
            >
              <CardHeader class="flex-row items-start justify-between gap-4">
                <div>
                  <CardDescription class="text-brown-700">
                    {{ stat.label }}
                  </CardDescription>
                  <CardTitle class="mt-2 font-display text-3xl text-brown-950">
                    {{ stat.value }}
                  </CardTitle>
                </div>
                <div class="border border-gold/40 bg-gold/10 p-2 text-gold">
                  <component :is="stat.icon" class="size-5" aria-hidden="true" />
                </div>
              </CardHeader>
              <CardContent class="text-xs text-gray">
                {{ stat.note }}
              </CardContent>
            </Card>
          </div>
        </section>

        <Card class="mt-8 rounded-none border-gray-light bg-cream text-brown-950 shadow-none">
          <CardHeader class="border-b border-gray-light">
            <CardTitle class="font-display text-2xl text-brown-950">
              Produk Terbaru
            </CardTitle>
            <CardDescription class="text-brown-700">
              Data contoh katalog terbaru. Manajemen produk tersedia setelah API produk ditambahkan.
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
                  <th scope="col" class="px-6 py-4 font-medium">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-light">
                <tr v-for="product in products" :key="product.name" class="transition-colors hover:bg-[#F3EEE3]/60">
                  <td class="px-6 py-4 font-medium text-brown-950">{{ product.name }}</td>
                  <td class="px-6 py-4 text-brown-700">{{ product.category }}</td>
                  <td class="px-6 py-4 text-brown-700">{{ product.price }}</td>
                  <td class="px-6 py-4 tabular-nums text-brown-700">{{ product.stock }}</td>
                  <td class="px-6 py-4">
                    <span
                      class="inline-flex whitespace-nowrap border px-2.5 py-1 text-xs"
                      :class="product.stock <= 4
                        ? 'border-gold bg-gold/10 text-brown-700'
                        : 'border-gray-light bg-white text-brown-700'"
                    >
                      {{ product.stock <= 4 ? 'Stok menipis' : 'Tersedia' }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
