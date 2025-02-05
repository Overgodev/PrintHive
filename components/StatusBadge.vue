<template>
    <span 
      class="text-sm px-2 py-0.5 rounded"
      :class="statusClasses"
    >
      {{ status }}
    </span>
  </template>
  
  <script setup>
  const props = defineProps({
    status: {
      type: String,
      required: true
    }
  })
  
  const statusClasses = computed(() => ({
    'bg-yellow-500/20 text-yellow-500': props.status === 'PRINTING',
    'bg-green-500/20 text-green-500': props.status === 'OPERATIONAL',
    'bg-gray-500/20 text-gray-500': props.status === 'MAINTENANCE',
    'bg-red-500/20 text-red-500': props.status === 'ERROR'
  }))
  </script>