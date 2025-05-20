<template>
  <div
    class="mode-selector"
    role="radiogroup"
    aria-label="Context panel mode"
  >
    <button
      v-for="mode in availableModes"
      :key="mode.value"
      class="mode-button"
      :class="{ 'mode-button--active': modelValue === mode.value }"
      :aria-checked="modelValue === mode.value"
      role="radio"
      @click="selectMode(mode.value)"
    >
      <i
        v-if="mode.icon"
        class="mode-button__icon"
        :class="mode.icon"
      />
      <span class="mode-button__label">{{ mode.label }}</span>
    </button>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  modelValue: {
    type: String,
    required: true,
    validator: (value) => ['edit', 'preview', 'chat', 'design'].includes(value)
  },
  availableModes: {
    type: Array,
    default: () => [
      { value: 'edit', label: 'Edit', icon: 'fas fa-edit' },
      { value: 'preview', label: 'Preview', icon: 'fas fa-eye' },
      { value: 'chat', label: 'Chat', icon: 'fas fa-comment' },
      { value: 'design', label: 'Design', icon: 'fas fa-palette' }
    ]
  }
});

const emit = defineEmits(['update:modelValue', 'mode-changed']);

const selectMode = (mode) => {
  emit('update:modelValue', mode);
  emit('mode-changed', mode);
};
</script>

<style lang="scss" scoped>
.mode-selector {
  display: flex;
  background-color: var(--surface-color, #f5f5f5);
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--border-color, #e0e0e0);
  margin-bottom: 1rem;
}

.mode-button {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;
  color: var(--text-color, #333);
  
  &:hover {
    background-color: var(--hover-color, #e9e9e9);
  }
  
  &--active {
    background-color: var(--primary-color, #4a6cf7);
    color: white;
    
    &:hover {
      background-color: var(--primary-color-dark, #3a5ce7);
    }
  }
  
  &__icon {
    font-size: 0.9em;
  }
  
  &__label {
    font-size: 0.9em;
    font-weight: 500;
  }
}

@media (max-width: 768px) {
  .mode-button__label {
    display: none;
  }
  
  .mode-button {
    padding: 0.75rem;
  }
}
</style>