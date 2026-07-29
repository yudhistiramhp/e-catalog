import tailwindcss from "@tailwindcss/vite";

export default defineNuxtConfig({
  srcDir: "app/",
  compatibilityDate: "2025-07-15",
  devtools: { enabled: true },
  css: ['./main.css'],

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