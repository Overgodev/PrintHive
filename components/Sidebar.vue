<template>
    <aside class="fixed left-0 top-0 h-full w-16 bg-gray-900">
      <div class="p-3">
        <img src="/logo.svg" alt="Logo" class="w-10 h-10" />
      </div>
      <nav class="flex-1 flex flex-col gap-2 p-2">
        <NuxtLink 
          v-for="item in navItems"
          :key="item.path"
          :to="item.path"
          class="p-2 rounded hover:bg-gray-700"
        >
          <component :is="item.icon" class="w-6 h-6" />
        </NuxtLink>
      </nav>
    </aside>
  </template>
  
  <script setup>
  import { 
    Home,
    Printer,
    Camera,
    LineChart,
    Settings
  } from 'lucide-vue-next'
  
  const navItems = [
    { path: '/', icon: Home },
    { path: '/printers', icon: Printer },
    { path: '/camera', icon: Camera },
    { path: '/stats', icon: LineChart },
    { path: '/settings', icon: Settings }
  ]
  </script>