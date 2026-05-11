<template>
  <div 
    v-if="isThinking || hasThinkingContent" 
    class="thinking-panel"
    :class="{ 'thinking-expanded': isExpanded }"
  >
    <!-- Thinking header - always visible when there's thinking content -->
    <div
      class="thinking-header"
      @click="toggleExpanded"
    >
      <div class="thinking-header-content">
        <div class="thinking-icon-container">
          <svg 
            class="thinking-icon" 
            :class="{ 'spinning': isThinking }"
            width="16" 
            height="16" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <circle
              cx="12"
              cy="12"
              r="3"
            />
            <path d="M12 1v6m0 6v6" />
            <path d="m16.24 7.76-4.24 4.24-4.24-4.24" />
          </svg>
        </div>
        
        <div class="thinking-status">
          <span class="thinking-label">
            {{ isThinking ? 'Thinking...' : 'Thinking complete' }}
          </span>
          <span
            v-if="thinkingDuration"
            class="thinking-duration"
          >
            ({{ formatDuration(thinkingDuration) }})
          </span>
        </div>
      </div>
      
      <div class="thinking-controls">
        <span
          v-if="thinkingTokenCount"
          class="token-count"
        >
          {{ thinkingTokenCount }} tokens
        </span>
        <button
          class="expand-toggle"
          :aria-label="isExpanded ? 'Collapse thinking' : 'Expand thinking'"
        >
          <svg
            width="12"
            height="12"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path :d="isExpanded ? 'M18 15l-6-6-6 6' : 'M6 9l6 6 6-6'" />
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Thinking content - expandable -->
    <div 
      v-if="isExpanded" 
      ref="thinkingContent"
      class="thinking-content"
    >
      <div
        ref="thinkingScroll"
        class="thinking-scroll-area"
      >
        <MarkdownPreview 
          v-if="thinkingContent" 
          :content="thinkingContent" 
          class="thinking-markdown"
        />
        <div
          v-else-if="isThinking"
          class="thinking-placeholder"
        >
          <div class="thinking-dots">
            <span />
            <span />
            <span />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import MarkdownPreview from './MarkdownPreview.vue'

const props = defineProps({
  thinkingContent: {
    type: String,
    default: ''
  },
  isThinking: {
    type: Boolean,
    default: false
  },
  defaultExpanded: {
    type: Boolean,
    default: false
  },
  thinkingStartTime: {
    type: Date,
    default: null
  },
  thinkingEndTime: {
    type: Date,
    default: null
  },
  thinkingTokenCount: {
    type: Number,
    default: 0
  },
  autoScroll: {
    type: Boolean,
    default: true
  }
})

const isExpanded = ref(props.defaultExpanded)
const thinkingScroll = ref(null)

const hasThinkingContent = computed(() => {
  return props.thinkingContent && props.thinkingContent.trim().length > 0
})

const thinkingDuration = computed(() => {
  if (props.thinkingStartTime) {
    const endTime = props.thinkingEndTime || (props.isThinking ? new Date() : null)
    if (endTime) {
      return endTime.getTime() - props.thinkingStartTime.getTime()
    }
  }
  return null
})

function toggleExpanded() {
  isExpanded.value = !isExpanded.value
}

function formatDuration(milliseconds) {
  if (milliseconds < 1000) {
    return `${milliseconds}ms`
  }
  const seconds = Math.floor(milliseconds / 1000)
  if (seconds < 60) {
    return `${seconds}s`
  }
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = seconds % 60
  return `${minutes}m ${remainingSeconds}s`
}

// Auto-scroll to bottom when new thinking content arrives
watch(() => props.thinkingContent, async () => {
  if (props.autoScroll && isExpanded.value && thinkingScroll.value) {
    await nextTick()
    const scrollElement = thinkingScroll.value
    scrollElement.scrollTop = scrollElement.scrollHeight
  }
})

// Auto-expand when thinking starts (optional behavior)
watch(() => props.isThinking, () => {
  // Optionally auto-expand when thinking starts
  // if (props.isThinking && !hasThinkingContent.value) {
  //   isExpanded.value = true
  // }
})
</script>

<style scoped>
.thinking-panel {
  margin: 8px 0;
  border: 1px solid var(--border-color, #e0e0e0);
  border-radius: 8px;
  background: var(--thinking-bg, #f8f9fa);
  overflow: hidden;
  transition: all 0.2s ease;
}

.thinking-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  user-select: none;
  background: var(--thinking-header-bg, #f0f1f2);
  border-bottom: 1px solid transparent;
  transition: background-color 0.2s ease;
}

.thinking-header:hover {
  background: var(--thinking-header-hover-bg, #e8e9ea);
}

.thinking-expanded .thinking-header {
  border-bottom-color: var(--border-color, #e0e0e0);
}

.thinking-header-content {
  display: flex;
  align-items: center;
  gap: 8px;
}

.thinking-icon-container {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.thinking-icon {
  color: var(--thinking-icon-color, #6366f1);
  transition: transform 0.2s ease;
}

.thinking-icon.spinning {
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.thinking-status {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.thinking-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--thinking-label-color, #374151);
}

.thinking-duration {
  font-size: 0.75rem;
  color: var(--text-muted, #6b7280);
}

.thinking-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.token-count {
  font-size: 0.75rem;
  color: var(--text-muted, #6b7280);
  background: var(--token-count-bg, #e5e7eb);
  padding: 2px 6px;
  border-radius: 4px;
}

.expand-toggle {
  background: none;
  border: none;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  color: var(--text-muted, #6b7280);
  transition: all 0.2s ease;
}

.expand-toggle:hover {
  background: var(--button-hover-bg, #e5e7eb);
  color: var(--text-color, #374151);
}

.thinking-content {
  border-top: 1px solid var(--border-color, #e0e0e0);
  background: var(--thinking-content-bg, #ffffff);
}

.thinking-scroll-area {
  max-height: 300px;
  overflow-y: auto;
  padding: 16px;
}

.thinking-scroll-area::-webkit-scrollbar {
  width: 6px;
}

.thinking-scroll-area::-webkit-scrollbar-track {
  background: var(--scrollbar-track, #f1f1f1);
}

.thinking-scroll-area::-webkit-scrollbar-thumb {
  background: var(--scrollbar-thumb, #c1c1c1);
  border-radius: 3px;
}

.thinking-scroll-area::-webkit-scrollbar-thumb:hover {
  background: var(--scrollbar-thumb-hover, #a8a8a8);
}

.thinking-markdown {
  font-size: 0.875rem;
  line-height: 1.5;
}

.thinking-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  color: var(--text-muted, #6b7280);
}

.thinking-dots {
  display: flex;
  gap: 4px;
}

.thinking-dots span {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--thinking-dots-color, #6366f1);
  animation: thinking-pulse 1.4s ease-in-out infinite both;
}

.thinking-dots span:nth-child(1) { animation-delay: -0.32s; }
.thinking-dots span:nth-child(2) { animation-delay: -0.16s; }
.thinking-dots span:nth-child(3) { animation-delay: 0s; }

@keyframes thinking-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.5;
  }
  40% {
    transform: scale(1);
    opacity: 1;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .thinking-panel {
    --thinking-bg: #1f2937;
    --thinking-header-bg: #374151;
    --thinking-header-hover-bg: #4b5563;
    --thinking-content-bg: #1f2937;
    --thinking-icon-color: #818cf8;
    --thinking-label-color: #f3f4f6;
    --border-color: #4b5563;
    --text-muted: #9ca3af;
    --text-color: #f3f4f6;
    --token-count-bg: #4b5563;
    --button-hover-bg: #4b5563;
    --scrollbar-track: #374151;
    --scrollbar-thumb: #6b7280;
    --scrollbar-thumb-hover: #9ca3af;
    --thinking-dots-color: #818cf8;
  }
}
</style>