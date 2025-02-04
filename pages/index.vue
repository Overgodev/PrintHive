<!-- pages/index.vue -->
<template>
    <div class="min-h-screen bg-gray-900 text-white">
      <!-- Navigation -->
      <nav class="bg-gray-800 p-4">
        <div class="container mx-auto flex items-center justify-between">
          <div class="flex items-center space-x-8">
            <img src="" alt="Prusa Connect" class="h-8" />
            <div class="space-x-6">
              <NuxtLink to="/printers" class="hover:text-orange-500">Printers</NuxtLink>
              <NuxtLink to="/files" class="hover:text-orange-500">Connect Files</NuxtLink>
              <NuxtLink to="/help" class="hover:text-orange-500">Help</NuxtLink>
              <NuxtLink to="/forum" class="hover:text-orange-500">Forum</NuxtLink>
            </div>
          </div>
          <div class="flex items-center space-x-4">
            <select class="bg-gray-700 rounded px-2 py-1">
              <option>English</option>
            </select>
            <div class="relative">
              <span class="absolute -top-1 -right-1 bg-orange-500 text-xs rounded-full w-4 h-4 flex items-center justify-center">2</span>
              <button class="hover:text-orange-500">
                <IconBell class="w-5 h-5" />
              </button>
            </div>
            <div class="flex items-center space-x-2">
              <img src="" alt="User" class="w-8 h-8 rounded-full" />
              <span>Michal Zoubek</span>
            </div>
          </div>
        </div>
      </nav>
  
      <!-- Printer Status -->
      <div class="container mx-auto p-4">
        <div class="bg-gray-800 rounded-lg p-6">
          <div class="flex items-center space-x-6">
            <div class="w-32 h-32 bg-orange-500 rounded-lg"></div>
            <div class="flex-1">
              <div class="flex items-center space-x-4">
                <h1 class="text-2xl font-bold">Duncan</h1>
                <span class="bg-blue-600 px-3 py-1 rounded text-sm">PRINTING</span>
              </div>
              
              <!-- Status Indicators -->
              <div class="grid grid-cols-5 gap-6 mt-4">
                <div class="bg-gray-700 p-3 rounded">
                  <div class="text-sm text-gray-400">Nozzle temperature</div>
                  <div class="flex items-center mt-1">
                    <IconThermometer class="w-4 h-4 text-orange-500 mr-2" />
                    <span>250→250°C</span>
                  </div>
                </div>
                
                <div class="bg-gray-700 p-3 rounded">
                  <div class="text-sm text-gray-400">Bed temperature</div>
                  <div class="flex items-center mt-1">
                    <IconThermometer class="w-4 h-4 text-orange-500 mr-2" />
                    <span>90→90°C</span>
                  </div>
                </div>
  
                <div class="bg-gray-700 p-3 rounded">
                  <div class="text-sm text-gray-400">Material</div>
                  <div class="flex items-center mt-1">
                    <IconFilament class="w-4 h-4 text-orange-500 mr-2" />
                    <span>PETG</span>
                  </div>
                </div>
  
                <div class="bg-gray-700 p-3 rounded">
                  <div class="text-sm text-gray-400">Speed</div>
                  <div class="flex items-center mt-1">
                    <IconSpeed class="w-4 h-4 text-orange-500 mr-2" />
                    <span>100%</span>
                  </div>
                </div>
  
                <div class="bg-gray-700 p-3 rounded">
                  <div class="text-sm text-gray-400">Current Z-height</div>
                  <div class="flex items-center mt-1">
                    <IconRuler class="w-4 h-4 text-orange-500 mr-2" />
                    <span>170.8mm</span>
                  </div>
                </div>
              </div>
            </div>
            
            <button class="bg-orange-500 px-6 py-2 rounded-lg hover:bg-orange-600">
              Set ready
            </button>
          </div>
        </div>
  
        <!-- Current Print -->
        <div class="mt-6 bg-gray-800 rounded-lg p-6">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-xl mb-4">KATANA_SQ_PNP_0.4n_0.2mm_PETG_MK4IS_4h41m.bgcode</h2>
              <div class="grid grid-cols-4 gap-8">
                <div>
                  <div class="text-sm text-gray-400">Print started</div>
                  <div>Today at 8:46 AM</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400">Printing time</div>
                  <div>4h 30m</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400">Remaining time</div>
                  <div>20m</div>
                </div>
                <div>
                  <div class="text-sm text-gray-400">Estimated end</div>
                  <div>Today at 1:37 PM</div>
                </div>
              </div>
            </div>
            <div class="flex space-x-2">
              <button class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">Pozastavit</button>
              <button class="bg-gray-700 px-4 py-2 rounded hover:bg-gray-600">Zastavit</button>
            </div>
          </div>
        </div>
  
        <!-- Print Queue -->
        <div class="mt-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl">Print queue</h2>
            <button class="text-sm text-gray-400 hover:text-white">
              Remove all from queue
            </button>
          </div>
          
          <!-- Queue Items -->
          <div class="space-y-4">
            <div class="bg-gray-800 rounded-lg p-4">
              <div class="flex items-center space-x-4">
                <div class="w-24 h-24 bg-gray-700 rounded"></div>
                <div class="flex-1">
                  <h3 class="font-medium">Sword_Hook_V2_0.4n_0.2mm_PETG_MK4IS_1h16m.bgcode</h3>
                  <div class="grid grid-cols-5 gap-4 mt-2 text-sm text-gray-400">
                    <div>
                      <div>Printer type</div>
                      <div class="text-white">MK4IS</div>
                    </div>
                    <div>
                      <div>Printing time</div>
                      <div class="text-white">1h 15m</div>
                    </div>
                    <div>
                      <div>Material</div>
                      <div class="text-white">PETG</div>
                    </div>
                    <div>
                      <div>Layer height</div>
                      <div class="text-white">0.2mm</div>
                    </div>
                    <div>
                      <div>Size</div>
                      <div class="text-white">954kB</div>
                    </div>
                  </div>
                </div>
                <div class="flex space-x-2">
                  <button class="text-gray-400 hover:text-white">
                    <IconEdit class="w-5 h-5" />
                  </button>
                  <button class="text-gray-400 hover:text-white">
                    <IconCopy class="w-5 h-5" />
                  </button>
                  <button class="text-gray-400 hover:text-white">
                    <IconTrash class="w-5 h-5" />
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
  
  </script>