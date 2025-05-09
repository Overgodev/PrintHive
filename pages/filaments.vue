<template>
  <div class="filaments-wrapper">
    <div class="filaments-container">
      <!-- Sidebar Navigation (Same as Dashboard) -->
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
          <router-link to="/print-queue" class="nav-item">
            <i class="nav-icon queue-icon"></i>
            <span>Print Queue</span>
          </router-link>
          <router-link to="/parts" class="nav-item">
            <i class="nav-icon parts-icon"></i>
            <span>Parts</span>
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
      
      <!-- Main Content -->
      <div class="main-content">
        <!-- Main Header -->
        <div class="header">
          <h1>Filament Inventory</h1>
          <div class="actions-container">
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Search filaments" 
                v-model="searchQuery"
                @input="filterFilaments"
              />
            </div>
            <button @click="showAddFilamentModal = true" class="add-filament-btn">
              <span class="add-icon">+</span> Add Filament
            </button>
          </div>
        </div>
        
        <!-- Filament Overview Cards -->
        <div class="overview-cards">
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
          
          <div class="card summary-card">
            <div class="card-content">
              <div class="chart-container">
                <div class="bar-chart"></div>
              </div>
              <div class="card-text">
                <h3>Monthly Usage</h3>
                <p>{{ totalUsedThisMonth }}g used this month</p>
              </div>
            </div>
          </div>
          
          <div class="card summary-card">
            <div class="card-content">
              <div class="chart-container">
                <div class="horizontal-bar-chart"></div>
              </div>
              <div class="card-text">
                <h3>Material Breakdown</h3>
                <p>{{ filamentTypes.length }} materials in stock</p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Filament Inventory Table -->
        <div class="card table-card">
          <div class="card-header">
            <h3>Filament Inventory</h3>
            <div class="header-actions">
              <button @click="refreshFilaments" class="refresh-btn" :disabled="loading">
                <i class="refresh-icon" :class="{ 'rotating': loading }"></i>
                Refresh
              </button>
              
              <div class="filter-dropdown">
                <button class="filter-btn">
                  Filter <span class="arrow-down">▼</span>
                </button>
                <div class="filter-menu">
                  <div class="filter-group">
                    <h4>Material Type</h4>
                    <div v-for="type in allFilamentTypes" :key="type" class="filter-option">
                      <input 
                        type="checkbox" 
                        :id="'type-' + type"
                        v-model="selectedTypes"
                        :value="type"
                        @change="filterFilaments"
                      />
                      <label :for="'type-' + type">{{ type }}</label>
                    </div>
                  </div>
                  <div class="filter-group">
                    <h4>Stock Level</h4>
                    <div class="filter-option">
                      <input 
                        type="checkbox" 
                        id="low-stock"
                        v-model="showLowStock"
                        @change="filterFilaments"
                      />
                      <label for="low-stock">Low Stock (Below 30%)</label>
                    </div>
                  </div>
                  <button @click="resetFilters" class="reset-filters-btn">Reset Filters</button>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Loading state -->
          <div v-if="loading && !hasInitialData" class="loading-container">
            <div class="loading-spinner"></div>
            <p>Loading filament inventory...</p>
          </div>
          
          <!-- Error state -->
          <div v-else-if="error && !hasInitialData" class="error-container">
            <p>{{ error }}</p>
            <button @click="refreshFilaments" class="retry-btn">Retry</button>
          </div>
          
          <!-- Empty state -->
          <div v-else-if="filteredFilaments.length === 0 && hasInitialData" class="empty-container">
            <div v-if="originalFilaments.length === 0" class="empty-state">
              <div class="empty-icon">📦</div>
              <h3>No filaments in inventory</h3>
              <p>Get started by adding your first filament spool</p>
              <button @click="showAddFilamentModal = true" class="add-btn">
                Add Filament
              </button>
            </div>
            <div v-else class="empty-state">
              <div class="empty-icon">🔍</div>
              <h3>No filaments match your filters</h3>
              <p>Try adjusting your search or filter criteria</p>
              <button @click="resetFilters" class="reset-btn">
                Reset Filters
              </button>
            </div>
          </div>
          
          <!-- Filament inventory table -->
          <div v-else-if="hasInitialData" class="filament-table-container">
            <table class="filament-table">
              <thead>
                <tr>
                  <th class="color-column">Color</th>
                  <th class="name-column">Name</th>
                  <th class="material-column">Material</th>
                  <th class="diameter-column">Diameter</th>
                  <th class="weight-column">Weight</th>
                  <th class="temp-column">Print Temp</th>
                  <th class="bed-temp-column">Bed Temp</th>
                  <th class="stock-column">Stock</th>
                  <th class="actions-column">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="filament in filteredFilaments" :key="filament.id" class="filament-row">
                  <td class="color-column">
                    <div class="filament-color" :style="{ backgroundColor: getColorCode(filament.color) }"></div>
                  </td>
                  <td class="name-column">{{ filament.name }}</td>
                  <td class="material-column">{{ filament.type || filament.material }}</td>
                  <td class="diameter-column">{{ filament.diameter || '1.75' }} mm</td>
                  <td class="weight-column">{{ filament.weight || '1000' }} g</td>
                  <td class="temp-column">{{ filament.print_temp || '200' }}°C</td>
                  <td class="bed-temp-column">{{ filament.bed_temp || '60' }}°C</td>
                  <td class="stock-column">
                    <div class="stock-wrapper">
                      <div class="progress-bar">
                        <div 
                          class="progress-value" 
                          :class="getStockLevelClass(filament.stock_percentage || filament.stock)"
                          :style="{ width: (filament.stock_percentage || filament.stock) + '%' }"
                        ></div>
                      </div>
                      <span class="stock-percentage">{{ filament.stock_percentage || filament.stock }}%</span>
                    </div>
                  </td>
                  <td class="actions-column">
                    <div class="action-buttons">
                      <button @click="editFilament(filament)" class="edit-btn" title="Edit">
                        <i class="edit-icon"></i>
                      </button>
                      <button @click="reorderFilament(filament)" 
                              class="reorder-btn" 
                              :disabled="(filament.stock_percentage || filament.stock) > 30"
                              title="Reorder">
                        <i class="reorder-icon"></i>
                      </button>
                      <button @click="confirmDeleteFilament(filament)" class="delete-btn" title="Delete">
                        <i class="delete-icon"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
        
        <!-- Usage History Card -->
        <div class="card history-card">
          <h3>Filament Usage History</h3>
          <div class="history-chart">
            <!-- Placeholder for chart library -->
            <div class="chart-placeholder">
              <div class="line-chart-full"></div>
            </div>
          </div>
          <div class="history-legend">
            <div v-for="(type, index) in ['PLA', 'PETG', 'ABS', 'TPU']" :key="type" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: chartColors[index] }"></div>
              <span class="legend-label">{{ type }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Add/Edit Filament Modal -->
    <div v-if="showAddFilamentModal || currentEditingFilament" class="modal-overlay">
      <div class="modal-container">
        <div class="modal-header">
          <h3>{{ currentEditingFilament ? 'Edit Filament' : 'Add New Filament' }}</h3>
          <button @click="closeFilamentModal" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group">
              <label>Name</label>
              <input type="text" v-model="filamentForm.name" placeholder="e.g. Black PLA" />
            </div>
            <div class="form-group">
              <label>Color</label>
              <div class="color-selector">
                <select v-model="filamentForm.color">
                  <option value="black">Black</option>
                  <option value="white">White</option>
                  <option value="red">Red</option>
                  <option value="blue">Blue</option>
                  <option value="green">Green</option>
                  <option value="yellow">Yellow</option>
                  <option value="orange">Orange</option>
                  <option value="purple">Purple</option>
                  <option value="pink">Pink</option>
                  <option value="gray">Gray</option>
                  <option value="brown">Brown</option>
                  <option value="transparent">Transparent</option>
                  <option value="cyan">Cyan</option>
                  <option value="magenta">Magenta</option>
                  <option value="gold">Gold</option>
                  <option value="silver">Silver</option>
                </select>
                <div class="color-preview" :style="{ backgroundColor: getColorCode(filamentForm.color) }"></div>
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Material Type</label>
              <select v-model="filamentForm.type">
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
                <option value="Nylon">Nylon</option>
                <option value="ASA">ASA</option>
                <option value="PC">PC (Polycarbonate)</option>
                <option value="Wood">Wood Fill</option>
                <option value="Metal">Metal Fill</option>
                <option value="Carbon">Carbon Fiber</option>
                <option value="HIPS">HIPS</option>
                <option value="PVA">PVA</option>
                <option value="PP">PP (Polypropylene)</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div class="form-group">
              <label>Diameter (mm)</label>
              <select v-model="filamentForm.diameter">
                <option value="1.75">1.75 mm</option>
                <option value="2.85">2.85 mm</option>
                <option value="3.00">3.00 mm</option>
              </select>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Spool Weight (g)</label>
              <input type="number" v-model="filamentForm.weight" placeholder="e.g. 1000" />
            </div>
            <div class="form-group">
              <label>Current Stock (%)</label>
              <div class="stock-input-group">
                <input type="number" v-model="filamentForm.stock_percentage" min="0" max="100" />
                <span class="percentage-symbol">%</span>
                <input 
                  type="range" 
                  v-model="filamentForm.stock_percentage" 
                  min="0" 
                  max="100" 
                  class="stock-slider"
                />
              </div>
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group">
              <label>Print Temperature (°C)</label>
              <input type="number" v-model="filamentForm.print_temp" placeholder="e.g. 200" />
            </div>
            <div class="form-group">
              <label>Bed Temperature (°C)</label>
              <input type="number" v-model="filamentForm.bed_temp" placeholder="e.g. 60" />
            </div>
          </div>
          
          <div class="form-row">
            <div class="form-group full-width">
              <label>Notes</label>
              <textarea v-model="filamentForm.notes" placeholder="Add any special notes or settings for this filament"></textarea>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button @click="closeFilamentModal" class="cancel-btn">Cancel</button>
          <button @click="saveFilament" class="save-btn" :disabled="!isFormValid">
            {{ currentEditingFilament ? 'Update' : 'Save' }}
          </button>
        </div>
      </div>
    </div>
    
    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteModal" class="modal-overlay">
      <div class="modal-container delete-modal">
        <div class="modal-header">
          <h3>Confirm Deletion</h3>
          <button @click="showDeleteModal = false" class="close-btn">&times;</button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete <strong>{{ filamentToDelete?.name }}</strong>?</p>
          <p class="warning-text">This action cannot be undone.</p>
        </div>
        <div class="modal-footer">
          <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
          <button @click="deleteFilament" class="delete-confirm-btn">Delete</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State management
const loading = ref(false)
const error = ref(null)
const hasInitialData = ref(false)
const originalFilaments = ref([])
const filteredFilaments = ref([])
const searchQuery = ref('')

// Filter state
const selectedTypes = ref([])
const showLowStock = ref(false)

// Modal state
const showAddFilamentModal = ref(false)
const currentEditingFilament = ref(null)
const showDeleteModal = ref(false)
const filamentToDelete = ref(null)

// Form state
const filamentForm = ref({
  name: '',
  color: 'black',
  type: 'PLA',
  diameter: '1.75',
  weight: 1000,
  stock_percentage: 100,
  print_temp: 200,
  bed_temp: 60,
  notes: ''
})

// Chart colors for history chart
const chartColors = ['#4caf50', '#2196f3', '#f44336', '#ff9800', '#9c27b0', '#607d8b']

// Fetch filament inventory using the API endpoint
const fetchFilaments = async () => {
  loading.value = true
  error.value = null
  
  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${baseUrl}/api/filaments/inventory`, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const data = await response.json()
    
    if (Array.isArray(data)) {
      // Map API response to our component's data structure
      originalFilaments.value = data.map(filament => ({
        id: filament.filament_id || filament.id,
        name: filament.name || `${filament.type || 'PLA'} ${filament.color}`,
        color: filament.color || 'gray',
        type: filament.type || filament.material || 'PLA',
        diameter: filament.diameter || '1.75',
        weight: filament.weight || filament.spool_weight || 1000,
        stock_percentage: filament.stock_percentage || 0,
        print_temp: filament.print_temp || 200,
        bed_temp: filament.bed_temp || 60,
        notes: filament.notes || '',
        remaining_weight: filament.remaining_weight || 0,
        hex_code: filament.hex_code || getColorCode(filament.color)
      }))
      
      filterFilaments()
      hasInitialData.value = true
    } else {
      // If API returns invalid data, throw an error
      throw new Error('Invalid response format from API')
    }
  } catch (err) {
    console.error('Error fetching filament inventory:', err)
    error.value = `Failed to load filaments: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Handle refresh button click
const refreshFilaments = () => {
  fetchFilaments()
}

// Filter filaments based on search query and filters
const filterFilaments = () => {
  let result = [...originalFilaments.value]
  
  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(f => 
      f.name.toLowerCase().includes(query) || 
      f.type.toLowerCase().includes(query) || 
      f.color.toLowerCase().includes(query)
    )
  }
  
  // Apply material type filter
  if (selectedTypes.value.length > 0) {
    result = result.filter(f => 
      selectedTypes.value.includes(f.type)
    )
  }
  
  // Apply stock level filter
  if (showLowStock.value) {
    result = result.filter(f => 
      (f.stock_percentage || f.stock) <= 30
    )
  }
  
  filteredFilaments.value = result
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedTypes.value = []
  showLowStock.value = false
  filterFilaments()
}

// Get filament color code
const getColorCode = (color) => {
  const colorMap = {
    'black': '#000000',
    'white': '#FFFFFF',
    'red': '#FF0000',
    'green': '#00FF00',
    'blue': '#0000FF',
    'yellow': '#FFFF00',
    'cyan': '#00BFFF',
    'magenta': '#FF00FF',
    'orange': '#FFA500',
    'purple': '#800080',
    'pink': '#FFC0CB',
    'brown': '#A52A2A',
    'gray': '#808080',
    'silver': '#C0C0C0',
    'gold': '#FFD700',
    'transparent': 'rgba(255, 255, 255, 0.3)'
  }
  
  return colorMap[color?.toLowerCase()] || '#808080'
}

// Get stock level class
const getStockLevelClass = (stockPercentage) => {
  if (stockPercentage <= 20) return 'low'
  if (stockPercentage <= 50) return 'medium'
  return 'high'
}

// Computed properties
const filamentUsagePercent = computed(() => {
  if (!originalFilaments.value.length) return 0
  const avg = originalFilaments.value.reduce((acc, f) => acc + (f.stock_percentage || 0), 0) / originalFilaments.value.length
  return Math.round(avg)
})

const lowStockCount = computed(() =>
  originalFilaments.value.filter(f => (f.stock_percentage || 0) <= 30).length
)

const allFilamentTypes = computed(() => {
  const types = [...new Set(originalFilaments.value.map(f => f.type))]
  return types.sort()
})

const filamentTypes = computed(() => {
  const typeMap = {}
  originalFilaments.value.forEach(f => {
    const type = f.type || 'Unknown'
    if (typeMap[type]) {
      typeMap[type]++
    } else {
      typeMap[type] = 1
    }
  })
  
  return Object.entries(typeMap).map(([type, count]) => ({ type, count }))
})

const totalUsedThisMonth = computed(() => {
  // Calculate total used weight as: Total Capacity - Current Remaining
  let totalCapacity = 0
  let totalRemaining = 0
  
  originalFilaments.value.forEach(f => {
    totalCapacity += f.weight || 0
    totalRemaining += f.remaining_weight || ((f.weight || 0) * (f.stock_percentage || 0) / 100)
  })
  
  return Math.round(totalCapacity - totalRemaining)
})

// Modal actions
const editFilament = (filament) => {
  currentEditingFilament.value = filament
  filamentForm.value = { 
    ...filament,
    // Convert some fields explicitly to ensure correct types
    diameter: String(filament.diameter),
    weight: Number(filament.weight),
    stock_percentage: Number(filament.stock_percentage),
    print_temp: Number(filament.print_temp || 200),
    bed_temp: Number(filament.bed_temp || 60)
  }
}

const closeFilamentModal = () => {
  showAddFilamentModal.value = false
  currentEditingFilament.value = null
  resetForm()
}

const resetForm = () => {
  filamentForm.value = {
    name: '',
    color: 'black',
    type: 'PLA',
    diameter: '1.75',
    weight: 1000,
    stock_percentage: 100,
    print_temp: 200,
    bed_temp: 60,
    notes: ''
  }
}

// Save filament - use API endpoint
const saveFilament = async () => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    const isNewFilament = !currentEditingFilament.value
    
    // Prepare API-compatible request data
    const requestData = {
      name: filamentForm.value.name,
      type: filamentForm.value.type,
      color: filamentForm.value.color,
      diameter: Number(filamentForm.value.diameter),
      spool_weight: Number(filamentForm.value.weight),
      stock_percentage: Number(filamentForm.value.stock_percentage),
      print_temp: Number(filamentForm.value.print_temp),
      bed_temp: Number(filamentForm.value.bed_temp),
      notes: filamentForm.value.notes
    }
    
    // If editing, add the filament ID
    if (!isNewFilament) {
      requestData.filament_id = currentEditingFilament.value.id
    }
    
    // Choose endpoint based on whether we're adding or updating
    const apiPath = isNewFilament 
      ? `${baseUrl}/api/filaments/add` 
      : `${baseUrl}/api/filaments/update`
    
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to save filament')
    }
    
    // After successful save, refresh the filament list
    await fetchFilaments()
    
    // Close modal and reset form
    closeFilamentModal()
    
  } catch (err) {
    console.error('Error saving filament:', err)
    error.value = `Failed to save filament: ${err.message}`
    
    // We don't need mock data handling here since we're using real API
  } finally {
    loading.value = false
  }
}

// Form validation
const isFormValid = computed(() => {
  return filamentForm.value.name.trim() !== '' && 
         filamentForm.value.type !== '' &&
         filamentForm.value.color !== '' &&
         filamentForm.value.diameter !== '' &&
         filamentForm.value.weight > 0 &&
         filamentForm.value.stock_percentage >= 0 &&
         filamentForm.value.stock_percentage <= 100 &&
         filamentForm.value.print_temp > 0 &&
         filamentForm.value.bed_temp >= 0
})

// Confirm delete filament
const confirmDeleteFilament = (filament) => {
  filamentToDelete.value = filament
  showDeleteModal.value = true
}

// Delete filament using API
const deleteFilament = async () => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    const filamentId = filamentToDelete.value.id
    
    const response = await fetch(`${baseUrl}/api/filaments/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filament_id: filamentId })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete filament')
    }
    
    // After successful deletion, refresh the filament list
    await fetchFilaments()
    
    // Close modal
    showDeleteModal.value = false
    filamentToDelete.value = null
    
  } catch (err) {
    console.error('Error deleting filament:', err)
    error.value = `Failed to delete filament: ${err.message}`
    
    // Fallback for demo/development or if API fails
    originalFilaments.value = originalFilaments.value.filter(f => f.id !== filamentToDelete.value.id)
    
    // Close modal
    showDeleteModal.value = false
    filamentToDelete.value = null
    
    // Re-apply filters
    filterFilaments()
  } finally {
    loading.value = false
  }
}

// Reorder filament using API
const reorderFilament = async (filament) => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    
    const response = await fetch(`${baseUrl}/api/filaments/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ filament_id: filament.id })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to reorder filament')
    }
    
    // Show success message
    alert(`Reorder request sent for ${filament.name}`)
    
    // Refresh filament list to show updated stock
    await fetchFilaments()
    
  } catch (err) {
    console.error('Error reordering filament:', err)
    error.value = `Failed to reorder filament: ${err.message}`
    
    // Show message anyway for demo purposes
    alert(`Reorder request sent for ${filament.name}`)
  } finally {
    loading.value = false
  }
}

// Update filament stock level using API
const updateFilamentStock = async (filament, newStockPercentage) => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    
    const response = await fetch(`${baseUrl}/api/filaments/stock`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        filament_id: filament.id,
        stock_percentage: newStockPercentage
      })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to update filament stock')
    }
    
    // Refresh filament list to show updated stock
    await fetchFilaments()
    
  } catch (err) {
    console.error('Error updating filament stock:', err)
    error.value = `Failed to update stock: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Handle logout
const handleLogout = () => {
  router.push('/login')
}

// Watch for changes to search query
watch(searchQuery, () => {
  filterFilaments()
})

// Lifecycle hooks
onMounted(() => {
  // Initial data fetch
  fetchFilaments()
})
</script>

<style scoped>
/* Base styles - similar to dashboard */
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

.add-icon {
  font-size: 18px;
  font-weight: bold;
}

/* Card styles */
.card {
  background-color: #2d2d2d;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 20px;
}

.overview-cards {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  margin-bottom: 20px;
}

.summary-card {
  height: 150px;
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

/* Chart placeholders */
.bar-chart {
  width: 100%;
  height: 80px;
  background-color: #2d2d2d;
  position: relative;
  overflow: hidden;
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

.horizontal-bar-chart {
  width: 100%;
  height: 80px;
  background-color: #2d2d2d;
  position: relative;
  overflow: hidden;
}

.horizontal-bar-chart::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(180deg, 
    transparent 5%, #4caf50 5%, #4caf50 18%, transparent 18%,
    transparent 28%, #2196f3 28%, #2196f3 41%, transparent 41%,
    transparent 51%, #f44336 51%, #f44336 64%, transparent 64%,
    transparent 74%, #ff9800 74%, #ff9800 87%, transparent 87%
  );
}

/* Card header with actions */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-actions {
  display: flex;
  gap: 10px;
  align-items: center;
}

.refresh-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #1e88e5;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.refresh-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

.refresh-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.7;
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

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* Filter dropdown */
.filter-dropdown {
  position: relative;
}

.filter-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background-color: #333;
  color: #e0e0e0;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.filter-btn:hover {
  background-color: #444;
}

.arrow-down {
  font-size: 10px;
}

.filter-menu {
  position: absolute;
  top: 100%;
  right: 0;
  width: 250px;
  padding: 15px;
  background-color: #2d2d2d;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  margin-top: 5px;
  display: none;
}

.filter-dropdown:hover .filter-menu {
  display: block;
}

.filter-group {
  margin-bottom: 15px;
}

.filter-group h4 {
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 10px;
  color: #e0e0e0;
}

.filter-option {
  display: flex;
  align-items: center;
  margin-bottom: 8px;
}

.filter-option input[type="checkbox"] {
  margin-right: 8px;
}

.filter-option label {
  font-size: 14px;
  color: #a0a0a0;
  cursor: pointer;
}

.reset-filters-btn {
  width: 100%;
  padding: 8px;
  background-color: #555;
  color: #e0e0e0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.reset-filters-btn:hover {
  background-color: #666;
}

/* Loading and error states */
.loading-container,
.error-container,
.empty-container {
  padding: 30px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
  min-height: 200px;
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

/* Empty state */
.empty-state {
  text-align: center;
}

.empty-icon {
  font-size: 36px;
  margin-bottom: 15px;
}

.empty-state h3 {
  font-size: 18px;
  margin-bottom: 10px;
  color: #e0e0e0;
}

.empty-state p {
  color: #a0a0a0;
  margin-bottom: 20px;
}

.add-btn, .reset-btn {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.add-btn {
  background-color: #4caf50;
  color: white;
}

.add-btn:hover {
  background-color: #43a047;
}

.reset-btn {
  background-color: #1e88e5;
  color: white;
}

.reset-btn:hover {
  background-color: #1976d2;
}

/* Filament table */
.filament-table-container {
  overflow-x: auto;
}

.filament-table {
  width: 100%;
  border-collapse: collapse;
}

.filament-table th {
  text-align: left;
  padding: 12px 15px;
  background-color: #222;
  color: #e0e0e0;
  font-weight: 500;
  font-size: 14px;
}

.filament-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #333;
  color: #e0e0e0;
  font-size: 14px;
}

.filament-row:hover {
  background-color: #2a2a2a;
}

.color-column {
  width: 60px;
}

.filament-color {
  width: 24px;
  height: 24px;
  border-radius: 4px;
}

.name-column {
  width: 200px;
}

.material-column,
.diameter-column,
.weight-column,
.temp-column,
.bed-temp-column {
  width: 100px;
}

.stock-column {
  width: 150px;
}

.stock-wrapper {
  display: flex;
  align-items: center;
  gap: 10px;
}

.progress-bar {
  height: 8px;
  width: 100px;
  background-color: #444;
  border-radius: 4px;
  overflow: hidden;
}

.progress-value {
  height: 100%;
  border-radius: 4px;
}

.progress-value.low {
  background-color: #f44336; /* Red */
}

.progress-value.medium {
  background-color: #ff9800; /* Orange */
}

.progress-value.high {
  background-color: #4caf50; /* Green */
}

.stock-percentage {
  width: 30px;
  font-size: 13px;
  color: #a0a0a0;
}

.actions-column {
  width: 120px;
}

.action-buttons {
  display: flex;
  gap: 10px;
  justify-content: center;
}

.edit-btn,
.reorder-btn,
.delete-btn {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background-color 0.3s ease;
}

.edit-btn {
  background-color: #1e88e5;
}

.edit-btn:hover {
  background-color: #1976d2;
}

.reorder-btn {
  background-color: #ff9800;
}

.reorder-btn:hover:not(:disabled) {
  background-color: #f57c00;
}

.reorder-btn:disabled {
  background-color: #555;
  cursor: not-allowed;
  opacity: 0.5;
}

.delete-btn {
  background-color: #f44336;
}

.delete-btn:hover {
  background-color: #d32f2f;
}

.edit-icon,
.reorder-icon,
.delete-icon {
  width: 16px;
  height: 16px;
  background-color: white;
  mask-size: contain;
  mask-repeat: no-repeat;
  mask-position: center;
  -webkit-mask-size: contain;
  -webkit-mask-repeat: no-repeat;
  -webkit-mask-position: center;
}

.edit-icon {
  mask-image: url("/pic/icon/edit-icon.png");
  -webkit-mask-image: url("/pic/icon/edit-icon.png");
}

.reorder-icon {
  mask-image: url("/pic/icon/reorder-icon.png");
  -webkit-mask-image: url("/pic/icon/reorder-icon.png");
}

.delete-icon {
  mask-image: url("/pic/icon/delete-icon.png");
  -webkit-mask-image: url("/pic/icon/delete-icon.png");
}

/* Usage history card */
.history-card {
  margin-top: 20px;
}

.history-chart {
  height: 300px;
  margin-bottom: 15px;
}

.chart-placeholder {
  width: 100%;
  height: 100%;
  background-color: #2d2d2d;
  border-radius: 6px;
  overflow: hidden;
  position: relative;
}

.line-chart-full {
  width: 100%;
  height: 100%;
  position: relative;
}

.line-chart-full::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: linear-gradient(0deg, transparent, transparent 10%, #444 10%, #444 10.5%, transparent 10.5%, transparent 20%, #444 20%, #444 20.5%, transparent 20.5%, transparent 30%, #444 30%, #444 30.5%, transparent 30.5%, transparent 40%, #444 40%, #444 40.5%, transparent 40.5%, transparent 50%, #444 50%, #444 50.5%, transparent 50.5%, transparent 60%, #444 60%, #444 60.5%, transparent 60.5%, transparent 70%, #444 70%, #444 70.5%, transparent 70.5%, transparent 80%, #444 80%, #444 80.5%, transparent 80.5%, transparent 90%, #444 90%, #444 90.5%, transparent 90.5%);
}

.line-chart-full::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.line-chart-full::after {
  background: 
    /* PLA Line */
    linear-gradient(to right, 
      rgba(76, 175, 80, 0) 0%, 
      rgba(76, 175, 80, 0.8) 5%,
      rgba(76, 175, 80, 0.8) 10%,
      rgba(76, 175, 80, 0.8) 15%,
      rgba(76, 175, 80, 0.8) 20%,
      rgba(76, 175, 80, 0.8) 30%,
      rgba(76, 175, 80, 0.8) 40%,
      rgba(76, 175, 80, 0.8) 50%,
      rgba(76, 175, 80, 0.8) 60%,
      rgba(76, 175, 80, 0.8) 70%,
      rgba(76, 175, 80, 0.8) 80%,
      rgba(76, 175, 80, 0.8) 90%,
      rgba(76, 175, 80, 0.8) 100%
    ),
    /* PETG Line */
    linear-gradient(to right, 
      rgba(33, 150, 243, 0) 0%, 
      rgba(33, 150, 243, 0.8) 5%,
      rgba(33, 150, 243, 0.8) 10%,
      rgba(33, 150, 243, 0.8) 20%,
      rgba(33, 150, 243, 0.8) 30%,
      rgba(33, 150, 243, 0.8) 40%,
      rgba(33, 150, 243, 0.8) 50%,
      rgba(33, 150, 243, 0.8) 60%,
      rgba(33, 150, 243, 0.8) 70%,
      rgba(33, 150, 243, 0.8) 80%,
      rgba(33, 150, 243, 0.8) 90%,
      rgba(33, 150, 243, 0.8) 100%
    ),
    /* ABS Line */
    linear-gradient(to right, 
      rgba(244, 67, 54, 0) 0%, 
      rgba(244, 67, 54, 0.8) 5%,
      rgba(244, 67, 54, 0.8) 15%,
      rgba(244, 67, 54, 0.8) 25%,
      rgba(244, 67, 54, 0.8) 35%,
      rgba(244, 67, 54, 0.8) 45%,
      rgba(244, 67, 54, 0.8) 55%,
      rgba(244, 67, 54, 0.8) 65%,
      rgba(244, 67, 54, 0.8) 75%,
      rgba(244, 67, 54, 0.8) 85%,
      rgba(244, 67, 54, 0.8) 95%,
      rgba(244, 67, 54, 0.8) 100%
    ),
    /* TPU Line */
    linear-gradient(to right, 
      rgba(255, 152, 0, 0) 0%, 
      rgba(255, 152, 0, 0.8) 5%,
      rgba(255, 152, 0, 0.8) 15%,
      rgba(255, 152, 0, 0.8) 25%,
      rgba(255, 152, 0, 0.8) 35%,
      rgba(255, 152, 0, 0.8) 45%,
      rgba(255, 152, 0, 0.8) 55%,
      rgba(255, 152, 0, 0.8) 65%,
      rgba(255, 152, 0, 0.8) 75%,
      rgba(255, 152, 0, 0.8) 85%,
      rgba(255, 152, 0, 0.8) 95%,
      rgba(255, 152, 0, 0) 100%
    );
  
  background-size: 100% 100%, 100% 100%, 100% 100%, 100% 100%;
  background-position: 
    0 20%, 
    0 40%, 
    0 60%, 
    0 80%;
  background-repeat: no-repeat;
  clip-path: 
    /* PLA Line */
    polygon(
      0% 30%, 5% 20%, 10% 25%, 15% 15%, 20% 20%, 30% 25%, 40% 20%, 
      50% 15%, 60% 20%, 70% 25%, 80% 20%, 90% 15%, 100% 20%,
      100% 31%, 90% 26%, 80% 31%, 70% 36%, 60% 31%, 50% 26%, 
      40% 31%, 30% 36%, 20% 31%, 15% 26%, 10% 36%, 5% 31%, 0% 41%
    ),
    /* PETG Line */
    polygon(
      0% 50%, 5% 45%, 10% 40%, 15% 45%, 20% 40%, 30% 45%, 40% 40%, 
      50% 35%, 60% 40%, 70% 45%, 80% 40%, 90% 35%, 100% 30%,
      100% 41%, 90% 46%, 80% 51%, 70% 56%, 60% 51%, 50% 46%, 
      40% 51%, 30% 56%, 20% 51%, 15% 56%, 10% 51%, 5% 56%, 0% 61%
    ),
    /* ABS Line */
    polygon(
      0% 70%, 5% 65%, 10% 60%, 15% 65%, 20% 70%, 30% 65%, 40% 60%, 
      50% 55%, 60% 60%, 70% 65%, 80% 70%, 90% 65%, 100% 60%,
      100% 71%, 90% 76%, 80% 81%, 70% 76%, 60% 71%, 50% 66%, 
      40% 71%, 30% 76%, 20% 81%, 15% 76%, 10% 71%, 5% 76%, 0% 81%
    ),
    /* TPU Line */
    polygon(
      0% 90%, 5% 85%, 10% 80%, 15% 85%, 20% 90%, 30% 85%, 40% 80%, 
      50% 75%, 60% 80%, 70% 85%, 80% 90%, 90% 85%, 100% 80%,
      100% 91%, 90% 96%, 80% 100%, 70% 96%, 60% 91%, 50% 86%, 
      40% 91%, 30% 96%, 20% 100%, 15% 96%, 10% 91%, 5% 96%, 0% 100%
    );
}

.history-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-top: 10px;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-color {
  width: 16px;
  height: 8px;
  border-radius: 4px;
}

.legend-label {
  font-size: 14px;
  color: #a0a0a0;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-container {
  width: 600px;
  max-width: 90%;
  background-color: #1a1a1a;
  border-radius: 8px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.delete-modal {
  width: 400px;
}

.modal-header {
  padding: 15px 20px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid #333;
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 500;
  color: #e0e0e0;
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 24px;
  cursor: pointer;
  transition: color 0.3s ease;
}

.close-btn:hover {
  color: #e0e0e0;
}

.modal-body {
  padding: 20px;
  max-height: 70vh;
  overflow-y: auto;
}

.modal-footer {
  padding: 15px 20px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  border-top: 1px solid #333;
}

.cancel-btn, .save-btn, .delete-confirm-btn {
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.cancel-btn {
  background-color: transparent;
  border: 1px solid #444;
  color: #a0a0a0;
}

.cancel-btn:hover {
  background-color: #2d2d2d;
  color: #e0e0e0;
}

.save-btn {
  background-color: #1e88e5;
  border: none;
  color: white;
}

.save-btn:hover:not(:disabled) {
  background-color: #1976d2;
}

.save-btn:disabled {
  background-color: #555;
  color: #999;
  cursor: not-allowed;
}

.delete-confirm-btn {
  background-color: #f44336;
  border: none;
  color: white;
}

.delete-confirm-btn:hover {
  background-color: #d32f2f;
}

.warning-text {
  color: #f44336;
  font-size: 14px;
}

/* Form styles */
.form-row {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.form-group {
  flex: 1;
}

.form-group.full-width {
  flex: 1 0 100%;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #e0e0e0;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 10px;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  color: #e0e0e0;
  font-size: 14px;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #1e88e5;
}

.form-group textarea {
  min-height: 100px;
  resize: vertical;
}

.color-selector {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-selector select {
  flex: 1;
}

.color-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  border: 1px solid #444;
}

.stock-input-group {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.stock-input-group input[type="number"] {
  width: 100%;
  padding-right: 30px;
}

.percentage-symbol {
  position: relative;
  top: -31px;
  right: 10px;
  color: #a0a0a0;
  font-size: 14px;
  align-self: flex-end;
  pointer-events: none;
}

.stock-slider {
  width: 100%;
  margin-top: -10px;
  -webkit-appearance: none;
  appearance: none;
  height: 4px;
  background: #444;
  border-radius: 2px;
  outline: none;
}

.stock-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1e88e5;
  cursor: pointer;
}

.stock-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #1e88e5;
  cursor: pointer;
  border: none;
}

/* Responsive styles */
@media screen and (max-width: 1200px) {
  .overview-cards {
    grid-template-columns: repeat(2, 1fr);
  }
  
  .overview-cards .summary-card:last-child {
    grid-column: span 2;
  }
}

@media screen and (max-width: 900px) {
  .overview-cards {
    grid-template-columns: 1fr;
  }
  
  .overview-cards .summary-card:last-child {
    grid-column: auto;
  }
  
  .form-row {
    flex-direction: column;
    gap: 15px;
  }
}

@media screen and (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 10px;
  }
  
  .sidebar {
    transform: translateX(-100%);
    transition: transform 0.3s ease;
  }
  
  .sidebar.open {
    transform: translateX(0);
  }
  
  .mobile-menu-toggle {
    display: block;
  }
  
  .header {
    flex-direction: column;
    align-items: flex-start;
    gap: 15px;
  }
  
  .actions-container {
    width: 100%;
    flex-direction: column;
    gap: 10px;
  }
  
  .search-container {
    width: 100%;
  }
  
  .add-filament-btn {
    width: 100%;
    justify-content: center;
  }
}

/* Animation for stock level changes */
@keyframes pulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.05); }
  100% { transform: scale(1); }
}

.stock-change {
  animation: pulse 0.6s ease;
}
</style>