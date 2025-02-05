<template>
    <header class="bg-[#1A1F29] border-b border-gray-800">
      <div class="px-6 py-3 flex items-center justify-between">
        <!-- Left side -->
        <div class="flex items-center space-x-8">
          <img src="/image/place_holder_logo.png" alt="Logo" class="h-8" />
          <nav class="flex items-center space-x-6">
            <NuxtLink to="/printers" class="text-gray-200 hover:text-white">Printers</NuxtLink>
            <div class="relative">
              <NuxtLink to="/filament" class="text-gray-200 hover:text-white">Filament</NuxtLink>
              <span class="absolute -top-2 -right-6 bg-orange-500 text-white text-xs px-1.5 rounded">NEW</span>
            </div>
            <NuxtLink to="/help" class="text-gray-200 hover:text-white">Help</NuxtLink>
            <NuxtLink to="/forum" class="text-gray-200 hover:text-white">Forum</NuxtLink>
          </nav>
        </div>
  
        <!-- Right side -->
        <div class="flex items-center space-x-4">
          <select class="bg-[#2A303C] text-gray-200 rounded px-3 py-1.5 text-sm">
            <option>English</option>
          </select>
          <button class="text-gray-200 hover:text-white relative">
            <Bell class="w-5 h-5" />
            <span class="absolute -top-1 -right-1 bg-orange-500 text-white text-xs w-4 h-4 flex items-center justify-center rounded-full">2</span>
          </button>
          <button class="text-gray-200 hover:text-white">
            <UserCircle class="w-8 h-8" />
          </button>
        </div>
      </div>
    </header>
  </template>
  
  <script setup>
  import { Bell, UserCircle } from 'lucide-vue-next'
  </script>