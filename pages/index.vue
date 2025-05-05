<template>
  <div class="login-wrapper">
    <div class="login-container">
      <div class="illustration-section">
        <div class="logo-container">
          <img src="/logo.png" alt="Company Logo" class="company-logo" />
        </div>
      </div>
      <div class="login-section">
        <h1>Welcome Back :)</h1>
        <p class="subtitle">To keep connected with us please login with your personal information by username and password</p>
        
        <form class="login-form" @submit.prevent="handleLogin">
          <div class="input-group">
            <label for="username">Username</label>
            <input 
              type="text" 
              id="username" 
              v-model="username" 
              :class="{ 'valid-input': isUsernameValid }"
            />
            <span v-if="isUsernameValid" class="input-icon success-icon">✓</span>
          </div>
          
          <div class="input-group">
            <label for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              v-model="password" 
            />
          </div>
          
          <div class="checkbox-group">
            <div class="remember-me">
              <input type="checkbox" id="remember" v-model="rememberMe" />
              <label for="remember">Remember Me</label>
            </div>
            <NuxtLink to="/forgot-password" class="forgot-password">Forgot Password?</NuxtLink>
          </div>
          
          <button 
            type="submit" 
            class="btn-login" 
            :disabled="isLoading"
          >
            {{ isLoading ? 'Logging in...' : 'Login Now' }}
          </button>
          
          <p v-if="errorMessage" class="error-message">{{ errorMessage }}</p>
        </form>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// Form state
const username = ref('')
const password = ref('')
const rememberMe = ref(false)
const isLoading = ref(false)
const errorMessage = ref('')

// Validation
const isUsernameValid = computed(() => {
  // Username validation - at least 3 characters
  return username.value && username.value.length >= 3
})

// Handle login
const handleLogin = async () => {
  if (!isUsernameValid.value || !password.value) {
    errorMessage.value = 'Please enter a valid username and password'
    return
  }

  errorMessage.value = ''
  isLoading.value = true

  try {
    // Replace with your actual API endpoint
    const response = await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        username: username.value,
        password: password.value,
        remember: rememberMe.value
      }
    })

    // Handle successful login
    if (response.token) {
      // Save token to store or localStorage if needed
      // For example:
      // localStorage.setItem('token', response.token)
      
      // Redirect to dashboard or home page
      router.push('/dashboard')
    } else {
      errorMessage.value = 'Login failed. Please try again.'
    }
  } catch (error) {
    errorMessage.value = error.message || 'Invalid credentials. Please try again.'
  } finally {
    isLoading.value = false
  }
}
</script>

<style scoped>
html, body {
  margin: 0;
  padding: 0;
  height: 100%;
  width: 100%;
  overflow: hidden;
}

.login-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #ff69b4 0%, #9370db 50%, #20b2aa 100%);
  background-attachment: fixed;
  background-size: cover;
  background-position: center center;
  padding: 20px;
}

.login-container {
  background-color: #1a1a1a;
  border-radius: 12px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.25);
  overflow: hidden;
  width: 100%;
  max-width: 900px;
  display: flex;
  flex-direction: row;
}

.illustration-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: #1a1a1a;
}

.login-section {
  flex: 1;
  padding: 40px;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a;
}

.logo-container {
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.company-logo {
  width: 80%;
  min-width: 120px;
  max-width: 300px;
  height: auto;
}

h1 {
  font-size: 28px;
  font-weight: 600;
  margin-bottom: 8px;
  color: #e0e0e0;
}

.subtitle {
  font-size: 14px;
  color: #a0a0a0;
  margin-bottom: 30px;
  line-height: 1.5;
}

.login-form {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.input-group {
  position: relative;
}

.input-group label {
  display: block;
  font-size: 14px;
  margin-bottom: 6px;
  color: #a0a0a0;
}

.input-group input {
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #444;
  border-radius: 6px;
  font-size: 14px;
  transition: border-color 0.3s;
  background-color: #2d2d2d;
  color: #e0e0e0;
}

.input-group input:focus {
  outline: none;
  border-color: #3291ff;
}

.valid-input {
  border-color: #4caf50 !important;
}

.input-icon {
  position: absolute;
  right: 12px;
  top: 38px;
  color: #777;
}

.success-icon {
  color: #4caf50;
}

.checkbox-group {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 14px;
  color: #a0a0a0;
}

.remember-me {
  display: flex;
  align-items: center;
  gap: 6px;
}

.forgot-password {
  color: #a0a0a0;
  text-decoration: none;
}

.forgot-password:hover {
  text-decoration: underline;
  color: #3291ff;
}

.btn-login {
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.3s;
}

.btn-login:hover:not(:disabled) {
  background-color: #1976d2;
}

.btn-login:disabled {
  background-color: #1e5aa0;
  cursor: not-allowed;
}

.error-message {
  color: #f44336;
  font-size: 14px;
  text-align: center;
  margin-top: 10px;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .illustration-section {
    padding: 30px;
  }
  
  .login-section {
    padding: 30px;
  }
  
  .logo-container {
    width: 100%;
  }
  
  .company-logo {
    width: 50%;
    min-width: 100px;
  }
}
</style>