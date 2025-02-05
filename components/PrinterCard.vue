<template>
    <div class="bg-[#1A1F29] rounded-lg p-6">
      <div class="flex items-center justify-between">
        <div class="flex items-start gap-3">
          <div class="w-8 h-8 flex items-center justify-center">
            <Printer class="w-6 h-6 text-gray-400" />
          </div>
          <div>
            <h3 class="font-medium text-lg text-white">{{ printer.name }}</h3>
            <p class="text-sm text-gray-400 truncate max-w-[300px]">
              {{ printer.currentFile }}
            </p>
          </div>
        </div>
        <button class="text-gray-400 hover:text-white">
          <MoreVertical class="w-6 h-6" />
        </button>
      </div>
  
      <div class="mt-8">
        <div class="bg-[#2A303C] h-1.5 rounded-full overflow-hidden">
          <div 
            class="bg-[#00B894] h-full transition-all duration-300" 
            :style="{ width: `${printer.progress}%` }"
          ></div>
        </div>
        <div class="flex items-center justify-between mt-2">
          <span class="text-sm text-gray-400">{{ printer.progress }}%</span>
          <span class="px-2 py-1 rounded text-xs bg-[#A9937B] text-white">
            PRINTING
          </span>
        </div>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { Printer, MoreVertical } from 'lucide-vue-next'
  
  defineProps<{
    printer: {
      id: number
      name: string
      status: 'PRINTING' | 'OPERATIONAL' | 'MAINTENANCE'
      progress?: number
      currentFile?: string
    }
  }>()
  </script>