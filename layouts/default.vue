<template>
    <div class="min-h-screen bg-[#0F1218]">
      <AppHeader />
      <main class="p-6">
        <slot />
      </main>
    </div>
  </template>
  
  <script setup>
  import AppHeader from '~/components/AppHeader.vue'
  </script>