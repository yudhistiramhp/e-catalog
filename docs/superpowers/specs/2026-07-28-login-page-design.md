# Halaman Login Email dan Password

**Tanggal:** 2026-07-28
**Scope:** `app/pages/login.vue`, `app/app.vue`

## Tujuan

Menyelaraskan halaman login aktif `/login` dengan identitas visual Griya Prada Bali dari `app/pages/index.vue`, memakai struktur card/form dari `app/components/login-03/components/LoginForm.vue`, serta mempertahankan autentikasi Firebase email-password.

## Struktur

- `app/pages/login.vue` tetap menjadi route aktif karena Nuxt memakai `srcDir: "app/"`.
- Branding Griya Prada Bali tampil di atas card.
- Card memuat email, password, tombol show/hide password, tombol login, dan pesan error.
- `app/app.vue` menyembunyikan `NavBar` dan `SiteFooter` saat route `/login` aktif.

## Auth

Alur existing dipertahankan:

1. Validasi HTML `email` dan `password`.
2. Panggil `signInWithEmailAndPassword`.
3. Ambil ID token Firebase.
4. Kirim token ke `POST /api/auth/session`.
5. Simpan `SessionUser` lalu navigasi ke `/dashboard`.
6. Saat gagal, sign out Firebase, kosongkan session, dan tampilkan error.
7. Disable form selama proses.

Login Google dan Apple tidak disediakan. Tidak menambah provider Firebase atau tombol sosial.

## Show/Hide Password

State lokal `showPassword` menentukan `type="text"` atau `type="password"`. Tombol icon memakai `Eye` dan `EyeOff` dari `@lucide/vue`, memiliki `type="button"`, label aksesibel, dan tidak ikut submit form.

## Visual

- `bg-cream` sebagai latar.
- `font-display` untuk branding dan judul.
- `brown-950`, `brown-700`, `gold`, `gray-light` dari token existing.
- Card tanpa shadow dan sudut minimal agar selaras halaman landing.
- Input putih dengan border gray, focus gold.
- Tombol login brown gelap dengan teks cream.
- Responsive: card full-width dengan max-width dan padding mobile.

## Aksesibilitas

- Label terhubung ke input melalui `for`/`id`.
- Input memakai autocomplete yang sesuai.
- Toggle password memiliki `aria-label` dinamis.
- Error memakai `role="alert"` dan `aria-live="polite"`.
- Loading state memakai `disabled` dan `aria-busy`.

## Verifikasi

- `npm run build` harus selesai tanpa error.
- Diagnostics `app/pages/login.vue` dan `app/app.vue` harus kosong.
- Pastikan `/login` tidak merender `NavBar` atau `SiteFooter`.
- Pastikan tidak ada tombol Google/Apple pada template login.

## Batasan

Tidak membuat registrasi, reset password, OAuth, atau API baru.
