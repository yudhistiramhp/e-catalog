<template>
  <footer class="bg-brown-950 px-6 pb-8 pt-16 text-white" id="kontak">
    <div class="mx-auto max-w-screen-xl">
      <div class="grid gap-12 border-b border-brown-border pb-11 max-md:grid-cols-1 max-lg:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr]">
        <div>
          <NuxtLink to="/" class="flex items-center gap-2 leading-none">
            <img src="/logo.png" alt="Agung Prada Bali" class="size-12 rounded-md" />
            <span class="font-display text-[1.3rem] tracking-wider text-white">Agung Prada Bali</span>
          </NuxtLink>
          <p class="mt-3.5 max-w-[34ch] text-sm leading-relaxed text-text-muted">
            Kain prada dan perlengkapan upacara khas Bali, dibuat oleh perajin lokal berdasarkan pesanan.
          </p>
        </div>
        <div class="footer-col">
          <h4 class="mb-4 font-body text-xs font-medium italic uppercase tracking-[0.1em] text-gold-soft">Kontak</h4>
          <a href="https://wa.me/08123968327" class="block text-sm text-text-dim transition-colors hover:text-gold-soft">
            WhatsApp: +62 812-3968-327
          </a>
          <a href="mailto:agungpradabali@gmail.com" class="block text-sm text-text-dim transition-colors hover:text-gold-soft">
            agungpradabali@gmail.com
          </a>
          <a href="https://instagram.com//agungprada2026" class="block text-sm text-text-dim transition-colors hover:text-gold-soft">
            @agungpradabali
          </a>
        </div>
        <div class="footer-col">
          <h4 class="mb-4 font-body text-xs font-medium italic uppercase tracking-[0.1em] text-gold-soft">Lokasi</h4>
          <p class="block text-sm text-text-dim">Jalan Gunung Andakasa Gang Kamboja I/20X</p>
          <p class="block text-sm text-text-dim">Lingkungan Penamparan, Padang Sambian Denpasar</p>
        </div>
      </div>
      <div class="flex flex-wrap justify-between gap-3 pt-6 text-xs text-footer-dim max-sm:flex-col max-sm:text-center">
        <span>&copy; 2026 Agung Prada Bali. Seluruh hak cipta dilindungi.</span>
        <span>Dikembangkan oleh <a href="https://www.instagram.com/yudhistiramhp" target="_blank" rel="noopener noreferrer">Yudhistira</a></span>
      </div>
    </div>
  </footer>
</template>