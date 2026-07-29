# Login Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Menyelaraskan route `/login` dengan visual Griya Prada Bali, mempertahankan Firebase email/password, menambah show/hide password, dan menghapus shell navbar/footer dari halaman login.

**Architecture:** Perubahan minimal pada halaman route aktif `app/pages/login.vue` serta shell `app/app.vue`. Form tetap berada di halaman route, bukan komponen baru; alur auth existing dipertahankan. `app.vue` menentukan apakah route `/login` atau `/dashboard` membutuhkan shell tanpa navbar/footer.

**Tech Stack:** Nuxt 4, Vue 3 `<script setup lang="ts">`, Tailwind CSS 4, Firebase Auth, shadcn-nuxt UI primitives, `@lucide/vue`.

## Global Constraints

- Route aktif adalah `app/pages/login.vue`; `pages/login/index.vue` berada di luar `srcDir: "app/"`.
- Login Google dan Apple tidak disediakan. Tidak menambah provider Firebase atau tombol sosial.
- Pertahankan `signInWithEmailAndPassword`, `POST /api/auth/session`, `SessionUser`, dan redirect `/dashboard`.
- Password toggle memakai state lokal, `Eye`/`EyeOff`, tombol `type="button"`, dan `aria-label` dinamis.
- `/login` tidak merender `NavBar` atau `SiteFooter`.
- Gunakan token `cream`, `brown-950`, `brown-700`, `gold`, `gray-light`, `font-display`, dan `font-body`.
- Tidak menambah dependency, API, OAuth, registrasi, atau reset password.
- Jangan commit perubahan.

## File Structure

- Modify: `app/pages/login.vue` — form login, auth behavior, visual, password visibility.
- Modify: `app/app.vue` — hide global `NavBar`/`SiteFooter` on `/login` while preserving existing dashboard behavior.

---

### Task 1: Update Login Route

**Files:**
- Modify: `app/pages/login.vue:1-116`

**Interfaces:**
- Consumes: `$firebaseAuth`, `useAuthSession`, `signInWithEmailAndPassword`, `signOut`, `SessionUser`, UI primitives `Card`, `Field`, `Input`, `Button`, icons `Eye` and `EyeOff`.
- Produces: `/login` email/password form with loading/error states and password visibility toggle.

- [ ] **Step 1: Confirm current auth baseline**

Run:

```bash
npm run test:auth
```

Expected: 3 tests pass, 0 failures. This task has no existing component test harness; auth policy test protects the server/session contract.

- [ ] **Step 2: Add password visibility state and icon imports**

Keep existing imports and add:

```ts
import { Eye, EyeOff } from '@lucide/vue'
```

Keep the existing refs and add:

```ts
const showPassword = ref(false)
```

Do not alter `login()` auth sequence:

```ts
const credential = await signInWithEmailAndPassword(
  $firebaseAuth,
  email.value.trim(),
  password.value,
)
const idToken = await credential.user.getIdToken(true)
const sessionUser = await $fetch<SessionUser>('/api/auth/session', {
  method: 'POST',
  body: { idToken },
})
setUser(sessionUser)
await navigateTo('/dashboard')
```

- [ ] **Step 3: Replace template with branded login layout**

Use this outer structure:

```vue
<template>
  <main class="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="inline-flex flex-col items-center leading-none">
          <span class="font-display text-2xl tracking-wider text-brown-950">Griya Prada</span>
          <span class="mt-1 text-[0.62rem] uppercase tracking-[0.32em] text-gold">Bali</span>
        </NuxtLink>
        <p class="mt-6 max-w-sm text-sm text-brown-700">
          Masuk ke dashboard untuk mengelola katalog dan pesanan.
        </p>
      </div>
      <!-- card form -->
    </div>
  </main>
</template>
```

Use `Card` with `border-gray-light bg-cream shadow-none`; title `Selamat Datang`; description `Login dengan email dan password.`. Do not include Apple, Google, social separator, signup, terms, or forgot-password links.

- [ ] **Step 4: Keep email field wired to auth**

Render email using existing `v-model` and accessibility attributes:

```vue
<Field>
  <FieldLabel for="email" class="text-brown-700">Email</FieldLabel>
  <Input
    id="email"
    v-model="email"
    type="email"
    placeholder="m@example.com"
    autocomplete="email"
    required
    :disabled="isLoading"
    class="rounded-none border-gray-light bg-white text-brown-950 placeholder:text-gray focus:border-gold focus:ring-gold"
  />
</Field>
```

- [ ] **Step 5: Add password field with show/hide control**

Use a relative wrapper, preserve `v-model="password"`, and change input type from `showPassword`:

```vue
<Field>
  <FieldLabel for="password" class="text-brown-700">Password</FieldLabel>
  <div class="relative">
    <Input
      id="password"
      v-model="password"
      :type="showPassword ? 'text' : 'password'"
      autocomplete="current-password"
      required
      :disabled="isLoading"
      class="rounded-none border-gray-light bg-white pr-10 text-brown-950 placeholder:text-gray focus:border-gold focus:ring-gold"
    />
    <button
      type="button"
      class="absolute right-2 top-1/2 -translate-y-1/2 text-gray transition-colors hover:text-brown-700"
      :aria-label="showPassword ? 'Sembunyikan password' : 'Tampilkan password'"
      @click="showPassword = !showPassword"
    >
      <EyeOff v-if="showPassword" class="size-4" aria-hidden="true" />
      <Eye v-else class="size-4" aria-hidden="true" />
    </button>
  </div>
</Field>
```

- [ ] **Step 6: Preserve submit, loading, and error semantics**

Use a full-width brown button:

```vue
<Button
  type="submit"
  class="w-full rounded-none bg-brown-950 text-cream hover:bg-brown-700"
  :disabled="isLoading"
  :aria-busy="isLoading"
>
  {{ isLoading ? 'Memproses...' : 'Login' }}
</Button>
```

Keep error block exact behavior:

```vue
<p
  v-if="errorMessage"
  class="text-center text-sm text-red-700"
  role="alert"
  aria-live="polite"
>
  {{ errorMessage }}
</p>
```

Add footer copy only if useful: `Belum punya akun? Hubungi admin.`. Do not add a signup link.

- [ ] **Step 7: Run route build check**

Run:

```bash
npm run build
```

Expected: Nuxt client/server build succeeds without Vue template or TypeScript errors.

---

### Task 2: Hide Public Shell on Login

**Files:**
- Modify: `app/app.vue:1-12`

**Interfaces:**
- Consumes: `useRoute()`, current dashboard shell condition.
- Produces: `NavBar` and `SiteFooter` hidden for `/login` and existing `/dashboard` routes.

- [ ] **Step 1: Add login shell condition**

Keep the existing route state, then add:

```ts
const isLogin = computed(() => route.path === '/login')
const hideShell = computed(() => isDashboard.value || isLogin.value)
```

Update template conditions:

```vue
<NavBar v-if="!hideShell" />
<NuxtPage />
<SiteFooter v-if="!hideShell" />
```

Do not change the root wrapper classes or public-page behavior.

- [ ] **Step 2: Verify shell and route imports**

Run:

```bash
npm run build
```

Expected: PASS. `/login` remains public via `app/utils/route-policy.ts`; `/dashboard` remains protected by `app/middleware/auth.global.ts`.

- [ ] **Step 3: Run final checks**

Run:

```bash
npm run test:auth
git diff --check -- app/pages/login.vue app/app.vue
git status --short -- app/pages/login.vue app/app.vue
```

Expected: auth tests 3/3 pass, diff check clean, no commit created. Confirm template contains no `Google` or `Apple` buttons:

```bash
rg -n "Google|Apple|signInWithPopup|signInWithRedirect" app/pages/login.vue
```

Expected: no matches.
