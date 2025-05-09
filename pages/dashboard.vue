<template>
  <div class="dashboard-wrapper">
    <div class="dashboard-container">
      <!-- Sidebar Navigation -->
      <div class="sidebar">
        <div class="logo-container">
          <img src="/logo.png" alt="PrintHive Logo" class="company-logo" />
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
        <!-- Main Header -->
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
                <!-- Updated Printer Card with Reduced Dead Space -->
                <div v-for="printer in filteredPrinters" :key="printer.printer_id" class="printer-card">
                  <!-- Top status/progress bar -->
                  <div class="printer-top-bar">
                    <div v-if="printer.print_stats.state === 'printing'" class="print-progress-top">
                      <div class="progress-bar">
                        <div 
                          class="progress-value" 
                          :style="{ width: (printer.print_stats.progress * 100) + '%' }"
                        ></div>
                      </div>
                      <div class="progress-percentage">{{ Math.round(printer.print_stats.progress * 100) }}%</div>
                    </div>
                    <div v-else class="printer-status-top" :class="printer.print_stats.state">
                      {{ printer.print_stats.state.toUpperCase() }}
                    </div>
                  </div>
                  
                  <!-- Main content area - more compact design -->
                  <div class="printer-body">
                    <div class="printer-content">
                      <!-- Printer name -->
                      <h4 class="printer-name">{{ printer.printer_name }}</h4>
                      
                      <!-- Temperature and Job Info - Side by Side -->
                      <div class="printer-info-grid">
                        <!-- LEFT: Temperature indicators -->
                        <div class="temp-container">
                          <div class="temp-item">
                            <i class="temp-icon hotend" :style="{ backgroundColor: getTemperatureIconColor(printer.extruder.temperature) }"></i>
                            <span class="temp-value">{{ printer.extruder.temperature.toFixed(1) }}°C</span>
                          </div>
                          <div class="temp-item">
                            <i class="temp-icon bed" :style="{ backgroundColor: getTemperatureIconColor(printer.heater_bed.temperature) }"></i>
                            <span class="temp-value">{{ printer.heater_bed.temperature.toFixed(1) }}°C</span>
                          </div>
                        </div>
                        
                        <!-- RIGHT: Job, Filament, Connection -->
                        <div class="status-container">
                          <!-- Current Print Job -->
                          <div class="job-info">
                            <div v-if="printer.print_stats.filename" class="printing-file">
                              {{ printer.print_stats.filename }}
                            </div>
                            <div v-else class="printing-file no-file">
                              No active print job
                            </div>
                          </div>
                          
                          <!-- Filament and Connection in same row -->
                          <div class="meta-info">
                            <!-- Filament Spool -->
                            <div class="filament-indicator">
                              <div class="filament-color" 
                                  :style="{ backgroundColor: getColorCode(printer.filaments && printer.filaments.length > 0 ? printer.filaments[0].color : null) }">
                              </div>
                              <span class="filament-type">{{ printer.filaments && printer.filaments.length > 0 ? printer.filaments[0].type || 'PLA' : 'No filament' }}</span>
                            </div>
                            
                            <!-- Connection Status -->
                            <div class="connection-indicator" :class="getConnectionClass(printer)">
                              <span class="indicator-dot"></span>
                              <span class="indicator-text">{{ getConnectionText(printer) }}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <!-- Printer Footer with Detail and Manage buttons -->
                  <div class="printer-footer">
                    <button @click="viewPrinterDetails(printer)" class="action-btn details-btn">Detail</button>
                    <button @click="managePrinter(printer)" class="action-btn manage-btn">Manage</button>
                  </div>
                </div>
            </div>
          </div>
          
          <!-- Filament Inventory - UPDATED -->
          <!-- Filament Summary + Low Stock Cards Side by Side -->
          <div class="filament-row">
            <!-- Avg Filament Remaining Card -->
            <div class="card summary-card">
              <div class="card-content">
                <div class="chart-container">
                  <div class="pie-chart" :style="{ '--value': filamentUsagePercent }">
                    <div class="pie-value">{{ filamentUsagePercent }}%</div>
                  </div>
                </div>
                <div class="card-text">
                  <h3>Avg Filament Remaining</h3>
                  <p>{{ lowStockCount }} spool(s) under 30%</p>
                </div>
              </div>
            </div>

            <!-- Low Stock Filaments -->
            <div class="card filament--card">
              <h3>Low Stock Filaments</h3>
              <div v-if="topLowFilaments.length">
                <div 
                  v-for="filament in topLowFilaments" 
                  :key="filament.id" 
                  class="low-filament-item"
                >
                  <span class="dot" :style="{ backgroundColor: getColorCode(filament.color) }"></span>
                  <span class="label">{{ filament.name }}</span>
                  <span class="percent">{{ filament.stock || filament.stock_percentage }}%</span>
                </div>
                <router-link to="/filaments" class="view-more-link">View All Filaments</router-link>
              </div>
              <div v-else class="empty-state">No filament data</div>
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

// Filament inventory states
const loadingFilaments = ref(true)
const filamentError = ref(null)

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

/* Adjust the getConnectionClass and getConnectionText functions to work with the new layout */

// Get connection status class for the new layout
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
    'black': '#000000',
    'cyan': '#00BFFF',
    'magenta': '#FF00FF',
    'yellow': '#FFFF00',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'transparent': 'rgba(255, 255, 255, 0.3)',
    'natural': '#F5F5DC'
  };
  
  const lowerColor = color?.toLowerCase() || '';
  return colorMap[lowerColor] || '#777777';
};

// Get temperature icon color based on value - blue for cold to red for hot
const getTemperatureIconColor = (temp) => {
  // Define temperature ranges and corresponding colors
  // Cold (0-30°C): Blue
  // Medium (30-80°C): Gradient from blue to orange
  // Hot (80-100°C): Orange to red
  // Very hot (>100°C): Deep red
  
  if (temp <= 30) {
    // Cold - Blue
    return '#2196f3';
  } else if (temp <= 80) {
    // Medium - Blue to Orange gradient
    // Calculate position in range (0-1)
    const position = (temp - 30) / 50;
    
    // RGB components for blue: 33, 150, 243
    // RGB components for orange: 255, 152, 0
    const r = Math.round(33 + position * (255 - 33));
    const g = Math.round(150 + position * (152 - 150));
    const b = Math.round(243 + position * (0 - 243));
    
    return `rgb(${r}, ${g}, ${b})`;
  } else if (temp <= 100) {
    // Hot - Orange to Red gradient
    // Calculate position in range (0-1)
    const position = (temp - 80) / 20;
    
    // RGB components for orange: 255, 152, 0
    // RGB components for red: 244, 67, 54
    const r = Math.round(255 + position * (244 - 255));
    const g = Math.round(152 + position * (67 - 152));
    const b = Math.round(0 + position * (54 - 0));
    
    return `rgb(${r}, ${g}, ${b})`;
  } else {
    // Very hot - Deep red
    return '#e74c3c';
  }
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

// UPDATED: Fetch filament inventory from API with better error handling
const fetchFilamentInventory = async () => {
  loadingFilaments.value = true;
  filamentError.value = null;
  
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/filaments/inventory`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data)) {
      // Map the data to ensure consistent property names
      filamentInventory.value = data.map(filament => ({
        filament_id: filament.id || filament.filament_id,
        id: filament.id || filament.filament_id,
        name: filament.name || `${filament.type || 'PLA'} ${filament.color}`,
        color: filament.color || 'gray',
        type: filament.type || filament.material || 'PLA',
        stock_percentage: filament.stock_percentage || filament.stock || 0,
        stock: filament.stock_percentage || filament.stock || 0
      }));
    } else {
      // If we get an empty or invalid response, use mock data to demonstrate UI
      useMockFilamentData();
    }
  } catch (err) {
    console.error('Error fetching filament inventory:', err);
    filamentError.value = `Failed to load filaments: ${err.message}`;
    
    // Use mock data on error to ensure UI isn't empty
    useMockFilamentData();
  } finally {
    loadingFilaments.value = false;
  }
};

// Helper function to generate mock filament data
const useMockFilamentData = () => {
  filamentInventory.value = [
    { filament_id: 1, id: 1, name: "PLA Black", color: "black", type: "PLA", stock_percentage: 25, stock: 25 },
    { filament_id: 2, id: 2, name: "PETG Blue", color: "blue", type: "PETG", stock_percentage: 78, stock: 78 },
    { filament_id: 3, id: 3, name: "ABS Red", color: "red", type: "ABS", stock_percentage: 15, stock: 15 },
    { filament_id: 4, id: 4, name: "TPU White", color: "white", type: "TPU", stock_percentage: 92, stock: 92 },
    { filament_id: 5, id: 5, name: "PLA Transparent", color: "transparent", type: "PLA", stock_percentage: 45, stock: 45 }
  ];
};

// Refresh filament inventory
const refreshFilamentInventory = () => {
  fetchFilamentInventory();
};

// Reorder filament
const reorderFilament = async (filament) => {
  try {
    const baseUrl = window.location.origin;
    const filamentId = filament.filament_id || filament.id;
    
    const response = await fetch(`${baseUrl}/api/filaments/reorder`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ filament_id: filamentId })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    alert(`Reordering ${filament.name}...`);
    await fetchFilamentInventory();
  } catch (err) {
    console.error('Error reordering filament:', err);
    alert(`Failed to reorder ${filament.name}`);
  }
};

// Add new filament
const addNewFilament = () => {
  router.push('/filaments/add');
};

const lowStockCount = computed(() =>
  filamentInventory.value.filter(f => (f.stock || f.stock_percentage) <= 30).length
);

const filamentUsagePercent = computed(() => {
  if (!filamentInventory.value.length) return 0;
  const avg = filamentInventory.value.reduce((acc, f) => acc + (f.stock || f.stock_percentage), 0) / filamentInventory.value.length;
  return Math.round(avg);
});

const topLowFilaments = computed(() =>
  [...filamentInventory.value]
    .sort((a, b) => (a.stock || a.stock_percentage) - (b.stock || b.stock_percentage))
    .slice(0, 3)
);

// Fetch maintenance tasks from API - enhanced with better error handling
const fetchMaintenanceTasks = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/tasks`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (Array.isArray(data) && data.length > 0) {
      maintenanceTasks.value = data;
    } else {
      // If no tasks found, use mock data for demonstration
      maintenanceTasks.value = [
        { 
          task_id: 1, 
          description: "Nozzle Replacement", 
          printer_name: "Ender 3 Pro", 
          due_date: new Date(Date.now() + 86400000 * 2).toISOString(), // 2 days from now
          status: "pending" 
        },
        { 
          task_id: 2, 
          description: "Belt Tightening", 
          printer_name: "Prusa i3 MK3", 
          due_date: new Date(Date.now() + 86400000 * 5).toISOString(), // 5 days from now
          status: "pending" 
        },
        { 
          task_id: 3, 
          description: "Bed Cleaning", 
          printer_name: "Ender 3 Pro", 
          due_date: new Date().toISOString(), // Today
          status: "completed" 
        }
      ];
    }
  } catch (err) {
    console.error('Error fetching maintenance tasks:', err);
    
    // Use mock data on error
    maintenanceTasks.value = [
      { 
        task_id: 1, 
        description: "Nozzle Replacement", 
        printer_name: "Ender 3 Pro", 
        due_date: new Date(Date.now() + 86400000 * 2).toISOString(), 
        status: "pending" 
      },
      { 
        task_id: 2, 
        description: "Belt Tightening", 
        printer_name: "Prusa i3 MK3", 
        due_date: new Date(Date.now() + 86400000 * 5).toISOString(), 
        status: "pending" 
      },
      { 
        task_id: 3, 
        description: "Bed Cleaning", 
        printer_name: "Ender 3 Pro", 
        due_date: new Date().toISOString(), 
        status: "completed" 
      }
    ];
  }
};

// Complete maintenance task
const completeTask = async (task) => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/complete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ task_id: task.task_id })
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    
    // Update task status locally
    task.status = 'completed';
    
    // Optionally refresh tasks list
    await fetchMaintenanceTasks();
  } catch (err) {
    console.error('Error completing task:', err);
    alert(`Failed to complete task: ${task.description}`);
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

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 15px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.refresh-btn:hover {
  background-color: #1976d2;
}

.refresh-btn:disabled {
  background-color: #555;
  color: #999;
  cursor: not-allowed;
}

.refresh-icon {
  width: 16px;
  height: 16px;
  border: 2px solid currentColor;
  border-radius: 50%;
  position: relative;
}

.refresh-icon::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 8px;
  height: 8px;
  border-top: 2px solid currentColor;
  border-right: 2px solid currentColor;
  transform: rotate(45deg);
}

.refresh-icon-small {
  width: 12px;
  height: 12px;
  border: 1.5px solid currentColor;
  border-radius: 50%;
  position: relative;
  display: inline-block;
}

.refresh-icon-small::before {
  content: '';
  position: absolute;
  top: -2px;
  right: -2px;
  width: 6px;
  height: 6px;
  border-top: 1.5px solid currentColor;
  border-right: 1.5px solid currentColor;
  transform: rotate(45deg);
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

/* Updated Printer Card Styles with Reduced Dead Space */
.printer-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 15px;
}

.printer-card {
  background-color: #1a1a1a;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #333;
  display: flex;
  flex-direction: column;
  /* Reduced minimum height */
  min-height: 200px;
}

/* Top status/progress bar */
.printer-top-bar {
  padding: 0;
  background-color: #222;
  border-bottom: 1px solid #333;
  position: relative;
  height: 30px; /* Reduced height */
  display: flex;
  align-items: center;
}

.printer-status-top {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  width: 100%;
  color: white;
  font-weight: 500;
  font-size: 14px; /* Reduced font size */
  letter-spacing: 1px;
}

.printer-status-top.printing {
  background-color: #4caf50; /* Green */
}

.printer-status-top.idle {
  background-color: #2196f3; /* Blue */
}

.printer-status-top.paused {
  background-color: #ff9800; /* Orange */
}

.printer-status-top.error,
.printer-status-top.offline {
  background-color: #f44336; /* Red */
}

.print-progress-top {
  width: 100%;
  height: 100%;
  position: relative;
}

.print-progress-top .progress-bar {
  height: 100%;
  background-color: #333;
  border-radius: 0;
  overflow: hidden;
}

.print-progress-top .progress-value {
  height: 100%;
  background-color: #4caf50; /* Green for printing */
  border-radius: 0;
}

.print-progress-top .progress-percentage {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: white;
  font-weight: 500;
  font-size: 14px; /* Reduced font size */
  z-index: 2;
  text-shadow: 0 0 3px rgba(0,0,0,0.7);
}

/* Main content with much tighter padding */
.printer-body {
  flex: 1;
  padding: 8px; /* Further reduced padding */
  display: flex;
  flex-direction: column;
}

.printer-content {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Further reduced gap */
}

.printer-name {
  margin: 0 0 4px 0; /* Reduced bottom margin */
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
  padding-left: 2px; /* Small left padding for better alignment */
}

/* New grid layout for printer info */
.printer-info-grid {
  display: grid;
  grid-template-columns: 80px 1fr; /* Slightly smaller fixed width for temp column */
  gap: 8px; /* Reduced gap */
  margin-top: 2px; /* Further reduced margin */
  align-items: start; /* Align items to the top */
}

.temp-container {
  display: flex;
  flex-direction: column;
  gap: 6px; /* Further reduced gap */
  width: 80px; /* Reduced width for temperature column */
}

.temp-item {
  display: flex;
  align-items: center;
  gap: 6px; /* Reduced gap between icon and text */
  height: 20px; /* Reduced height for tighter spacing */
  margin-left: 2px; /* Small left margin for better alignment */
}

.temp-icon {
  width: 16px; /* Reduced size */
  height: 16px; /* Reduced size */
  min-width: 16px; /* Ensure icon doesn't shrink */
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
  border-radius: 3px; /* Reduced for consistency */
}

.temp-value {
  font-size: 14px; /* Reduced font size */
  color: #2196f3; /* Blue color for temperature values like in the screenshot */
  font-weight: 600; /* Slightly bolder for better readability */
  white-space: nowrap; /* Prevent wrapping */
}

.temp-icon.hotend {
  mask-image: url("/pic/icon/hotend-icon.png");
  -webkit-mask-image: url("/pic/icon/hotend-icon.png");
}

.temp-icon.bed {
  mask-image: url("/pic/icon/bed-icon.png");
  -webkit-mask-image: url("/pic/icon/bed-icon.png");
}

.status-container {
  display: flex;
  flex-direction: column;
  gap: 4px; /* Further reduced gap */
  min-width: 0; /* Important for ellipsis to work in flexbox */
}

.job-info {
  background-color: #2d2d2d;
  padding: 8px 10px; /* Reduced padding */
  border-radius: 4px; /* Reduced radius */
  height: 36px; /* Fixed height for job info container */
  display: flex;
  align-items: center;
  overflow: hidden;       /* NEW */
  min-width: 0;           /* NEW (for flex containers) */
}

.printing-file {
  font-size: 13px; /* Reduced font size */
  color: #e0e0e0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%; /* Ensure text doesn't overflow container */
  line-height: 1.2; /* Improved line height */
  display: block; /* Ensure text is constrained */
}

.no-file {
  color: #a0a0a0;
  font-style: italic;
}

/* Meta info row - filament and connection in one row */
.meta-info {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  height: 36px; /* Fixed height to match job info */
}

.filament-indicator, .connection-indicator {
  display: flex;
  align-items: center;
  gap: 6px; /* Reduced gap */
  background-color: #2d2d2d;
  padding: 6px 8px; /* Reduced padding */
  border-radius: 4px; /* Reduced radius */
  white-space: nowrap;
  height: 100%; /* Full height of container */
  box-sizing: border-box;
}

.filament-color {
  width: 12px; /* Reduced size */
  height: 12px; /* Reduced size */
  border-radius: 50%;
}

.filament-type, .indicator-text {
  font-size: 12px; /* Reduced font size */
  color: #e0e0e0;
}

.indicator-dot {
  width: 8px; /* Reduced size */
  height: 8px; /* Reduced size */
  border-radius: 50%;
}

/* Connection indicator styling */
.connection-indicator.connected .indicator-dot {
  background-color: #4caf50; /* Green */
}

.connection-indicator.connecting .indicator-dot {
  background-color: #ff9800; /* Orange */
  animation: blink 1s infinite;
}

.connection-indicator.disconnected .indicator-dot {
  background-color: #f44336; /* Red */
}

.connection-indicator.unstable .indicator-dot {
  background-color: #ff9800; /* Orange */
}

/* Printer Footer with buttons */
.printer-footer {
  display: flex;
  gap: 5px; /* Further reduced gap */
  padding: 8px; /* Further reduced padding */
  border-top: 1px solid #333;
}

.action-btn {
  flex: 1;
  padding: 6px 0; /* Reduced padding */
  border: none;
  border-radius: 4px;
  font-size: 13px; /* Reduced font size */
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
  background-color: #e74c3c; /* Red */
  color: white;
}

.manage-btn:hover {
  background-color: #c0392b;
}

/* UPDATED: Filament Inventory Styles */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.refresh-btn {
  background-color: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  padding: 5px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #333;
  color: #e0e0e0;
}

.refresh-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

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

.inventory-item .filament-color {
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

.filament-info .filament-type {
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

.stock-level .progress-bar {
  height: 8px;
  background-color: #444;
  border-radius: 4px;
  overflow: hidden;
  flex: 1;
}

.stock-level .progress-value {
  height: 100%;
  border-radius: 4px;
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

/* Empty State */
.empty-inventory {
  padding: 20px;
  text-align: center;
  color: #a0a0a0;
}

.add-btn {
  margin-top: 10px;
  padding: 8px 15px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.add-btn:hover {
  background-color: #43a047;
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

@keyframes blink {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.3; }
}

.low-filament-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #2d2d2d;
  padding: 8px 12px;
  border-radius: 6px;
  margin-bottom: 6px;
}

.low-filament-item .dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-right: 8px;
  display: inline-block;
}

.low-filament-item .label {
  flex: 1;
  font-size: 14px;
  color: #e0e0e0;
}

.low-filament-item .percent {
  font-size: 13px;
  color: #f44336;
  font-weight: bold;
}

.view-more-link {
  margin-top: 8px;
  display: inline-block;
  font-size: 13px;
  color: #1e88e5;
  text-decoration: underline;
  cursor: pointer;
}

.empty-state {
  padding: 12px;
  color: #a0a0a0;
  font-size: 14px;
}

.filament-overview-row {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card,
.low-stock-card {
  flex: 1;
  min-width: 300px;
}

.filament-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  align-items: flex-start;
}

.filament-avg-card,
.filament-low-card,
.maintenance-mini-card {
  width: 280px;
  height: 160px;
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.maintenance-mini-card {
  width: 320px; /* Or adjust to your liking */
}

</style>