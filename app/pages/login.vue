<script setup lang="ts">
import { FirebaseError } from 'firebase/app'
import { signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { Eye, EyeOff } from '@lucide/vue'
import { useAuthSession } from '@/composables/useSession'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Field,
  FieldLabel,
} from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import type { SessionUser } from '@/types/auth'

const { $firebaseAuth } = useNuxtApp()
const { setUser } = useAuthSession()
const email = ref('')
const password = ref('')
const showPassword = ref(false)
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

<template>
  <main class="flex min-h-screen items-center justify-center bg-cream px-6 py-16">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <NuxtLink to="/" class="inline-block">
          <img src="/logo.png" alt="Agung Prada Bali" class="mx-auto mb-4 size-24 object-contain" />
          <span class="font-display text-2xl tracking-wider text-brown-950">Agung Prada Bali</span>
        </NuxtLink>
        <p class="mt-6 text-sm text-brown-700">
          Masuk ke dashboard untuk mengelola katalog dan pesanan.
        </p>
      </div>

      <Card class="border-gray-light bg-cream shadow-none">
        <CardHeader class="text-center">
          <CardTitle class="font-display text-xl text-brown-950">
            Selamat Datang
          </CardTitle>
          <CardDescription class="text-brown-700">
            Login dengan email dan password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form class="space-y-4" @submit.prevent="login">
            <Field>
              <FieldLabel for="email" class="text-brown-700">
                Email
              </FieldLabel>
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

            <Field>
              <FieldLabel for="password" class="text-brown-700">
                Password
              </FieldLabel>
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
                  :tabindex="-1"
                  @click="showPassword = !showPassword"
                >
                  <EyeOff v-if="showPassword" class="size-4" />
                  <Eye v-else class="size-4" />
                </button>
              </div>
            </Field>

            <Button
              type="submit"
              class="w-full rounded-none bg-brown-950 text-cream hover:bg-brown-700"
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

      <p class="mt-6 text-center text-xs text-gray">
        Belum punya akun? Hubungi admin.
      </p>
    </div>
  </main>
</template>
