<script setup lang="ts">
const route = useRoute()
const isDashboard = computed(() => route.path.startsWith('/dashboard'))
const isLogin = computed(() => route.path === '/login')
const hideShell = computed(() => isDashboard.value || isLogin.value)
</script>

<template>
  <div class="min-h-screen bg-cream font-body text-brown-950">
    <NavBar v-if="!hideShell" />
    <NuxtPage />
    <SiteFooter v-if="!hideShell" />
  </div>
</template>
