<template>
  <div class="prompt-type-selector">
    <div
      v-if="showHeader"
      class="selector-header"
    >
      <h3>{{ title }}</h3>
      <p
        v-if="description"
        class="selector-description"
      >
        {{ description }}
      </p>
    </div>

    <div
      v-if="showSearch"
      class="search-filter"
    >
      <input
        v-model="searchQuery"
        type="text"
        placeholder="Search prompt types..."
        class="search-input"
      >
    </div>

    <div class="type-grid">
      <div
        v-for="type in filteredTypes"
        :key="type.id"
        class="type-card"
        :class="{
          selected: modelValue === type.id,
          featured: type.featured,
        }"
        @click="$emit('update:modelValue', type.id)"
      >
        <div class="type-icon">
          <i :class="type.icon" />
          <span
            v-if="type.featured"
            class="featured-badge"
          >Featured</span>
        </div>
        <div class="type-content">
          <h4 class="type-name">
            {{ type.name }}
          </h4>
          <p class="type-description">
            {{ type.description }}
          </p>

          <div
            v-if="showExample && type.example"
            class="type-example"
          >
            <div class="example-header">
              Example:
            </div>
            <div class="example-text">
              {{ type.example }}
            </div>
          </div>

          <div
            v-if="
              showBestPractices &&
                type.bestPractices &&
                type.bestPractices.length
            "
            class="type-best-practices"
          >
            <div class="practices-header">
              Best Practices:
            </div>
            <ul class="practices-list">
              <li
                v-for="(practice, i) in type.bestPractices"
                :key="i"
              >
                {{ practice }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>

    <div
      v-if="filteredTypes.length === 0"
      class="no-results"
    >
      <i class="fas fa-search" />
      <p>No matching prompt types found. Try a different search term.</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from "vue";
import { usePromptStore } from "@/stores/promptStore";

const props = defineProps({
  modelValue: {
    type: String,
    default: "",
  },
  title: {
    type: String,
    default: "Select Prompt Type",
  },
  description: {
    type: String,
    default: "Choose the type of prompt that best fits your needs",
  },
  showHeader: {
    type: Boolean,
    default: true,
  },
  showSearch: {
    type: Boolean,
    default: true,
  },
  showExample: {
    type: Boolean,
    default: true,
  },
  showBestPractices: {
    type: Boolean,
    default: false,
  },
  purpose: {
    type: String,
    default: null,
  },
});

const emit = defineEmits(["update:modelValue"]);

const promptStore = usePromptStore();
const searchQuery = ref("");
const promptTypes = ref([]);
const loading = ref(true);
const error = ref(null);

// Computed properties
const filteredTypes = computed(() => {
  let types = [...promptTypes.value];

  // Filter by purpose if specified
  if (props.purpose) {
    types = types.filter((type) => {
      // If the type has compatiblePurposes, check if our purpose is included
      return (
        !type.compatiblePurposes ||
        type.compatiblePurposes.includes(props.purpose)
      );
    });
  }

  // Then filter by search query
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase();
    return types.filter(
      (type) =>
        type.name.toLowerCase().includes(query) ||
        type.description.toLowerCase().includes(query) ||
        (type.tags &&
          type.tags.some((tag) => tag.toLowerCase().includes(query))),
    );
  }

  return types;
});

// Methods
async function loadPromptTypes() {
  loading.value = true;
  error.value = null;

  try {
    promptTypes.value = await promptStore.fetchPromptTypes();
  } catch (err) {
    console.error("Failed to load prompt types:", err);
    error.value = "Failed to load prompt types. Please try again.";

    // Fallback to default types
    promptTypes.value = getDefaultTypes();
  } finally {
    loading.value = false;
  }
}

function getDefaultTypes() {
  return [
    {
      id: "general",
      name: "General Purpose",
      description: "Versatile prompts for a wide range of tasks and outputs",
      icon: "fas fa-globe",
      featured: true,
      example: "Explain the concept of quantum computing in simple terms",
      bestPractices: [
        "Be specific about the desired output format",
        "Provide clear context about the topic",
        "Include examples of expected responses when possible",
      ],
      compatiblePurposes: [
        "information",
        "generation",
        "transformation",
        "analysis",
        "conversation",
      ],
    },
    {
      id: "coding",
      name: "Code Generation",
      description:
        "Prompts optimized for generating, explaining, or debugging code",
      icon: "fas fa-code",
      featured: true,
      example:
        "Write a JavaScript function that sorts an array of objects by a specific property",
      bestPractices: [
        "Specify the programming language",
        "Include error handling requirements",
        "Define expected inputs and outputs",
        "Mention performance considerations",
      ],
      compatiblePurposes: ["generation", "transformation", "analysis"],
    },
    {
      id: "creative",
      name: "Creative Writing",
      description:
        "Prompts for generating stories, poetry, and creative content",
      icon: "fas fa-feather-alt",
      example: "Write a short story about a robot discovering emotions",
      bestPractices: [
        "Define the tone and style",
        "Specify character details and setting",
        "Include desired themes or motifs",
        "Set approximate length requirements",
      ],
      compatiblePurposes: ["generation"],
    },
    {
      id: "analytical",
      name: "Data Analysis",
      description:
        "Prompts for analyzing data, extracting insights, and summarizing findings",
      icon: "fas fa-chart-pie",
      example: "Analyze this sales data and identify key trends and outliers",
      bestPractices: [
        "Specify the type of analysis needed",
        "Define key metrics to focus on",
        "Request specific visualizations or formats",
        "Include context about data collection methodology",
      ],
      compatiblePurposes: ["analysis", "information"],
    },
    {
      id: "instructional",
      name: "Tutorial & Guides",
      description:
        "Prompts for creating step-by-step instructions and educational content",
      icon: "fas fa-chalkboard-teacher",
      example: "Create a beginner's guide to baking sourdough bread",
      bestPractices: [
        "Specify the knowledge level of the audience",
        "Request clear steps with explanations",
        "Include safety warnings if applicable",
        "Ask for troubleshooting tips",
      ],
      compatiblePurposes: ["generation", "information"],
    },
    {
      id: "conversational",
      name: "Dialogue & Chat",
      description: "Prompts for creating engaging conversational interfaces",
      icon: "fas fa-comments",
      example:
        "Design a customer service chatbot that can handle common support questions",
      bestPractices: [
        "Define the personality and tone",
        "Include fallback responses",
        "Specify how to handle ambiguous questions",
        "Set the boundaries of the conversation",
      ],
      compatiblePurposes: ["conversation"],
    },
  ];
}

// Lifecycle hooks
onMounted(async () => {
  await loadPromptTypes();
});

// Watch for purpose changes
watch(
  () => props.purpose,
  () => {
    // If current selection is no longer compatible with the new purpose,
    // reset the selection
    if (props.purpose && props.modelValue) {
      const currentType = promptTypes.value.find(
        (t) => t.id === props.modelValue,
      );
      if (
        currentType &&
        currentType.compatiblePurposes &&
        !currentType.compatiblePurposes.includes(props.purpose)
      ) {
        emit("update:modelValue", "");
      }
    }
  },
);
</script>

<style lang="scss" scoped>
.prompt-type-selector {
  .selector-header {
    margin-bottom: 1.5rem;

    h3 {
      margin-bottom: 0.5rem;
      font-size: 1.2rem;
    }

    .selector-description {
      color: #666;
      font-size: 0.9rem;
    }
  }

  .search-filter {
    margin-bottom: 1.5rem;

    .search-input {
      width: 100%;
      padding: 0.8rem;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
      font-size: 0.9rem;

      &:focus {
        outline: none;
        border-color: var(--primary-color);
      }
    }
  }

  .type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1.25rem;

    .type-card {
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.2s ease;
      position: relative;
      display: flex;
      flex-direction: column;

      &:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 15px rgba(0, 0, 0, 0.1);
      }

      &.selected {
        border-color: var(--primary-color);
        background-color: rgba(var(--primary-color-rgb), 0.05);
        box-shadow: 0 6px 15px rgba(var(--primary-color-rgb), 0.15);
      }

      &.featured {
        border-color: #ffc107;

        &::before {
          content: "";
          position: absolute;
          top: 0;
          right: 0;
          width: 0;
          height: 0;
          border-style: solid;
          border-width: 0 25px 25px 0;
          border-color: transparent #ffc107 transparent transparent;
          border-top-right-radius: 6px;
        }
      }

      .type-icon {
        margin-bottom: 1rem;
        position: relative;

        i {
          font-size: 2rem;
          color: var(--primary-color);
        }

        .featured-badge {
          position: absolute;
          top: -8px;
          right: -8px;
          background-color: #ffc107;
          color: #333;
          font-size: 0.7rem;
          padding: 0.15rem 0.5rem;
          border-radius: 10px;
          font-weight: bold;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }
      }

      .type-content {
        flex: 1;
        display: flex;
        flex-direction: column;

        .type-name {
          margin-bottom: 0.5rem;
          font-size: 1.1rem;
        }

        .type-description {
          color: #666;
          font-size: 0.9rem;
          margin-bottom: 1rem;
          flex: 0 0 auto;
        }

        .type-example {
          margin-bottom: 1rem;
          background-color: #f9f9f9;
          padding: 0.75rem;
          border-radius: 4px;
          font-size: 0.85rem;
          flex: 1 1 auto;

          .example-header {
            font-weight: bold;
            margin-bottom: 0.5rem;
            font-size: 0.8rem;
            color: #555;
          }

          .example-text {
            font-style: italic;
            color: #444;
          }
        }

        .type-best-practices {
          margin-top: auto;
          padding-top: 1rem;
          border-top: 1px solid #f0f0f0;
          flex: 0 0 auto;

          .practices-header {
            font-weight: bold;
            margin-bottom: 0.5rem;
            font-size: 0.8rem;
            color: #555;
          }

          .practices-list {
            padding-left: 1.5rem;
            margin: 0;

            li {
              font-size: 0.8rem;
              margin-bottom: 0.3rem;
              color: #555;
            }
          }
        }
      }
    }
  }

  .no-results {
    text-align: center;
    padding: 2rem;
    background-color: #f9f9f9;
    border-radius: 8px;
    color: #666;

    i {
      font-size: 2rem;
      margin-bottom: 1rem;
      opacity: 0.5;
    }

    p {
      font-size: 0.9rem;
    }
  }
}
</style>
