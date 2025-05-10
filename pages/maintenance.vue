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
            <router-link to="/filaments" class="nav-item">
              <i class="nav-icon filament-icon"></i>
              <span>Filaments</span>
            </router-link>
            <router-link to="/maintenance" class="nav-item active">
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
            <h1>Maintenance</h1>
            <button @click="openAddMaintenanceModal" class="add-btn">+ Add Maintenance</button>
          </div>
  
          <!-- Tabs -->
          <div class="tabs-container">
            <div class="tabs">
              <button 
                v-for="tab in tabs" 
                :key="tab.id"
                @click="switchTab(tab.id)"
                :class="['tab', { active: activeTab === tab.id }]"
              >
                {{ tab.label }}
              </button>
            </div>
            
            <div class="tab-content">
              <!-- Scheduled Maintenance Tab -->
              <div v-if="activeTab === 'scheduled'" class="tab-panel">
                <div class="maintenance-grid">
                  <div 
                    v-for="maintenance in scheduledMaintenance" 
                    :key="maintenance.id" 
                    class="maintenance-card"
                  >
                    <div class="maintenance-header">
                      <div class="maintenance-title">{{ maintenance.title }}</div>
                      <span :class="['status-badge', maintenance.status.toLowerCase()]">
                        {{ maintenance.status }}
                      </span>
                    </div>
                    <div class="maintenance-details">
                      <div class="detail-item">
                        <span class="detail-label">{{ getDueDateLabel(maintenance.status) }}</span>
                        <span class="detail-value">{{ formatDate(maintenance.dueDate) }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Assigned To</span>
                        <span class="detail-value">{{ maintenance.assignedTo }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">{{ getTimeLabel(maintenance.status) }}</span>
                        <span class="detail-value">{{ maintenance.time }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">{{ getAdditionalInfoLabel(maintenance.status) }}</span>
                        <span class="detail-value">{{ maintenance.additionalInfo }}</span>
                      </div>
                    </div>
                    <div class="maintenance-actions">
                      <button 
                        v-if="maintenance.status === 'Pending' || maintenance.status === 'Overdue'"
                        @click="startMaintenance(maintenance)"
                        class="action-btn start-btn"
                      >
                        Start Task
                      </button>
                      <button 
                        v-if="maintenance.status === 'In Progress'"
                        @click="completeMaintenance(maintenance)"
                        class="action-btn complete-btn"
                      >
                        Mark Complete
                      </button>
                      <button 
                        @click="viewMaintenanceDetails(maintenance)"
                        class="action-btn view-btn"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- Supplies Tab -->
              <div v-else-if="activeTab === 'supplies'" class="tab-panel">
                <div class="supplies-grid">
                  <div 
                    v-for="supply in maintenanceSupplies" 
                    :key="supply.id" 
                    class="supply-card"
                  >
                    <div class="supply-header">
                      <div class="maintenance-title">{{ supply.name }}</div>
                      <span :class="['status-badge', getSupplyStatusClass(supply)]">
                        {{ getSupplyStatus(supply) }}
                      </span>
                    </div>
                    <div class="maintenance-details">
                      <div class="detail-item">
                        <span class="detail-label">Current Stock</span>
                        <span class="detail-value">{{ supply.currentStock }} {{ supply.unit }}</span>
                      </div>
                      <div class="detail-item">
                        <span class="detail-label">Minimum Level</span>
                        <span class="detail-value">{{ supply.minimumLevel }} {{ supply.unit }}</span>
                      </div>
                    </div>
                    <div class="stock-progress">
                      <div 
                        :class="['stock-fill', getStockFillClass(supply)]" 
                        :style="{ width: getStockPercentage(supply) + '%' }"
                      ></div>
                    </div>
                    <div class="maintenance-actions">
                      <button 
                        @click="reorderSupply(supply)"
                        :class="['action-btn', getReorderButtonClass(supply)]"
                      >
                        {{ getReorderButtonText(supply) }}
                      </button>
                      <button 
                        @click="updateStock(supply)"
                        class="action-btn view-btn"
                      >
                        Update Stock
                      </button>
                    </div>
                  </div>
                </div>
              </div>
  
              <!-- History Tab -->
              <div v-else-if="activeTab === 'history'" class="tab-panel">
                <table class="history-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Printer</th>
                      <th>Maintenance Task</th>
                      <th>Performed By</th>
                      <th>Duration</th>
                      <th>Status</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr v-for="record in maintenanceHistory" :key="record.id">
                      <td>{{ formatDate(record.date) }}</td>
                      <td>{{ record.printer }}</td>
                      <td>{{ record.task }}</td>
                      <td>{{ record.performedBy }}</td>
                      <td>{{ record.duration }}</td>
                      <td>
                        <span :class="['status-badge', record.status.toLowerCase()]">
                          {{ record.status }}
                        </span>
                      </td>
                      <td>{{ record.notes || '-' }}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
  
          <!-- Add Maintenance Modal -->
          <div :class="['modal', { active: showAddModal }]">
            <div class="modal-content">
              <div class="modal-header">
                <h2 class="modal-title">Add Maintenance Task</h2>
                <button @click="closeAddModal" class="close-btn">&times;</button>
              </div>
              <form @submit.prevent="submitMaintenanceTask">
                <div class="form-group">
                  <label class="form-label">Printer</label>
                  <select v-model="newMaintenance.printer" class="form-control" required>
                    <option value="">Select Printer</option>
                    <option v-for="printer in printers" :key="printer.id" :value="printer.id">
                      {{ printer.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Task Type</label>
                  <select v-model="newMaintenance.type" class="form-control" required>
                    <option value="">Select Task</option>
                    <option value="nozzle-replacement">Nozzle Replacement</option>
                    <option value="bed-leveling">Bed Leveling</option>
                    <option value="belt-tension">Belt Tension Check</option>
                    <option value="cleaning">Cleaning</option>
                    <option value="lubrication">Lubrication</option>
                    <option value="firmware-update">Firmware Update</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div class="form-group" v-if="newMaintenance.type === 'other'">
                  <label class="form-label">Custom Task Description</label>
                  <input v-model="newMaintenance.customTask" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Due Date</label>
                  <input v-model="newMaintenance.dueDate" type="date" class="form-control" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Assigned To</label>
                  <select v-model="newMaintenance.assignedTo" class="form-control" required>
                    <option value="">Select Person</option>
                    <option v-for="person in staff" :key="person.id" :value="person.id">
                      {{ person.name }}
                    </option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Priority</label>
                  <select v-model="newMaintenance.priority" class="form-control" required>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div class="form-group">
                  <label class="form-label">Estimated Time</label>
                  <input v-model="newMaintenance.estimatedTime" type="text" class="form-control" placeholder="e.g., 30 minutes" required>
                </div>
                <div class="form-group">
                  <label class="form-label">Notes</label>
                  <textarea v-model="newMaintenance.notes" class="form-control" rows="3"></textarea>
                </div>
                <div class="modal-actions">
                  <button type="submit" class="submit-btn">Create Task</button>
                  <button type="button" @click="closeAddModal" class="action-btn view-btn">Cancel</button>
                </div>
              </form>
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

// Reactive data
const activeTab = ref('scheduled');
const showAddModal = ref(false);
const printers = ref([]);
const scheduledMaintenance = ref([]);
const maintenanceSupplies = ref([]);
const maintenanceHistory = ref([]);
const staff = ref([]);

// Form data for new maintenance
const newMaintenance = ref({
  printer: '',
  type: '',
  customTask: '',
  dueDate: '',
  assignedTo: '',
  priority: 'medium',
  estimatedTime: '',
  notes: ''
});

// Tab configuration
const tabs = [
  { id: 'scheduled', label: 'Scheduled Maintenance' },
  { id: 'supplies', label: 'Supplies' },
  { id: 'history', label: 'History' }
];

// Fetch data methods
const fetchMaintenanceData = async () => {
  try {
    const baseUrl = window.location.origin;
    
    // Fetch scheduled maintenance
    const scheduledResponse = await fetch(`${baseUrl}/api/maintenance/scheduled`);
    if (!scheduledResponse.ok) throw new Error('Failed to fetch scheduled maintenance');
    scheduledMaintenance.value = await scheduledResponse.json();
    
    // Fetch supplies
    const suppliesResponse = await fetch(`${baseUrl}/api/maintenance/supplies`);
    if (!suppliesResponse.ok) throw new Error('Failed to fetch supplies');
    maintenanceSupplies.value = await suppliesResponse.json();
    
    // Fetch history
    const historyResponse = await fetch(`${baseUrl}/api/maintenance/history`);
    if (!historyResponse.ok) throw new Error('Failed to fetch history');
    maintenanceHistory.value = await historyResponse.json();
    
    // Fetch printers for the dropdown
    const printersResponse = await fetch(`${baseUrl}/api/printers`);
    if (!printersResponse.ok) throw new Error('Failed to fetch printers');
    printers.value = await printersResponse.json();
    
    // Fetch staff
    const staffResponse = await fetch(`${baseUrl}/api/staff`);
    if (!staffResponse.ok) throw new Error('Failed to fetch staff');
    staff.value = await staffResponse.json();
    
  } catch (err) {
    console.error('Failed to load maintenance data:', err);
    // Set mock data for testing
    setMockData();
  }
};

// Mock data for testing
const setMockData = () => {
  scheduledMaintenance.value = [
    {
      id: 1,
      title: 'Printer-001 - Nozzle Replacement',
      status: 'Pending',
      dueDate: '2025-05-15',
      assignedTo: 'John Smith',
      time: '30 minutes',
      additionalInfo: 'High',
      printer: 'Printer-001'
    },
    {
      id: 2,
      title: 'Printer-003 - Bed Leveling',
      status: 'In Progress',
      dueDate: '2025-05-10 14:30',
      assignedTo: 'Sarah Johnson',
      time: '65%',
      additionalInfo: '16:00',
      printer: 'Printer-003'
    },
    {
      id: 3,
      title: 'Printer-002 - Belt Tension Check',
      status: 'Overdue',
      dueDate: '2025-05-08',
      assignedTo: 'Mike Davis',
      time: '45 minutes',
      additionalInfo: 'Medium',
      printer: 'Printer-002'
    }
  ];

  maintenanceSupplies.value = [
    {
      id: 1,
      name: 'Brass Nozzles (0.4mm)',
      currentStock: 25,
      minimumLevel: 5,
      unit: 'units'
    },
    {
      id: 2,
      name: 'Bed Adhesive',
      currentStock: 3,
      minimumLevel: 5,
      unit: 'bottles'
    },
    {
      id: 3,
      name: 'Cleaning Solution',
      currentStock: 0,
      minimumLevel: 3,
      unit: 'bottles'
    }
  ];

  maintenanceHistory.value = [
    {
      id: 1,
      date: '2025-05-08',
      printer: 'Printer-001',
      task: 'Nozzle Replacement',
      performedBy: 'John Smith',
      duration: '25 minutes',
      status: 'Completed',
      notes: 'Replaced 0.4mm brass nozzle'
    },
    {
      id: 2,
      date: '2025-05-07',
      printer: 'Printer-003',
      task: 'Bed Leveling',
      performedBy: 'Sarah Johnson',
      duration: '40 minutes',
      status: 'Completed',
      notes: 'Bed was significantly out of level'
    },
    {
      id: 3,
      date: '2025-05-05',
      printer: 'Printer-002',
      task: 'Cleaning',
      performedBy: 'Mike Davis',
      duration: '60 minutes',
      status: 'Completed',
      notes: 'Full cleaning and lubrication'
    }
  ];

  printers.value = [
    { id: 1, name: 'Printer-001' },
    { id: 2, name: 'Printer-002' },
    { id: 3, name: 'Printer-003' }
  ];

  staff.value = [
    { id: 1, name: 'John Smith' },
    { id: 2, name: 'Sarah Johnson' },
    { id: 3, name: 'Mike Davis' }
  ];
};

// Tab switching
const switchTab = (tabId) => {
  activeTab.value = tabId;
};

// Modal methods
const openAddMaintenanceModal = () => {
  showAddModal.value = true;
};

const closeAddModal = () => {
  showAddModal.value = false;
  resetNewMaintenanceForm();
};

const resetNewMaintenanceForm = () => {
  newMaintenance.value = {
    printer: '',
    type: '',
    customTask: '',
    dueDate: '',
    assignedTo: '',
    priority: 'medium',
    estimatedTime: '',
    notes: ''
  };
};

// Maintenance actions
const startMaintenance = async (maintenance) => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/${maintenance.id}/start`, {
      method: 'POST'
    });
    
    if (response.ok) {
      // Refresh data
      await fetchMaintenanceData();
    }
  } catch (err) {
    console.error('Failed to start maintenance:', err);
  }
};

const completeMaintenance = async (maintenance) => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/${maintenance.id}/complete`, {
      method: 'POST'
    });
    
    if (response.ok) {
      // Refresh data
      await fetchMaintenanceData();
    }
  } catch (err) {
    console.error('Failed to complete maintenance:', err);
  }
};

const viewMaintenanceDetails = (maintenance) => {
  router.push(`/maintenance/${maintenance.id}`);
};

// Supplies actions
const reorderSupply = async (supply) => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/supplies/${supply.id}/reorder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        quantity: supply.minimumLevel * 2 // Order double the minimum level
      })
    });
    
    if (response.ok) {
      console.log('Reorder request submitted');
    }
  } catch (err) {
    console.error('Failed to reorder supply:', err);
  }
};

const updateStock = (supply) => {
  // TODO: Open modal to update stock levels
  console.log('Update stock for:', supply.name);
};

// Submit new maintenance task
const submitMaintenanceTask = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newMaintenance.value)
    });
    
    if (response.ok) {
      closeAddModal();
      await fetchMaintenanceData();
    }
  } catch (err) {
    console.error('Failed to create maintenance task:', err);
  }
};

// Utility methods
const formatDate = (date) => {
  if (!date) return '-';
  return new Date(date).toLocaleString();
};

const getDueDateLabel = (status) => {
  if (status === 'In Progress') return 'Started';
  return 'Due Date';
};

const getTimeLabel = (status) => {
  if (status === 'In Progress') return 'Progress';
  return 'Estimated Time';
};

const getAdditionalInfoLabel = (status) => {
  if (status === 'In Progress') return 'Est. Completion';
  if (status === 'Overdue') return 'Priority';
  return 'Priority';
};

const getSupplyStatus = (supply) => {
  const percentage = getStockPercentage(supply);
  if (percentage === 0) return 'Critical';
  if (percentage < 40) return 'Low Stock';
  return 'In Stock';
};

const getSupplyStatusClass = (supply) => {
  const percentage = getStockPercentage(supply);
  if (percentage === 0) return 'overdue';
  if (percentage < 40) return 'pending';
  return 'completed';
};

const getStockPercentage = (supply) => {
  if (supply.minimumLevel === 0) return 100;
  return Math.min(100, Math.round((supply.currentStock / (supply.minimumLevel * 2)) * 100));
};

const getStockFillClass = (supply) => {
  const percentage = getStockPercentage(supply);
  if (percentage === 0) return 'critical';
  if (percentage < 40) return 'low';
  return '';
};

const getReorderButtonClass = (supply) => {
  const percentage = getStockPercentage(supply);
  if (percentage === 0) return 'cancel-btn';
  if (percentage < 40) return 'start-btn';
  return 'view-btn';
};

const getReorderButtonText = (supply) => {
  const percentage = getStockPercentage(supply);
  if (percentage === 0) return 'Urgent Reorder';
  if (percentage < 40) return 'Reorder Now';
  return 'Reorder';
};

// Logout method
const handleLogout = () => {
  router.push('/login');
};

// Lifecycle hooks
onMounted(() => {
  fetchMaintenanceData();
});

// Watch for tab changes to refresh data
// watch(activeTab, () => {
//   fetchMaintenanceData();
// });
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

.add-btn {
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.add-btn:hover {
  background-color: #1565c0;
}

.tabs-container {
  background-color: #222;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.tabs {
  display: flex;
  border-bottom: 1px solid #333;
}

.tab {
  padding: 15px 20px;
  background-color: transparent;
  border: none;
  color: #a0a0a0;
  cursor: pointer;
  transition: all 0.3s ease;
  flex: 1;
  text-align: center;
}

.tab.active {
  color: #1e88e5;
  border-bottom: 2px solid #1e88e5;
  background-color: #1a1a1a;
}

.tab-content {
  padding: 20px;
}

.maintenance-grid {
  display: grid;
  gap: 20px;
}

.maintenance-card {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.maintenance-title {
  font-size: 16px;
  font-weight: 500;
  color: #e0e0e0;
}

.status-badge {
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  text-transform: capitalize;
}

.status-badge.pending {
  background-color: #ff9800;
  color: white;
}

.status-badge.in-progress {
  background-color: #2196f3;
  color: white;
}

.status-badge.completed {
  background-color: #4caf50;
  color: white;
}

.status-badge.overdue {
  background-color: #f44336;
  color: white;
}

.maintenance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 15px;
  color: #ccc;
  font-size: 14px;
}

.detail-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.detail-label {
  color: #888;
  font-size: 12px;
}

.detail-value {
  color: #e0e0e0;
}

.maintenance-actions {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.action-btn {
  padding: 8px 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-size: 13px;
}

.start-btn {
  background-color: #4caf50;
  color: white;
}

.start-btn:hover {
  background-color: #388e3c;
}

.complete-btn {
  background-color: #2196f3;
  color: white;
}

.complete-btn:hover {
  background-color: #1976d2;
}

.cancel-btn {
  background-color: #f44336;
  color: white;
}

.cancel-btn:hover {
  background-color: #d32f2f;
}

.view-btn {
  background-color: #555;
  color: white;
}

.view-btn:hover {
  background-color: #666;
}

.supplies-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.supply-card {
  background: #222;
  padding: 20px;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 15px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.supply-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stock-progress {
  height: 8px;
  background-color: #333;
  border-radius: 4px;
  overflow: hidden;
}

.stock-fill {
  height: 100%;
  background-color: #4caf50;
  transition: width 0.3s ease;
}

.stock-fill.low {
  background-color: #ff9800;
}

.stock-fill.critical {
  background-color: #f44336;
}

.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: none;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal.active {
  display: flex;
}

.modal-content {
  background-color: #222;
  padding: 30px;
  border-radius: 8px;
  width: 500px;
  max-width: 90vw;
  color: #e0e0e0;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.modal-title {
  font-size: 18px;
  font-weight: 500;
}

.close-btn {
  background: none;
  border: none;
  color: #a0a0a0;
  font-size: 24px;
  cursor: pointer;
}

.close-btn:hover {
  color: #e0e0e0;
}

.form-group {
  margin-bottom: 15px;
}

.form-label {
  display: block;
  margin-bottom: 5px;
  color: #ccc;
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 10px;
  border: 1px solid #444;
  border-radius: 4px;
  background-color: #2d2d2d;
  color: #e0e0e0;
  box-sizing: border-box;
}

.form-control:focus {
  outline: none;
  border-color: #1e88e5;
}

.form-control[type="date"] {
  color-scheme: dark;
}

.form-control textarea {
  resize: vertical;
  min-height: 80px;
}

.modal-actions {
  display: flex;
  gap: 10px;
  margin-top: 20px;
}

.submit-btn {
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.submit-btn:hover {
  background-color: #1565c0;
}

.history-table {
  width: 100%;
  border-collapse: collapse;
  background-color: #222;
  border-radius: 8px;
  overflow: hidden;
}

.history-table th,
.history-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #333;
}

.history-table th {
  background-color: #1a1a1a;
  color: #a0a0a0;
  font-weight: 500;
  font-size: 14px;
}

.history-table td {
  color: #e0e0e0;
}

.history-table tr:hover {
  background-color: #2d2d2d;
}

/* Responsive design */
@media (max-width: 768px) {
  .sidebar {
    width: 60px;
  }
  
  .nav-item span {
    display: none;
  }
  
  .logo-container {
    display: none;
  }
  
  .main-content {
    margin-left: 60px;
  }
  
  .maintenance-details,
  .supplies-grid {
    grid-template-columns: 1fr;
  }
  
  .history-table {
    display: block;
    overflow-x: auto;
    white-space: nowrap;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #222;
}

::-webkit-scrollbar-thumb {
  background: #444;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #555;
}

</style>