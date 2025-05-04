<template>
  <div class="tag-input-container">
    <div class="tag-list">
      <div
        v-for="(tag, index) in modelValue"
        :key="index"
        class="tag-item"
      >
        <span class="tag-text">{{ tag }}</span>
        <button
          class="tag-remove"
          type="button"
          aria-label="Remove tag"
          @click.prevent="removeTag(index)"
        >
          &times;
        </button>
      </div>
      <input
        v-model="tagInputValue"
        placeholder="Add tags..."
        class="tag-input"
        :class="{ 'has-tags': modelValue.length > 0 }"
        @keydown.enter.prevent="addTag"
        @keydown.backspace="handleBackspace"
        @keydown.tab.prevent="addTag"
        @keydown.comma.prevent="addTag"
        @blur="addTag"
      >
    </div>
    <div class="tag-help-text">
      Press Enter or comma to add a tag
    </div>
  </div>
</template>

<script setup>
import { ref, watch } from 'vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['update:modelValue']);

const tagInputValue = ref('');

// Add a new tag
const addTag = () => {
  if (tagInputValue.value.trim()) {
    // Split by comma in case user typed multiple tags with commas
    const tags = tagInputValue.value.split(',').map(tag => tag.trim()).filter(tag => tag);
    
    const newTags = [...props.modelValue];
    
    // Add each tag if it's not already in the list
    tags.forEach(tag => {
      if (tag && !newTags.includes(tag)) {
        newTags.push(tag);
      }
    });
    
    emit('update:modelValue', newTags);
    tagInputValue.value = '';
  }
};

// Remove tag at the given index
const removeTag = (index) => {
  const newTags = [...props.modelValue];
  newTags.splice(index, 1);
  emit('update:modelValue', newTags);
};

// Handle backspace to remove the last tag when input is empty
const handleBackspace = (event) => {
  if (tagInputValue.value === '' && props.modelValue.length > 0) {
    const newTags = [...props.modelValue];
    newTags.pop();
    emit('update:modelValue', newTags);
  }
};
</script>

<style lang="scss" scoped>
.tag-input-container {
  margin-bottom: 1rem;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  padding: 0.5rem;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  background-color: var(--card-bg-color);
  min-height: 42px;
}

.tag-item {
  display: flex;
  align-items: center;
  background-color: rgba(74, 108, 247, 0.1);
  color: var(--primary-color);
  padding: 0.25rem 0.5rem;
  border-radius: 2rem;
  margin-right: 0.25rem;
  margin-bottom: 0.25rem;
}

.tag-text {
  margin-right: 0.25rem;
}

.tag-remove {
  background: none;
  border: none;
  color: var(--primary-color);
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0.1rem;
  margin-left: 0.25rem;
  border-radius: 50%;
  width: 18px;
  height: 18px;

  &:hover {
    background-color: rgba(74, 108, 247, 0.2);
  }
}

.tag-input {
  flex: 1;
  min-width: 100px;
  background: transparent;
  border: none;
  outline: none;
  padding: 0.25rem 0;
  color: var(--text-color);

  &.has-tags {
    margin-left: 0.25rem;
  }

  &:focus {
    box-shadow: none;
  }
}

.tag-help-text {
  font-size: 0.75rem;
  color: var(--text-secondary);
  margin-top: 0.25rem;
}
</style>
