# Project Tasks

## Backlog

<!-- empty or other tasks -->

## Done

### [x] TASK-001 — Migrasi dari Blade ke Vue

- **Priority:** High
- **Goal:** Memastikan Vue template sesuai dengan Blade template
- **Scope:** Vue template

#### Acceptance criteria

- [x] Gunakan style Tailwind css untuk 2 halaman tersebut
- [x] Buat 2 halaman (Halaman landing page & halaman detail)
- [x] Halaman landing page gunakan template.blade
- [x] Halaman detail gunakan show.blade
- [x] pastikan semua responsive


#### Verification

- [x] pastikan kedua halaman tersebut menerapkan style css yang di convert ke tailwind css

### [x] TASK-002 — Membuat Fitur Search Pada Halaman Catalog

- **Priority:** High
- **Goal:** Memastikan Search berjalan dengan baik sesuai dengan diketik
- **Scope:** Search Catalog

#### Acceptance criteria

- [x] Mencari produk berdasarkan nama
- [x] Buat agar ada sorting by latest, oldest
- [x] Tambahkan fitur button untuk cari kategori
- [x] Pastikan fitur search hanya tersedia pada halaman catalog.vue
- [x] pastikan semua responsive


#### Verification

- [x] pastikan fitur search berjalan dengan baik sesuai dengan apa yang diminta


### [x] TASK-003 — Membuat Fitur CRUD Kategori

- **Priority:** High
- **Goal:** Memastikan satu kategori mempunyai banyak produk
- **Scope:** CRUD Kategori

#### Acceptance criteria

- [x] Buatkan CRUD kategori menggunakan firestore


#### Verification

- [x] pastikan fitur CRUD berjalan dengan baik

#### NOTES

- BERI TANDA [x] JIKA TASK SUDAH SELESAI


### [x] TASK-004 — Membuat Fitur CRUD Produk

- **Priority:** High
- **Goal:** Memastikan fitur CRUD produk berjalan dengan baik
- **Scope:** CRUD produk

#### Acceptance criteria

- [x] Buatkan CRUD produk
- [x] Pastikan setiap produk memiliki nama, kategori, harga, jenis, foto
- [x] Pastikan data yang kategori yang diimputkan di produk itu datanya ada
- [x] Untuk di jenis, datanya pakai array of object [{ id, title, color[], imageurl }] (karena di masing-masing jenis ini mempunyai banyak warna jadi gunakan array)


#### Verification

- [x] pastikan fitur CRUD berjalan dengan baik

#### NOTES

- BERI TANDA [x] JIKA TASK SUDAH SELESAI