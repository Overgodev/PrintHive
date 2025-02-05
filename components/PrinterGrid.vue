<template>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div v-for="printer in printers" :key="printer.id">
        <PrinterCard :printer="printer" />
      </div>
      <div class="bg-gray-800 rounded-lg p-6 min-h-[200px] flex items-center justify-center">
        <button class="bg-teal-500 hover:bg-teal-600 text-white px-6 py-3 rounded-md flex items-center gap-2 font-medium">
          <Plus class="w-5 h-5" />
          NEW PRINTER
        </button>
      </div>
    </div>
  </template>
  
  <script setup lang="ts">
  import { ref } from 'vue'
  import { Plus } from 'lucide-vue-next'
  import PrinterCard from './PrinterCard.vue'
  
  interface Printer {
    id: number
    name: string
    status: 'PRINTING' | 'OPERATIONAL' | 'MAINTENANCE'
    progress?: number
    currentFile?: string
  }
  
  const printers = ref<Printer[]>([
    {
      id: 1,
      name: 'OctoPrint 1.10.3',
      status: 'PRINTING',
      progress: 39.2,
      currentFile: 'Groen_TurbineMerged_0.2mm_PLA_MK3S_8h14m (1).gcode'
    }
  ])
  </script>