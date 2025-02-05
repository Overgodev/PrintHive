<template>
  <div>
    <h1 class="text-2xl font-bold mb-6 text-white">Print Farm Dashboard</h1>
    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
      <PrinterCard 
        v-for="printer in printers" 
        :key="printer.id" 
        :printer="printer" 
      />
      <div class="bg-[#1A1F29] rounded-lg p-6 flex items-center justify-center min-h-[180px]">
        <button class="bg-[#00B894] hover:bg-[#00A583] text-white px-6 py-3 rounded-md flex items-center gap-2">
          <Plus class="w-5 h-5" />
          NEW PRINTER
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Plus } from 'lucide-vue-next'
import PrinterCard from '~/components/PrinterCard.vue'

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