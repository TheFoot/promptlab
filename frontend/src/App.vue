<template>
  <div
    class="app"
    :class="{ 
      'dark-theme': isDarkTheme,
      'chat-expanded': isChatExpanded && !isChatDisabled
    }"
  >
    <header class="app-header">
      <div class="container">
        <h1><router-link to="/" class="app-title">Prompt Library</router-link></h1>
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
            @click="toggleChat"
            aria-label="Toggle chat"
            :title="isChatExpanded ? 'Close chat' : 'Open test chat'"
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
      />
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch, computed } from 'vue';
import { useUiStore } from './stores/uiStore';
import ChatSidebar from './components/ChatSidebar.vue';

// Get UI store
const uiStore = useUiStore();

// Theme state
const isDarkTheme = ref(false);

// Chat state
const isChatExpanded = ref(false);

// Determine if chat should be disabled
// The chat is disabled when in edit mode on the prompt detail view
const isChatDisabled = computed(() => {
  return uiStore.isEditingPrompt;
});

// Toggle chat sidebar expanded state
const toggleChat = () => {
  isChatExpanded.value = !isChatExpanded.value;
};

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
});

// Toggle theme
const toggleTheme = () => {
  isDarkTheme.value = !isDarkTheme.value;
};

// Save theme preference whenever it changes
watch(isDarkTheme, (newValue) => {
  localStorage.setItem('theme', newValue ? 'dark' : 'light');
});
</script>

<style lang="scss">
@use './styles/variables.scss' as *;

.app {
  min-height: 100vh;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition: background-color 0.3s, color 0.3s;
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
    max-width: 1800px;
    margin: 0 auto;
    padding: 0 1.5rem;
    width: 100%;
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
}

.app-content {
  flex: 1;
  max-width: 1800px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
  transition: width 0.3s ease, max-width 0.3s ease;
}

/* Push content when chat is expanded */
.chat-expanded .app-content {
  margin-right: 400px; /* Match chat sidebar width */
  max-width: 1400px; /* Adjust max-width to accommodate sidebar */
}
</style>
