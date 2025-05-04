<template>
  <div class="alert-container">
    <transition-group name="alert">
      <div 
        v-for="alert in alerts" 
        :key="alert.id"
        class="alert"
        :class="{ 
          'alert-success': alert.type === 'success',
          'alert-error': alert.type === 'error',
          'alert-info': alert.type === 'info'
        }"
      >
        {{ alert.message }}
      </div>
    </transition-group>
  </div>
</template>

<script setup>
import { ref, onUnmounted } from 'vue';

const alerts = ref([]);
let nextId = 1;
const timeouts = new Map();

// Function to add a new alert
const addAlert = (message, type = 'info', duration = 5000) => {
  const id = nextId++;
  const alert = { id, message, type };
  
  // Add alert to the list
  alerts.value.push(alert);
  
  // Set timeout to remove the alert
  const timeout = setTimeout(() => {
    removeAlert(id);
  }, duration);
  
  // Store timeout reference
  timeouts.set(id, timeout);
  
  return id;
};

// Function to remove an alert
const removeAlert = (id) => {
  const index = alerts.value.findIndex(alert => alert.id === id);
  if (index !== -1) {
    alerts.value.splice(index, 1);
    
    // Clear timeout if it exists
    if (timeouts.has(id)) {
      clearTimeout(timeouts.get(id));
      timeouts.delete(id);
    }
  }
};

// Clean up timeouts when component is unmounted
onUnmounted(() => {
  timeouts.forEach(timeout => clearTimeout(timeout));
  timeouts.clear();
});

// Make the functions available to other components
defineExpose({
  addAlert,
  removeAlert
});
</script>

<style scoped>
.alert-container {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  width: auto;
  max-width: 90vw;
}

.alert {
  padding: 12px 20px;
  border-radius: 4px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  font-size: 14px;
  min-width: 200px;
  text-align: center;
  pointer-events: all;
}

.alert-success {
  background-color: #4caf50;
  color: white;
}

.alert-error {
  background-color: #f44336;
  color: white;
}

.alert-info {
  background-color: var(--primary-color, #4A6CF7);
  color: white;
}

/* Animation */
.alert-enter-active,
.alert-leave-active {
  transition: all 0.3s ease;
}

.alert-enter-from {
  opacity: 0;
  transform: translateY(-20px);
}

.alert-leave-to {
  opacity: 0;
  transform: translateY(-20px);
}
</style>