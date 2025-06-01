<template>
  <div
    class="template-preview"
    :class="{ selected: selected }"
    @click="$emit('select', template.id)"
  >
    <div class="template-header">
      <h4 class="template-title">
        {{ template.name }}
      </h4>
    </div>

    <div class="template-tags">
      <span
        v-for="tag in template.tags"
        :key="tag"
        class="template-tag"
      >
        {{ tag }}
      </span>
    </div>

    <div class="template-preview-content">
      <div class="preview-label">
        Preview:
      </div>
      <div class="preview-text">
        <pre>{{ truncatedContent }}</pre>
      </div>
    </div>

    <div
      v-if="template.sections && template.sections.length"
      class="template-sections"
    >
      <div class="sections-label">
        Sections:
      </div>
      <div class="section-list">
        <div
          v-for="section in template.sections"
          :key="section.id"
          class="section-item"
          :class="{
            required: section.isRequired,
            customizable: section.isCustomizable,
          }"
        >
          <i
            v-if="section.isRequired"
            class="fas fa-exclamation-circle"
          />
          <i
            v-else-if="section.isCustomizable"
            class="fas fa-pencil-alt"
          />
          <i
            v-else
            class="fas fa-check-circle"
          />
          {{ section.name }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from "vue";

const props = defineProps({
  template: {
    type: Object,
    required: true,
    validator: (template) => {
      return template && template.id && template.name && template.content;
    },
  },
  selected: {
    type: Boolean,
    default: false,
  },
});

defineEmits(["select"]);

// Computed properties
const maxLength = 1000;

const truncatedContent = computed(() => {
  if (!props.template.content) return "";

  // Show more content but still truncate very long content
  if (props.template.content.length <= maxLength) {
    return props.template.content;
  }

  return props.template.content.substring(0, maxLength) + "...";
});
</script>

<style lang="scss" scoped>
.template-preview {
  position: relative;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 1.25rem;
  background-color: white;
  transition: all 0.2s ease;
  height: 100%;
  display: flex;
  flex-direction: column;
  cursor: pointer;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
    border-color: var(--primary-color);
  }

  &.selected {
    border-color: var(--primary-color);
    box-shadow: 0 6px 15px rgba(var(--primary-color-rgb), 0.2);

    &::before {
      content: "";
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      background-color: var(--primary-color);
      border-radius: 50%;
      z-index: 1;
    }

    &::after {
      content: "\f00c"; /* Font Awesome check icon */
      font-family: "Font Awesome 5 Free";
      font-weight: 900;
      position: absolute;
      top: -8px;
      right: -8px;
      width: 24px;
      height: 24px;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
    }
  }

  .template-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 0.75rem;

    .template-title {
      margin: 0;
      font-size: 1.1rem;
      flex: 1;
    }

    .template-popularity {
      font-size: 0.8rem;
      display: flex;
      align-items: center;
      color: #666;

      i {
        color: #ffc107;
        margin-right: 0.25rem;
      }
    }
  }

  .template-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    margin-bottom: 1rem;
    flex: 0 0 auto;

    .template-tag {
      background-color: #f0f0f0;
      color: #555;
      font-size: 0.75rem;
      padding: 0.25rem 0.5rem;
      border-radius: 4px;
    }
  }

  .template-preview-content {
    margin-bottom: 0;
    flex: 1 1 auto;

    .preview-label {
      font-weight: bold;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .preview-text {
      font-size: 0.85rem;
      line-height: 1.4;
      color: #444;
      background-color: #f9f9f9;
      border-radius: 4px;
      font-family: monospace;
      height: 180px;
      overflow: auto;
      position: relative;

      pre {
        margin: 0;
        padding: 0.75rem;
        font-family: monospace;
        font-size: 0.85rem;
        line-height: 1.4;
        white-space: pre-wrap;
        word-break: break-word;
      }
    }
  }

  .template-sections {
    margin-bottom: 1rem;
    flex: 0 0 auto;

    .sections-label {
      font-weight: bold;
      font-size: 0.8rem;
      margin-bottom: 0.5rem;
    }

    .section-list {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;

      .section-item {
        font-size: 0.75rem;
        padding: 0.25rem 0.5rem;
        border-radius: 4px;
        display: flex;
        align-items: center;

        i {
          margin-right: 0.25rem;
          font-size: 0.7rem;
        }

        &.required {
          background-color: rgba(var(--warning-color-rgb, 255, 193, 7), 0.2);
          color: var(--warning-color-dark, #d39e00);

          i {
            color: var(--warning-color, #ffc107);
          }
        }

        &.customizable {
          background-color: rgba(var(--info-color-rgb, 23, 162, 184), 0.2);
          color: var(--info-color-dark, #138496);

          i {
            color: var(--info-color, #17a2b8);
          }
        }

        &:not(.required):not(.customizable) {
          background-color: rgba(var(--success-color-rgb, 40, 167, 69), 0.2);
          color: var(--success-color-dark, #218838);

          i {
            color: var(--success-color, #28a745);
          }
        }
      }
    }
  }
}
</style>
