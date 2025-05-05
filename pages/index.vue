<template>
  <div class="p-6 max-w-md mx-auto text-center">
    <h1 class="text-2xl font-bold mb-4">Generate Stock QR</h1>

    <form @submit.prevent="generateQR">
      <select v-model="type" class="border p-2 mb-4 w-full">
        <option value="1">Filament</option>
        <option value="2">Parts</option>
        <option value="F">Other</option>
      </select>
      <button class="bg-blue-500 text-white px-4 py-2 rounded">Generate</button>
    </form>

    <div v-if="result" class="mt-4">
      <h2 class="font-semibold">QR: {{ result.code }}</h2>
      <img :src="result.url" class="mx-auto w-40 h-40" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';

const type = ref('1');
const result = ref<{ code: string, url: string } | null>(null);

const generateQR = async () => {
  const { data } = await useFetch('/api/generate-qr', {
    method: 'POST',
    body: { type: type.value }
  });
  result.value = data.value;
};
</script>
