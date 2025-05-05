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
            <h1>3D Printer Inventory</h1>
            <div class="search-container">
              <input 
                type="text" 
                placeholder="Search" 
                v-model="searchQuery"
                @input="filterPrinters"
              />
            </div>
          </div>
          
          <div class="dashboard-grid">
            <!-- Summary Cards -->
            <div class="card summary-card">
              <div class="card-content">
                <div class="chart-container">
                  <div class="pie-chart">
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
            
            <!-- Printer Status Table -->
            <div class="card table-card">
              <h3>Printer Status</h3>
              <div class="printer-list">
                <div v-for="(printer, index) in filteredPrinters" :key="index" class="printer-item">
                  <div class="printer-info">
                    <div class="printer-icon">
                      <i :class="['status-indicator', printer.status]"></i>
                    </div>
                    <div class="printer-name">{{ printer.name }}</div>
                  </div>
                  <div class="printer-details">
                    <div class="filament-levels">
                      <div v-for="(filament, fIndex) in printer.filaments" :key="fIndex" class="filament-item">
                        <span class="filament-label">{{ filament.color }}</span>
                        <div class="progress-bar">
                          <div 
                            class="progress-value" 
                            :style="{ width: filament.level + '%', backgroundColor: getColorCode(filament.color) }"
                          ></div>
                        </div>
                        <span class="filament-percentage">{{ filament.level }}%</span>
                      </div>
                    </div>
                    <div class="printer-actions">
                      <button @click="viewPrinterDetails(printer)" class="action-btn details-btn">Details</button>
                      <button @click="managePrinter(printer)" class="action-btn manage-btn">Manage</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- Filament Inventory -->
            <div class="card inventory-card">
              <h3>Filament Inventory</h3>
              <div class="inventory-list">
                <div v-for="(filament, index) in filamentInventory" :key="index" class="inventory-item">
                  <div class="filament-color" :style="{ backgroundColor: getColorCode(filament.color) }"></div>
                  <div class="filament-info">
                    <span class="filament-name">{{ filament.name }}</span>
                    <span class="filament-type">{{ filament.type }}</span>
                  </div>
                  <div class="stock-level">
                    <div class="progress-bar">
                      <div 
                        class="progress-value" 
                        :style="{ width: filament.stock + '%', backgroundColor: getColorCode(filament.color) }"
                      ></div>
                    </div>
                    <span class="stock-percentage">{{ filament.stock }}%</span>
                  </div>
                  <button @click="reorderFilament(filament)" class="reorder-btn" :disabled="filament.stock > 30">
                    {{ filament.stock <= 30 ? 'Reorder' : 'In Stock' }}
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Maintenance Schedule -->
            <div class="card schedule-card">
              <h3>Maintenance Schedule</h3>
              <div class="schedule-list">
                <div v-for="(task, index) in maintenanceTasks" :key="index" class="schedule-item">
                  <div class="task-info">
                    <span class="task-name">{{ task.description }}</span>
                    <span class="task-printer">{{ task.printer }}</span>
                  </div>
                  <div class="task-date">{{ formatDate(task.date) }}</div>
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
  import { ref, computed, onMounted } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  const searchQuery = ref('')
  
  // Sample printer data
  const printers = ref([
    {
      id: 1,
      name: 'Prusa i3 MK3S+',
      status: 'online',
      filaments: [
        { color: 'black', level: 89 },
        { color: 'cyan', level: 89 },
        { color: 'magenta', level: 86 },
        { color: 'yellow', level: 86 }
      ]
    },
    {
      id: 2,
      name: 'Creality Ender 3 Pro',
      status: 'offline',
      filaments: [
        { color: 'black', level: 40 }
      ]
    },
    {
      id: 3,
      name: 'Artillery Sidewinder X1',
      status: 'maintenance',
      filaments: [
        { color: 'black', level: 65 },
        { color: 'white', level: 72 }
      ]
    },
    {
      id: 4,
      name: 'Anycubic Mega S',
      status: 'online',
      filaments: [
        { color: 'black', level: 34 },
        { color: 'cyan', level: 81 },
        { color: 'magenta', level: 75 },
        { color: 'yellow', level: 62 }
      ]
    }
  ])
  
  // Sample filament inventory
  const filamentInventory = ref([
    { id: 1, name: 'PLA Black', color: 'black', type: 'PLA', stock: 85 },
    { id: 2, name: 'PLA Cyan', color: 'cyan', type: 'PLA', stock: 65 },
    { id: 3, name: 'PLA Magenta', color: 'magenta', type: 'PLA', stock: 50 },
    { id: 4, name: 'PLA Yellow', color: 'yellow', type: 'PLA', stock: 25 },
    { id: 5, name: 'PETG Black', color: 'black', type: 'PETG', stock: 90 },
    { id: 6, name: 'TPU White', color: 'white', type: 'TPU', stock: 15 }
  ])
  
  // Sample maintenance tasks
  const maintenanceTasks = ref([
    { id: 1, description: 'Nozzle Replacement', printer: 'Prusa i3 MK3S+', date: new Date(2025, 4, 10), status: 'pending' },
    { id: 2, description: 'Belt Tightening', printer: 'Creality Ender 3 Pro', date: new Date(2025, 4, 12), status: 'pending' },
    { id: 3, description: 'Bed Leveling', printer: 'Artillery Sidewinder X1', date: new Date(2025, 4, 8), status: 'pending' },
    { id: 4, description: 'Extruder Cleaning', printer: 'Anycubic Mega S', date: new Date(2025, 4, 7), status: 'completed' }
  ])
  
  // Filtered printers based on search
  const filteredPrinters = ref([...printers.value])
  
  // Active printers calculation
  const activePrinters = computed(() => {
    return printers.value.filter(printer => printer.status === 'online').length
  })
  
  const activePrinterPercentage = computed(() => {
    return Math.round((activePrinters.value / printers.value.length) * 100)
  })
  
  // Filter printers based on search query
  const filterPrinters = () => {
    if (!searchQuery.value) {
      filteredPrinters.value = [...printers.value]
      return
    }
    
    const query = searchQuery.value.toLowerCase()
    filteredPrinters.value = printers.value.filter(printer => 
      printer.name.toLowerCase().includes(query)
    )
  }
  
  // Get color code from color name
  const getColorCode = (color) => {
    const colorMap = {
      black: '#000000',
      cyan: '#00BFFF',
      magenta: '#FF00FF',
      yellow: '#FFFF00',
      white: '#FFFFFF'
    }
    
    return colorMap[color.toLowerCase()] || '#777777'
  }
  
  // Format date for display
  const formatDate = (date) => {
    const options = { month: 'short', day: 'numeric' }
    return new Date(date).toLocaleDateString('en-US', options)
  }
  
  // View printer details
  const viewPrinterDetails = (printer) => {
    router.push(`/printers/${printer.id}`)
  }
  
  // Manage printer
  const managePrinter = (printer) => {
    router.push(`/printers/${printer.id}/manage`)
  }
  
  // Reorder filament
  const reorderFilament = (filament) => {
    // Implement reorder logic
    alert(`Reordering ${filament.name}`)
  }
  
  // Complete maintenance task
  const completeTask = (task) => {
    task.status = 'completed'
  }
  
  // Handle logout
  const handleLogout = () => {
    // Add your logout logic here
    router.push('/login')
  }
  
  // Lifecycle hooks
  onMounted(() => {
    // Add any initialization code here
  })
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
  
  .nav-item {
    display: flex;
    align-items: center;
    padding: 12px 24px;
    color: #a0a0a0;
    text-decoration: none;
    transition: all 0.3s ease;
    margin-bottom: 5px;
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
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 576 512'%3E%3Cpath d='M575.8 255.5c0 18-15 32.1-32 32.1h-32l.7 160.2c0 2.7-.2 5.4-.5 8.1V472c0 22.1-17.9 40-40 40H456c-1.1 0-2.2 0-3.3-.1c-1.4 .1-2.8 .1-4.2 .1H416 392c-22.1 0-40-17.9-40-40V448 384c0-17.7-14.3-32-32-32H256c-17.7 0-32 14.3-32 32v64 24c0 22.1-17.9 40-40 40H160 128.1c-1.5 0-3-.1-4.5-.2c-1.2 .1-2.4 .2-3.6 .2H104c-22.1 0-40-17.9-40-40V360c0-.9 0-1.9 .1-2.8V287.6H32c-18 0-32-14-32-32.1c0-9 3-17 10-24L266.4 8c7-7 15-8 22-8s15 2 21 7L564.8 231.5c8 7 12 15 11 24z'/%3E%3C/svg%3E");
  }
  
  .printer-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M128 0C92.7 0 64 28.7 64 64v96h64V64H354.7L384 93.3V160h64V93.3c0-17-6.7-33.3-18.7-45.3L400 18.7C388 6.7 371.7 0 354.7 0H128zM384 352v32 64H128V384 368 352H384zm64 32h32c17.7 0 32-14.3 32-32V256c0-35.3-28.7-64-64-64H64c-35.3 0-64 28.7-64 64v96c0 17.7 14.3 32 32 32H64v64c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V384zM432 248a24 24 0 1 1 0 48 24 24 0 1 1 0-48z'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M128 0C92.7 0 64 28.7 64 64v96h64V64H354.7L384 93.3V160h64V93.3c0-17-6.7-33.3-18.7-45.3L400 18.7C388 6.7 371.7 0 354.7 0H128zM384 352v32 64H128V384 368 352H384zm64 32h32c17.7 0 32-14.3 32-32V256c0-35.3-28.7-64-64-64H64c-35.3 0-64 28.7-64 64v96c0 17.7 14.3 32 32 32H64v64c0 35.3 28.7 64 64 64H384c35.3 0 64-28.7 64-64V384zM432 248a24 24 0 1 1 0 48 24 24 0 1 1 0-48z'/%3E%3C/svg%3E");
  }
  
  .filament-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M234.5 5.7c13.9-5 29.1-5 43.1 0l192 68.6C495 83.4 512 107.5 512 134.6V377.4c0 27-17 51.2-42.5 60.3l-192 68.6c-13.9 5-29.1 5-43.1 0l-192-68.6C17 428.6 0 404.5 0 377.4V134.6c0-27 17-51.2 42.5-60.3l192-68.6zM256 66L82.3 128 256 190l173.7-62L256 66zm32 368.6l160-57.1v-188L288 246.6v188z'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M234.5 5.7c13.9-5 29.1-5 43.1 0l192 68.6C495 83.4 512 107.5 512 134.6V377.4c0 27-17 51.2-42.5 60.3l-192 68.6c-13.9 5-29.1 5-43.1 0l-192-68.6C17 428.6 0 404.5 0 377.4V134.6c0-27 17-51.2 42.5-60.3l192-68.6zM256 66L82.3 128 256 190l173.7-62L256 66zm32 368.6l160-57.1v-188L288 246.6v188z'/%3E%3C/svg%3E");
  }
  
  .maintenance-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.3-20.7-3.7-30.5c-2.4-9.8-16.5-14.3-23.4-7.3L448 144l-96 96 32 32 96-96 37.8-37.8c7-7 2.5-21-7.3-23.4c-9.8-2.4-20-3.7-30.5-3.7z'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M78.6 5C69.1-2.4 55.6-1.5 47 7L7 47c-8.5 8.5-9.4 22-2.1 31.6l80 104c4.5 5.9 11.6 9.4 19 9.4h54.1l109 109c-14.7 29-10 65.4 14.3 89.6l112 112c12.5 12.5 32.8 12.5 45.3 0l64-64c12.5-12.5 12.5-32.8 0-45.3l-112-112c-24.2-24.2-60.6-29-89.6-14.3l-109-109V104c0-7.5-3.5-14.5-9.4-19L78.6 5zM19.9 396.1C7.2 408.8 0 426.1 0 444.1C0 481.6 30.4 512 67.9 512c18 0 35.3-7.2 48-19.9L233.7 374.3c-7.8-20.9-9-43.6-3.6-65.1l-61.7-61.7L19.9 396.1zM512 144c0-10.5-1.3-20.7-3.7-30.5c-2.4-9.8-16.5-14.3-23.4-7.3L448 144l-96 96 32 32 96-96 37.8-37.8c7-7 2.5-21-7.3-23.4c-9.8-2.4-20-3.7-30.5-3.7z'/%3E%3C/svg%3E");
  }
  
  .settings-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 512 512'%3E%3Cpath d='M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z'/%3E%3C/svg%3E");
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
  
  .printer-list,
  .inventory-list,
  .schedule-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .printer-item,
  .inventory-item,
  .schedule-item {
    background-color: #1a1a1a;
    border-radius: 6px;
    padding: 15px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
  .printer-info {
    display: flex;
    align-items: center;
    gap: 15px;
  }
  
  .printer-icon {
    width: 40px;
    height: 40px;
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
    position: absolute;
  }
  
  .status-indicator.online {
    background-color: #4caf50;
  }
  
  .status-indicator.offline {
    background-color: #f44336;
  }
  
  .status-indicator.maintenance {
    background-color: #ff9800;
  }
  
  .printer-name {
    font-size: 16px;
    font-weight: 500;
    color: #e0e0e0;
  }
  
  .printer-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .filament-levels {
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
  }
  
  .filament-item {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .filament-label {
    width: 70px;
    font-size: 14px;
    color: #a0a0a0;
    text-transform: capitalize;
  }
  
  .progress-bar {
    flex: 1;
    height: 8px;
    background-color: #444;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-value {
    height: 100%;
    border-radius: 4px;
    transition: width 0.3s ease;
  }
  
  .filament-percentage {
    width: 40px;
    font-size: 14px;
    color: #a0a0a0;
    text-align: right;
  }
  
  .printer-actions {
    display: flex;
    gap: 10px;
  }
  
  .action-btn {
    padding: 8px 15px;
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
  
  .inventory-item {
    flex-direction: row;
    align-items: center;
    gap: 15px;
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
  
  .stock-level .progress-bar {
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
  
  .schedule-item {
    flex-direction: row;
    align-items: center;
    gap: 15px;
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
  
  @media (max-width: 1200px) {
    .dashboard-grid {
      grid-template-columns: repeat(2, 1fr);
    }
  
    .table-card,
    .inventory-card,
    .schedule-card {
      grid-column: span 2;
    }
  }
  
  @media (max-width: 768px) {
    .dashboard-grid {
      grid-template-columns: 1fr;
    }
  
    .table-card,
    .inventory-card,
    .schedule-card {
      grid-column: span 1;
    }
  
    .sidebar {
      width: 0;
      transform: translateX(-100%);
      transition: transform 0.3s ease;
    }
  
    .sidebar.active {
      width: 240px;
      transform: translateX(0);
    }
  
    .main-content {
      margin-left: 0;
      transition: margin-left 0.3s ease;
    }
  
    .main-content.sidebar-active {
      margin-left: 240px;
    }
  
    .printer-details {
      flex-direction: column;
      gap: 15px;
      align-items: flex-start;
    }
  
    .printer-actions {
      width: 100%;
      justify-content: flex-end;
    }
  
    .inventory-item,
    .schedule-item {
      flex-direction: column;
      align-items: flex-start;
    }
  
    .stock-level {
      width: 100%;
    }
  
    .reorder-btn,
    .complete-btn {
      align-self: flex-end;
    }
  }
  </style>