<script setup lang="ts">
import {
  FolderKanban,
  LayoutDashboard,
  LogOut,
  PackagePlus,
  Pencil,
  Plus,
  ShoppingBag,
  Tags,
  Trash2,
} from '@lucide/vue'
import { signOut } from 'firebase/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
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
import { Skeleton } from '@/components/ui/skeleton'
import { useAuthSession } from '@/composables/useSession'
import { useKategori } from '@/composables/useKategori'
import { useProduk } from '@/composables/useProduk'
import type { Kategori } from '@/types/kategori'
import type { Produk } from '@/types/produk'

const { $firebaseAuth } = useNuxtApp()
const { user, setUser } = useAuthSession()
const isLoading = ref(false)
const errorMessage = ref('')

const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, href: '/dashboard' },
  { label: 'Produk', icon: ShoppingBag, href: '/dashboard/produk', active: true },
  { label: 'Kategori', icon: Tags, href: '/dashboard/kategori' },
  { label: 'Pesanan', icon: FolderKanban, href: '', disabled: true },
]

const produktList = ref<Produk[]>([])
const kategoriList = ref<Kategori[]>([])
const loadingData = ref(true)
const sheetOpen = ref(false)
const editingId = ref<string | null>(null)
const formError = ref('')
const deleteConfirmId = ref<string | null>(null)

const form = ref({
  name: '',
  categoryId: '',
  price: 0,
  description: '',
  stock: 0,
  jenis: [] as { title: string; colors: { name: string; hex: string; imageUrl: string }[] }[],
})

const produkService = useProduk()
const kategoriService = useKategori()

onMounted(() => {
  kategoriService.subscribe((items) => { kategoriList.value = items })
  const unsub = produkService.subscribe((items) => {
    produktList.value = items
    loadingData.value = false
  })
  onUnmounted(unsub)
})

function resetForm() {
  form.value = { name: '', categoryId: '', price: 0, description: '', stock: 0, jenis: [] }
  editingId.value = null
  formError.value = ''
}

function openEdit(item: Produk) {
  form.value = {
    name: item.name,
    categoryId: item.categoryId,
    price: item.price,
    description: item.description,
    stock: item.stock,
    jenis: item.jenis.map(j => ({ title: j.title, colors: j.colors })),
  }
  editingId.value = item.id
  formError.value = ''
  sheetOpen.value = true
}

function addJenis() {
  form.value.jenis.push({ title: '', colors: [{ name: '', hex: '#D9BD8E', imageUrl: '' }] })
}

function removeJenis(idx: number) {
  form.value.jenis.splice(idx, 1)
}

function addColor(jenisIdx: number) {
  form.value.jenis[jenisIdx].colors.push({ name: '', hex: '#D9BD8E', imageUrl: '' })
}

function removeColor(jenisIdx: number, colorIdx: number) {
  form.value.jenis[jenisIdx].colors.splice(colorIdx, 1)
}

const kategoriName = computed(() => (id: string) =>
  kategoriList.value.find(k => k.id === id)?.name ?? '—'
)

async function handleSubmit() {
  if (!form.value.name.trim()) { formError.value = 'Nama wajib diisi'; return }
  if (!form.value.categoryId) { formError.value = 'Pilih kategori'; return }
  if (!form.value.price || form.value.price <= 0) { formError.value = 'Harga harus lebih dari 0'; return }
  if (form.value.jenis.length === 0) { formError.value = 'Minimal 1 jenis produk'; return }

  formError.value = ''
  const cat = kategoriList.value.find(k => k.id === form.value.categoryId)
  const payload = {
    name: form.value.name.trim(),
    categoryId: form.value.categoryId,
    categoryName: cat?.name ?? '',
    price: form.value.price,
    description: form.value.description.trim(),
    stock: form.value.stock,
    jenis: form.value.jenis.map(j => ({
      ...j,
      title: j.title.trim(),
      colors: j.colors.filter(c => c.name.trim() || c.imageUrl.trim()),
    })).filter(j => j.title),
  }

  try {
    if (editingId.value) {
      await produkService.update(editingId.value, payload)
    } else {
      await produkService.add(payload)
    }
    sheetOpen.value = false
    resetForm()
  } catch {
    formError.value = 'Gagal menyimpan produk'
  }
}

async function handleDelete() {
  if (!deleteConfirmId.value) return
  try {
    await produkService.remove(deleteConfirmId.value)
    deleteConfirmId.value = null
  } catch {
    errorMessage.value = 'Gagal menghapus produk'
  }
}

const logout = async () => {
  if (isLoading.value) return
  isLoading.value = true; errorMessage.value = ''
  try { await $fetch('/api/auth/logout', { method: 'POST' }) }
  catch { errorMessage.value = 'Logout gagal'; isLoading.value = false; return }
  await signOut($firebaseAuth).catch(() => undefined)
  setUser(null); await navigateTo('/login')
}

const userInitials = computed(() => {
  const s = user.value?.name || user.value?.email || 'Admin'
  return s.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
})
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
          <SidebarGroupLabel class="uppercase tracking-[0.18em] text-gold-soft/70">Manajemen</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navItems" :key="item.label">
                <SidebarMenuButton v-if="!item.disabled" as-child :is-active="item.active" :tooltip="item.label" class="text-cream hover:bg-brown-800 hover:text-gold-soft data-[active=true]:bg-gold data-[active=true]:text-brown-950">
                  <NuxtLink :to="item.href"><component :is="item.icon" aria-hidden="true" /><span>{{ item.label }}</span></NuxtLink>
                </SidebarMenuButton>
                <SidebarMenuButton v-else disabled aria-disabled="true" class="text-text-muted opacity-55">
                  <component :is="item.icon" aria-hidden="true" /><span>{{ item.label }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter class="border-t border-brown-border p-3">
        <div class="flex items-center gap-3 px-2 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <Avatar class="size-8 shrink-0 rounded-none border border-gold/50">
            <AvatarImage v-if="user?.picture" :src="user.picture" referrerpolicy="no-referrer" />
            <AvatarFallback class="rounded-none bg-brown-800 text-xs text-gold-soft">{{ userInitials }}</AvatarFallback>
          </Avatar>
          <div class="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p class="truncate text-sm font-medium text-cream">{{ user?.name || 'Admin' }}</p>
            <p class="truncate text-xs text-text-muted">{{ user?.email || 'Administrator' }}</p>
          </div>
        </div>
        <Button type="button" variant="ghost" class="w-full justify-start text-cream hover:bg-brown-800 hover:text-gold-soft group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0" :disabled="isLoading" @click="logout">
          <LogOut aria-hidden="true" />
          <span class="group-data-[collapsible=icon]:hidden">{{ isLoading ? 'Keluar...' : 'Logout' }}</span>
        </Button>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>

    <SidebarInset class="min-w-0 bg-cream">
      <header class="sticky top-0 z-20 flex h-16 shrink-0 items-center gap-3 border-b border-gray-light bg-cream/95 px-4 backdrop-blur sm:px-6">
        <SidebarTrigger class="text-brown-700 hover:bg-gold/15 hover:text-gold" aria-label="Buka atau tutup sidebar" />
        <span class="h-5 w-px bg-gray-light" aria-hidden="true"></span>
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem><NuxtLink to="/dashboard" class="text-sm text-brown-700 transition-colors hover:text-gold">Dashboard</NuxtLink></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage class="font-display text-brown-950">Produk</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div class="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="produk-title">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="mb-3 text-xs italic uppercase tracking-[0.18em] text-gold">Manajemen</p>
              <h1 id="produk-title" class="font-display text-3xl text-brown-950 sm:text-4xl">Produk</h1>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-brown-700">Kelola semua produk Agung Prada Bali.</p>
            </div>

            <Sheet v-model:open="sheetOpen">
              <SheetTrigger as-child>
                <Button type="button" class="rounded-none bg-brown-950 text-cream hover:bg-brown-700" @click="resetForm">
                  <PackagePlus aria-hidden="true" />
                  <span class="max-sm:hidden">Tambah Produk</span>
                </Button>
              </SheetTrigger>
              <SheetContent class="flex w-full flex-col gap-0 bg-cream p-0 sm:max-w-2xl">
                <SheetHeader class="space-y-3 border-b border-gray-light bg-white px-6 py-5">
                  <div class="flex items-center gap-3">
                    <span class="flex size-10 shrink-0 items-center justify-center border border-gold/40 bg-gold/10 text-gold">
                      <PackagePlus class="size-5" aria-hidden="true" />
                    </span>
                    <div class="min-w-0">
                      <SheetTitle class="font-display text-xl text-brown-950">{{ editingId ? 'Edit Produk' : 'Tambah Produk' }}</SheetTitle>
                      <SheetDescription class="text-xs text-brown-700">Lengkapi data produk Agung Prada Bali.</SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
                  <div class="min-h-0 flex-1 space-y-6 overflow-y-auto px-6 py-6">
                    <section class="space-y-4">
                      <h3 class="flex items-center gap-2 border-b border-gray-light pb-2 font-display text-sm uppercase tracking-wider text-brown-700">
                        <span class="size-1.5 bg-gold" aria-hidden="true"></span> Informasi Dasar
                      </h3>
                      <div class="grid gap-2">
                        <Label for="produk-name" class="text-xs font-medium uppercase tracking-wider text-brown-700">Nama Produk <span class="text-red-500">*</span></Label>
                        <Input id="produk-name" v-model="form.name" placeholder="Contoh: Prada Klasik Emas" class="rounded-none border-brown-800/30 focus-visible:border-gold" required />
                      </div>
                      <div class="grid gap-2">
                        <Label for="produk-cat" class="text-xs font-medium uppercase tracking-wider text-brown-700">Kategori <span class="text-red-500">*</span></Label>
                        <select id="produk-cat" v-model="form.categoryId" class="rounded-none border border-brown-800/30 bg-cream px-3 py-2 text-sm text-brown-950 focus:border-gold focus:outline-none" required>
                          <option value="" disabled>Pilih kategori</option>
                          <option v-for="k in kategoriList" :key="k.id" :value="k.id">{{ k.name }}</option>
                        </select>
                      </div>
                      <div class="grid grid-cols-2 gap-4">
                        <div class="grid gap-2">
                          <Label for="produk-price" class="text-xs font-medium uppercase tracking-wider text-brown-700">Harga (Rp) <span class="text-red-500">*</span></Label>
                          <Input id="produk-price" v-model.number="form.price" type="number" min="0" placeholder="0" class="rounded-none border-brown-800/30 focus-visible:border-gold" required />
                        </div>
                        <div class="grid gap-2">
                          <Label for="produk-stock" class="text-xs font-medium uppercase tracking-wider text-brown-700">Stok</Label>
                          <Input id="produk-stock" v-model.number="form.stock" type="number" min="0" placeholder="0" class="rounded-none border-brown-800/30 focus-visible:border-gold" />
                        </div>
                      </div>
                      <div class="grid gap-2">
                        <Label for="produk-desc" class="text-xs font-medium uppercase tracking-wider text-brown-700">Deskripsi</Label>
                        <textarea id="produk-desc" v-model="form.description" rows="3" placeholder="Deskripsi produk" class="resize-none rounded-none border border-brown-800/30 bg-cream px-3 py-2 text-sm text-brown-950 placeholder:text-brown-400 focus:border-gold focus:outline-none" />
                      </div>
                    </section>

                    <section class="space-y-3">
                      <div class="flex items-center justify-between border-b border-gray-light pb-2">
                        <h3 class="flex items-center gap-2 font-display text-sm uppercase tracking-wider text-brown-700">
                          <span class="size-1.5 bg-gold" aria-hidden="true"></span> Jenis / Varian
                        </h3>
                        <Button type="button" variant="outline" size="sm" class="rounded-none border-brown-800/30 text-xs text-brown-950" @click="addJenis">
                          <Plus class="mr-1 size-3" /> Tambah Jenis
                        </Button>
                      </div>

                      <p v-if="form.jenis.length === 0" class="border border-dashed border-gray-light py-8 text-center text-xs text-brown-400">Belum ada jenis. Klik "Tambah Jenis" untuk memulai.</p>

                      <div v-for="(jenis, ji) in form.jenis" :key="ji" class="space-y-3 border border-gray-light bg-white p-4">
                        <div class="flex items-center justify-between">
                          <span class="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brown-700">
                            <span class="flex size-5 items-center justify-center bg-brown-950 text-[10px] text-cream">{{ ji + 1 }}</span>
                            Jenis
                          </span>
                          <button type="button" class="inline-flex items-center gap-1 text-xs text-red-500 transition-colors hover:text-red-700" @click="removeJenis(ji)">
                            <Trash2 class="size-3" /> Hapus
                          </button>
                        </div>

                        <div class="grid gap-2">
                          <Label :for="`jenis-title-${ji}`" class="text-xs font-medium text-brown-700">Nama Jenis</Label>
                          <Input :id="`jenis-title-${ji}`" v-model="jenis.title" placeholder="Contoh: Ukuran Sedang" class="rounded-none border-brown-800/30 focus-visible:border-gold" />
                        </div>

                        <div class="grid gap-2 border-t border-gray-light pt-3">
                          <div class="flex items-center justify-between">
                            <Label class="text-xs font-medium text-brown-700">Warna</Label>
                            <button type="button" class="inline-flex items-center gap-1 text-xs text-gold transition-colors hover:text-gold/70" @click="addColor(ji)">
                              <Plus class="size-3" /> Tambah Warna
                            </button>
                          </div>

                          <div class="space-y-2">
                            <div v-for="(color, ci) in jenis.colors" :key="ci" class="grid grid-cols-[auto_1fr_2.5fr_auto] items-end gap-2">
                              <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-medium uppercase tracking-wider text-brown-400">Warna</span>
                                <label class="relative flex size-9 cursor-pointer items-center justify-center border border-brown-800/30" :title="color.hex">
                                  <input :id="`color-hex-${ji}-${ci}`" v-model="color.hex" type="color" class="absolute inset-0 size-full cursor-pointer opacity-0" />
                                  <span class="size-5" :style="{ backgroundColor: color.hex }" aria-hidden="true"></span>
                                </label>
                              </div>
                              <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-medium uppercase tracking-wider text-brown-400">Nama Warna</span>
                                <Input :id="`color-name-${ji}-${ci}`" v-model="color.name" placeholder="Emas" class="h-9 rounded-none border-brown-800/30 text-xs focus-visible:border-gold" />
                              </div>
                              <div class="flex flex-col gap-1">
                                <span class="text-[10px] font-medium uppercase tracking-wider text-brown-400">URL Gambar</span>
                                <Input :id="`color-img-${ji}-${ci}`" v-model="color.imageUrl" placeholder="https://..." class="h-9 rounded-none border-brown-800/30 text-xs focus-visible:border-gold" />
                              </div>
                              <button type="button" class="mb-px inline-flex size-9 items-center justify-center border border-red-200 bg-red-50 text-red-500 transition-colors hover:bg-red-600 hover:text-white disabled:opacity-30" @click="removeColor(ji, ci)" :disabled="jenis.colors.length <= 1" title="Hapus warna">
                                <Trash2 class="size-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>

                    <p v-if="formError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">{{ formError }}</p>
                  </div>

                  <SheetFooter class="flex-row justify-end gap-3 border-t border-gray-light bg-white px-6 py-4">
                    <SheetClose as-child>
                      <Button type="button" variant="outline" class="rounded-none border-brown-800/30 text-brown-950">Batal</Button>
                    </SheetClose>
                    <Button type="submit" class="rounded-none bg-brown-950 text-cream hover:bg-brown-700">{{ editingId ? 'Simpan Perubahan' : 'Tambah Produk' }}</Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        <Card class="mt-8 rounded-none border-gray-light bg-cream text-brown-950 shadow-none">
          <CardHeader class="border-b border-gray-light">
            <CardTitle class="font-display text-2xl text-brown-950">Daftar Produk</CardTitle>
            <CardDescription class="text-brown-700">{{ produktList.length }} produk terdaftar.</CardDescription>
          </CardHeader>
          <CardContent class="overflow-x-auto p-0">
            <div v-if="loadingData" class="space-y-4 p-6">
              <Skeleton v-for="i in 4" :key="i" class="h-14 w-full rounded-none bg-brown-800/10" />
            </div>
            <div v-else-if="produktList.length === 0" class="py-16 text-center">
              <ShoppingBag class="mx-auto mb-4 size-10 text-brown-400" />
              <p class="text-sm text-brown-700">Belum ada produk.</p>
              <p class="mt-1 text-xs text-brown-400">Klik "Tambah Produk" untuk memulai.</p>
            </div>
            <table v-else class="min-w-full w-full text-left text-sm">
              <thead class="border-b border-gray-light bg-[#F3EEE3] text-xs uppercase tracking-wider text-brown-700">
                <tr>
                  <th scope="col" class="px-6 py-4 font-medium">Nama</th>
                  <th scope="col" class="px-6 py-4 font-medium max-md:hidden">Kategori</th>
                  <th scope="col" class="px-6 py-4 font-medium">Harga</th>
                  <th scope="col" class="px-6 py-4 font-medium max-sm:hidden">Varian</th>
                  <th scope="col" class="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-light">
                <tr v-for="item in produktList" :key="item.id" class="transition-colors hover:bg-[#F3EEE3]/60">
                  <td class="px-6 py-4 font-medium text-brown-950">{{ item.name }}</td>
                  <td class="px-6 py-4 text-brown-700 max-md:hidden">{{ kategoriName(item.categoryId) }}</td>
                  <td class="px-6 py-4 tabular-nums text-brown-700">Rp {{ item.price.toLocaleString('id-ID') }}</td>
                  <td class="px-6 py-4 text-brown-700 max-sm:hidden">{{ item.jenis?.length ?? 0 }} varian</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button class="inline-flex size-8 items-center justify-center border border-gold/40 bg-gold/10 text-gold transition-colors hover:bg-gold hover:text-white" title="Edit" @click="openEdit(item)"><Pencil class="size-3.5" /></button>
                      <button class="inline-flex size-8 items-center justify-center border border-red-300 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white" title="Hapus" @click="deleteConfirmId = item.id"><Trash2 class="size-3.5" /></button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Teleport to="body">
          <Transition name="modal">
            <div v-if="deleteConfirmId" class="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm" @click.self="deleteConfirmId = null">
              <div class="w-full max-w-sm bg-cream p-6 shadow-2xl">
                <h3 class="mb-2 font-display text-lg text-brown-950">Hapus Produk?</h3>
                <p class="mb-6 text-sm text-brown-700">Produk <strong>{{ produktList.find(p => p.id === deleteConfirmId)?.name }}</strong> akan dihapus permanen.</p>
                <div class="flex justify-end gap-3">
                  <Button type="button" variant="outline" class="rounded-none border-brown-800/30 text-brown-950" @click="deleteConfirmId = null">Batal</Button>
                  <Button type="button" class="rounded-none bg-red-600 text-white hover:bg-red-700" @click="handleDelete">Hapus</Button>
                </div>
              </div>
            </div>
          </Transition>
        </Teleport>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: all 0.3s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
