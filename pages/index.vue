<template>
  <div class="p-8 max-w-sm mx-auto">
    <h1 class="text-xl font-bold mb-4">Login</h1>
    <form @submit.prevent="login">
      <input v-model="username" placeholder="Username" class="border p-2 w-full mb-2" />
      <input v-model="password" type="password" placeholder="Password" class="border p-2 w-full mb-4" />
      <button class="bg-blue-500 text-white px-4 py-2 rounded">Login</button>
    </form>
    <p v-if="error" class="text-red-500 mt-2">{{ error }}</p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useFetch } from '#app'; 

const username = ref('');
const password = ref('');
const error = ref('');
const router = useRouter();

const login = async () => {
  const { data, error: err } = await useFetch('/api/login', {
    method: 'POST',
    body: { username: username.value, password: password.value }
  });

  if (err.value) {
    error.value = 'Login failed';
    return;
  }

  const role = data.value.role;
  if (role === 'Admin') router.push('/admin');
  else if (role === 'Technician') router.push('/technician');
  else router.push('/operator');
};
</script>

