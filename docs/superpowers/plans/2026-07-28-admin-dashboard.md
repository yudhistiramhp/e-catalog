# Admin Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Mengubah `/dashboard` menjadi dashboard admin responsif berisi sidebar, ringkasan toko, tabel produk, profil pengguna, dan logout yang tetap berfungsi.

**Architecture:** Seluruh perubahan berada di `app/pages/dashboard/index.vue`. Halaman memakai primitive sidebar, card, avatar, breadcrumb, dan button yang sudah tersedia; data dashboard tetap lokal sampai API produk tersedia. Sidebar diposisikan di bawah navbar global setinggi 78px, memakai perilaku collapse desktop serta sheet mobile bawaan `SidebarProvider`.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS 4, shadcn-nuxt/reka-ui, `@lucide/vue`, Firebase Auth.

## Global Constraints

- Ubah hanya `app/pages/dashboard/index.vue`; jangan membuat layout atau komponen baru.
- Gunakan token visual `cream`, `brown-950`, `brown-700`, `brown-border`, `gold`, `gold-soft`, `font-display`, dan `font-body` dari `app/main.css`.
- Gunakan komponen sidebar yang sudah ada di `app/components/ui/sidebar`.
- Pertahankan urutan logout: API session, Firebase, state lokal, navigasi `/login`.
- Menu tanpa route dan tombol tambah produk harus nonaktif; jangan arahkan ke halaman 404.
- Jangan menambah dependency, API produk, CRUD, chart, route, atau test framework.
- Jangan commit tanpa permintaan eksplisit pengguna.

## File Structure

- Modify: `app/pages/dashboard/index.vue` — data contoh, logout, sidebar admin, header, kartu ringkasan, tabel produk, responsive styling, dan aksesibilitas.

---

### Task 1: Bangun Dashboard Admin Satu Halaman

**Files:**
- Modify: `app/pages/dashboard/index.vue:1-80`

**Interfaces:**
- Consumes: `useAuthSession(): { user, setUser }`, `useNuxtApp().$firebaseAuth`, `POST /api/auth/logout`, primitive dari `@/components/ui/sidebar`, `@/components/ui/card`, `@/components/ui/avatar`, `@/components/ui/breadcrumb`, dan `@/components/ui/button`.
- Produces: route `/dashboard` dengan sidebar responsif, empat kartu ringkasan, tabel lima produk, logout, dan error alert.

- [ ] **Step 1: Catat baseline build**

Run:

```bash
npm run build
```

Expected: PASS. Jika gagal sebelum perubahan, simpan error baseline lalu lanjut hanya bila error tidak berasal dari `app/pages/dashboard/index.vue`.

- [ ] **Step 2: Ganti script dashboard dengan data dan import minimum**

Pertahankan `logout()`. Tambahkan import ikon dan komponen UI berikut:

```ts
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
```

Tambahkan data lokal bertipe inferensi Vue/TypeScript:

```ts
const navItems = [
  { label: 'Ringkasan', icon: LayoutDashboard, active: true },
  { label: 'Produk', icon: ShoppingBag, active: false },
  { label: 'Kategori', icon: Tags, active: false },
  { label: 'Pesanan', icon: FolderKanban, active: false },
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
```

Gunakan status stok langsung di template: `stock <= 4 ? 'Stok menipis' : 'Tersedia'`. Tidak perlu helper baru.

- [ ] **Step 3: Ganti template dengan shell sidebar**

Bangun struktur terluar berikut:

```vue
<SidebarProvider class="min-h-[calc(100svh-78px)] bg-cream">
  <Sidebar
    collapsible="icon"
    class="top-[78px] h-[calc(100svh-78px)]! border-brown-border bg-brown-950 text-cream"
  >
    <SidebarHeader class="border-b border-brown-border p-3">
      <!-- identitas Griya Prada Bali -->
    </SidebarHeader>
    <SidebarContent>
      <!-- menu admin -->
    </SidebarContent>
    <SidebarFooter class="border-t border-brown-border p-3">
      <!-- profil, logout, error -->
    </SidebarFooter>
    <SidebarRail />
  </Sidebar>

  <SidebarInset class="min-w-0 bg-cream">
    <!-- header dan konten -->
  </SidebarInset>
</SidebarProvider>
```

Identitas sidebar memakai `SidebarMenuButton size="lg" as-child` dan `NuxtLink to="/dashboard"`. Tampilkan monogram `GP`, nama `Griya Prada`, serta label `Admin Bali`. Menu memakai `v-for="item in navItems"`; hanya Ringkasan memakai `as-child` dan `NuxtLink to="/dashboard"`. Item lain harus berupa button dengan `disabled`, `aria-disabled="true"`, tooltip judul, dan opacity yang jelas.

Gunakan kelas menu aktif:

```vue
class="text-cream hover:bg-brown-800 hover:text-gold-soft data-[active=true]:bg-gold data-[active=true]:text-brown-950"
```

- [ ] **Step 4: Tambahkan profil dan logout aksesibel**

Footer sidebar memakai `Avatar`, foto `user?.picture`, alt ``Foto profil ${user?.name || user?.email || 'admin'}``, serta `userInitials`. Tampilkan nama fallback `Admin` dan email fallback `Administrator`.

Tombol logout tetap memanggil `logout`:

```vue
<Button
  type="button"
  variant="ghost"
  class="w-full justify-start text-cream hover:bg-brown-800 hover:text-gold-soft group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0"
  :disabled="isLoading"
  :aria-busy="isLoading"
  @click="logout"
>
  <LogOut />
  <span class="group-data-[collapsible=icon]:hidden">
    {{ isLoading ? 'Keluar...' : 'Logout' }}
  </span>
</Button>
```

Render `errorMessage` dengan `role="alert"` dan `aria-live="polite"`. Sembunyikan copy panjang ketika sidebar collapse, tetapi jangan hilangkan semantic alert.

- [ ] **Step 5: Tambahkan header dashboard**

Header `SidebarInset` harus sticky, tinggi 64px, border bawah, dan memakai:

```vue
<SidebarTrigger class="text-brown-700 hover:bg-gold/15 hover:text-gold" />
<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem>
      <BreadcrumbPage class="font-display text-brown-950">Dashboard Admin</BreadcrumbPage>
    </BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>
<Button
  type="button"
  disabled
  aria-disabled="true"
  title="Manajemen produk belum tersedia"
  class="ml-auto rounded-none bg-brown-950 text-cream hover:bg-brown-700"
>
  <PackagePlus />
  <span class="max-sm:hidden">Tambah Produk</span>
</Button>
```

Tambahkan pembatas vertikal sederhana antara trigger dan breadcrumb. Override teks bawaan `Toggle Sidebar` lewat `aria-label="Buka atau tutup sidebar"` pada `SidebarTrigger`; atribut diteruskan oleh komponen.

- [ ] **Step 6: Tambahkan kartu ringkasan**

Konten utama memakai `px-4 py-8 sm:px-6 lg:px-8`. Tambahkan eyebrow `Ringkasan Toko`, judul `Selamat datang, {{ user?.name || 'Admin' }}`, dan deskripsi singkat.

Render `stats` sebagai grid `sm:grid-cols-2 xl:grid-cols-4`. Setiap `Card` memakai `rounded-none border-gray-light bg-cream shadow-none transition-colors hover:border-gold`. Struktur:

```vue
<Card v-for="stat in stats" :key="stat.label" class="rounded-none border-gray-light bg-cream shadow-none">
  <CardHeader class="flex-row items-start justify-between gap-4">
    <div>
      <CardDescription class="text-brown-700">{{ stat.label }}</CardDescription>
      <CardTitle class="mt-2 font-display text-3xl text-brown-950">{{ stat.value }}</CardTitle>
    </div>
    <div class="border border-gold/40 bg-gold/10 p-2 text-gold">
      <component :is="stat.icon" class="size-5" aria-hidden="true" />
    </div>
  </CardHeader>
  <CardContent class="text-xs text-gray">{{ stat.note }}</CardContent>
</Card>
```

- [ ] **Step 7: Tambahkan tabel produk terbaru**

Gunakan satu `Card` tanpa sudut membulat. Header card berisi judul `Produk Terbaru` dan deskripsi data contoh. Bungkus tabel dengan `overflow-x-auto`.

Tabel minimum memiliki header `Produk`, `Kategori`, `Harga`, `Stok`, `Status`. Gunakan `<th scope="col">`, `<tbody>`, dan `v-for`. Status:

```vue
<span
  class="inline-flex whitespace-nowrap border px-2.5 py-1 text-xs"
  :class="product.stock <= 4
    ? 'border-gold bg-gold/10 text-brown-700'
    : 'border-gray-light bg-white text-brown-700'"
>
  {{ product.stock <= 4 ? 'Stok menipis' : 'Tersedia' }}
</span>
```

Gunakan `min-w-[720px]` pada tabel, `text-left`, garis pemisah `border-gray-light`, dan warna teks konsisten. Jangan menambahkan tombol edit/hapus karena CRUD di luar scope.

- [ ] **Step 8: Jalankan build dan perbaiki hanya masalah terkait dashboard**

Run:

```bash
npm run build
```

Expected: PASS tanpa error import, TypeScript, Vue template, atau SSR.

Jika `aria-label` tidak menimpa label internal `SidebarTrigger`, jangan ubah primitive global. Bungkus trigger dengan label visual tersembunyi hanya bila build atau audit aksesibilitas menuntutnya.

- [ ] **Step 9: Periksa scope diff**

Run:

```bash
git diff -- app/pages/dashboard/index.vue docs/superpowers/specs/2026-07-28-admin-dashboard-design.md docs/superpowers/plans/2026-07-28-admin-dashboard.md
```

Expected: implementasi hanya mengubah `app/pages/dashboard/index.vue`; dua file dokumentasi baru tetap terpisah dari kode. Jangan stage atau commit.
