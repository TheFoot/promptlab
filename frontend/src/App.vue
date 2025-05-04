<template>
  <div
    class="app"
    :class="{ 
      'dark-theme': isDarkTheme,
      'chat-expanded': isChatExpanded && !isChatDisabled,
      'resizing': isResizing
    }"
  >
    <!-- Alert system -->
    <AlertSystem ref="alertSystemRef" />
    <header class="app-header">
      <div class="container">
        <h1>
          <router-link
            to="/"
            class="app-title"
          >
            PromptLab <span class="version">v{{ appVersion }}</span>
          </router-link>
        </h1>
        <div class="header-controls">
          <!-- Theme toggle button -->
          <button
            class="header-button theme-toggle"
            aria-label="Toggle theme"
            @click="toggleTheme"
          >
            <span v-if="isDarkTheme">☀️</span>
            <span v-else>🌙</span>
          </button>
          
          <!-- Chat toggle button - only show when not in edit mode -->
          <button 
            v-if="!isChatDisabled" 
            class="header-button chat-toggle-button"
            :class="{ 'active': isChatExpanded }"
            aria-label="Toggle chat"
            :title="isChatExpanded ? 'Close chat' : 'Open test chat'"
            @click="toggleChat"
          >
            <!-- Use same icon but with green indicator dot when active -->
            💬
          </button>
        </div>
      </div>
    </header>
    <div class="content-wrapper">
      <main class="app-content">
        <router-view />
      </main>
      <ChatSidebar 
        :disabled="isChatDisabled" 
        :expanded="isChatExpanded"
        @toggle="isChatExpanded = $event"
        @resize="handleSidebarResize"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed, nextTick } from 'vue';
import { useUiStore } from './stores/uiStore';
import ChatSidebar from './components/ChatSidebar.vue';
import AlertSystem from './components/AlertSystem.vue';
import alertService from './services/alertService';

// Get app version from Vite define
const appVersion = __APP_VERSION__;

// Get UI store
const uiStore = useUiStore();

// Theme state
const isDarkTheme = ref(false);

// Chat state
const isChatExpanded = ref(false);
const sidebarWidth = ref(400); // Default sidebar width
const isResizing = ref(false); // Track if sidebar is being resized

// Try to load the sidebar width from localStorage
const savedWidth = localStorage.getItem('chat-sidebar-width');
if (savedWidth) {
  const width = parseInt(savedWidth, 10);
  // Ensure width is within reasonable bounds (250-600px)
  if (width >= 250 && width <= 600) {
    sidebarWidth.value = width;
  }
}

// Determine if chat should be disabled
// The chat is disabled when in edit mode on the prompt detail view
const isChatDisabled = computed(() => {
  return uiStore.isEditingPrompt;
});

// Handle sidebar resize event
const handleSidebarResize = (width) => {
  sidebarWidth.value = width;
  isResizing.value = true;
  
  // Debounce the resizing state
  clearTimeout(window.resizeTimer);
  window.resizeTimer = setTimeout(() => {
    isResizing.value = false;
  }, 100);
};

// Toggle chat sidebar expanded state
const toggleChat = () => {
  isChatExpanded.value = !isChatExpanded.value;
  
  if (isChatExpanded.value) {
    // Force layout recalculation to ensure content is pushed aside
    nextTick(() => {
      // Small delay to ensure transitions work properly
      setTimeout(() => {
        document.querySelector('.app-content').style.transition = 'margin-right 0.3s ease, max-width 0.3s ease';
      }, 10);
    });
  } 
  // We don't reset width when closing - we'll use the persisted width from localStorage
};

// Alert system ref
const alertSystemRef = ref(null);

// Load theme from localStorage or system preference
onMounted(() => {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme) {
    isDarkTheme.value = savedTheme === 'dark';
  } else {
    // Check system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    isDarkTheme.value = prefersDark;
  }
  
  // Register alert system
  if (alertSystemRef.value) {
    alertService.registerAlertSystem(alertSystemRef.value);
  }
});

// Toggle theme
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

// Save theme preference whenever it changes
watch(isDarkTheme, (newValue) => {
  localStorage.setItem('theme', newValue ? 'dark' : 'light');
});

// Watch for edit mode changes
watch(() => uiStore.isEditingPrompt, (isEditing) => {
  // When edit mode changes, force layout recalculations
  nextTick(() => {
    // Wait for DOM updates
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      
      // If we're exiting edit mode and chat was previously open, restore it
      if (!isEditing && localStorage.getItem('chatWasOpen') === 'true') {
        isChatExpanded.value = true;
        localStorage.removeItem('chatWasOpen');
      }
    }, 100);
  });
  
  // If entering edit mode and chat is open, save state and close it
  if (isEditing && isChatExpanded.value) {
    localStorage.setItem('chatWasOpen', 'true');
    isChatExpanded.value = false;
  }
});
</script>

<style lang="scss">
@use './styles/variables.scss' as *;

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
  overflow: hidden; /* Prevent app container from scrolling */
}

.app-header {
  background-color: var(--primary-color);
  color: white;
  height: 60px; /* Fixed height for consistency */
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;
  display: flex;
  align-items: center;
  position: relative;
  z-index: 100; /* Highest z-index for app header */

  .container {
    display: flex;
    justify-content: space-between;
    align-items: center;
    width: 100%;
    margin: 0 auto;
    padding: 0 1.5rem;
  }

  h1 {
    margin: 0;
    font-size: 1.5rem;
  }
  
  .app-title {
    color: white;
    text-decoration: none;
    
    &:hover {
      text-decoration: none;
      opacity: 0.9;
    }
    
    .version {
      font-size: 0.6rem;
      font-weight: normal;
      opacity: 0.7;
      vertical-align: middle;
      margin-left: 5px;
    }
  }
}

.header-controls {
  display: flex;
  gap: 10px;
  align-items: center;
}

.header-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
  
  &:active {
    background-color: rgba(255, 255, 255, 0.2);
  }
  
  &.chat-toggle-button {
    position: relative;
    
    &:after {
      content: '';
      position: absolute;
      bottom: 5px;
      right: 5px;
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background-color: #4caf50;
      opacity: 0;
      transition: opacity 0.2s;
    }
    
    &.active:after {
      opacity: 1;
    }
  }
}

.content-wrapper {
  display: flex;
  width: 100%;
  position: relative;
  transition: margin-right 0.3s ease;
  flex: 1; /* Take up remaining space */
  overflow: hidden; /* Prevent wrapper from scrolling */
}

.app-content {
  flex: 1;
  width: 100%;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
  transition: margin-right 0.3s ease, width 0.3s ease;
  margin-right: 0; /* Initial state */
  overflow-y: auto; /* Allow content area to scroll */
  height: 100%; /* Take full height of parent */
}

/* Disable transition during resize */
.resizing .app-content {
  transition: none;
}

/* Push content when chat is expanded */
.chat-expanded .app-content {
  margin-right: v-bind('sidebarWidth + "px"'); /* Dynamic margin based on sidebar width */
  width: calc(100% - v-bind('sidebarWidth + "px"')); /* Adjust width dynamically */
}

</style>
