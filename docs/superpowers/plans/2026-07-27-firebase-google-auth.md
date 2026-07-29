# Firebase Google Authentication Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Google-only Firebase login backed by server-verified five-day session cookies, SSR-aware route protection, dashboard identity, and logout.

**Architecture:** Firebase browser Auth obtains a fresh ID token; Nitro exchanges it for an HTTP-only Firebase Admin session cookie. A cached Nuxt session composable plus global route middleware protects every page except `/`, `/login`, `/catalog`, and `/products/**`; every future private API must independently call server session verification.

**Tech Stack:** Nuxt 4.5, Vue 3.5, TypeScript, Firebase JS SDK 12.16, Firebase Admin SDK, Nitro/H3, Node built-in test runner.

## Global Constraints

- Deployment target: Firebase App Hosting with Nuxt server runtime; static `nuxt generate` hosting is unsupported.
- Preserve all existing uncommitted user changes; edit only named sections/files and never reset, checkout, or replace unrelated work.
- Do not commit unless user explicitly requests a commit.
- Google-only authentication; remove email/password UI.
- Accept every Google account.
- Public pages: `/`, `/login`, `/catalog`, and every `/products/**` path.
- Private pages: every other page, including `/dashboard`.
- Authenticated `/login` visits redirect to `/dashboard`.
- Session lifetime: exactly five days.
- Session cookie: `HttpOnly`, `SameSite=Lax`, path `/`, `Secure` in production.
- Session creation accepts only ID tokens whose `auth_time` is no older than five minutes.
- State-changing auth endpoints require same-origin requests.
- Firebase Admin uses Application Default Credentials plus `FIREBASE_PROJECT_ID`; never add service-account JSON/private keys.
- Page middleware is not API authorization; future private APIs must verify session independently.
- Use existing UI components and styling; add no state-management, auth, test, or UI dependency.

## File Map

- Modify `package.json`: add Firebase Admin and auth-policy test script without disturbing existing dependencies.
- Modify `package-lock.json`: generated lockfile update from npm.
- Modify `nuxt.config.ts`: expose existing Firebase web values through public runtime config.
- Modify `app/config/firebase.ts`: replace eager Analytics initialization with reusable browser Auth initialization.
- Create `app/plugins/firebase.client.ts`: client-only Firebase Auth injection.
- Create `app/types/auth.ts`: browser/session user contract.
- Create `app/utils/route-policy.ts`: pure public-route classifier.
- Create `server/utils/session-policy.ts`: pure session lifetime, recent-login, and same-origin rules.
- Create `server/utils/firebase-admin.ts`: singleton Firebase Admin Auth initialization.
- Create `server/utils/session.ts`: cookie read/write/delete and verified-user conversion.
- Create `server/api/auth/session.post.ts`: exchange ID token for session cookie.
- Create `server/api/auth/session.get.ts`: return current verified user.
- Create `server/api/auth/logout.post.ts`: clear session cookie.
- Create `app/composables/useSession.ts`: SSR/client session state and refresh.
- Create `app/middleware/auth.global.ts`: global page redirects.
- Modify `app/pages/login.vue`: Google-only login UI and flow.
- Modify `app/pages/dashboard/index.vue`: identity and logout UI.
- Create `tests/auth-policy.test.ts`: route, recency, and origin policy checks using Node stdlib.
- Modify `README.md`: Firebase Console, local ADC, and App Hosting requirements.

---

### Task 1: Install Firebase Admin and Add Pure Auth Policies

**Files:**
- Modify: `package.json:5-29`
- Modify: `package-lock.json`
- Create: `app/utils/route-policy.ts`
- Create: `server/utils/session-policy.ts`
- Create: `tests/auth-policy.test.ts`

**Interfaces:**
- Produces: `isPublicRoute(path: string): boolean`
- Produces: `SESSION_MAX_AGE_SECONDS`, `RECENT_LOGIN_MAX_AGE_SECONDS`
- Produces: `isRecentLogin(authTime: number, now?: number): boolean`
- Produces: `isSameOrigin(origin: string | undefined, requestOrigin: string): boolean`

- [ ] **Step 1: Install only required server dependency**

Run:

```bash
npm install firebase-admin
```

Expected: `firebase-admin` appears under `dependencies`; `package-lock.json` updates; existing dependency edits remain intact.

- [ ] **Step 2: Add test script without replacing existing scripts**

Add this property inside `scripts` in `package.json`:

```json
"test:auth": "node --test tests/auth-policy.test.ts"
```

Keep `build`, `dev`, `generate`, `preview`, and `postinstall` unchanged.

- [ ] **Step 3: Write failing policy test**

Create `tests/auth-policy.test.ts`:

```ts
import assert from 'node:assert/strict'
import test from 'node:test'
import { isPublicRoute } from '../app/utils/route-policy.ts'
import {
  isRecentLogin,
  isSameOrigin,
  RECENT_LOGIN_MAX_AGE_SECONDS,
  SESSION_MAX_AGE_SECONDS,
} from '../server/utils/session-policy.ts'

test('only approved routes are public', () => {
  for (const path of ['/', '/login', '/catalog', '/products/1', '/products/category/1']) {
    assert.equal(isPublicRoute(path), true, path)
  }

  for (const path of ['/dashboard', '/catalog/admin', '/product/1', '/unknown']) {
    assert.equal(isPublicRoute(path), false, path)
  }
})

test('session and recent-login windows match security policy', () => {
  assert.equal(SESSION_MAX_AGE_SECONDS, 5 * 24 * 60 * 60)
  assert.equal(RECENT_LOGIN_MAX_AGE_SECONDS, 5 * 60)
  assert.equal(isRecentLogin(700, 1_000), true)
  assert.equal(isRecentLogin(699, 1_000), false)
  assert.equal(isRecentLogin(1_001, 1_000), false)
})

test('state-changing requests require an exact origin match', () => {
  assert.equal(isSameOrigin('https://example.com', 'https://example.com'), true)
  assert.equal(isSameOrigin('https://evil.example', 'https://example.com'), false)
  assert.equal(isSameOrigin(undefined, 'https://example.com'), false)
})
```

- [ ] **Step 4: Run test and verify expected failure**

Run:

```bash
npm run test:auth
```

Expected: FAIL with module-not-found errors for `app/utils/route-policy.ts` or `server/utils/session-policy.ts`.

- [ ] **Step 5: Implement minimal route policy**

Create `app/utils/route-policy.ts`:

```ts
const PUBLIC_ROUTES = new Set(['/', '/login', '/catalog'])

export const isPublicRoute = (path: string) =>
  PUBLIC_ROUTES.has(path) || path.startsWith('/products/')
```

- [ ] **Step 6: Implement minimal session policy**

Create `server/utils/session-policy.ts`:

```ts
export const SESSION_MAX_AGE_SECONDS = 5 * 24 * 60 * 60
export const RECENT_LOGIN_MAX_AGE_SECONDS = 5 * 60

export const isRecentLogin = (
  authTime: number,
  now = Math.floor(Date.now() / 1_000),
) => authTime <= now && now - authTime <= RECENT_LOGIN_MAX_AGE_SECONDS

export const isSameOrigin = (
  origin: string | undefined,
  requestOrigin: string,
) => origin === requestOrigin
```

- [ ] **Step 7: Run policy tests**

Run:

```bash
npm run test:auth
```

Expected: 3 tests PASS, 0 FAIL.

- [ ] **Step 8: Check dependency tree**

Run:

```bash
npm ls firebase firebase-admin --depth=0
```

Expected: both packages listed once; exit code 0.

---

### Task 2: Make Firebase Initialization SSR-Safe

**Files:**
- Modify: `nuxt.config.ts:3-20`
- Modify: `app/config/firebase.ts:1-16`
- Create: `app/plugins/firebase.client.ts`

**Interfaces:**
- Consumes: existing Firebase web values from `app/config/firebase.ts`.
- Produces: `createFirebaseClient(options: FirebaseOptions): { auth: Auth; googleProvider: GoogleAuthProvider }`
- Produces Nuxt injections: `$firebaseAuth: Auth`, `$googleAuthProvider: GoogleAuthProvider`

- [ ] **Step 1: Add public runtime configuration**

Add `runtimeConfig` inside `defineNuxtConfig` in `nuxt.config.ts`, preserving existing CSS, Vite, module, and shadcn settings:

```ts
runtimeConfig: {
  public: {
    firebase: {
      apiKey: 'AIzaSyBhOC7sFlXftnLw8Debnky3GLptHNSOzSA',
      authDomain: 'e-catalog-project.firebaseapp.com',
      projectId: 'e-catalog-project',
      storageBucket: 'e-catalog-project.firebasestorage.app',
      messagingSenderId: '268801840504',
      appId: '1:268801840504:web:9a2fbe02fc81985c66648d',
    },
  },
},
```

Do not include `measurementId`; Analytics is outside auth scope.

- [ ] **Step 2: Replace eager Firebase initialization**

Replace `app/config/firebase.ts` with:

```ts
import { getApp, getApps, initializeApp, type FirebaseOptions } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { GoogleAuthProvider } from 'firebase/auth'

export const createFirebaseClient = (options: FirebaseOptions) => {
  const app = getApps().length ? getApp() : initializeApp(options)

  return {
    auth: getAuth(app),
    googleProvider: new GoogleAuthProvider(),
  }
}
```

This removes `getAnalytics`, which currently evaluates browser-only behavior during import.

- [ ] **Step 3: Add client-only Nuxt plugin**

Create `app/plugins/firebase.client.ts`:

```ts
import { createFirebaseClient } from '@/config/firebase'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const { auth, googleProvider } = createFirebaseClient(config.public.firebase)

  return {
    provide: {
      firebaseAuth: auth,
      googleAuthProvider: googleProvider,
    },
  }
})
```

Nuxt generates injection types from this plugin; no manual declaration file needed.

- [ ] **Step 4: Generate Nuxt types**

Run:

```bash
npm run postinstall
```

Expected: Nuxt preparation completes successfully and `.nuxt` types include plugin injections.

- [ ] **Step 5: Verify SSR build**

Run:

```bash
npm run build
```

Expected: build succeeds; no `window is not defined`, Analytics, or duplicate Firebase app error.

---

### Task 3: Add Firebase Admin Session API

**Files:**
- Create: `server/utils/firebase-admin.ts`
- Create: `server/utils/session.ts`
- Create: `server/api/auth/session.post.ts`
- Create: `server/api/auth/session.get.ts`
- Create: `server/api/auth/logout.post.ts`

**Interfaces:**
- Consumes: `SESSION_MAX_AGE_SECONDS`, `isRecentLogin`, `isSameOrigin` from `server/utils/session-policy.ts`.
- Produces: `firebaseAdminAuth` Firebase Admin Auth singleton.
- Produces: `getSessionUser(event): Promise<{ uid: string; name: string | null; email: string | null; picture: string | null }>`.
- Produces endpoints: `POST /api/auth/session`, `GET /api/auth/session`, `POST /api/auth/logout`.

- [ ] **Step 1: Add Admin Auth singleton**

Create `server/utils/firebase-admin.ts`:

```ts
import { applicationDefault, getApps, initializeApp } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'

const app = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID,
})

export const firebaseAdminAuth = getAuth(app)
```

- [ ] **Step 2: Add session-cookie helper**

Create `server/utils/session.ts`:

```ts
import type { H3Event } from 'h3'
import type { DecodedIdToken } from 'firebase-admin/auth'
import { firebaseAdminAuth } from './firebase-admin'
import { SESSION_MAX_AGE_SECONDS } from './session-policy'

export const SESSION_COOKIE_NAME = '__session'

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path: '/',
  maxAge: SESSION_MAX_AGE_SECONDS,
}

export const toSessionUser = (token: DecodedIdToken) => ({
  uid: token.uid,
  name: token.name ?? null,
  email: token.email ?? null,
  picture: token.picture ?? null,
})

export const setSessionCookie = (event: H3Event, value: string) =>
  setCookie(event, SESSION_COOKIE_NAME, value, cookieOptions)

export const clearSessionCookie = (event: H3Event) =>
  deleteCookie(event, SESSION_COOKIE_NAME, { path: '/' })

export const getSessionUser = async (event: H3Event) => {
  const cookie = getCookie(event, SESSION_COOKIE_NAME)

  if (!cookie) {
    throw createError({ statusCode: 401, statusMessage: 'Authentication required' })
  }

  try {
    return toSessionUser(await firebaseAdminAuth.verifySessionCookie(cookie))
  }
  catch {
    clearSessionCookie(event)
    throw createError({ statusCode: 401, statusMessage: 'Invalid session' })
  }
}
```

- [ ] **Step 3: Add strict request-origin assertion inline with session creation**

Create `server/api/auth/session.post.ts`:

```ts
import { firebaseAdminAuth } from '../../utils/firebase-admin'
import { setSessionCookie, toSessionUser } from '../../utils/session'
import {
  isRecentLogin,
  isSameOrigin,
  SESSION_MAX_AGE_SECONDS,
} from '../../utils/session-policy'

export default defineEventHandler(async (event) => {
  const origin = getHeader(event, 'origin')
  const requestOrigin = getRequestURL(event).origin

  if (!isSameOrigin(origin, requestOrigin)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin' })
  }

  const body = await readBody<unknown>(event)
  const idToken = typeof body === 'object' && body !== null && 'idToken' in body
    ? (body as { idToken?: unknown }).idToken
    : undefined

  if (typeof idToken !== 'string' || idToken.length === 0) {
    throw createError({ statusCode: 400, statusMessage: 'ID token is required' })
  }

  let decoded
  try {
    decoded = await firebaseAdminAuth.verifyIdToken(idToken)
  }
  catch {
    throw createError({ statusCode: 401, statusMessage: 'Invalid ID token' })
  }

  if (!isRecentLogin(decoded.auth_time)) {
    throw createError({ statusCode: 401, statusMessage: 'Recent login required' })
  }

  const sessionCookie = await firebaseAdminAuth.createSessionCookie(idToken, {
    expiresIn: SESSION_MAX_AGE_SECONDS * 1_000,
  })

  setSessionCookie(event, sessionCookie)
  return toSessionUser(decoded)
})
```

- [ ] **Step 4: Add current-session endpoint**

Create `server/api/auth/session.get.ts`:

```ts
import { getSessionUser } from '../../utils/session'

export default defineEventHandler((event) => getSessionUser(event))
```

- [ ] **Step 5: Add same-origin logout endpoint**

Create `server/api/auth/logout.post.ts`:

```ts
import { clearSessionCookie } from '../../utils/session'
import { isSameOrigin } from '../../utils/session-policy'

export default defineEventHandler((event) => {
  const origin = getHeader(event, 'origin')
  const requestOrigin = getRequestURL(event).origin

  if (!isSameOrigin(origin, requestOrigin)) {
    throw createError({ statusCode: 403, statusMessage: 'Invalid request origin' })
  }

  clearSessionCookie(event)
  return { ok: true }
})
```

- [ ] **Step 6: Run policy and compile checks**

Run:

```bash
npm run test:auth
npm run build
```

Expected: 3 tests PASS; Nuxt build succeeds with all server imports resolved.

- [ ] **Step 7: Verify unauthenticated endpoint behavior locally**

Start app in one terminal:

```bash
npm run dev
```

From another terminal run:

```bash
curl -i http://localhost:3000/api/auth/session
```

Expected: HTTP 401 with `Authentication required`. Stop dev server after check.

---

### Task 4: Add Shared Session State and Route Middleware

**Files:**
- Create: `app/types/auth.ts`
- Create: `app/composables/useSession.ts`
- Create: `app/middleware/auth.global.ts`

**Interfaces:**
- Consumes: `isPublicRoute(path: string)` and `GET /api/auth/session`.
- Produces: `SessionUser`.
- Produces: `useSession(): { user, refresh, setUser }`.
- Produces global redirect policy for SSR and client navigation.

- [ ] **Step 1: Add client session type**

Create `app/types/auth.ts`:

```ts
export interface SessionUser {
  uid: string
  name: string | null
  email: string | null
  picture: string | null
}
```

- [ ] **Step 2: Add SSR-aware session composable**

Create `app/composables/useSession.ts`:

```ts
import type { SessionUser } from '@/types/auth'

export const useSession = () => {
  const user = useState<SessionUser | null | undefined>('session-user', () => undefined)
  const requestHeaders = import.meta.server ? useRequestHeaders(['cookie']) : undefined

  const refresh = async () => {
    try {
      user.value = await $fetch<SessionUser>('/api/auth/session', {
        headers: requestHeaders,
      })
    }
    catch {
      user.value = null
    }

    return user.value
  }

  const setUser = (value: SessionUser | null) => {
    user.value = value
  }

  return { user, refresh, setUser }
}
```

The `undefined` state means “not checked”; `null` means “checked and anonymous.”

- [ ] **Step 3: Add global route middleware**

Create `app/middleware/auth.global.ts`:

```ts
import { isPublicRoute } from '@/utils/route-policy'

export default defineNuxtRouteMiddleware(async (to) => {
  const isLogin = to.path === '/login'
  const isPrivate = !isPublicRoute(to.path)

  if (!isLogin && !isPrivate) return

  const { user, refresh } = useSession()

  if (user.value === undefined) {
    await refresh()
  }

  if (isLogin && user.value) {
    return navigateTo('/dashboard')
  }

  if (isPrivate && !user.value) {
    return navigateTo('/login')
  }
})
```

Do not add per-page middleware to public pages; global policy already covers them.

- [ ] **Step 4: Run route tests and build**

Run:

```bash
npm run test:auth
npm run build
```

Expected: policy tests PASS; middleware compiles; build succeeds.

- [ ] **Step 5: Manually verify anonymous routing**

Run app:

```bash
npm run dev
```

Open these URLs:

```text
http://localhost:3000/
http://localhost:3000/catalog
http://localhost:3000/products/1
http://localhost:3000/dashboard
```

Expected: first three render normally; `/dashboard` redirects to `/login`. Stop dev server after check.

---

### Task 5: Replace Login Form with Google Login

**Files:**
- Modify: `app/pages/login.vue:1-100`

**Interfaces:**
- Consumes Nuxt injections `$firebaseAuth`, `$googleAuthProvider`.
- Consumes `POST /api/auth/session` and `useSession().setUser`.
- Produces Google-only login flow ending at `/dashboard`.

- [ ] **Step 1: Replace login script with Google flow**

Replace the complete `<script setup lang="ts">` block in `app/pages/login.vue` with:

```vue
<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { signInWithPopup, signOut } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Field, FieldDescription } from '@/components/ui/field'
import type { SessionUser } from '@/types/auth'

const { $firebaseAuth, $googleAuthProvider } = useNuxtApp()
const { setUser } = useSession()
const isLoading = ref(false)
const errorMessage = ref('')

const loginWithGoogle = async () => {
  if (isLoading.value) return

  isLoading.value = true
  errorMessage.value = ''

  try {
    const credential = await signInWithPopup($firebaseAuth, $googleAuthProvider)
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
    errorMessage.value = error instanceof FirebaseError
      && error.code === 'auth/popup-closed-by-user'
      ? 'Login dibatalkan.'
      : 'Login gagal. Silakan coba lagi.'
  }
  finally {
    isLoading.value = false
  }
}
</script>
```

- [ ] **Step 2: Replace login template with Google-only accessible UI**

Replace the complete `<template>` block in `app/pages/login.vue` with:

```vue
<template>
  <main class="flex min-h-[70vh] items-center justify-center px-6 py-16">
    <Card class="w-full max-w-md">
      <CardHeader class="text-center">
        <CardTitle class="text-xl">
          Welcome back
        </CardTitle>
        <CardDescription>
          Login dengan akun Google untuk membuka dashboard.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Field>
          <Button
            variant="outline"
            type="button"
            class="w-full"
            :disabled="isLoading"
            :aria-busy="isLoading"
            @click="loginWithGoogle"
          >
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
              <path
                d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                fill="currentColor"
              />
            </svg>
            {{ isLoading ? 'Memproses...' : 'Login dengan Google' }}
          </Button>
          <p
            v-if="errorMessage"
            class="text-center text-sm text-red-700"
            role="alert"
            aria-live="polite"
          >
            {{ errorMessage }}
          </p>
        </Field>
      </CardContent>
    </Card>
    <FieldDescription class="sr-only">
      Firebase Authentication membuka popup Google yang aman.
    </FieldDescription>
  </main>
</template>
```

No email, password, Apple, sign-up, forgot-password, separator, terms, or fake links remain.

- [ ] **Step 3: Build login page**

Run:

```bash
npm run build
```

Expected: build succeeds; no missing plugin injection, component, or Firebase type error.

- [ ] **Step 4: Manually check login failure accessibility**

Run app, visit `/login`, click Google login, then close popup.

Expected: button disables during popup, re-enables afterward, and `Login dibatalkan.` appears in alert region.

---

### Task 6: Add Dashboard Identity and Logout

**Files:**
- Modify: `app/pages/dashboard/index.vue` (currently empty)

**Interfaces:**
- Consumes `useSession().user`, `useSession().setUser`, `$firebaseAuth`, and `POST /api/auth/logout`.
- Produces dashboard identity card and logout action returning to `/login`.

- [ ] **Step 1: Add dashboard logout behavior**

Write `app/pages/dashboard/index.vue`:

```vue
<script setup lang="ts">
import { signOut } from 'firebase/auth'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'

const { $firebaseAuth } = useNuxtApp()
const { user, setUser } = useSession()
const isLoading = ref(false)
const errorMessage = ref('')

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
  <main class="mx-auto min-h-[70vh] max-w-screen-xl px-6 py-16">
    <Card class="max-w-xl">
      <CardHeader>
        <div class="flex items-center gap-4">
          <img
            v-if="user?.picture"
            :src="user.picture"
            :alt="`Foto profil ${user.name || user.email || 'pengguna'}`"
            class="size-14 rounded-full"
            referrerpolicy="no-referrer"
          >
          <div>
            <CardTitle>Dashboard</CardTitle>
            <CardDescription>Login sebagai {{ user?.name || user?.email }}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent class="space-y-4">
        <p v-if="user?.email" class="text-sm text-brown-700">
          {{ user.email }}
        </p>
        <Button
          type="button"
          :disabled="isLoading"
          :aria-busy="isLoading"
          @click="logout"
        >
          {{ isLoading ? 'Keluar...' : 'Logout' }}
        </Button>
        <p
          v-if="errorMessage"
          class="text-sm text-red-700"
          role="alert"
          aria-live="polite"
        >
          {{ errorMessage }}
        </p>
      </CardContent>
    </Card>
  </main>
</template>
```

- [ ] **Step 2: Build dashboard**

Run:

```bash
npm run build
```

Expected: build succeeds with no nullable-user or plugin-injection errors.

- [ ] **Step 3: Verify end-to-end auth flow with valid credentials**

Before running locally, configure ADC and project ID in user environment:

```bash
gcloud auth application-default login
```

Create local `.env` without committing it:

```dotenv
FIREBASE_PROJECT_ID=e-catalog-project
```

In Firebase Console, enable **Authentication > Sign-in method > Google** and authorize `localhost`.

Run:

```bash
npm run dev
```

Expected manual flow:

1. Anonymous `/dashboard` redirects to `/login`.
2. Google popup succeeds.
3. `POST /api/auth/session` returns 200 and sets `__session` as HttpOnly.
4. Browser reaches `/dashboard` and shows Google identity.
5. Refreshing `/dashboard` remains authenticated through SSR.
6. Visiting `/login` redirects to `/dashboard`.
7. Logout clears `__session`, returns to `/login`, and `/dashboard` becomes inaccessible.
8. `/`, `/catalog`, and `/products/1` stay public before and after logout.

---

### Task 7: Document Setup and Run Final Verification

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes completed auth implementation.
- Produces reproducible Firebase Console, local development, test, build, and App Hosting instructions.

- [ ] **Step 1: Append authentication setup documentation**

Append to `README.md`:

```md
## Firebase Authentication

Authentication uses Google Sign-In in browser, then exchanges Firebase ID tokens for five-day HTTP-only server session cookies.

### Firebase Console

1. Open **Authentication > Sign-in method** and enable **Google**.
2. Add local and deployed hosts under **Authentication > Settings > Authorized domains**.

### Local development

Firebase Admin uses Application Default Credentials. Install Google Cloud CLI, then run:

```sh
gcloud auth application-default login
```

Create an untracked `.env`:

```dotenv
FIREBASE_PROJECT_ID=e-catalog-project
```

Start Nuxt:

```sh
npm run dev
```

### Verification

```sh
npm run test:auth
npm run build
```

### Deployment

Deploy with Firebase App Hosting or another Nuxt server runtime. Set `FIREBASE_PROJECT_ID=e-catalog-project` in runtime environment. Do not commit service-account JSON or private keys. Static Firebase Hosting with `nuxt generate` cannot provide server-verified sessions.
```

- [ ] **Step 2: Run final automated checks**

Run:

```bash
npm run test:auth
npm run build
```

Expected: 3 tests PASS; production build succeeds.

- [ ] **Step 3: Inspect only auth-related diff**

Run:

```bash
git diff -- package.json package-lock.json nuxt.config.ts app/config/firebase.ts app/plugins/firebase.client.ts app/types/auth.ts app/utils/route-policy.ts app/composables/useSession.ts app/middleware/auth.global.ts app/pages/login.vue app/pages/dashboard/index.vue server/utils/session-policy.ts server/utils/firebase-admin.ts server/utils/session.ts server/api/auth/session.post.ts server/api/auth/session.get.ts server/api/auth/logout.post.ts tests/auth-policy.test.ts README.md
```

Expected: only planned auth changes; no service-account material, `.env`, unrelated formatting, or user-change deletion.

- [ ] **Step 4: Check complete working tree without altering it**

Run:

```bash
git status --short
```

Expected: planned auth files plus pre-existing user modifications. Do not stage, reset, or commit without explicit user request.
