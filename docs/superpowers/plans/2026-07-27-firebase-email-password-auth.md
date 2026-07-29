# Firebase Email/Password Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace Google popup login with Firebase email/password login while retaining server-verified five-day session cookies.

**Architecture:** Firebase client Auth verifies email/password and returns an ID token. Existing Nitro session endpoint exchanges that token for the same HTTP-only cookie; existing middleware, dashboard, server verification, route policy, and logout remain unchanged.

**Tech Stack:** Nuxt 4.5, Vue 3.5, TypeScript 5.9, Firebase JS SDK 12.16, Firebase Admin 14.2, Nitro/H3.

## Global Constraints

- Login only; accounts are created manually in Firebase Console.
- No registration or password-reset flow.
- Never send raw passwords to Nuxt server endpoints.
- Credential errors use exact copy `Email atau password salah.`.
- Session creation errors use exact copy `Login gagal. Silakan coba lagi.`.
- Existing five-day session, route policy, dashboard, server endpoints, Firebase Admin, and logout behavior remain unchanged.
- Preserve all unrelated uncommitted changes.
- Add no dependencies.
- Do not commit unless user explicitly requests it.

---

### Task 1: Remove Google Provider Coupling

**Files:**
- Modify: `app/config/firebase.ts`
- Modify: `app/plugins/firebase.client.ts`

**Interfaces:**
- Produces: `createFirebaseClient(options: FirebaseOptions): { auth: Auth }`
- Produces Nuxt injection: `$firebaseAuth: Auth`

- [ ] **Step 1: Simplify Firebase client factory**

Replace `app/config/firebase.ts` with:

```ts
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'

export const createFirebaseClient = (options: FirebaseOptions) => {
  const app = getApps().length ? getApp() : initializeApp(options)

  return { auth: getAuth(app) }
}
```

- [ ] **Step 2: Remove Google provider injection**

Replace `app/plugins/firebase.client.ts` with:

```ts
import { createFirebaseClient } from '@/config/firebase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { auth } = createFirebaseClient(config.public.firebase)

  return {
    provide: {
      firebaseAuth: auth,
    },
  }
})
```

- [ ] **Step 3: Regenerate Nuxt types**

Run:

```bash
npm run postinstall
```

Expected: Nuxt types generate successfully; `$firebaseAuth` remains typed; `$googleAuthProvider` disappears.

---

### Task 2: Replace Google Login UI and Flow

**Files:**
- Modify: `app/pages/login.vue`

**Interfaces:**
- Consumes: `$firebaseAuth`, `useAuthSession().setUser`, `POST /api/auth/session`.
- Produces: email/password form ending at `/dashboard`.

- [ ] **Step 1: Replace login script**

Use this `<script setup lang="ts">`:

```vue
<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { useAuthSession } from '@/composables/useSession'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SessionUser } from '@/types/auth'

const { $firebaseAuth } = useNuxtApp()
const { setUser } = useAuthSession()
const email = ref('')
const password = ref('')
const isLoading = ref(false)
const errorMessage = ref('')

const login = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''
  let authenticated = false

  try {
    const credential = await signInWithEmailAndPassword(
      $firebaseAuth,
      email.value.trim(),
      password.value,
    )
    authenticated = true
    const idToken = await credential.user.getIdToken(true)
    const sessionUser = await $fetch<SessionUser>('/api/auth/session', {
      method: 'POST',
      body: { idToken },
    })

    setUser(sessionUser)
    await navigateTo('/dashboard')
  }
  catch (error) {
    await signOut($firebaseAuth).catch(() => undefined)
    setUser(null)
    errorMessage.value = !authenticated && error instanceof FirebaseError
      ? 'Email atau password salah.'
      : 'Login gagal. Silakan coba lagi.'
  }
  finally {
    isLoading.value = false
  }
}
</script>
```

`authenticated` separates Firebase credential rejection from ID-token/session failures without exposing specific Firebase error codes.

- [ ] **Step 2: Replace login template**

Use this `<template>`:

```vue
<template>
  <main class="flex min-h-[70vh] items-center justify-center px-6 py-16">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          Welcome back
        </CardTitle>
        <CardDescription>
          Login dengan email dan password untuk membuka dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form class="space-y-4" @submit.prevent="login">
          <Field>
            <FieldLabel for="email">Email</FieldLabel>
            <Input
              id="email"
              v-model="email"
              type="email"
              autocomplete="email"
              required
              :disabled="isLoading"
            />
          </Field>
          <Field>
            <FieldLabel for="password">Password</FieldLabel>
            <Input
              id="password"
              v-model="password"
              type="password"
              autocomplete="current-password"
              required
              :disabled="isLoading"
            />
          </Field>
          <Button
            type="submit"
            class="w-full"
            :disabled="isLoading"
            :aria-busy="isLoading"
          >
            {{ isLoading ? 'Memproses...' : 'Login' }}
          </Button>
          <p
            v-if="errorMessage"
            class="text-center text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {{ errorMessage }}
          </p>
        </form>
      </CardContent>
    </Card>
  </main>
</template>
```

- [ ] **Step 3: Check active auth source for Google remnants**

Run:

```bash
rg "GoogleAuthProvider|signInWithPopup|googleAuthProvider|Login dengan Google|akun Google" app/config app/plugins app/pages/login.vue
```

Expected: no matches.

- [ ] **Step 4: Run compile checks**

Run:

```bash
npm run test:auth
npm run build
```

Expected: 3 policy tests pass; production build succeeds.

---

### Task 3: Update Setup Documentation and Smoke Test

**Files:**
- Modify: `README.md`

**Interfaces:**
- Produces Firebase Email/Password setup instructions.

- [ ] **Step 1: Replace Firebase Console provider instructions**

In `README.md`, replace:

```md
1. Open **Authentication > Sign-in method** and enable **Google**.
2. Add local and deployed hosts under **Authentication > Settings > Authorized domains**.
```

with:

```md
1. Open **Authentication > Sign-in method** and enable **Email/Password**.
2. Create dashboard accounts under **Authentication > Users**.
```

Change the authentication overview sentence to:

```md
Authentication uses Firebase Email/Password in browser, then exchanges Firebase ID tokens for five-day HTTP-only server session cookies.
```

- [ ] **Step 2: Run final checks**

Run:

```bash
npm run test:auth
npm run build
```

Expected: 3 tests pass; build exits 0.

- [ ] **Step 3: Run anonymous route smoke test**

Start production output:

```bash
PORT=3100 FIREBASE_PROJECT_ID=e-catalog-project node .output/server/index.mjs
```

Check in another shell:

```bash
curl -I http://localhost:3100/
curl -I http://localhost:3100/catalog
curl -I http://localhost:3100/products/1
curl -I http://localhost:3100/dashboard
curl -i http://localhost:3100/api/auth/session
```

Expected: public routes return 200; dashboard redirects 302 to `/login`; session endpoint returns 401.

- [ ] **Step 4: Manual credential acceptance check**

Enable Email/Password and create a user in Firebase Console. Run `gcloud auth application-default login`, set `FIREBASE_PROJECT_ID=e-catalog-project`, then verify:

1. Invalid credentials show `Email atau password salah.`.
2. Valid credentials navigate to `/dashboard`.
3. Refresh preserves session.
4. Logout returns to `/login`.
5. Authenticated `/login` redirects to `/dashboard`.

- [ ] **Step 5: Inspect working tree without altering it**

Run:

```bash
git status --short
git diff -- app/config/firebase.ts app/plugins/firebase.client.ts app/pages/login.vue README.md
```

Expected: email/password conversion only in named files; no unrelated deletion, secret, commit, or staging.
