<script setup lang="ts">
import {
  LayoutDashboard,
  LogOut,
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
import type { Kategori } from '@/types/kategori'

const { $firebaseAuth } = useNuxtApp()
const { user, setUser } = useAuthSession()
const isLoading = ref(false)
const errorMessage = ref('')

const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, href: '/dashboard', active: false, disabled: false },
  { label: 'Produk', icon: ShoppingBag, href: '/dashboard/produk', active: false, disabled: false },
  { label: 'Kategori', icon: Tags, href: '/dashboard/kategori', active: true, disabled: false },
]

const kategoriList = ref<Kategori[]>([])
const loadingData = ref(true)
const formName = ref('')
const formDescription = ref('')
const editingId = ref<string | null>(null)
const formError = ref('')
const sheetOpen = ref(false)
const deleteConfirmId = ref<string | null>(null)

const { subscribe, add, update, remove, nameExists } = useKategori()

onMounted(() => {
  const unsub = subscribe((items: Kategori[]) => {
    kategoriList.value = items
    loadingData.value = false
  })
  onUnmounted(unsub)
})

function resetForm() {
  formName.value = ''
  formDescription.value = ''
  editingId.value = null
  formError.value = ''
}

function openEdit(item: Kategori) {
  formName.value = item.name
  formDescription.value = item.description
  editingId.value = item.id
  formError.value = ''
  sheetOpen.value = true
}

async function handleSubmit() {
  const name = formName.value.trim()
  if (!name) { formError.value = 'Nama wajib diisi'; return }

  formError.value = ''
  const exists = await nameExists(name, editingId.value ?? undefined)
  if (exists) { formError.value = 'Nama kategori sudah ada'; return }

  try {
    if (editingId.value) {
      await update(editingId.value, { name, description: formDescription.value.trim() })
    } else {
      await add({ name, description: formDescription.value.trim() })
    }
    sheetOpen.value = false
    resetForm()
  } catch {
    formError.value = 'Gagal menyimpan kategori'
  }
}

async function handleDelete() {
  if (!deleteConfirmId.value) return
  try {
    await remove(deleteConfirmId.value)
    deleteConfirmId.value = null
  } catch {
    errorMessage.value = 'Gagal menghapus kategori'
  }
}

const logout = async () => {
  if (isLoading.value) return
  isLoading.value = true
  errorMessage.value = ''
  try { await $fetch('/api/auth/logout', { method: 'POST' }) }
  catch { errorMessage.value = 'Logout gagal'; isLoading.value = false; return }
  await signOut($firebaseAuth).catch(() => undefined)
  setUser(null)
  await navigateTo('/login')
}

const userInitials = computed(() => {
  const source = user.value?.name || user.value?.email || 'Admin'
  return source.split(/\s+/).map(p => p[0]).join('').slice(0, 2).toUpperCase()
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
            <BreadcrumbItem>
              <NuxtLink to="/dashboard" class="text-sm text-brown-700 transition-colors hover:text-gold">Dashboard</NuxtLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage class="font-display text-brown-950">Kategori</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>

      <div class="flex-1 px-4 py-8 sm:px-6 lg:px-8">
        <section aria-labelledby="kategori-title">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p class="mb-3 text-xs italic uppercase tracking-[0.18em] text-gold">Manajemen</p>
              <h1 id="kategori-title" class="font-display text-3xl text-brown-950 sm:text-4xl">Kategori Produk</h1>
              <p class="mt-3 max-w-2xl text-sm leading-relaxed text-brown-700">
                Kelola kategori produk. Setiap kategori dapat menampung banyak produk.
              </p>
            </div>

            <Sheet v-model:open="sheetOpen">
              <SheetTrigger as-child>
                <Button type="button" class="rounded-none bg-brown-950 text-cream hover:bg-brown-700" @click="resetForm">
                  <Plus aria-hidden="true" />
                  <span class="max-sm:hidden">Tambah Kategori</span>
                </Button>
              </SheetTrigger>
              <SheetContent class="flex w-full flex-col gap-0 bg-cream p-0 sm:max-w-md">
                <SheetHeader class="space-y-3 border-b border-gray-light bg-white px-6 py-5">
                  <div class="flex items-center gap-3">
                    <span class="flex size-10 shrink-0 items-center justify-center border border-gold/40 bg-gold/10 text-gold">
                      <Tags class="size-5" aria-hidden="true" />
                    </span>
                    <div class="min-w-0">
                      <SheetTitle class="font-display text-xl text-brown-950">
                        {{ editingId ? 'Edit Kategori' : 'Tambah Kategori' }}
                      </SheetTitle>
                      <SheetDescription class="text-xs text-brown-700">
                        {{ editingId ? 'Perbarui nama dan deskripsi kategori.' : 'Masukkan nama kategori baru.' }}
                      </SheetDescription>
                    </div>
                  </div>
                </SheetHeader>

                <form class="flex min-h-0 flex-1 flex-col" @submit.prevent="handleSubmit">
                  <div class="min-h-0 flex-1 space-y-5 overflow-y-auto px-6 py-6">
                    <div class="grid gap-2">
                      <Label for="kategori-name" class="text-xs font-medium uppercase tracking-wider text-brown-700">
                        Nama Kategori <span class="text-red-500">*</span>
                      </Label>
                      <Input
                        id="kategori-name"
                        v-model="formName"
                        placeholder="Contoh: Kain Prada"
                        class="rounded-none border-brown-800/30 focus-visible:border-gold"
                        required
                      />
                      <p class="text-[11px] text-brown-400">Nama unik, dipakai untuk mengelompokkan produk.</p>
                    </div>

                    <div class="grid gap-2">
                      <Label for="kategori-desc" class="text-xs font-medium uppercase tracking-wider text-brown-700">
                        Deskripsi
                      </Label>
                      <textarea
                        id="kategori-desc"
                        v-model="formDescription"
                        rows="4"
                        placeholder="Deskripsi singkat tentang kategori ini (opsional)"
                        class="resize-none rounded-none border border-brown-800/30 bg-cream px-3 py-2 text-sm text-brown-950 placeholder:text-brown-400 focus:border-gold focus:outline-none"
                      />
                    </div>

                    <p v-if="formError" class="border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600" role="alert">
                      {{ formError }}
                    </p>
                  </div>

                  <SheetFooter class="flex-row justify-end gap-3 border-t border-gray-light bg-white px-6 py-4">
                    <SheetClose as-child>
                      <Button type="button" variant="outline" class="rounded-none border-brown-800/30 text-brown-950">Batal</Button>
                    </SheetClose>
                    <Button type="submit" class="rounded-none bg-brown-950 text-cream hover:bg-brown-700">
                      {{ editingId ? 'Simpan Perubahan' : 'Tambah Kategori' }}
                    </Button>
                  </SheetFooter>
                </form>
              </SheetContent>
            </Sheet>
          </div>
        </section>

        <Card class="mt-8 rounded-none border-gray-light bg-cream text-brown-950 shadow-none">
          <CardHeader class="border-b border-gray-light">
            <CardTitle class="font-display text-2xl text-brown-950">Daftar Kategori</CardTitle>
            <CardDescription class="text-brown-700">
              {{ kategoriList.length }} kategori terdaftar.
            </CardDescription>
          </CardHeader>
          <CardContent class="overflow-x-auto p-0">
            <div v-if="loadingData" class="space-y-4 p-6">
              <Skeleton v-for="i in 3" :key="i" class="h-14 w-full rounded-none bg-brown-800/10" />
            </div>

            <div v-else-if="kategoriList.length === 0" class="py-16 text-center">
              <Tags class="mx-auto mb-4 size-10 text-brown-400" />
              <p class="text-sm text-brown-700">Belum ada kategori.</p>
              <p class="mt-1 text-xs text-brown-400">Klik "Tambah Kategori" untuk membuat kategori baru.</p>
            </div>

            <table v-else class="min-w-full w-full text-left text-sm">
              <thead class="border-b border-gray-light bg-[#F3EEE3] text-xs uppercase tracking-wider text-brown-700">
                <tr>
                  <th scope="col" class="px-6 py-4 font-medium">Nama</th>
                  <th scope="col" class="px-6 py-4 font-medium max-sm:hidden">Slug</th>
                  <th scope="col" class="px-6 py-4 font-medium max-md:hidden">Deskripsi</th>
                  <th scope="col" class="px-6 py-4 font-medium text-right">Aksi</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-light">
                <tr v-for="item in kategoriList" :key="item.id" class="transition-colors hover:bg-[#F3EEE3]/60">
                  <td class="px-6 py-4 font-medium text-brown-950">{{ item.name }}</td>
                  <td class="px-6 py-4 text-xs text-brown-700 max-sm:hidden">{{ item.slug }}</td>
                  <td class="px-6 py-4 text-brown-700 max-md:hidden">{{ item.description || '—' }}</td>
                  <td class="px-6 py-4 text-right">
                    <div class="flex justify-end gap-2">
                      <button
                        class="inline-flex size-8 items-center justify-center border border-gold/40 bg-gold/10 text-gold transition-colors hover:bg-gold hover:text-white"
                        title="Edit"
                        @click="openEdit(item)"
                      >
                        <Pencil class="size-3.5" />
                      </button>
                      <button
                        class="inline-flex size-8 items-center justify-center border border-red-300 bg-red-50 text-red-600 transition-colors hover:bg-red-600 hover:text-white"
                        title="Hapus"
                        @click="deleteConfirmId = item.id"
                      >
                        <Trash2 class="size-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </CardContent>
        </Card>

        <Teleport to="body">
          <Transition name="modal">
            <div v-if="deleteConfirmId" class="fixed inset-0 z-50 flex overflow-y-auto bg-black/60 p-4 backdrop-blur-sm" @click.self="deleteConfirmId = null">
              <div class="m-auto w-full max-w-sm bg-cream p-6 shadow-2xl">
                <h3 class="mb-2 font-display text-lg text-brown-950">Hapus Kategori?</h3>
                <p class="mb-6 text-sm text-brown-700">
                  Kategori <strong>{{ kategoriList.find(k => k.id === deleteConfirmId)?.name }}</strong> akan dihapus permanen.
                </p>
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
