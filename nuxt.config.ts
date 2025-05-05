import { defineNuxtConfig } from 'nuxt/config'

export default defineNuxtConfig({
  ssr: true,

  
  modules: [
    '@nuxtjs/tailwindcss'
  ],

  build: {
    transpile: ['lucide-vue-next']
  },

  vite: {
    optimizeDeps: {
      include: ['lucide-vue-next']
    },
    resolve: {
      dedupe: ['vue']
    }
  },

  compatibilityDate: '2025-02-05'
})
