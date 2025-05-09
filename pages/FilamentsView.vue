<template>
    <div class="filaments-wrapper">
      <div class="filaments-container">
        <!-- Sidebar Navigation (reused from dashboard) -->
        <div class="sidebar">
          <div class="logo-container">
            <img src="/logo.png" alt="PrintHive Logo" class="company-logo" />
          </div>
          <div class="nav-links">
            <router-link to="/dashboard" class="nav-item">
              <i class="nav-icon home-icon"></i>
              <span>Dashboard</span>
            </router-link>
            <router-link to="/printers" class="nav-item">
              <i class="nav-icon printer-icon"></i>
              <span>Printers</span>
            </router-link>
            <router-link to="/filaments" class="nav-item active">
              <i class="nav-icon filament-icon"></i>
              <span>Filaments</span>
            </router-link>
            <router-link to="/maintenance" class="nav-item">
              <i class="nav-icon maintenance-icon"></i>
              <span>Maintenance</span>
            </router-link>
            <router-link to="/settings" class="nav-item">
              <i class="nav-icon settings-icon"></i>
              <span>Settings</span>
            </router-link>
          </div>
          <div class="logout-container">
            <button @click="handleLogout" class="logout-button">SIGN OUT</button>
          </div>
        </div>
        
        <div class="main-content">
          <!-- Main Header -->
          <div class="header">
            <h1>Filament Management</h1>
            <div class="actions-container">
              <button @click="addNewFilament" class="add-filament-btn">
                <span>+</span> Add Filament
              </button>
            </div>
          </div>
          
          <!-- Embedded full FilamentOverview component -->
          <FilamentOverview ref="filamentOverviewRef" />
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import FilamentOverview from '@/components/FilamentOverview.vue';
  
  const router = useRouter();
  const filamentOverviewRef = ref(null);
  
  // Add new filament by triggering the modal in the FilamentOverview component
  const addNewFilament = () => {
    if (filamentOverviewRef.value) {
      filamentOverviewRef.value.addNewFilament();
    }
  };
  
  // Handle logout
  const handleLogout = () => {
    router.push('/login');
  };
  </script>
  
  <style scoped>
  .filaments-wrapper {
    min-height: 100vh;
    width: 100%;
    display: flex;
    background-color: #f5f7fb;
  }
  
  .filaments-container {
    width: 100%;
    display: flex;
    background-color: #1a1a1a;
    color: #e0e0e0;
  }
  
  .sidebar {
    width: 240px;
    background-color: #1a1a1a;
    padding: 20px 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    height: 100vh;
    position: fixed;
    left: 0;
    top: 0;
    border-right: 1px solid #333;
  }
  
  .logo-container {
    padding: 0 20px;
    margin-bottom: 40px;
  }
  
  .company-logo {
    width: 100%;
    max-width: 180px;
    height: auto;
  }
  
  .nav-links {
    display: flex;
    flex-direction: column;
    flex-grow: 1;
  }
  
  .nav-item, .nav-item.active, .nav-item:hover {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    color: #a0a0a0;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-bottom: 5px;
    font-size: 16px;
    line-height: 1.5;
  }
  
  .nav-item.active,
  .nav-item:hover {
    background-color: #2d2d2d;
    color: #1e88e5;
  }
  
  .nav-icon {
    margin-right: 12px;
    width: 20px;
    height: 20px;
    background-color: currentColor;
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
  }
  
  .home-icon {
    mask-image: url("/pic/icon/home-icon.png");
    -webkit-mask-image: url("/pic/icon/home-icon.png");
  }
  
  .printer-icon {
    mask-image: url("/pic/icon/printer-icon.png");
    -webkit-mask-image: url("/pic/icon/printer-icon.png");
  }
  
  .filament-icon {
    mask-image: url("/pic/icon/filament-icon.png");
    -webkit-mask-image: url("/pic/icon/filament-icon.png");
  }
  
  .maintenance-icon {
    mask-image: url("/pic/icon/maintenance-icon.png");
    -webkit-mask-image: url("/pic/icon/maintenance-icon.png");
  }
  
  .settings-icon {
    mask-image: url("/pic/icon/settings-icon.png");
    -webkit-mask-image: url("/pic/icon/settings-icon.png");
  }
  
  .logout-container {
    padding: 20px;
    border-top: 1px solid #333;
  }
  
  .logout-button {
    width: 100%;
    padding: 10px;
    background-color: transparent;
    border: 1px solid #444;
    color: #a0a0a0;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
  }
  
  .logout-button:hover {
    background-color: #2d2d2d;
    color: #e0e0e0;
  }
  
  .main-content {
    margin-left: 240px;
    flex: 1;
    padding: 20px;
    background-color: #1a1a1a;
    min-height: 100vh;
  }
  
  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
  }
  
  .header h1 {
    font-size: 24px;
    font-weight: 600;
    color: #e0e0e0;
  }
  
  .actions-container {
    display: flex;
    gap: 15px;
    align-items: center;
  }
  
  .add-filament-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 15px;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: background-color 0.3s ease;
  }
  
  .add-filament-btn:hover {
    background-color: #43a047;
  }
  </style>