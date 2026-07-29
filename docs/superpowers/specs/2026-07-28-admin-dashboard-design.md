# Desain Dashboard Admin

**Tanggal:** 2026-07-28  
**Scope:** `app/pages/dashboard/index.vue`

## Tujuan

Mengubah halaman dashboard akun menjadi dashboard admin responsif. Halaman memakai komponen sidebar yang sudah tersedia dan mempertahankan identitas visual halaman publik Griya Prada Bali.

## Pendekatan

Implementasi tetap dalam satu halaman. Tidak membuat layout admin atau komponen baru karena baru satu route dashboard. Komponen `app/components/ui/sidebar` menyediakan perilaku desktop, collapse, dan off-canvas mobile.

## Struktur

- `SidebarProvider` membungkus seluruh dashboard.
- `Sidebar` memuat identitas Griya Prada Bali, menu admin, profil pengguna, dan logout.
- `SidebarInset` memuat header serta konten utama.
- Header memuat `SidebarTrigger`, breadcrumb, dan tombol tambah produk placeholder.
- Konten utama memuat empat kartu ringkasan serta tabel lima produk terbaru.

## Navigasi

Menu sidebar:

1. Ringkasan — aktif, menuju `/dashboard`.
2. Produk — placeholder karena route manajemen produk belum tersedia.
3. Kategori — placeholder karena route kategori belum tersedia.
4. Pesanan — placeholder karena route pesanan belum tersedia.

Link yang belum punya route tidak boleh mengarahkan pengguna ke halaman 404. Tombol tambah produk juga tampil sebagai aksi nonaktif sampai route tersedia.

## Data

Kartu ringkasan menampilkan data contoh lokal:

- total produk,
- total kategori,
- pesanan baru,
- stok menipis.

Tabel menampilkan lima produk contoh dengan nama, kategori, harga, stok, dan status. Tidak ada fetching produk karena server belum menyediakan API produk.

Data pengguna berasal dari `useAuthSession()`. Nama, email, foto, dan fallback avatar digunakan pada footer sidebar.

## Logout dan Error

Alur logout yang ada dipertahankan:

1. Kirim `POST /api/auth/logout`.
2. Jika gagal, tampilkan pesan error dengan `role="alert"` dan hentikan proses.
3. Jika berhasil, keluar dari Firebase, kosongkan session lokal, lalu pindah ke `/login`.
4. Tombol logout dinonaktifkan selama proses untuk mencegah permintaan ganda.

## Visual

- Latar utama `cream`.
- Sidebar `brown-950` dengan teks cream serta aksen gold.
- Judul memakai `font-display`; isi memakai `font-body` bawaan aplikasi.
- Card dan tabel memakai border brown/gold, sudut minimal, tanpa gaya SaaS generik.
- Ikon memakai `@lucide/vue` yang sudah terpasang.
- Kartu ringkasan memakai hirarki tipografi, bukan chart, karena belum ada data historis.

## Responsive dan Aksesibilitas

- Desktop: sidebar tetap, dapat diciutkan menjadi ikon.
- Mobile: sidebar memakai sheet off-canvas dari komponen yang tersedia.
- Tabel dapat digulir horizontal pada layar sempit.
- Tombol ikon memiliki label aksesibel.
- Foto pengguna memiliki alt text; status logout diumumkan sebagai alert.
- Kontras mengikuti token brown, cream, dan gold aplikasi.

## Verifikasi

- Jalankan `npm run build` untuk memeriksa template, type, import, dan SSR build.
- Periksa bahwa `/dashboard` tetap dilindungi middleware auth.
- Periksa tampilan desktop dan mobile bila browser tersedia.

## Batas Scope

Tidak membuat CRUD produk, API produk, route kategori, route pesanan, chart, atau layout admin bersama. Tambahkan saat route dashboard kedua atau backend produk benar-benar tersedia.
