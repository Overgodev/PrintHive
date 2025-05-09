<template>
    <div class="parts-wrapper">
      <div class="parts-container">
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
            <router-link to="/parts" class="nav-item active">
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
        
        <!-- Main Content -->
        <div class="main-content">
          <!-- Main Header -->
          <div class="header">
            <h1>Printer Parts Inventory</h1>
            <div class="actions-container">
              <div class="search-container">
                <input 
                  type="text" 
                  placeholder="Search parts" 
                  v-model="searchQuery"
                  @input="filterParts"
                />
              </div>
              <button @click="showAddPartModal = true" class="add-part-btn">
                <span class="add-icon">+</span> Add Part
              </button>
            </div>
          </div>
          
          <!-- Parts Overview Cards -->
          <div class="overview-cards">
            <div class="card summary-card">
              <div class="card-content">
                <div class="chart-container">
                  <div class="pie-chart" :style="{ '--value': lowStockPercentage }">
                    <div class="pie-value">{{ lowStockParts }}</div>
                  </div>
                </div>
                <div class="card-text">
                  <h3>Low Stock Alert</h3>
                  <p>{{ lowStockParts }} part(s) need reordering</p>
                </div>
              </div>
            </div>
            
            <div class="card summary-card">
              <div class="card-content">
                <div class="chart-container">
                  <div class="bar-chart"></div>
                </div>
                <div class="card-text">
                  <h3>Parts Categories</h3>
                  <p>{{ categoriesCount }} different categories</p>
                </div>
              </div>
            </div>
            
            <div class="card summary-card">
              <div class="card-content">
                <div class="chart-container">
                  <div class="horizontal-bar-chart"></div>
                </div>
                <div class="card-text">
                  <h3>Total Inventory Value</h3>
                  <p>${{ totalInventoryValue }}</p>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Parts Inventory Table -->
          <div class="card table-card">
            <div class="card-header">
              <h3>Parts Inventory</h3>
              <div class="header-actions">
                <button @click="refreshParts" class="refresh-btn" :disabled="loading">
                  <i class="refresh-icon" :class="{ 'rotating': loading }"></i>
                  Refresh
                </button>
                
                <!-- Updated Filter Dropdown -->
                <div class="filter-dropdown">
                  <button @click="toggleFilterMenu" class="filter-btn">
                    Filter <span class="arrow-down">▼</span>
                  </button>
                  <div v-show="showFilterMenu" class="filter-menu">
                    <div class="filter-group">
                      <h4>Category</h4>
                      <div v-for="category in allCategories" :key="category" class="filter-option">
                        <input 
                          type="checkbox" 
                          :id="'category-' + category"
                          v-model="selectedCategories"
                          :value="category"
                          @change="filterParts"
                        />
                        <label :for="'category-' + category">{{ category }}</label>
                      </div>
                    </div>
                    <div class="filter-group">
                      <h4>Stock Level</h4>
                      <div class="filter-option">
                        <input 
                          type="checkbox" 
                          id="low-stock"
                          v-model="showLowStock"
                          @change="filterParts"
                        />
                        <label for="low-stock">Low Stock (Below Minimum)</label>
                      </div>
                      <div class="filter-option">
                        <input 
                          type="checkbox" 
                          id="out-of-stock"
                          v-model="showOutOfStock"
                          @change="filterParts"
                        />
                        <label for="out-of-stock">Out of Stock</label>
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
              <p>Loading parts inventory...</p>
            </div>
            
            <!-- Error state -->
            <div v-else-if="error && !hasInitialData" class="error-container">
              <p>{{ error }}</p>
              <button @click="refreshParts" class="retry-btn">Retry</button>
            </div>
            
            <!-- Empty state -->
            <div v-else-if="filteredParts.length === 0 && hasInitialData" class="empty-container">
              <div v-if="originalParts.length === 0" class="empty-state">
                <div class="empty-icon">⚙️</div>
                <h3>No parts in inventory</h3>
                <p>Get started by adding your first printer part</p>
                <button @click="showAddPartModal = true" class="add-btn">
                  Add Part
                </button>
              </div>
              <div v-else class="empty-state">
                <div class="empty-icon">🔍</div>
                <h3>No parts match your filters</h3>
                <p>Try adjusting your search or filter criteria</p>
                <button @click="resetFilters" class="reset-btn">
                  Reset Filters
                </button>
              </div>
            </div>
            
            <!-- Parts inventory table -->
            <div v-else-if="hasInitialData" class="parts-table-container">
              <table class="parts-table">
                <thead>
                  <tr>
                    <th class="image-column">Image</th>
                    <th class="name-column">Part Name</th>
                    <th class="category-column">Category</th>
                    <th class="sku-column">SKU</th>
                    <th class="quantity-column">Quantity</th>
                    <th class="minimum-column">Minimum</th>
                    <th class="price-column">Unit Price</th>
                    <th class="value-column">Total Value</th>
                    <th class="compatibility-column">Compatible With</th>
                    <th class="actions-column">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="part in filteredParts" :key="part.id" class="part-row">
                    <td class="image-column">
                      <div class="part-image" :style="{ backgroundImage: `url(${part.image || '/pic/placeholder-part.png'})` }"></div>
                    </td>
                    <td class="name-column">{{ part.name }}</td>
                    <td class="category-column">{{ part.category }}</td>
                    <td class="sku-column">{{ part.sku || 'N/A' }}</td>
                    <td class="quantity-column">
                      <div class="quantity-wrapper">
                        <span :class="getStockLevelClass(part.quantity, part.minimum)">
                          {{ part.quantity }}
                        </span>
                        <span class="unit">{{ part.unit || 'pcs' }}</span>
                      </div>
                    </td>
                    <td class="minimum-column">{{ part.minimum }}</td>
                    <td class="price-column">${{ formatPrice(part.unit_price) }}</td>
                    <td class="value-column">${{ formatPrice(part.quantity * part.unit_price) }}</td>
                    <td class="compatibility-column">
                      <div class="compatible-printers">
                        <span v-for="printer in part.compatible_printers" :key="printer" class="printer-tag">
                          {{ printer }}
                        </span>
                        <span v-if="!part.compatible_printers || part.compatible_printers.length === 0">
                          Universal
                        </span>
                      </div>
                    </td>
                    <td class="actions-column">
                      <div class="action-buttons">
                        <button @click="editPart(part)" class="edit-btn" title="Edit">
                          <i class="edit-icon"></i>
                        </button>
                        <button @click="adjustStock(part)" class="stock-btn" title="Adjust Stock">
                          <i class="stock-icon"></i>
                        </button>
                        <button @click="reorderPart(part)" 
                                class="reorder-btn" 
                                :disabled="part.quantity > part.minimum"
                                title="Reorder">
                          <i class="reorder-icon"></i>
                        </button>
                        <button @click="confirmDeletePart(part)" class="delete-btn" title="Delete">
                          <i class="delete-icon"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
          
          <!-- Recent Activity Card -->
          <div class="card history-card">
            <h3>Recent Part Activity</h3>
            <div class="activity-list">
              <div v-if="recentActivity.length === 0" class="empty-activity">
                <div class="empty-icon">📝</div>
                <p>No recent activity</p>
              </div>
              <div v-else v-for="activity in recentActivity" :key="activity.id" class="activity-item">
                <div class="activity-icon" :class="activity.type">
                  <i :class="getActivityIcon(activity.type)"></i>
                </div>
                <div class="activity-content">
                  <div class="activity-header">
                    <strong>{{ activity.description }}</strong>
                    <span class="activity-time">{{ formatActivityTime(activity.timestamp) }}</span>
                  </div>
                  <div class="activity-details">
                    {{ activity.details }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Add/Edit Part Modal -->
      <div v-if="showAddPartModal || currentEditingPart" class="modal-overlay">
        <div class="modal-container">
          <div class="modal-header">
            <h3>{{ currentEditingPart ? 'Edit Part' : 'Add New Part' }}</h3>
            <button @click="closePartModal" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="form-row">
              <div class="form-group">
                <label>Part Name</label>
                <input type="text" v-model="partForm.name" placeholder="e.g. 0.4mm Brass Nozzle" />
              </div>
              <div class="form-group">
                <label>Category</label>
                <select v-model="partForm.category">
                  <option value="Nozzles">Nozzles</option>
                  <option value="Extruder">Extruder</option>
                  <option value="Bed">Bed</option>
                  <option value="Motors">Motors</option>
                  <option value="Belts">Belts</option>
                  <option value="Electronics">Electronics</option>
                  <option value="Sensors">Sensors</option>
                  <option value="Screws & Bolts">Screws & Bolts</option>
                  <option value="Bearings">Bearings</option>
                  <option value="Frames">Frames</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>SKU (Optional)</label>
                <input type="text" v-model="partForm.sku" placeholder="e.g. NZL-04-BR" />
              </div>
              <div class="form-group">
                <label>Current Quantity</label>
                <input type="number" v-model="partForm.quantity" min="0" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Minimum Stock Level</label>
                <input type="number" v-model="partForm.minimum" min="0" />
              </div>
              <div class="form-group">
                <label>Unit Price ($)</label>
                <input type="number" v-model="partForm.unit_price" min="0" step="0.01" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Unit</label>
                <select v-model="partForm.unit">
                  <option value="pcs">pieces</option>
                  <option value="set">set</option>
                  <option value="meter">meter</option>
                  <option value="kg">kilogram</option>
                  <option value="kit">kit</option>
                </select>
              </div>
              <div class="form-group">
                <label>Supplier</label>
                <input type="text" v-model="partForm.supplier" placeholder="e.g. FilamentOne" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label>Compatible Printers</label>
                <div class="checkbox-group">
                  <label v-for="printer in allPrinters" :key="printer.id" class="checkbox-label">
                    <input 
                      type="checkbox" 
                      :value="printer.id"
                      v-model="partForm.compatible_printers"
                    />
                    {{ printer.name }}
                  </label>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label>Part Image</label>
                <div class="file-upload-area">
                  <input type="file" id="part-image" accept="image/*" @change="handleImageUpload" style="display: none" />
                  <label for="part-image" class="file-upload-label">
                    <div class="upload-icon">📷</div>
                    <span>{{ partForm.image_name || 'Upload part image' }}</span>
                  </label>
                </div>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea v-model="partForm.notes" placeholder="Add any notes, specifications, or maintenance tips"></textarea>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button @click="closePartModal" class="cancel-btn">Cancel</button>
            <button @click="savePart" class="save-btn" :disabled="!isFormValid">
              {{ currentEditingPart ? 'Update' : 'Save' }}
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
            <p>Are you sure you want to delete <strong>{{ partToDelete?.name }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button @click="showDeleteModal = false" class="cancel-btn">Cancel</button>
            <button @click="deletePart" class="delete-confirm-btn">Delete</button>
          </div>
        </div>
      </div>
      
      <!-- Stock Adjustment Modal -->
      <div v-if="showStockModal" class="modal-overlay">
        <div class="modal-container stock-modal">
          <div class="modal-header">
            <h3>Adjust Stock: {{ stockPartToAdjust?.name }}</h3>
            <button @click="showStockModal = false" class="close-btn">&times;</button>
          </div>
          <div class="modal-body">
            <div class="current-stock-info">
              <div class="stock-info-item">
                <label>Current Quantity:</label>
                <span>{{ stockPartToAdjust?.quantity }} {{ stockPartToAdjust?.unit || 'pcs' }}</span>
              </div>
              <div class="stock-info-item">
                <label>Minimum Level:</label>
                <span>{{ stockPartToAdjust?.minimum }} {{ stockPartToAdjust?.unit || 'pcs' }}</span>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label>Adjustment Type</label>
                <select v-model="stockAdjustment.type">
                  <option value="add">Add Stock</option>
                  <option value="remove">Remove Stock</option>
                  <option value="set">Set Exact Amount</option>
                </select>
              </div>
              <div class="form-group">
                <label>Quantity</label>
                <input type="number" v-model="stockAdjustment.quantity" min="0" />
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label>Reason</label>
                <select v-model="stockAdjustment.reason">
                  <option value="purchase">Purchase/Restock</option>
                  <option value="usage">Part Usage</option>
                  <option value="damaged">Damaged/Defective</option>
                  <option value="inventory">Inventory Adjustment</option>
                  <option value="other">Other</option>
                </select>
              </div>
            </div>
            
            <div class="form-row">
              <div class="form-group full-width">
                <label>Notes</label>
                <textarea v-model="stockAdjustment.notes" placeholder="Add details about this adjustment"></textarea>
              </div>
            </div>
            
            <div class="new-stock-preview">
              <strong>New Quantity:</strong> {{ calculatedNewQuantity }} {{ stockPartToAdjust?.unit || 'pcs' }}
            </div>
          </div>
          <div class="modal-footer">
            <button @click="showStockModal = false" class="cancel-btn">Cancel</button>
            <button @click="saveStockAdjustment" class="save-btn">
              Adjust Stock
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>

<script setup>
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()

// State management
const loading = ref(false)
const error = ref(null)
const hasInitialData = ref(false)
const originalParts = ref([])
const filteredParts = ref([])
const searchQuery = ref('')

// Filter state
const selectedCategories = ref([])
const showLowStock = ref(false)
const showOutOfStock = ref(false)
const showFilterMenu = ref(false) // New state for filter dropdown

// Modal state
const showAddPartModal = ref(false)
const currentEditingPart = ref(null)
const showDeleteModal = ref(false)
const partToDelete = ref(null)
const showStockModal = ref(false)
const stockPartToAdjust = ref(null)

// Form state
const partForm = ref({
  name: '',
  category: 'Nozzles',
  sku: '',
  quantity: 0,
  minimum: 5,
  unit_price: 0,
  unit: 'pcs',
  supplier: '',
  compatible_printers: [],
  notes: '',
  image_name: ''
})

// Stock adjustment state
const stockAdjustment = ref({
  type: 'add',
  quantity: 0,
  reason: 'purchase',
  notes: ''
})

// All printers state (fetched from API)
const allPrinters = ref([])

// Toggle filter menu function
const toggleFilterMenu = () => {
  showFilterMenu.value = !showFilterMenu.value
}

// Close filter menu when clicking outside
const handleClickOutside = (event) => {
  const filterDropdown = event.target.closest('.filter-dropdown')
  if (!filterDropdown && showFilterMenu.value) {
    showFilterMenu.value = false
  }
}

// Fetch all printers for compatibility selection
const fetchPrinters = async () => {
  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${baseUrl}/api/printers/list`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const data = await response.json()
    allPrinters.value = data
  } catch (err) {
    console.error('Error fetching printers:', err)
    allPrinters.value = []
  }
}

// Fetch parts using the API endpoint
// Update the fetchParts function in your script
const fetchParts = async () => {
  loading.value = true
  error.value = null
  
  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${baseUrl}/api/parts/inventory`, {
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
      originalParts.value = data.map(part => ({
        id: part.part_id,
        name: part.name,
        category: part.category,
        brand: part.brand || '',
        sku: part.sku || '',
        quantity: Number(part.quantity) || 0,
        minimum: Number(part.minimum_stock) || 5,
        unit_price: Number(part.unit_price) || 0,
        total_value: Number(part.total_value) || 0,
        unit: part.unit || 'pcs',
        supplier: part.supplier || '',
        compatible_printers: part.compatible_printers || [],
        notes: part.notes || '',
        image: part.image_url || null,
        last_updated: part.last_updated || new Date().toISOString(),
        wear_level: part.wear_level || 0,
        max_wear_limit: part.max_wear_limit || 1000,
        hex_code: part.hex_code || null,
        compatible_with: part.compatible_with || ''
      }))
      
      filterParts()
      hasInitialData.value = true
    } else {
      throw new Error('Invalid response format from API')
    }
  } catch (err) {
    console.error('Error fetching parts inventory:', err)
    error.value = `Failed to load parts: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Fetch recent activity
const recentActivity = ref([])
const fetchRecentActivity = async () => {
  try {
    const baseUrl = window.location.origin
    const response = await fetch(`${baseUrl}/api/parts/activity`)
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const data = await response.json()
    recentActivity.value = data
  } catch (err) {
    console.error('Error fetching recent activity:', err)
    recentActivity.value = []
  }
}

// Handle refresh button click
const refreshParts = () => {
  fetchParts()
  fetchRecentActivity()
}

// Filter parts based on search query and filters
const filterParts = () => {
  let result = [...originalParts.value]
  
  // Apply search query filter
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    result = result.filter(p => 
      p.name.toLowerCase().includes(query) || 
      p.category.toLowerCase().includes(query) || 
      p.sku.toLowerCase().includes(query) ||
      p.supplier.toLowerCase().includes(query)
    )
  }
  
  // Apply category filter
  if (selectedCategories.value.length > 0) {
    result = result.filter(p => 
      selectedCategories.value.includes(p.category)
    )
  }
  
  // Apply stock level filters
  if (showLowStock.value) {
    result = result.filter(p => 
      p.quantity <= p.minimum && p.quantity > 0
    )
  }
  
  if (showOutOfStock.value) {
    result = result.filter(p => 
      p.quantity === 0
    )
  }
  
  filteredParts.value = result
}

// Reset all filters
const resetFilters = () => {
  searchQuery.value = ''
  selectedCategories.value = []
  showLowStock.value = false
  showOutOfStock.value = false
  filterParts()
}

// Computed properties
const partCompletionRate = computed(() => {
  if (!originalParts.value.length) return 0
  const completed = originalParts.value.filter(p => p.status === 'Completed').length
  return Math.round((completed / originalParts.value.length) * 100)
})

const completedParts = computed(() =>
  originalParts.value.filter(p => p.status === 'Completed').length
)

const totalParts = computed(() => originalParts.value.length)

const activeJobs = computed(() =>
  originalParts.value.filter(p => p.status === 'Printing').length
)

const totalWeight = computed(() => {
  // Calculate estimated total weight used (simplified)
  const avgWeight = 50 // grams per hour average
  return originalParts.value.reduce((total, part) => {
    if (part.status === 'Completed') {
      return total + (part.estimated_time * avgWeight)
    }
    return total
  }, 0)
})

const lowStockParts = computed(() =>
  originalParts.value.filter(p => p.quantity <= p.minimum).length
)

const lowStockPercentage = computed(() => {
  if (originalParts.value.length === 0) return 0
  return Math.round((lowStockParts.value / originalParts.value.length) * 100)
})

const categoriesCount = computed(() => {
  const categories = [...new Set(originalParts.value.map(p => p.category))]
  return categories.length
})

const totalInventoryValue = computed(() => {
  const total = originalParts.value.reduce((sum, part) => 
    sum + (part.quantity * part.unit_price), 0
  )
  return total.toFixed(2)
})

const allCategories = computed(() => {
  const categories = [...new Set(originalParts.value.map(p => p.category))]
  return categories.sort()
})

// Calculated new quantity for stock adjustment
const calculatedNewQuantity = computed(() => {
  if (!stockPartToAdjust.value) return 0
  
  const current = stockPartToAdjust.value.quantity
  const adjustment = Number(stockAdjustment.value.quantity)
  
  switch (stockAdjustment.value.type) {
    case 'add':
      return current + adjustment
    case 'remove':
      return Math.max(0, current - adjustment)
    case 'set':
      return adjustment
    default:
      return current
  }
})

// Utility functions
const getStockLevelClass = (quantity, minimum) => {
  if (quantity === 0) return 'out-of-stock'
  if (quantity <= minimum) return 'low-stock'
  return 'normal-stock'
}

const formatPrice = (price) => {
  return Number(price).toFixed(2)
}

const formatActivityTime = (timestamp) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now - date
  
  if (diff < 3600000) { // Less than 1 hour
    const minutes = Math.floor(diff / 60000)
    return `${minutes}m ago`
  } else if (diff < 86400000) { // Less than 1 day
    const hours = Math.floor(diff / 3600000)
    return `${hours}h ago`
  } else { // More than 1 day
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }
}

const getActivityIcon = (type) => {
  const icons = {
    stock_adjustment: 'adjustment-icon',
    low_stock: 'warning-icon',
    reorder: 'reorder-icon',
    usage: 'usage-icon'
  }
  return icons[type] || 'info-icon'
}

// Modal actions
const editPart = (part) => {
  currentEditingPart.value = part
  partForm.value = { 
    ...part,
    quantity: Number(part.quantity),
    minimum: Number(part.minimum),
    unit_price: Number(part.unit_price)
  }
}

const adjustStock = (part) => {
  stockPartToAdjust.value = part
  stockAdjustment.value = {
    type: 'add',
    quantity: 0,
    reason: 'purchase',
    notes: ''
  }
  showStockModal.value = true
}

const closePartModal = () => {
  showAddPartModal.value = false
  currentEditingPart.value = null
  resetForm()
}

const resetForm = () => {
  partForm.value = {
    name: '',
    category: 'Nozzles',
    sku: '',
    quantity: 0,
    minimum: 5,
    unit_price: 0,
    unit: 'pcs',
    supplier: '',
    compatible_printers: [],
    notes: '',
    image_name: ''
  }
}

// Image upload handler
const handleImageUpload = (event) => {
  const file = event.target.files[0]
  if (file) {
    partForm.value.image_name = file.name
    // In a real app, you'd upload the file to the server here
  }
}

// Save part - use API endpoint
const savePart = async () => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    const isNewPart = !currentEditingPart.value
    
    // Prepare API-compatible request data
    const requestData = {
      name: partForm.value.name,
      category: partForm.value.category,
      sku: partForm.value.sku,
      quantity: Number(partForm.value.quantity),
      minimum_stock: Number(partForm.value.minimum),
      unit_price: Number(partForm.value.unit_price),
      unit: partForm.value.unit,
      supplier: partForm.value.supplier,
      compatible_printers: partForm.value.compatible_printers,
      notes: partForm.value.notes
    }
    
    // If editing, add the part ID
    if (!isNewPart) {
      requestData.part_id = currentEditingPart.value.id
    }
    
    // Choose endpoint based on whether we're adding or updating
    const apiPath = isNewPart 
      ? `${baseUrl}/api/parts/add` 
      : `${baseUrl}/api/parts/update`
    
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
      throw new Error(result.error || 'Failed to save part')
    }
    
    // After successful save, refresh the parts list
    await fetchParts()
    
    // Close modal and reset form
    closePartModal()
    
  } catch (err) {
    console.error('Error saving part:', err)
    error.value = `Failed to save part: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Form validation
const isFormValid = computed(() => {
  return partForm.value.name.trim() !== '' && 
         partForm.value.category !== '' &&
         Number(partForm.value.quantity) >= 0 &&
         Number(partForm.value.minimum) >= 0 &&
         Number(partForm.value.unit_price) >= 0
})

// Confirm delete part
const confirmDeletePart = (part) => {
  partToDelete.value = part
  showDeleteModal.value = true
}

// Delete part using API
const deletePart = async () => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    const partId = partToDelete.value.id
    
    const response = await fetch(`${baseUrl}/api/parts/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ part_id: partId })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to delete part')
    }
    
    // After successful deletion, refresh the parts list
    await fetchParts()
    
    // Close modal
    showDeleteModal.value = false
    partToDelete.value = null
    
  } catch (err) {
    console.error('Error deleting part:', err)
    error.value = `Failed to delete part: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Save stock adjustment
const saveStockAdjustment = async () => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    
    const requestData = {
      part_id: stockPartToAdjust.value.id,
      adjustment_type: stockAdjustment.value.type,
      quantity: Number(stockAdjustment.value.quantity),
      reason: stockAdjustment.value.reason,
      notes: stockAdjustment.value.notes
    }
    
    const response = await fetch(`${baseUrl}/api/parts/stock`, {
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
      throw new Error(result.error || 'Failed to adjust stock')
    }
    
    // After successful adjustment, refresh the parts list
    await fetchParts()
    
    // Close modal
    showStockModal.value = false
    stockPartToAdjust.value = null
    
  } catch (err) {
    console.error('Error adjusting stock:', err)
    error.value = `Failed to adjust stock: ${err.message}`
  } finally {
    loading.value = false
  }
}

// Reorder part using API
const reorderPart = async (part) => {
  try {
    loading.value = true
    const baseUrl = window.location.origin
    
    const response = await fetch(`${baseUrl}/api/parts/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ part_id: part.id })
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`)
    }
    
    const result = await response.json()
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to reorder part')
    }
    
    // Show success message
    alert(`Reorder request sent for ${part.name}`)
    
    // Refresh parts list to show updated status
    await fetchParts()
    
  } catch (err) {
    console.error('Error reordering part:', err)
    error.value = `Failed to reorder part: ${err.message}`
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
  filterParts()
})

// Lifecycle hooks
onMounted(async () => {
  // Initial data fetch
  await fetchParts()
  await fetchPrinters()
  await fetchRecentActivity()
  
  // Add click outside listener
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  // Clean up event listener
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* Base styles - similar to dashboard */
.parts-wrapper {
  min-height: 100vh;
  width: 100%;
  display: flex;
  background-color: #f5f7fb;
}

.parts-container {
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

.add-part-btn {
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

.add-part-btn:hover {
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

/* Filter dropdown - UPDATED STYLES */
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
  top: calc(100% + 5px);
  right: 0;
  width: 250px;
  padding: 15px;
  background-color: #2d2d2d;
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  z-index: 100;
  transition: all 0.2s ease-in-out;
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
  accent-color: #1e88e5;
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

/* Parts table */
.parts-table-container {
  overflow-x: auto;
}

.parts-table {
  width: 100%;
  border-collapse: collapse;
}

.parts-table th {
  text-align: left;
  padding: 12px 15px;
  background-color: #222;
  color: #e0e0e0;
  font-weight: 500;
  font-size: 14px;
}

.parts-table td {
  padding: 12px 15px;
  border-bottom: 1px solid #333;
  color: #e0e0e0;
  font-size: 14px;
}

.part-row:hover {
  background-color: #2a2a2a;
}

.image-column {
  width: 60px;
}

.part-image {
  width: 48px;
  height: 48px;
  border-radius: 4px;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  background-color: #333;
}

.name-column {
  width: 200px;
}

.category-column,
.sku-column,
.price-column,
.minimum-column {
  width: 100px;
}

.quantity-column {
  width: 120px;
}

.quantity-wrapper {
  display: flex;
  align-items: center;
  gap: 5px;
}

.quantity-wrapper .unit {
  color: #888;
  font-size: 13px;
}

.out-of-stock {
  color: #f44336;
}

.low-stock {
  color: #ff9800;
}

.normal-stock {
  color: #4caf50;
}

.value-column {
  width: 120px;
}

.compatibility-column {
  width: 150px;
}

.compatible-printers {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.printer-tag {
  padding: 2px 6px;
  background-color: #444;
  border-radius: 3px;
  font-size: 12px;
  color: #e0e0e0;
}

.actions-column {
  width: 140px;
}

.action-buttons {
  display: flex;
  gap: 8px;
  justify-content: center;
}

.edit-btn,
.stock-btn,
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

.stock-btn {
  background-color: #2196f3;
}

.stock-btn:hover {
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
.stock-icon,
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

.stock-icon {
  mask-image: url("/pic/icon/stock-icon.png");
  -webkit-mask-image: url("/pic/icon/stock-icon.png");
}

.reorder-icon {
  mask-image: url("/pic/icon/reorder-icon.png");
  -webkit-mask-image: url("/pic/icon/reorder-icon.png");
}

.delete-icon {
  mask-image: url("/pic/icon/delete-icon.png");
  -webkit-mask-image: url("/pic/icon/delete-icon.png");
}

.stock-icon {
  mask-image: url("/pic/icon/stock-icon.png");
  -webkit-mask-image: url("/pic/icon/stock-icon.png");
}

/* Recent activity card */
.history-card {
  margin-top: 20px;
}

.activity-list {
  margin-top: 15px;
}

.empty-activity {
  text-align: center;
  padding: 40px;
  color: #a0a0a0;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  padding: 12px 0;
  border-bottom: 1px solid #333;
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  flex-shrink: 0;
}

.activity-icon.stock_adjustment {
  background-color: #2196f3;
}

.activity-icon.low_stock {
  background-color: #ff9800;
}

.activity-icon.reorder {
  background-color: #4caf50;
}

.activity-icon.usage {
  background-color: #9c27b0;
}

.activity-icon i {
  color: white;
  font-size: 16px;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 4px;
}

.activity-header strong {
  color: #e0e0e0;
}

.activity-time {
  color: #888;
  font-size: 13px;
  white-space: nowrap;
}

.activity-details {
  color: #a0a0a0;
  font-size: 14px;
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

.delete-modal,
.stock-modal {
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
  margin-top: 10px;
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

/* File upload area */
.file-upload-area {
  position: relative;
}

.file-upload-label {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px;
  background-color: #2d2d2d;
  border: 1px solid #444;
  border-radius: 4px;
  cursor: pointer;
  transition: border-color 0.3s ease;
}

.file-upload-label:hover {
  border-color: #1e88e5;
}

.upload-icon {
  font-size: 18px;
}

/* Checkbox group */
.checkbox-group {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.checkbox-label input[type="checkbox"] {
  margin-right: 8px;
  accent-color: #1e88e5;
}

/* Stock modal specific styles */
.current-stock-info {
  background-color: #2d2d2d;
  padding: 15px;
  border-radius: 6px;
  margin-bottom: 20px;
}

.stock-info-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.stock-info-item:last-child {
  margin-bottom: 0;
}

.stock-info-item label {
  color: #a0a0a0;
}

.stock-info-item span {
  color: #e0e0e0;
  font-weight: 500;
}

.new-stock-preview {
  margin-top: 15px;
  padding: 12px;
  background-color: #2d2d2d;
  border-radius: 6px;
  text-align: center;
  border: 1px solid #444;
}

.new-stock-preview strong {
  color: #1e88e5;
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
  
  .add-part-btn {
    width: 100%;
    justify-content: center;
  }
  
  .parts-table-container {
    overflow-x: auto;
  }
  
  .modal-container {
    width: 95%;
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