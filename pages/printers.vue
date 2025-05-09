<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <!-- Sidebar -->
      <div class="sidebar">
        <div class="logo-container">
          <img src="/logo.png" alt="PrintHive Logo" class="company-logo" />
        </div>
        <div class="nav-links">
          <router-link to="/dashboard" class="nav-item">
            <i class="nav-icon home-icon"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/printers" class="nav-item active">
            <i class="nav-icon printer-icon"></i>
            <span>Printers</span>
          </router-link>
          <router-link to="/filaments" class="nav-item">
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

      <!-- Main content -->
      <div class="main-content">
        <h1>Printers</h1>
        <div class="printer-grid">
          <div 
            v-for="printer in printers" 
            :key="printer.printer_id" 
            class="printer-card">
            <div class="printer-header">
              <span class="printer-name">{{ printer.printer_name }}</span>
              <span class="printer-status" :class="printer.print_stats.state">
                {{ printer.print_stats.state.toUpperCase() }}
              </span>
            </div>
            <div class="printer-body">
              <div class="temp">Hotend: {{ printer.extruder.temperature }}°C</div>
              <div class="temp">Bed: {{ printer.heater_bed.temperature }}°C</div>
            </div>
            <div class="printer-footer">
              <button @click="viewPrinterDetails(printer)">Detail</button>
              <button @click="managePrinter(printer)">Manage</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const printers = ref([]);

const fetchPrinters = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/printers/direct-connect`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    printers.value = data;
  } catch (err) {
    console.error('Failed to load printers:', err);
  }
};

const viewPrinterDetails = (printer) => {
  router.push(`/printer/${printer.printer_id}`);
};

const managePrinter = (printer) => {
  router.push(`/printer/${printer.printer_id}/manage`);
};

const handleLogout = () => {
  router.push('/login');
};

onMounted(() => {
  fetchPrinters();
});
</script>

<style scoped>
.dashboard-wrapper {
  display: flex;
  min-height: 100vh;
  background: #121212;
}

.dashboard-container {
  display: flex;
  width: 100%;
}

.sidebar {
  width: 220px;
  background: #1a1a1a;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 20px 0;
}

.logo-container {
  text-align: center;
  margin-bottom: 20px;
}

.company-logo {
  width: 100px;
}

.nav-links {
  display: flex;
  flex-direction: column;
}

.nav-item {
  display: flex;
  align-items: center;
  padding: 12px 24px;
  color: #aaa;
  text-decoration: none;
  transition: background 0.2s;
}

.nav-item.active,
.nav-item:hover {
  background: #2a2a2a;
  color: #1e88e5;
}

.nav-icon {
  width: 18px;
  height: 18px;
  margin-right: 12px;
  background-color: currentColor;
  mask-size: contain;
  mask-repeat: no-repeat;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
}

.home-icon { mask-image: url('/pic/icon/home-icon.png'); -webkit-mask-image: url('/pic/icon/home-icon.png'); }
.printer-icon { mask-image: url('/pic/icon/printer-icon.png'); -webkit-mask-image: url('/pic/icon/printer-icon.png'); }
.filament-icon { mask-image: url('/pic/icon/filament-icon.png'); -webkit-mask-image: url('/pic/icon/filament-icon.png'); }
.maintenance-icon { mask-image: url('/pic/icon/maintenance-icon.png'); -webkit-mask-image: url('/pic/icon/maintenance-icon.png'); }
.settings-icon { mask-image: url('/pic/icon/settings-icon.png'); -webkit-mask-image: url('/pic/icon/settings-icon.png'); }

.logout-container {
  padding: 20px;
}

.logout-button {
  width: 100%;
  padding: 10px;
  border: 1px solid #444;
  background: transparent;
  color: #aaa;
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}

.logout-button:hover {
  background: #2a2a2a;
  color: #fff;
}

.main-content {
  flex: 1;
  padding: 20px;
  background: #181818;
  color: #fff;
}

.printer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 20px;
  margin-top: 20px;
}

.printer-card {
  background: #222;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.printer-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 16px;
  font-weight: 500;
}

.printer-status.printing { color: #4caf50; }
.printer-status.idle { color: #2196f3; }
.printer-status.paused { color: #ff9800; }
.printer-status.offline { color: #f44336; }

.printer-body {
  font-size: 14px;
  color: #ccc;
  margin-bottom: 10px;
}

.printer-footer {
  display: flex;
  justify-content: space-between;
}

.printer-footer button {
  flex: 1;
  margin: 2px;
  padding: 6px;
  border: none;
  border-radius: 4px;
  background: #1e88e5;
  color: #fff;
  cursor: pointer;
  transition: background 0.2s;
}

.printer-footer button:hover {
  background: #1565c0;
}
</style>
