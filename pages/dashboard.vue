<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <div class="sidebar">
        <div class="logo-container">
          <img src="/logo.png" alt="Company Logo" class="company-logo" />
        </div>
        <div class="nav-links">
          <router-link to="/dashboard" class="nav-item active">
            <i class="nav-icon home-icon"></i>
            <span>Dashboard</span>
          </router-link>
          <router-link to="/printers" class="nav-item">
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
      
      <div class="main-content">
        <div class="header">
          <h1>PrintHive</h1>
          <div class="actions-container">
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Search" 
                v-model="searchQuery"
                @input="filterPrinters"
              />
            </div>
            <button @click="refreshAllPrinters" class="refresh-btn" :disabled="initialLoading || refreshInProgress">
              <span class="refresh-icon" :class="{ 'rotating': initialLoading || refreshInProgress }"></span>
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div class="dashboard-grid">
          <!-- Summary Cards -->
          <div class="card summary-card">
            <div class="card-content">
              <div class="chart-container">
                <div class="pie-chart" :style="{ '--value': activePrinterPercentage }">
                  <div class="pie-value">{{ activePrinterPercentage }}%</div>
                </div>
              </div>
              <div class="card-text">
                <h3>Active Printers</h3>
                <p>{{ activePrinters }} of {{ printers.length }}</p>
              </div>
            </div>
          </div>
          
          <div class="card summary-card">
            <div class="card-content">
              <div class="chart-container">
                <div class="line-chart"></div>
              </div>
              <div class="card-text">
                <h3>Print Jobs</h3>
                <p>Last 7 days</p>
              </div>
            </div>
          </div>
          
          <div class="card summary-card">
            <div class="card-content">
              <div class="chart-container">
                <div class="bar-chart"></div>
              </div>
              <div class="card-text">
                <h3>Filament Usage</h3>
                <p>Monthly tracking</p>
              </div>
            </div>
          </div>
          
          <!-- Printer Status Grid - with improved loading state handling -->
          <div class="card table-card">
            <h3>Printer Status</h3>
            
            <!-- Only show loading during initial load, never for background refreshes -->
            <div v-if="initialLoading" class="loading-container">
              <div class="loading-spinner"></div>
              <p>Loading printer data...</p>
            </div>
            
            <!-- Show error only if we have no data -->
            <div v-else-if="error && !hasInitialData" class="error-container">
              <p>{{ error }}</p>
              <button @click="refreshAllPrinters" class="retry-btn">Retry</button>
            </div>
            
            <!-- Always show printer grid once we have initial data, regardless of background refreshes -->
            <div v-else-if="hasInitialData" class="printer-grid">
              <div v-for="printer in filteredPrinters" :key="printer.printer_id" class="printer-card">
                <!-- Connection status indicator -->
                <div class="connection-indicator" :class="getConnectionClass(printer)">
                  <span class="indicator-dot"></span>
                  <span class="indicator-text">{{ getConnectionText(printer) }}</span>
                </div>
                
                <div class="printer-header">
                  <div class="printer-title">
                    <div class="printer-icon">
                      <i :class="['status-indicator', printer.print_stats.state]"></i>
                    </div>
                    <h4>{{ printer.printer_name }}</h4>
                  </div>
                  <div class="printer-status-badge" :class="printer.print_stats.state">
                    {{ printer.print_stats.state }}
                  </div>
                </div>
                
                <div class="printer-body">
                  <!-- Individual printer loading state -->
                  <div v-if="printer._loading" class="printer-loading">
                    <div class="mini-loading-spinner"></div>
                    <p>Updating...</p>
                  </div>
                  
                  <!-- Data age warning -->
                  <div v-if="printer._stale && !printer._loading" class="stale-data-warning">
                    <span class="warning-icon">⚠️</span>
                    <span>Data may be outdated</span>
                    <button @click="refreshSinglePrinter(printer)" class="mini-refresh-btn">
                      <span class="mini-refresh-icon"></span>
                    </button>
                  </div>
                  
                  <!-- Current print information -->
                  <div v-if="printer.print_stats.filename" class="current-task">
                    <div class="task-info">
                      <p class="task-name">Printing: {{ printer.print_stats.filename }}</p>
                      <div class="temperature-info">
                        <span class="temp-item">
                          <i class="temp-icon hotend"></i> {{ printer.extruder.temperature.toFixed(1) }}°C
                        </span>
                        <span class="temp-item">
                          <i class="temp-icon bed"></i> {{ printer.heater_bed.temperature.toFixed(1) }}°C
                        </span>
                      </div>
                    </div>
                    
                    <div class="print-progress" v-if="printer.print_stats.progress !== undefined">
                      <div class="progress-bar">
                        <div 
                          class="progress-value" 
                          :style="{ width: (printer.print_stats.progress * 100) + '%' }"
                        ></div>
                      </div>
                      <div class="progress-details">
                        <span class="progress-percentage">{{ Math.round(printer.print_stats.progress * 100) }}%</span>
                        <span v-if="printer.print_stats.time_remaining" class="time-remaining">
                          {{ formatTimeRemaining(printer.print_stats.time_remaining) }} remaining
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div v-if="printer.filaments && printer.filaments.length > 0" class="filament-levels-grid">
                    <div v-for="(filament, fIndex) in printer.filaments" :key="fIndex" class="filament-grid-item">
                      <div class="filament-label-container">
                        <span class="filament-label">{{ filament.color }}</span>
                        <span class="filament-percentage">{{ filament.level }}%</span>
                      </div>
                      <div class="progress-bar">
                        <div 
                          class="progress-value" 
                          :style="{ width: filament.level + '%', backgroundColor: getColorCode(filament.color) }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- If no filaments data is available -->
                  <div v-else class="no-filament-data">
                    <p>No filament data available</p>
                  </div>
                </div>
                
                <div class="printer-footer">
                  <button 
                    @click="refreshSinglePrinter(printer)" 
                    class="action-btn refresh-single-btn"
                    :disabled="printer._loading"
                  >
                    <span class="refresh-icon-small" :class="{ 'rotating': printer._loading }"></span>
                    <span>Refresh</span>
                  </button>
                  <button @click="viewPrinterDetails(printer)" class="action-btn details-btn">Details</button>
                  <button @click="managePrinter(printer)" class="action-btn manage-btn">Manage</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Filament Inventory -->
          <div class="card inventory-card">
            <h3>Filament Inventory</h3>
            <div class="inventory-list">
              <div v-for="filament in filamentInventory" :key="filament.filament_id" class="inventory-item">
                <div class="filament-color" :style="{ backgroundColor: getColorCode(filament.color) }"></div>
                <div class="filament-info">
                  <span class="filament-name">{{ filament.name }}</span>
                  <span class="filament-type">{{ filament.type }}</span>
                </div>
                <div class="stock-level">
                  <div class="progress-bar">
                    <div 
                      class="progress-value" 
                      :style="{ width: filament.stock_percentage + '%', backgroundColor: getColorCode(filament.color) }"
                    ></div>
                  </div>
                  <span class="stock-percentage">{{ filament.stock_percentage }}%</span>
                </div>
                <button @click="reorderFilament(filament)" class="reorder-btn" :disabled="filament.stock_percentage > 30">
                  {{ filament.stock_percentage <= 30 ? 'Reorder' : 'In Stock' }}
                </button>
              </div>
            </div>
          </div>
          
          <!-- Maintenance Schedule -->
          <div class="card schedule-card">
            <h3>Maintenance Schedule</h3>
            <div class="schedule-list">
              <div v-for="task in maintenanceTasks" :key="task.task_id" class="schedule-item">
                <div class="task-info">
                  <span class="task-name">{{ task.description }}</span>
                  <span class="task-printer">{{ task.printer_name }}</span>
                </div>
                <div class="task-date">{{ formatDate(task.due_date) }}</div>
                <div class="task-status" :class="task.status">{{ task.status }}</div>
                <button @click="completeTask(task)" class="complete-btn" :disabled="task.status === 'completed'">
                  {{ task.status === 'completed' ? 'Completed' : 'Complete' }}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const searchQuery = ref('')
const initialLoading = ref(true) // For initial loads only
const backgroundRefreshing = ref(false) // For background refreshes
const error = ref(null)
const hasInitialData = ref(false)
const lastRefreshTime = ref(Date.now())
const refreshInProgress = ref(false)

// Data states
const printers = ref([])
const filteredPrinters = ref([])
const filamentInventory = ref([])
const maintenanceTasks = ref([])

/**
 * Fetch printers with silent background refresh support
 * @param {boolean} showLoading - Whether to show loading indicators (true for manual refresh, false for background)
 * @returns {Promise<void>}
 */
const fetchPrinters = async (showLoading = true) => {
  // Prevent concurrent refreshes
  if (refreshInProgress.value) {
    console.log('Refresh already in progress, skipping');
    return;
  }
  
  refreshInProgress.value = true;
  
  // Update loading state based on refresh type
  if (showLoading) {
    // Only show loading indicator if this is initial load or manual refresh
    // AND we don't already have data
    if (!hasInitialData.value) {
      initialLoading.value = true;
    }
    error.value = null;
  } else {
    // This is a background refresh - just set the background flag
    backgroundRefreshing.value = true;
  }
  
  try {
    // Ensure URL is properly formatted - use absolute path with origin
    const baseUrl = window.location.origin;
    const apiEndpoint = '/api/printers/direct-connect';
    const fullUrl = `${baseUrl}${apiEndpoint}`;
    
    console.log(`Fetching printers from: ${fullUrl}`);
    
    const response = await fetch(fullUrl, {
      // Add cache control headers to prevent caching
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      console.log(`Successfully loaded ${data.length} printers`);
      
      // Track last successful update time
      const updateTime = Date.now();
      
      // Update printer data while preserving UI states
      if (printers.value.length > 0) {
        // Merge new data with existing data to avoid UI flickering
        data.forEach(newPrinter => {
          const existingIndex = printers.value.findIndex(p => p.printer_id === newPrinter.printer_id);
          
          if (existingIndex >= 0) {
            // Preserve UI state variables from existing printer
            const existingPrinter = printers.value[existingIndex];
            
            // Merge the data - update printer status but keep UI state
            printers.value[existingIndex] = {
              ...newPrinter,
              _lastUpdated: updateTime,
              _stale: false,
              // Only keep _loading if this is a specific printer refresh
              _loading: existingPrinter._loading && !showLoading
            };
          } else {
            // New printer not previously in the list
            printers.value.push({
              ...newPrinter,
              _lastUpdated: updateTime,
              _stale: false,
              _loading: false
            });
          }
        });
        
        // Filter out printers that no longer exist
        printers.value = printers.value.filter(printer => 
          data.some(newPrinter => newPrinter.printer_id === printer.printer_id)
        );
      } else {
        // Initial load - no existing data to merge
        printers.value = data.map(printer => ({
          ...printer,
          _lastUpdated: updateTime,
          _stale: false,
          _loading: false
        }));
      }
      
      // Update filtered printers based on search query
      filterPrinters();
      
      // Data successfully loaded
      hasInitialData.value = true;
      lastRefreshTime.value = updateTime;
    } else if (data.body && data.body.error) {
      throw new Error(data.body.error);
    } else {
      throw new Error('Invalid response format from API');
    }
  } catch (err) {
    console.error('Error fetching printers:', err);
    
    // Only show error messages for manual refreshes
    if (showLoading) {
      error.value = `Failed to fetch printer status: ${err.message}`;
    }
    
    // Just silently mark data as stale for background refreshes
    if (printers.value.length > 0) {
      printers.value.forEach(printer => {
        printer._stale = true;
      });
    }
  } finally {
    // Clear the appropriate loading state
    if (showLoading) {
      initialLoading.value = false;
    } else {
      backgroundRefreshing.value = false;
    }
    
    // Always mark refresh as complete
    refreshInProgress.value = false;
  }
};

/**
 * Refresh a single printer
 * @param {Object} printer - The printer to refresh
 * @returns {Promise<void>}
 */
const refreshSinglePrinter = async (printer) => {
  // Prevent multiple refreshes of the same printer
  if (printer._loading) return;
  
  // Set loading state for just this printer
  printer._loading = true;
  
  try {
    // Ensure URL is properly formatted
    const baseUrl = window.location.origin;
    const apiEndpoint = `/api/printers/direct-connect/${printer.printer_id}`;
    const fullUrl = `${baseUrl}${apiEndpoint}`;
    
    console.log(`Refreshing printer ${printer.printer_name} from: ${fullUrl}`);
    
    // Make API call to fetch just this printer
    const response = await fetch(fullUrl, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data) {
      const updateTime = Date.now();
      
      // Find the printer in our array
      const index = printers.value.findIndex(p => p.printer_id === printer.printer_id);
      
      if (index >= 0) {
        // Update just this printer with new data
        printers.value[index] = {
          ...data,
          _lastUpdated: updateTime,
          _stale: false,
          _loading: false
        };
        
        // Re-apply filter if search is active
        if (searchQuery.value) {
          filterPrinters();
        }
      }
    } else {
      throw new Error('Invalid response format for single printer refresh');
    }
  } catch (err) {
    console.error(`Error refreshing printer ${printer.printer_name}:`, err);
    // Mark as stale on error
    printer._stale = true;
  } finally {
    // Always clear loading state
    printer._loading = false;
  }
};

// Manual refresh function
const refreshAllPrinters = () => {
  fetchPrinters(true);
};

// Filter printers based on search query
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

// Get connection status class
const getConnectionClass = (printer) => {
  if (printer._loading) return 'connecting';
  if (printer.print_stats.state === 'offline') return 'disconnected';
  if (printer._stale) return 'unstable';
  return 'connected';
};

// Get connection status text
const getConnectionText = (printer) => {
  if (printer._loading) return 'Connecting...';
  if (printer.print_stats.state === 'offline') return 'Disconnected';
  if (printer._stale) return 'Unstable Connection';
  return 'Connected';
};

// Active printers calculation
const activePrinters = computed(() => {
  return printers.value.filter(printer => 
    printer.print_stats.state === 'printing' || 
    printer.print_stats.state === 'paused'
  ).length;
});

const activePrinterPercentage = computed(() => {
  return printers.value.length ? Math.round((activePrinters.value / printers.value.length) * 100) : 0;
});

// Get color code from color name
const getColorCode = (color) => {
  const colorMap = {
    black: '#000000',
    cyan: '#00BFFF',
    magenta: '#FF00FF',
    yellow: '#FFFF00',
    white: '#FFFFFF',
    red: '#FF0000',
    green: '#00FF00',
    blue: '#0000FF',
    orange: '#FFA500',
    purple: '#800080',
    pink: '#FFC0CB',
    brown: '#A52A2A',
    gray: '#808080',
    silver: '#C0C0C0',
    gold: '#FFD700'
  };
  
  return colorMap[color?.toLowerCase()] || '#777777';
};

// Format time remaining to display as hours and minutes
const formatTimeRemaining = (seconds) => {
  if (!seconds) return '';
  
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const options = { month: 'short', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};

// View printer details
const viewPrinterDetails = (printer) => {
  router.push(`/printer/${printer.printer_id}`);
};

// Manage printer
const managePrinter = (printer) => {
  router.push(`/printer/${printer.printer_id}/manage`);
};

// Fetch filament inventory from API - simplified here
const fetchFilamentInventory = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/filaments/inventory`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        filamentInventory.value = data;
      }
    }
  } catch (err) {
    console.error('Error fetching filament inventory:', err);
  }
};

// Reorder filament - simplified here
const reorderFilament = async (filament) => {
  try {
    const baseUrl = window.location.origin;
    await fetch(`${baseUrl}/api/filaments/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filament_id: filament.filament_id })
    });
    
    alert(`Reordering ${filament.name}...`);
    await fetchFilamentInventory();
  } catch (err) {
    console.error('Error reordering filament:', err);
    alert(`Failed to reorder ${filament.name}`);
  }
};

// Fetch maintenance tasks from API - simplified here
const fetchMaintenanceTasks = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/tasks`);
    
    if (response.ok) {
      const data = await response.json();
      if (Array.isArray(data)) {
        maintenanceTasks.value = data;
      }
    }
  } catch (err) {
    console.error('Error fetching maintenance tasks:', err);
  }
};

// Complete maintenance task - simplified here
const completeTask = async (task) => {
  try {
    const baseUrl = window.location.origin;
    await fetch(`${baseUrl}/api/maintenance/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.task_id })
    });
    
    task.status = 'completed';
    await fetchMaintenanceTasks();
  } catch (err) {
    console.error('Error completing task:', err);
    alert(`Failed to complete task: ${task.description}`);
    task.status = 'pending';
  }
};

// Handle logout
const handleLogout = () => {
  router.push('/login');
};

// Lifecycle hooks
onMounted(() => {
  // Initial data load with loading indicator
  fetchPrinters(true);
  
  // Also fetch filament inventory and maintenance tasks
  fetchFilamentInventory();
  fetchMaintenanceTasks();
  
  // Set up a timer for background refreshes
  const refreshInterval = setInterval(() => {
    // Silent background refresh - no loading indicators
    fetchPrinters(false);
  }, 30000); // Every 30 seconds
  
  // Clean up on unmount
  onUnmounted(() => {
    clearInterval(refreshInterval);
  });
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

.dashboard-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.card {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.summary-card {
  height: 150px;
}

.table-card,
.inventory-card,
.schedule-card {
  grid-column: span 3;
}

.card h3 {
  font-size: 18px;
  font-weight: 500;
  margin-bottom: 15px;
  color: #e0e0e0;
}

.card-content {
  display: flex;
  align-items: center;
  height: 100%;
}

.chart-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
}

.pie-chart {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: conic-gradient(#1e88e5 0% var(--percentage), #444 var(--percentage) 100%);
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.pie-chart::before {
  content: '';
  position: absolute;
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background-color: #2d2d2d;
}

.pie-value {
  position: relative;
  z-index: 1;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.pie-chart {
  --percentage: calc(var(--value) * 1%);
}

.line-chart,
.bar-chart {
  width: 100%;
  height: 80px;
  background-color: #2d2d2d;
  position: relative;
  overflow: hidden;
}

.line-chart::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, transparent 5%, #1e88e5 5%, #1e88e5 10%, transparent 10%, transparent 15%, #1e88e5 15%, #1e88e5 20%, transparent 20%, transparent 25%, #1e88e5 25%, #1e88e5 30%, transparent 30%, transparent 35%, #1e88e5 35%, #1e88e5 40%, transparent 40%, transparent 45%, #1e88e5 45%, #1e88e5 50%, transparent 50%, transparent 55%, #1e88e5 55%, #1e88e5 60%, transparent 60%, transparent 65%, #1e88e5 65%, #1e88e5 70%, transparent 70%, transparent 75%, #1e88e5 75%, #1e88e5 80%, transparent 80%, transparent 85%, #1e88e5 85%, #1e88e5 90%, transparent 90%, transparent 95%, #1e88e5 95%, #1e88e5 100%);
  opacity: 0.7;
  background-size: 100% 1px;
  background-repeat: repeat-y;
  background-position: center;
}

.line-chart::after {
  content: '';
  position: absolute;
  top: 50%;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: #1e88e5;
  transform: translateY(-50%) scaleY(0.5);
  clip-path: polygon(0 0, 10% 30%, 20% 10%, 30% 50%, 40% 30%, 50% 70%, 60% 40%, 70% 20%, 80% 60%, 90% 10%, 100% 40%, 100% 100%, 0 100%);
}

.bar-chart::before {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent 5%, #1e88e5 5%, #1e88e5 15%, transparent 15%, transparent 25%, #1e88e5 25%, #1e88e5 35%, transparent 35%, transparent 45%, #1e88e5 45%, #1e88e5 55%, transparent 55%, transparent 65%, #1e88e5 65%, #1e88e5 75%, transparent 75%, transparent 85%, #1e88e5 85%, #1e88e5 95%, transparent 95%);
  clip-path: polygon(
    5% 0, 5% 50%, 15% 50%, 15% 0,
    25% 0, 25% 70%, 35% 70%, 35% 0,
    45% 0, 45% 40%, 55% 40%, 55% 0,
    65% 0, 65% 80%, 75% 80%, 75% 0,
    85% 0, 85% 60%, 95% 60%, 95% 0,
    100% 0, 100% 100%, 0 100%, 0 0
  );
}

.card-text {
  flex: 1;
  padding-left: 20px;
}

.card-text h3 {
  margin-bottom: 5px;
}

.card-text p {
  color: #a0a0a0;
  font-size: 14px;
}

/* Printer Grid */
.printer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.printer-card {
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
}

.printer-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  background-color: #222;
  border-bottom: 1px solid #333;
}

.printer-title {
  display: flex;
  align-items: center;
  gap: 10px;
}

.printer-icon {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background-color: #333;
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.status-indicator {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background-color: #777;
}

.status-indicator.printing {
  background-color: #4caf50;
}

.status-indicator.idle {
  background-color: #2196f3;
}

.status-indicator.paused {
  background-color: #ff9800;
}

.status-indicator.error,
.status-indicator.offline {
  background-color: #f44336;
}

.printer-title h4 {
  margin: 0;
  font-size: 16px;
  font-weight: 500;
}

.printer-status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  text-transform: uppercase;
  font-weight: 500;
}

.printer-status-badge.printing {
  background-color: #4caf50;
  color: #1a1a1a;
}

.printer-status-badge.idle {
  background-color: #2196f3;
  color: #1a1a1a;
}

.printer-status-badge.paused {
  background-color: #ff9800;
  color: #1a1a1a;
}

.printer-status-badge.error,
.printer-status-badge.offline {
  background-color: #f44336;
  color: #1a1a1a;
}

.printer-body {
  flex: 1;
  padding: 15px;
}

.current-task {
  margin-bottom: 15px;
  padding-bottom: 15px;
  border-bottom: 1px solid #333;
}

.task-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-name {
  font-size: 14px;
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 65%;
}

.temperature-info {
  display: flex;
  gap: 10px;
}

.temp-item {
  font-size: 12px;
  color: #a0a0a0;
  display: flex;
  align-items: center;
  gap: 5px;
}

.temp-icon {
  width: 14px;
  height: 14px;
  background-color: #a0a0a0;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.temp-icon.hotend {
  mask-image: url("/pic/icon/hotend-icon.png");
  -webkit-mask-image: url("/pic/icon/hotend-icon.png");
}

.temp-icon.bed {
  mask-image: url("/pic/icon/bed-icon.png");
  -webkit-mask-image: url("/pic/icon/bed-icon.png");
}

.print-progress {
  margin-top: 10px;
}

.progress-bar {
  height: 8px;
  background-color: #444;
  border-radius: 4px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  background-color: #1e88e5;
  border-radius: 4px;
}

.progress-details {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 5px;
}

.progress-percentage {
  font-size: 14px;
  font-weight: 500;
  color: #e0e0e0;
}

.time-remaining {
  font-size: 12px;
  color: #a0a0a0;
}

.filament-levels-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 10px;
}

.filament-grid-item {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.filament-label-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filament-label {
  font-size: 14px;
  color: #a0a0a0;
  text-transform: capitalize;
}

.filament-percentage {
  font-size: 14px;
  color: #e0e0e0;
}

.no-filament-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 50px;
  color: #777;
  font-size: 14px;
}

.printer-footer {
  display: flex;
  gap: 10px;
  padding: 15px;
  border-top: 1px solid #333;
}

.action-btn {
  flex: 1;
  padding: 8px 0;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.details-btn {
  background-color: #444;
  color: #e0e0e0;
}

.details-btn:hover {
  background-color: #555;
}

.manage-btn {
  background-color: #1e88e5;
  color: white;
}

.manage-btn:hover {
  background-color: #1976d2;
}

/* Inventory and Maintenance Styles */
.inventory-list,
.schedule-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.inventory-item,
.schedule-item {
  display: flex;
  align-items: center;
  gap: 15px;
  padding: 12px;
  background-color: #1a1a1a;
  border-radius: 6px;
}

.filament-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.filament-info {
  width: 150px;
}

.filament-name {
  display: block;
  font-size: 15px;
  color: #e0e0e0;
}

.filament-type {
  display: block;
  font-size: 13px;
  color: #a0a0a0;
}

.stock-level {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
}

.stock-percentage {
  width: 40px;
  font-size: 14px;
  color: #a0a0a0;
  text-align: right;
}

.reorder-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background-color: #f44336;
  color: white;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reorder-btn:disabled {
  background-color: #444;
  color: #a0a0a0;
  cursor: not-allowed;
}

.reorder-btn:hover:not(:disabled) {
  background-color: #d32f2f;
}

.task-info {
  width: 250px;
}

.task-name {
  display: block;
  font-size: 15px;
  color: #e0e0e0;
}

.task-printer {
  display: block;
  font-size: 13px;
  color: #a0a0a0;
}

.task-date {
  width: 100px;
  font-size: 14px;
  color: #a0a0a0;
}

.task-status {
  width: 100px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 13px;
  text-align: center;
  text-transform: capitalize;
}

.task-status.pending {
  background-color: #ff9800;
  color: #1a1a1a;
}

.task-status.completed {
  background-color: #4caf50;
  color: #1a1a1a;
}

.complete-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  font-size: 14px;
  background-color: #1e88e5;
  color: white;
  cursor: pointer;
  margin-left: auto;
  transition: background-color 0.3s ease;
}

.complete-btn:disabled {
  background-color: #4caf50;
  cursor: not-allowed;
}

.complete-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

/* Loading and error states */
.loading-container,
.error-container {
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(30, 136, 229, 0.3);
  border-radius: 50%;
  border-top-color: #1e88e5;
  animation: spinner 1s linear infinite;
  margin-bottom: 15px;
}

@keyframes spinner {
  to {
    transform: rotate(360deg);
  }
}

.error-container p {
  color: #f44336;
  margin-bottom: 15px;
}

.retry-btn {
  padding: 8px 20px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.retry-btn:hover {
  background-color: #1976d2;
}
  </style>