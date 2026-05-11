<template>
  <div
    class="app"
    :class="{
      'dark-theme': isDarkTheme,
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
        </div>
      </div>
    </header>
    <div class="content-wrapper">
      <main class="app-content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from "vue";
import AlertSystem from "./components/AlertSystem.vue";
import alertService from "./services/alertService";

// Get app version from Vite define
const appVersion = __APP_VERSION__;

// Theme state
const isDarkTheme = ref(false);

// Alert system ref
const alertSystemRef = ref(null);

// Load theme from localStorage or system preference
onMounted(() => {
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme) {
    isDarkTheme.value = savedTheme === "dark";
  } else {
    // Check system preference
    const prefersDark = window.matchMedia(
      "(prefers-color-scheme: dark)",
    ).matches;
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
  localStorage.setItem("theme", newValue ? "dark" : "light");
});
</script>

<style lang="scss">
@use "./styles/variables.scss" as *;

.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
  transition:
    background-color 0.3s,
    color 0.3s;
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

}

.content-wrapper {
  display: flex;
  width: 100%;
  position: relative;
  flex: 1; /* Take up remaining space */
  overflow: hidden; /* Prevent wrapper from scrolling */
}

.app-content {
  flex: 1;
  width: 100%;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
  overflow-y: auto; /* Allow content area to scroll */
  height: 100%; /* Take full height of parent */
}
</style>
