import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  srcDir: "app/",
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./main.css'],

  vite: {
    plugins: [
      tailwindcss(),
    ],
  },

  modules: ["shadcn-nuxt"],
  shadcn: {
    prefix: '',
    componentDir: '@/components/ui'
  }
});