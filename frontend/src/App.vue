<template>
  <div class="app" :class="{ 'dark-theme': isDarkTheme }">
    <header class="app-header">
      <div class="container">
        <h1>Prompt Library</h1>
        <button @click="toggleTheme" class="theme-toggle" aria-label="Toggle theme">
          <span v-if="isDarkTheme">☀️</span>
          <span v-else>🌙</span>
        </button>
      </div>
    </header>
    <main class="app-content">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';

// Theme state
const isDarkTheme = ref(false);

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
  padding: 1rem 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  width: 100%;

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
}

.theme-toggle {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 50%;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(255, 255, 255, 0.1);
  }
}

.app-content {
  width: 100%;
  max-width: 1800px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  box-sizing: border-box;
}
</style>
