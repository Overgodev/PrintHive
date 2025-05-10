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
          <router-link to="/maintenance" class="nav-item">
            <i class="nav-icon maintenance-icon"></i>
            <span>Maintenance</span>
          </router-link>
          <router-link to="/settings" class="nav-item active">
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
          <h1>Settings</h1>
        </div>

        <div class="settings-container">
          <!-- General Settings Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>General Settings</h2>
              <button @click="saveSettings('general')" class="save-btn" :disabled="!hasChanges">
                Save Changes
              </button>
            </div>
            <div class="settings-card-body">
              <div class="settings-group">
                <label for="theme">Theme</label>
                <select id="theme" v-model="settings.general.theme" @change="markChanged('general')">
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="auto">Auto</option>
                </select>
              </div>
              
              <div class="settings-group">
                <label for="language">Language</label>
                <select id="language" v-model="settings.general.language" @change="markChanged('general')">
                  <option value="en">English</option>
                  <option value="es">Spanish</option>
                  <option value="fr">French</option>
                  <option value="de">German</option>
                </select>
              </div>
              
              <div class="settings-group">
                <label for="timezone">Timezone</label>
                <select id="timezone" v-model="settings.general.timezone" @change="markChanged('general')">
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Europe/London">London</option>
                  <option value="Europe/Paris">Paris</option>
                  <option value="Asia/Tokyo">Tokyo</option>
                </select>
              </div>
              
              <div class="settings-group">
                <label for="autoRefresh">Auto-refresh interval (seconds)</label>
                <input 
                  type="number" 
                  id="autoRefresh" 
                  v-model.number="settings.general.autoRefresh"
                  @input="markChanged('general')"
                  min="5" 
                  max="300"
                />
              </div>
            </div>
          </div>

          <!-- Notification Settings Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>Notifications</h2>
              <button @click="saveSettings('notifications')" class="save-btn" :disabled="!hasChanges">
                Save Changes
              </button>
            </div>
            <div class="settings-card-body">
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.notifications.printComplete"
                    @change="markChanged('notifications')"
                  />
                  <span class="toggle-slider"></span>
                  Print completion notifications
                </label>
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.notifications.printErrors"
                    @change="markChanged('notifications')"
                  />
                  <span class="toggle-slider"></span>
                  Print error notifications
                </label>
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.notifications.maintenance"
                    @change="markChanged('notifications')"
                  />
                  <span class="toggle-slider"></span>
                  Maintenance reminders
                </label>
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.notifications.filamentLow"
                    @change="markChanged('notifications')"
                  />
                  <span class="toggle-slider"></span>
                  Low filament warnings
                </label>
              </div>
              
              <div class="settings-group">
                <label for="email">Email notifications to</label>
                <input 
                  type="email" 
                  id="email" 
                  v-model="settings.notifications.email"
                  @input="markChanged('notifications')"
                  placeholder="Enter email address"
                />
              </div>
            </div>
          </div>

          <!-- Printer Default Settings Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>Printer Defaults</h2>
              <button @click="saveSettings('printers')" class="save-btn" :disabled="!hasChanges">
                Save Changes
              </button>
            </div>
            <div class="settings-card-body">
              <div class="settings-group">
                <label for="tempUnits">Temperature Units</label>
                <select id="tempUnits" v-model="settings.printers.tempUnits" @change="markChanged('printers')">
                  <option value="celsius">Celsius (°C)</option>
                  <option value="fahrenheit">Fahrenheit (°F)</option>
                </select>
              </div>
              
              <div class="settings-group">
                <label for="defaultHotend">Default Hotend Temperature</label>
                <input 
                  type="number" 
                  id="defaultHotend" 
                  v-model.number="settings.printers.defaultHotend"
                  @input="markChanged('printers')"
                  min="0" 
                  max="300"
                />
              </div>
              
              <div class="settings-group">
                <label for="defaultBed">Default Bed Temperature</label>
                <input 
                  type="number" 
                  id="defaultBed" 
                  v-model.number="settings.printers.defaultBed"
                  @input="markChanged('printers')"
                  min="0" 
                  max="150"
                />
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.printers.autoConnect"
                    @change="markChanged('printers')"
                  />
                  <span class="toggle-slider"></span>
                  Auto-connect to printers on startup
                </label>
              </div>
            </div>
          </div>

          <!-- Security Settings Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>Security</h2>
              <button @click="saveSettings('security')" class="save-btn" :disabled="!hasChanges">
                Save Changes
              </button>
            </div>
            <div class="settings-card-body">
              <div class="settings-group">
                <label for="sessionTimeout">Session timeout (minutes)</label>
                <input 
                  type="number" 
                  id="sessionTimeout" 
                  v-model.number="settings.security.sessionTimeout"
                  @input="markChanged('security')"
                  min="15" 
                  max="720"
                />
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.security.twoFactorAuth"
                    @change="markChanged('security')"
                  />
                  <span class="toggle-slider"></span>
                  Enable two-factor authentication
                </label>
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.security.apiKeyEnabled"
                    @change="markChanged('security')"
                  />
                  <span class="toggle-slider"></span>
                  Enable API key access
                </label>
              </div>
              
              <div v-if="settings.security.apiKeyEnabled" class="settings-group">
                <label>API Key</label>
                <div class="api-key-container">
                  <input 
                    type="text" 
                    :value="settings.security.apiKey"
                    readonly
                    class="api-key-input"
                  />
                  <button @click="generateApiKey" class="generate-key-btn">Generate New Key</button>
                </div>
              </div>
              
              <div class="settings-group">
                <button @click="changePassword" class="change-password-btn">Change Password</button>
              </div>
            </div>
          </div>

          <!-- Backup & Maintenance Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>Backup & Maintenance</h2>
            </div>
            <div class="settings-card-body">
              <div class="settings-group">
                <label>Data Backup</label>
                <div class="backup-controls">
                  <button @click="backupData" class="backup-btn">Download Backup</button>
                  <button @click="restoreData" class="restore-btn">Restore from Backup</button>
                  <input type="file" ref="restoreInput" @change="handleRestore" style="display: none" accept=".json,.zip">
                </div>
              </div>
              
              <div class="settings-group">
                <label>System Maintenance</label>
                <div class="maintenance-controls">
                  <button @click="clearCache" class="maintenance-btn">Clear Cache</button>
                  <button @click="exportLogs" class="maintenance-btn">Export Logs</button>
                  <button @click="runDiagnostics" class="maintenance-btn">Run Diagnostics</button>
                </div>
              </div>
              
              <div class="settings-group">
                <label class="toggle-label">
                  <input 
                    type="checkbox" 
                    v-model="settings.backup.autoBackup"
                    @change="markChanged('backup')"
                  />
                  <span class="toggle-slider"></span>
                  Enable automatic daily backups
                </label>
              </div>
            </div>
          </div>

          <!-- About Card -->
          <div class="settings-card">
            <div class="settings-card-header">
              <h2>About PrintHive</h2>
            </div>
            <div class="settings-card-body">
              <div class="about-section">
                <div class="about-item">
                  <span class="about-label">Version:</span>
                  <span class="about-value">{{ systemInfo.version }}</span>
                </div>
                <div class="about-item">
                  <span class="about-label">License:</span>
                  <span class="about-value">{{ systemInfo.license }}</span>
                </div>
                <div class="about-item">
                  <span class="about-label">Last Updated:</span>
                  <span class="about-value">{{ systemInfo.lastUpdated }}</span>
                </div>
                <div class="about-item">
                  <span class="about-label">Support:</span>
                  <span class="about-value">
                    <a href="mailto:support@printhive.com" class="support-link">support@printhive.com</a>
                  </span>
                </div>
              </div>
              <div class="about-actions">
                <button @click="checkUpdates" class="update-btn">Check for Updates</button>
                <button @click="viewLicense" class="license-btn">View License</button>
              </div>
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

// Settings state
const settings = ref({
  general: {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    autoRefresh: 30
  },
  notifications: {
    printComplete: true,
    printErrors: true,
    maintenance: true,
    filamentLow: true,
    email: ''
  },
  printers: {
    tempUnits: 'celsius',
    defaultHotend: 200,
    defaultBed: 60,
    autoConnect: true
  },
  security: {
    sessionTimeout: 60,
    twoFactorAuth: false,
    apiKeyEnabled: false,
    apiKey: ''
  },
  backup: {
    autoBackup: false
  }
});

const systemInfo = ref({
  version: '2.1.0',
  license: 'MIT License',
  lastUpdated: '2025-05-01',
  support: 'support@printhive.com'
});

const originalSettings = ref({});
const hasChanges = computed(() => {
  return JSON.stringify(settings.value) !== JSON.stringify(originalSettings.value);
});

// Load settings
const loadSettings = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/settings`);
    if (!response.ok) throw new Error('Failed to load settings');
    const data = await response.json();
    settings.value = { ...data };
    originalSettings.value = JSON.parse(JSON.stringify(data));
  } catch (err) {
    console.error('Failed to load settings:', err);
    // Use default settings
    originalSettings.value = JSON.parse(JSON.stringify(settings.value));
  }
};

// Track changes
const markChanged = (section) => {
  // Settings are automatically tracked via reactive state
};

// Save settings
const saveSettings = async (section) => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/settings/${section}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(settings.value[section])
    });
    
    if (!response.ok) throw new Error('Failed to save settings');
    
    // Update original settings
    originalSettings.value[section] = JSON.parse(JSON.stringify(settings.value[section]));
    
    // Show success notification
    showNotification('Settings saved successfully', 'success');
  } catch (err) {
    console.error('Failed to save settings:', err);
    showNotification('Failed to save settings', 'error');
  }
};

// Generate API key
const generateApiKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  settings.value.security.apiKey = result;
  markChanged('security');
};

// Change password
const changePassword = () => {
  router.push('/change-password');
};

// Backup and restore
const backupData = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/backup`);
    if (!response.ok) throw new Error('Failed to create backup');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printhive-backup-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Backup downloaded successfully', 'success');
  } catch (err) {
    console.error('Failed to create backup:', err);
    showNotification('Failed to create backup', 'error');
  }
};

const restoreData = () => {
  const input = document.querySelector('input[type="file"]');
  input.click();
};

const handleRestore = async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  
  const formData = new FormData();
  formData.append('backup', file);
  
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/restore`, {
      method: 'POST',
      body: formData
    });
    
    if (!response.ok) throw new Error('Failed to restore backup');
    
    showNotification('Backup restored successfully', 'success');
    // Reload page to reflect changes
    setTimeout(() => window.location.reload(), 1500);
  } catch (err) {
    console.error('Failed to restore backup:', err);
    showNotification('Failed to restore backup', 'error');
  }
};

// Maintenance functions
const clearCache = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/maintenance/clear-cache`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Failed to clear cache');
    
    showNotification('Cache cleared successfully', 'success');
  } catch (err) {
    console.error('Failed to clear cache:', err);
    showNotification('Failed to clear cache', 'error');
  }
};

const exportLogs = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/logs/export`);
    if (!response.ok) throw new Error('Failed to export logs');
    
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `printhive-logs-${new Date().toISOString().split('T')[0]}.zip`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Logs exported successfully', 'success');
  } catch (err) {
    console.error('Failed to export logs:', err);
    showNotification('Failed to export logs', 'error');
  }
};

const runDiagnostics = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/diagnostics/run`, {
      method: 'POST'
    });
    
    if (!response.ok) throw new Error('Failed to run diagnostics');
    
    const result = await response.json();
    // Here you might want to show the diagnostics results in a modal
    showNotification('Diagnostics completed successfully', 'success');
  } catch (err) {
    console.error('Failed to run diagnostics:', err);
    showNotification('Failed to run diagnostics', 'error');
  }
};

// About functions
const checkUpdates = async () => {
  try {
    const baseUrl = window.location.origin;
    const response = await fetch(`${baseUrl}/api/updates/check`);
    if (!response.ok) throw new Error('Failed to check for updates');
    
    const result = await response.json();
    if (result.updateAvailable) {
      showNotification(`New version ${result.latestVersion} available!`, 'info');
    } else {
      showNotification('You are running the latest version', 'success');
    }
  } catch (err) {
    console.error('Failed to check for updates:', err);
    showNotification('Failed to check for updates', 'error');
  }
};

const viewLicense = () => {
  window.open('/license.html', '_blank');
};

// Utility function for notifications
const showNotification = (message, type) => {
  // You would implement your notification system here
  console.log(`${type}: ${message}`);
};

const handleLogout = () => {
  router.push('/login');
};

onMounted(() => {
  loadSettings();
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

.settings-container {
  display: flex;
  flex-direction: column;
  gap: 20px;
  max-width: 900px;
}

.settings-card {
  background: #222;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.settings-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: #2d2d2d;
  border-bottom: 1px solid #333;
}

.settings-card-header h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #e0e0e0;
}

.save-btn {
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.save-btn:hover:not(:disabled) {
  background-color: #1565c0;
}

.save-btn:disabled {
  background-color: #607d8b;
  opacity: 0.6;
  cursor: not-allowed;
}

.settings-card-body {
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.settings-group label {
  font-size: 14px;
  color: #ccc;
  font-weight: 500;
}

.settings-group select,
.settings-group input[type="number"],
.settings-group input[type="email"],
.settings-group input[type="text"] {
  background: #1a1a1a;
  border: 1px solid #444;
  color: #e0e0e0;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.settings-group select:focus,
.settings-group input:focus {
  outline: none;
  border-color: #1e88e5;
}

.toggle-label {
  display: flex !important;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.toggle-label input[type="checkbox"] {
  display: none;
}

.toggle-slider {
  position: relative;
  width: 44px;
  height: 24px;
  background-color: #444;
  border-radius: 12px;
  transition: background-color 0.3s ease;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  top: 2px;
  left: 2px;
  width: 20px;
  height: 20px;
  background-color: white;
  border-radius: 50%;
  transition: transform 0.3s ease;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider {
  background-color: #1e88e5;
}

.toggle-label input[type="checkbox"]:checked + .toggle-slider::after {
  transform: translateX(20px);
}

.api-key-container {
  display: flex;
  gap: 10px;
}

.api-key-input {
  flex: 1;
  font-family: monospace;
}

.generate-key-btn,
.change-password-btn {
  background-color: #555;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.generate-key-btn:hover,
.change-password-btn:hover {
  background-color: #666;
}

.backup-controls,
.maintenance-controls {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.backup-btn,
.restore-btn,
.maintenance-btn {
  background-color: #555;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.backup-btn:hover,
.restore-btn:hover,
.maintenance-btn:hover {
  background-color: #666;
}

.about-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.about-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.about-label {
  font-weight: 500;
  color: #ccc;
  min-width: 100px;
}

.about-value {
  color: #e0e0e0;
}

.support-link {
  color: #1e88e5;
  text-decoration: none;
  transition: color 0.3s ease;
}

.support-link:hover {
  color: #1565c0;
  text-decoration: underline;
}

.about-actions {
  margin-top: 20px;
  display: flex;
  gap: 10px;
}

.update-btn,
.license-btn {
  background-color: #1e88e5;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.update-btn:hover,
.license-btn:hover {
  background-color: #1565c0;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .main-content {
    margin-left: 0;
    padding: 10px;
  }
  
  .sidebar {
    width: 100%;
    height: auto;
    position: relative;
  }
  
  .settings-container {
    width: 100%;
  }
  
  .api-key-container {
    flex-direction: column;
  }
}
</style>