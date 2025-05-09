<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
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
          <router-link to="/print-queue" class="nav-item">
            <i class="nav-icon queue-icon"></i>
            <span>Print Queue</span>
          </router-link>
          <router-link to="/parts" class="nav-item">
            <i class="nav-icon parts-icon"></i>
            <span>Parts</span>
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
      
      <div class="main-content">
        <!-- Main Header -->
        <div class="header">
          <h1>Printers</h1>
          <div class="actions-container">
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Search" 
                v-model="searchQuery"
                @input="filterPrinters"
              />
            </div>
          </div>
        </div>

        <div class="printer-grid">
          <div 
            v-for="printer in filteredPrinters" 
            :key="printer.printer_id" 
            class="printer-card dashboard-style">
            <div class="printer-header">
              <span class="printer-name">{{ printer.printer_name }}</span>
              <span class="printer-status" :class="getPrinterStatusClass(printer)">
                {{ formatPrinterStatus(printer) }}
              </span>
            </div>
            <div class="printer-body">
              <div class="temp-row">
                <div class="temp-item">
                  <i class="temp-icon hotend" :style="{ backgroundColor: getTemperatureIconColor(printer.extruder.temperature) }"></i>
                  <span class="temp-value">{{ formatTemperature(printer.extruder.temperature) }}</span>
                </div>
                <div class="temp-item">
                  <i class="temp-icon bed" :style="{ backgroundColor: getTemperatureIconColor(printer.heater_bed.temperature) }"></i>
                  <span class="temp-value">{{ formatTemperature(printer.heater_bed.temperature) }}</span>
                </div>
              </div>
              <!-- Job with progress bar - IMPROVED -->
              <div class="job-container">
                <div class="job-info">{{ formatJobFilename(printer) }}</div>
                <div v-if="showProgressBar(printer)" class="job-progress-bar">
                  <div class="progress-value" :style="{ width: getProgressPercentage(printer.print_stats.progress, printer.print_stats.state) + '%' }"></div>
                  <span class="progress-text">{{ getProgressText(printer.print_stats.progress, printer.print_stats.state) }}</span>
                </div>
              </div>
              <div class="status-tags">
                <span class="tag" :class="getFilamentClass(printer)">
                  {{ getFilamentText(printer) }}
                </span>
                <span class="tag" :class="getConnectionClass(printer)">
                  {{ getConnectionText(printer) }}
                </span>
                <span v-if="isCancelled(printer)" class="tag cancelled">
                  Cancelled
                </span>
              </div>
            </div>
            <div class="printer-footer">
              <button @click="viewPrinterDetails(printer)" class="detail-btn">Detail</button>
              <button 
                @click="managePrinter(printer)" 
                class="manage-btn" 
                :class="{ 'disabled-btn': isPrinterOffline(printer) }"
                :disabled="isPrinterOffline(printer)"
                :title="getManageButtonTitle(printer)">
                Manage <i class="external-link-icon"></i>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const printers = ref([]);
const searchQuery = ref('');
const filteredPrinters = ref([]);

// Fetch printers from API or use mock data for testing
const fetchPrinters = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/printers/direct-connect`);
    if (!response.ok) throw new Error('Network response was not ok');
    const data = await response.json();
    printers.value = data.map(printer => normalizeData(printer));
    filterPrinters();
  } catch (err) {
    console.error('Failed to load printers:', err);  
    filterPrinters();
  }
};

const normalizeData = (printer) => {
  return {
    ...printer,
    ip_address: printer.ip_address || `192.168.1.${100 + parseInt(printer.printer_id)}`,
    print_stats: {
      state: printer.print_stats?.state || 'offline',
      filename: printer.print_stats?.filename || '',
      progress: printer.print_stats?.progress ?? undefined,
      cancelled: printer.print_stats?.cancelled || false
    },
    extruder: {
      temperature: printer.extruder?.temperature || 0
    },
    heater_bed: {
      temperature: printer.heater_bed?.temperature || 0
    },
    filaments: printer.filaments || []
  };
};

const isPrinterOffline = (printer) => {
  return printer.print_stats.state === 'offline';
};

const isCancelled = (printer) => {
  return printer.print_stats.cancelled === true;
};

const formatTemperature = (temp) => {
  if (temp === null || temp === undefined || isNaN(temp)) return '--°C';
  return `${temp.toFixed(1)}°C`;
};

const formatPrinterStatus = (printer) => {
  if (isCancelled(printer)) {
    return isPrinterOffline(printer) ? 'CANCELLED (OFFLINE)' : 'CANCELLED';
  }
  const state = printer.print_stats?.state || 'offline';
  return state.toUpperCase();
};

const getPrinterStatusClass = (printer) => {
  if (isCancelled(printer)) return 'cancelled';
  return printer.print_stats?.state?.toLowerCase() || 'offline';
};

const formatJobFilename = (printer) => {
  if (isPrinterOffline(printer)) {
    return printer.print_stats.filename || 'No active print job';
  }
  if (isCancelled(printer)) {
    return `${printer.print_stats.filename} (Cancelled)`;
  }
  return printer.print_stats.filename || 'No active print job';
};

const showProgressBar = (printer) => {
  return printer.print_stats.state === 'printing' && !isCancelled(printer);
};

const getFilamentText = (printer) => {
  if (printer.filaments && printer.filaments.length > 0) {
    return printer.filaments[0].type;
  }
  return 'No filament';
};

const getFilamentClass = (printer) => {
  return (printer.filaments && printer.filaments.length > 0) ? 'has-filament' : 'no-filament';
};

const getConnectionText = (printer) => {
  return isPrinterOffline(printer) ? 'Disconnected' : 'Connected';
};

const getConnectionClass = (printer) => {
  return isPrinterOffline(printer) ? 'disconnected' : 'connected';
};

const getManageButtonTitle = (printer) => {
  if (isPrinterOffline(printer)) {
    return 'Printer is offline';
  }
  return `Open printer interface at http://${printer.ip_address}`;
};

const getProgressPercentage = (progress, printerState) => {
  if (progress === undefined || progress === null || isNaN(progress)) {
    return printerState === 'printing' ? 10 : 0;
  }
  return Math.round(progress * 100);
};

const getProgressText = (progress, printerState) => {
  if (progress === undefined || progress === null || isNaN(progress)) {
    return printerState === 'printing' ? '10%' : '0%';
  }
  return Math.round(progress * 100) + '%';
};

const filterPrinters = () => {
  if (!searchQuery.value) {
    filteredPrinters.value = [...printers.value];
    return;
  }
  const query = searchQuery.value.toLowerCase();
  filteredPrinters.value = printers.value.filter(printer => 
    printer.printer_name.toLowerCase().includes(query)
  );
};

const viewPrinterDetails = (printer) => {
  router.push(`/printer/${printer.printer_id}`);
};

const managePrinter = (printer) => {
  if (isPrinterOffline(printer)) return;
  if (printer.ip_address) {
    window.open(`http://${printer.ip_address}`, '_blank');
  } else {
    router.push(`/printer/${printer.printer_id}/manage`);
  }
};

const getTemperatureIconColor = (temp) => {
  if (temp === null || temp === undefined || isNaN(temp)) return '#999';
  if (temp <= 30) {
    return '#2196f3';
  } else if (temp <= 80) {
    const position = (temp - 30) / 50;
    const r = Math.round(33 + position * (255 - 33));
    const g = Math.round(150 + position * (152 - 150));
    const b = Math.round(243 + position * (0 - 243));
    return `rgb(${r}, ${g}, ${b})`;
  } else if (temp <= 100) {
    const position = (temp - 80) / 20;
    const r = Math.round(255 + position * (244 - 255));
    const g = Math.round(152 + position * (67 - 152));
    const b = Math.round(0 + position * (54 - 0));
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    return '#e74c3c';
  }
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
  min-height: 100vh;
  width: 100%;
  display: flex;
  background-color: #f5f7fb;
}

.dashboard-container {
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

.queue-icon {
  mask-image: url("/pic/icon/queue-icon.png");
  -webkit-mask-image: url("/pic/icon/queue-icon.png");
}

.parts-icon {
  mask-image: url("/pic/icon/parts-icon.png");
  -webkit-mask-image: url("/pic/icon/parts-icon.png");
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
  margin: 0;
}

.actions-container {
  display: flex;
  gap: 15px;
  align-items: center;
}

.search-container {
  width: 300px;
}

.search-container input {
  width: 100%;
  padding: 10px 15px;
  border: 1px solid #444;
  border-radius: 6px;
  background-color: #2d2d2d;
  color: #e0e0e0;
}

.search-container input:focus {
  outline: none;
  border-color: #1e88e5;
}

.printer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
  gap: 20px;
}

.printer-card.dashboard-style {
  background: #222;
  padding: 16px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  gap: 12px;
}

.printer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 16px;
  font-weight: 500;
}

.printer-status {
  font-weight: bold;
}

.printer-status.printing {
  color: #4caf50;
}

.printer-status.idle {
  color: #2196f3;
}

.printer-status.paused {
  color: #ff9800;
}

.printer-status.offline {
  color: #f44336;
}

.printer-status.cancelled {
  color: #ff5252;
}

.printer-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  color: #ccc;
  padding: 6px 0;
}

.temp-row {
  display: flex;
  justify-content: flex-start;
  gap: 15px;
  margin-bottom: 10px;
}

.temp-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.temp-icon {
  width: 16px;
  height: 16px;
  min-width: 16px;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  border-radius: 3px;
}

.temp-value {
  font-size: 14px;
  color: #2196f3;
  font-weight: 600;
  white-space: nowrap;
}

.temp-icon.hotend {
  mask-image: url("/pic/icon/hotend-icon.png");
  -webkit-mask-image: url("/pic/icon/hotend-icon.png");
}

.temp-icon.bed {
  mask-image: url("/pic/icon/bed-icon.png");
  -webkit-mask-image: url("/pic/icon/bed-icon.png");
}

.job-container {
  background-color: #2d2d2d;
  border-radius: 6px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.job-info {
  padding: 10px 12px;
  font-size: 14px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  font-weight: 500;
}

.job-progress-bar {
  position: relative;
  height: 24px;
  background-color: #1a1a1a;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.5s ease;
}

.progress-text {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 12px;
  text-shadow: 0 0 3px rgba(0, 0, 0, 0.7);
}

.status-tags {
  display: flex;
  gap: 10px;
  margin-top: 4px;
  flex-wrap: wrap;
}

.tag {
  background-color: #2a2a2a;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
}

.tag.connected {
  background-color: #2e7d32;
  color: #fff;
}

.tag.disconnected {
  background-color: #c62828;
  color: #fff;
}

.tag.has-filament {
  background-color: #1565c0;
  color: #fff;
}

.tag.no-filament {
  background-color: #616161;
  color: #fff;
}

.tag.cancelled {
  background-color: #ff5252;
  color: #fff;
}

.printer-footer {
  display: flex;
  gap: 10px;
  margin-top: 4px;
}

.printer-footer button {
  flex: 1;
  padding: 8px;
  border: none;
  border-radius: 4px;
  color: white;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 6px;
}

.detail-btn {
  background-color: #555;
}

.detail-btn:hover {
  background-color: #666;
}

.manage-btn {
  background-color: #1e88e5;
}

.manage-btn:hover {
  background-color: #1565c0;
}

.manage-btn.disabled-btn {
  background-color: #607d8b;
  opacity: 0.6;
  cursor: not-allowed;
}

.external-link-icon {
  display: inline-block;
  width: 14px;
  height: 14px;
  position: relative;
}

.external-link-icon::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 8px;
  height: 8px;
  border: 1px solid currentColor;
  border-bottom: none;
  border-left: none;
}

.external-link-icon::after {
  content: '';
  position: absolute;
  bottom: 0;
  right: 0;
  width: 10px;
  height: 1px;
  background-color: currentColor;
  transform: rotate(-45deg);
  transform-origin: bottom right;
}
</style>