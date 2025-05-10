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
            <router-link to="/print-queue" class="nav-item active">
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
            <h1>Print Queue</h1>
            <div class="actions-container">
              <div class="filter-container">
                <select v-model="selectedFilter" class="filter-select">
                  <option value="all">All Jobs</option>
                  <option value="printing">Printing</option>
                  <option value="queued">Queued</option>
                  <option value="paused">Paused</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
              <div class="search-container">
                <input 
                  type="text" 
                  placeholder="Search jobs" 
                  v-model="searchQuery"
                  @input="filterJobs"
                />
              </div>
            </div>
          </div>
  
          <div class="queue-container">
            <div v-if="filteredJobs.length === 0" class="empty-state">
              <p>No print jobs found</p>
            </div>
            <div v-else class="job-list">
              <div 
                v-for="job in filteredJobs" 
                :key="job.job_id" 
                class="job-card">
                <div class="job-header">
                  <div class="job-title-section">
                    <span class="job-filename">{{ job.filename }}</span>
                    <span class="job-printer">on {{ job.printer_name }}</span>
                  </div>
                  <div class="job-status-section">
                    <span class="job-status" :class="getJobStatusClass(job)">
                      {{ formatJobStatus(job) }}
                    </span>
                    <div class="job-priority" :class="getPriorityClass(job)">
                      {{ job.priority }}
                    </div>
                  </div>
                </div>
                
                <div class="job-body">
                  <div class="job-progress-section">
                    <div class="job-progress-info">
                      <div class="progress-details">
                        <span class="progress-percentage">{{ getProgressPercentage(job) }}%</span>
                        <span class="progress-time">{{ getTimeRemaining(job) }}</span>
                      </div>
                      <div class="progress-bar">
                        <div 
                          class="progress-value" 
                          :style="{ 
                            width: getProgressPercentage(job) + '%',
                            backgroundColor: getProgressColor(job)
                          }"
                        ></div>
                      </div>
                    </div>
                  </div>
                  
                  <div class="job-details-grid">
                    <div class="detail-item">
                      <span class="detail-label">Added:</span>
                      <span class="detail-value">{{ formatDate(job.added_at) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Started:</span>
                      <span class="detail-value">{{ formatDate(job.started_at) || '--' }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Est. Time:</span>
                      <span class="detail-value">{{ formatDuration(job.estimated_duration) }}</span>
                    </div>
                    <div class="detail-item">
                      <span class="detail-label">Material:</span>
                      <span class="detail-value">{{ job.filament_type || 'Not specified' }}</span>
                    </div>
                  </div>
                  
                  <div class="job-actions">
                    <button 
                      v-if="canPause(job)" 
                      @click="pauseJob(job)" 
                      class="action-btn pause-btn">
                      <i class="action-icon pause-icon"></i>
                      Pause
                    </button>
                    <button 
                      v-if="canResume(job)" 
                      @click="resumeJob(job)" 
                      class="action-btn resume-btn">
                      <i class="action-icon resume-icon"></i>
                      Resume
                    </button>
                    <button 
                      v-if="canCancel(job)" 
                      @click="cancelJob(job)" 
                      class="action-btn cancel-btn">
                      <i class="action-icon cancel-icon"></i>
                      Cancel
                    </button>
                    <button 
                      v-if="canRestart(job)" 
                      @click="restartJob(job)" 
                      class="action-btn restart-btn">
                      <i class="action-icon restart-icon"></i>
                      Restart
                    </button>
                    <button 
                      v-if="canReschedule(job)" 
                      @click="rescheduleJob(job)" 
                      class="action-btn reschedule-btn">
                      <i class="action-icon reschedule-icon"></i>
                      Reschedule
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import { useRouter } from 'vue-router';
  
  const router = useRouter();
  const jobs = ref([]);
  const searchQuery = ref('');
  const selectedFilter = ref('all');
  const filteredJobs = ref([]);
  
  // Fetch print queue from API
  const fetchPrintQueue = async () => {
    try {
      const baseUrl = window.location.origin;
      const response = await fetch(`${baseUrl}/api/print-queue`);
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      jobs.value = data.map(job => normalizeJobData(job));
      filterJobs();
    } catch (err) {
      console.error('Failed to load print queue:', err);
      // Mock data for development
      jobs.value = getMockJobData();
      filterJobs();
    }
  };
  
  const normalizeJobData = (job) => {
    return {
      ...job,
      job_id: job.job_id || Date.now(),
      printer_id: job.printer_id || null,
      printer_name: job.printer_name || 'Unknown Printer',
      filename: job.filename || 'untitled.gcode',
      status: job.status || 'queued',
      priority: job.priority || 'normal',
      progress: job.progress ?? 0,
      estimated_duration: job.estimated_duration || 0,
      remaining_time: job.remaining_time || 0,
      added_at: job.added_at || new Date().toISOString(),
      started_at: job.started_at || null,
      completed_at: job.completed_at || null,
      filament_type: job.filament_type || null
    };
  };
  
  const getMockJobData = () => {
    return [
      {
        job_id: 1,
        printer_id: 'printer_1',
        printer_name: 'Ender 3 Pro #1',
        filename: 'phone_case_v2.gcode',
        status: 'printing',
        priority: 'high',
        progress: 0.75,
        estimated_duration: 14400, // 4 hours
        remaining_time: 3600, // 1 hour
        added_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        started_at: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
        filament_type: 'PLA'
      },
      {
        job_id: 2,
        printer_id: 'printer_2',
        printer_name: 'Prusa i3 MK3',
        filename: 'miniature_dragon.gcode',
        status: 'queued',
        priority: 'normal',
        progress: 0,
        estimated_duration: 18000, // 5 hours
        remaining_time: 18000,
        added_at: new Date(Date.now() - 1800 * 1000).toISOString(),
        filament_type: 'PETG'
      },
      {
        job_id: 3,
        printer_id: 'printer_3',
        printer_name: 'Artillery X1',
        filename: 'test_part_v3.gcode',
        status: 'paused',
        priority: 'low',
        progress: 0.3,
        estimated_duration: 7200, // 2 hours
        remaining_time: 5040, // 1.4 hours
        added_at: new Date(Date.now() - 7200 * 1000).toISOString(),
        started_at: new Date(Date.now() - 2160 * 1000).toISOString(),
        filament_type: 'ABS'
      },
      {
        job_id: 4,
        printer_id: 'printer_1',
        printer_name: 'Ender 3 Pro #1',
        filename: 'prototype_widget.gcode',
        status: 'completed',
        priority: 'normal',
        progress: 1,
        estimated_duration: 10800, // 3 hours
        remaining_time: 0,
        added_at: new Date(Date.now() - 86400 * 1000).toISOString(),
        started_at: new Date(Date.now() - 86400 * 1000 + 3600 * 1000).toISOString(),
        completed_at: new Date(Date.now() - 86400 * 1000 + 14400 * 1000).toISOString(),
        filament_type: 'TPU'
      },
      {
        job_id: 5,
        printer_id: 'printer_4',
        printer_name: 'CR-10S Pro',
        filename: 'large_vase.gcode',
        status: 'cancelled',
        priority: 'high',
        progress: 0.15,
        estimated_duration: 21600, // 6 hours
        remaining_time: 0,
        added_at: new Date(Date.now() - 172800 * 1000).toISOString(),
        started_at: new Date(Date.now() - 172800 * 1000 + 7200 * 1000).toISOString(),
        filament_type: 'PLA'
      }
    ];
  };
  
  const formatJobStatus = (job) => {
    const statusMap = {
      'printing': 'PRINTING',
      'queued': 'QUEUED',
      'paused': 'PAUSED',
      'completed': 'COMPLETED',
      'cancelled': 'CANCELLED',
      'failed': 'FAILED'
    };
    return statusMap[job.status] || job.status.toUpperCase();
  };
  
  const getJobStatusClass = (job) => {
    return job.status.toLowerCase();
  };
  
  const getPriorityClass = (job) => {
    return `priority-${job.priority.toLowerCase()}`;
  };
  
  const getProgressPercentage = (job) => {
    return Math.round(job.progress * 100);
  };
  
  const getProgressColor = (job) => {
    switch (job.status) {
      case 'printing':
        return '#4caf50';
      case 'paused':
        return '#ff9800';
      case 'completed':
        return '#2196f3';
      case 'cancelled':
      case 'failed':
        return '#f44336';
      default:
        return '#616161';
    }
  };
  
  const getTimeRemaining = (job) => {
    if (job.status === 'completed' || job.status === 'cancelled' || job.status === 'failed') {
      return '--';
    }
    return formatDuration(job.remaining_time);
  };
  
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return '--';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const canPause = (job) => {
    return job.status === 'printing';
  };
  
  const canResume = (job) => {
    return job.status === 'paused';
  };
  
  const canCancel = (job) => {
    return ['printing', 'paused', 'queued'].includes(job.status);
  };
  
  const canRestart = (job) => {
    return ['completed', 'cancelled', 'failed'].includes(job.status);
  };
  
  const canReschedule = (job) => {
    return ['queued', 'cancelled', 'failed'].includes(job.status);
  };
  
  const pauseJob = async (job) => {
    try {
      const response = await fetch(`/api/print-queue/${job.job_id}/pause`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to pause job');
      await fetchPrintQueue();
    } catch (err) {
      console.error('Failed to pause job:', err);
    }
  };
  
  const resumeJob = async (job) => {
    try {
      const response = await fetch(`/api/print-queue/${job.job_id}/resume`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to resume job');
      await fetchPrintQueue();
    } catch (err) {
      console.error('Failed to resume job:', err);
    }
  };
  
  const cancelJob = async (job) => {
    try {
      const response = await fetch(`/api/print-queue/${job.job_id}/cancel`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to cancel job');
      await fetchPrintQueue();
    } catch (err) {
      console.error('Failed to cancel job:', err);
    }
  };
  
  const restartJob = async (job) => {
    try {
      const response = await fetch(`/api/print-queue/${job.job_id}/restart`, {
        method: 'POST'
      });
      if (!response.ok) throw new Error('Failed to restart job');
      await fetchPrintQueue();
    } catch (err) {
      console.error('Failed to restart job:', err);
    }
  };
  
  const rescheduleJob = async (job) => {
    router.push(`/print-queue/${job.job_id}/reschedule`);
  };
  
  const filterJobs = () => {
    let filtered = [...jobs.value];
    
    // Apply status filter
    if (selectedFilter.value !== 'all') {
      filtered = filtered.filter(job => job.status === selectedFilter.value);
    }
    
    // Apply search filter
    if (searchQuery.value) {
      const query = searchQuery.value.toLowerCase();
      filtered = filtered.filter(job => 
        job.filename.toLowerCase().includes(query) ||
        job.printer_name.toLowerCase().includes(query)
      );
    }
    
    // Sort by priority and status
    filtered.sort((a, b) => {
      const priorityOrder = { 'high': 0, 'normal': 1, 'low': 2 };
      const statusOrder = { 'printing': 0, 'paused': 1, 'queued': 2, 'completed': 3, 'cancelled': 4, 'failed': 5 };
      
      // First sort by status
      if (statusOrder[a.status] !== statusOrder[b.status]) {
        return statusOrder[a.status] - statusOrder[b.status];
      }
      
      // Then by priority
      if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      
      // Finally by added time (newest first)
      return new Date(b.added_at) - new Date(a.added_at);
    });
    
    filteredJobs.value = filtered;
  };
  
  const handleLogout = () => {
    router.push('/login');
  };
  
  onMounted(() => {
    fetchPrintQueue();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchPrintQueue, 30000);
    
    // Cleanup interval on unmount
    onUnmounted(() => {
      clearInterval(interval);
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
  
  /* Sidebar styles - same as printers page */
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
  
  /* Main content */
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
  
  .filter-container {
    width: 150px;
  }
  
  .filter-select {
    width: 100%;
    padding: 10px 15px;
    border: 1px solid #444;
    border-radius: 6px;
    background-color: #2d2d2d;
    color: #e0e0e0;
    cursor: pointer;
  }
  
  .filter-select:focus {
    outline: none;
    border-color: #1e88e5;
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
  
  /* Queue container */
  .queue-container {
    background-color: #222;
    border-radius: 8px;
    padding: 20px;
    min-height: 400px;
  }
  
  .empty-state {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 300px;
    color: #666;
    font-size: 16px;
  }
  
  .job-list {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  /* Job card */
  .job-card {
    background: #2d2d2d;
    border-radius: 8px;
    padding: 16px;
    transition: background-color 0.3s ease;
  }
  
  .job-card:hover {
    background: #333;
  }
  
  .job-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }
  
  .job-title-section {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }
  
  .job-filename {
    font-weight: 600;
    font-size: 16px;
    color: #e0e0e0;
  }
  
  .job-printer {
    font-size: 14px;
    color: #999;
  }
  
  .job-status-section {
    display: flex;
    align-items: center;
    gap: 10px;
  }
  
  .job-status {
    font-weight: bold;
    font-size: 14px;
  }
  
  .job-status.printing {
    color: #4caf50;
  }
  
  .job-status.queued {
    color: #2196f3;
  }
  
  .job-status.paused {
    color: #ff9800;
  }
  
  .job-status.completed {
    color: #4caf50;
  }
  
  .job-status.cancelled,
  .job-status.failed {
    color: #f44336;
  }
  
  .job-priority {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 11px;
    text-transform: uppercase;
    font-weight: 600;
  }
  
  .priority-high {
    background-color: #ff5252;
    color: #fff;
  }
  
  .priority-normal {
    background-color: #666;
    color: #fff;
  }
  
  .priority-low {
    background-color: #444;
    color: #fff;
  }
  
  /* Job body */
  .job-body {
    display: flex;
    flex-direction: column;
    gap: 15px;
  }
  
  .job-progress-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }
  
  .job-progress-info {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }
  
  .progress-details {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  
  .progress-percentage {
    font-weight: 600;
    font-size: 16px;
    color: #e0e0e0;
  }
  
  .progress-time {
    font-size: 14px;
    color: #999;
  }
  
  .progress-bar {
    height: 8px;
    background-color: #1a1a1a;
    border-radius: 4px;
    overflow: hidden;
  }
  
  .progress-value {
    height: 100%;
    transition: width 0.5s ease;
    border-radius: 4px;
  }
  
  .job-details-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 10px;
  }
  
  .detail-item {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .detail-label {
    font-size: 13px;
    color: #999;
    min-width: 70px;
  }
  
  .detail-value {
    font-size: 13px;
    color: #e0e0e0;
  }
  
  /* Job actions */
  .job-actions {
    display: flex;
    gap: 10px;
    margin-top: 10px;
    flex-wrap: wrap;
  }
  
  .action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    border-radius: 4px;
    color: white;
    cursor: pointer;
    transition: all 0.3s ease;
    font-size: 13px;
  }
  
  .action-icon {
    width: 14px;
    height: 14px;
    background-color: currentColor;
    mask-size: contain;
    mask-repeat: no-repeat;
    mask-position: center;
    -webkit-mask-size: contain;
    -webkit-mask-repeat: no-repeat;
    -webkit-mask-position: center;
  }
  
  .pause-btn {
    background-color: #ff9800;
  }
  
  .pause-btn:hover {
    background-color: #f57c00;
  }
  
  .resume-btn {
    background-color: #4caf50;
  }
  
  .resume-btn:hover {
    background-color: #388e3c;
  }
  
  .cancel-btn {
    background-color: #f44336;
  }
  
  .cancel-btn:hover {
    background-color: #d32f2f;
  }
  
  .restart-btn {
    background-color: #2196f3;
  }
  
  .restart-btn:hover {
    background-color: #1976d2;
  }
  
  .reschedule-btn {
    background-color: #9c27b0;
  }
  
  .reschedule-btn:hover {
    background-color: #7b1fa2;
  }
  
  /* Action icons */
  .pause-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M9 4H7v16h2V4zm6 0h2v16h-2V4z' fill='white'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M9 4H7v16h2V4zm6 0h2v16h-2V4z' fill='white'/%3E%3C/svg%3E");
  }
  
  .resume-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M8 5v14l11-7z' fill='white'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M8 5v14l11-7z' fill='white'/%3E%3C/svg%3E");
  }
  
  .cancel-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' fill='white'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z' fill='white'/%3E%3C/svg%3E");
  }
  
  .restart-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M4 12a8 8 0 018-8V2.5L16 6l-4 3.5V8a6 6 0 106 6h1.5a7.5 7.5 0 11-15 0z' fill='white'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M4 12a8 8 0 018-8V2.5L16 6l-4 3.5V8a6 6 0 106 6h1.5a7.5 7.5 0 11-15 0z' fill='white'/%3E%3C/svg%3E");
  }
  
  .reschedule-icon {
    mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M14 6V4h-4v2H5v14h14V6h-5zm3 12H7V8h10v10z' fill='white'/%3E%3C/svg%3E");
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none'%3E%3Cpath d='M14 6V4h-4v2H5v14h14V6h-5zm3 12H7V8h10v10z' fill='white'/%3E%3C/svg%3E");
  }
</style>