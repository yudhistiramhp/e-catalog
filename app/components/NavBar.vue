<script setup lang="ts">
const { isScrolled, isOpen } = useNav()

const navItems = [
  { label: 'Kain Prada', href: '/#kain-prada' },
  { label: 'Alat Upacara', href: '/#alat-upacara' },
  { label: 'Tentang Kami', href: '/#tentang' },
  { label: 'Kontak', href: '/#kontak' },
]

watch(isOpen, (open) => {
  document.body.style.overflow = open ? 'hidden' : ''
})
</script>

<template>
  <header
    class="sticky top-0 z-50 border-b border-gray-light bg-cream backdrop-blur"
    :class="{ 'shadow-sm': isScrolled }"
  >
    <div class="mx-auto flex h-[78px] max-w-screen-xl items-center justify-between px-6">
      <NuxtLink to="/" class="flex items-center gap-2 leading-none">
        <img src="/logo.png" alt="Agung Prada Bali" class="size-12 rounded-md" />
       <span class="flex flex-col">
          <span class="font-display text-[1.3rem] tracking-wider">Agung Prada</span>
          <span class="mt-1 text-[0.62rem] tracking-[0.32em] uppercase text-gold">Bali</span>
       </span>
      </NuxtLink>

      <!-- Desktop nav -->
      <ul class="hidden gap-9 lg:flex">
        <li v-for="item in navItems" :key="item.href">
          <a :href="item.href" class="relative pb-1 text-sm tracking-wider transition-colors hover:text-gold">
            {{ item.label }}
          </a>
        </li>
      </ul>

      <!-- Tombol buka menu, disembunyikan saat menu sudah terbuka -->
      <button
        v-if="!isOpen"
        class="hidden cursor-pointer border-none bg-transparent p-2 max-lg:block"
        aria-label="Buka menu"
        :aria-expanded="isOpen"
        @click="isOpen = true"
      >
        <span class="my-[5px] block h-[1.5px] w-[22px] bg-brown-950"></span>
        <span class="my-[5px] block h-[1.5px] w-[22px] bg-brown-950"></span>
        <span class="my-[5px] block h-[1.5px] w-[22px] bg-brown-950"></span>
      </button>
    </div>
  </header>

  <!-- Teleport ke body supaya "fixed" tidak terjebak containing block dari backdrop-blur header -->
  <Teleport to="body">
    <nav
      class="nav-overlay fixed inset-0 z-[55] flex flex-col items-center justify-center bg-cream lg:hidden"
      :class="{ 'is-open': isOpen }"
    >
      <!-- Tombol close, hanya ada di dalam overlay -->
      <button
        class="absolute right-6 top-[27px] cursor-pointer border-none bg-transparent p-2"
        aria-label="Tutup menu"
        @click="isOpen = false"
      >
        <span class="absolute left-1/2 top-1/2 block h-[1.5px] w-[22px] -translate-x-1/2 -translate-y-1/2 rotate-45 bg-brown-950"></span>
        <span class="absolute left-1/2 top-1/2 block h-[1.5px] w-[22px] -translate-x-1/2 -translate-y-1/2 -rotate-45 bg-brown-950"></span>
      </button>

      <ul class="flex flex-col items-center gap-7">
        <li v-for="(item, i) in navItems" :key="item.href" class="nav-item">
          <NuxtLink
            :to="item.href"
            class="group flex items-baseline gap-3 font-display text-3xl tracking-wide"
            @click="isOpen = false"
          >
            <span class="text-xs text-gold">0{{ i + 1 }}</span>
            <span class="transition-colors group-hover:text-gold">{{ item.label }}</span>
          </NuxtLink>
        </li>
      </ul>
    </nav>
  </Teleport>
</template>

<style scoped>
.nav-overlay {
  clip-path: circle(0% at 100% 0%);
  transition: clip-path 0.7s cubic-bezier(0.16, 1, 0.3, 1);
  pointer-events: none;
}

.nav-overlay.is-open {
  clip-path: circle(150% at 100% 0%);
  pointer-events: auto;
}

.nav-item {
  opacity: 0;
  transform: translateY(16px);
  transition: opacity 0.4s ease, transform 0.4s ease;
}

.nav-overlay.is-open .nav-item {
  opacity: 1;
  transform: translateY(0);
}

.nav-overlay.is-open .nav-item:nth-child(1) { transition-delay: 150ms; }
.nav-overlay.is-open .nav-item:nth-child(2) { transition-delay: 225ms; }
.nav-overlay.is-open .nav-item:nth-child(3) { transition-delay: 300ms; }
.nav-overlay.is-open .nav-item:nth-child(4) { transition-delay: 375ms; }
</style>