<template>
  <div class="ai-prompt-questionnaire">
    <div class="questionnaire-progress">
      <div class="progress-bar">
        <div
          class="progress-filled"
          :style="{ width: `${progressPercentage}%` }"
        />
      </div>
      <div class="progress-text">
        Question {{ currentQuestionIndex + 1 }} of {{ questions.length }}
      </div>
    </div>

    <!-- Question Button Bar -->
    <div class="questionnaire-actions top-actions">
      <button
        v-if="
          currentQuestionIndex > 0 && !generatingPrompt && !aiResponse.content
        "
        class="secondary-button icon-button"
        title="Previous Question"
        @click="previousQuestion"
      >
        &#8678;
      </button>
      <div class="action-right">
        <button
          v-if="!isLastQuestion && !generatingPrompt && !aiResponse.content"
          class="primary-button icon-button"
          :disabled="!canProceed"
          title="Next Question"
          @click="nextQuestion"
        >
          &#8680;
        </button>
        <button
          v-if="isLastQuestion && !generatingPrompt && !aiResponse.content"
          class="generate-button icon-button"
          :disabled="!canProceed"
          title="Generate Prompt"
          @click="generatePrompt"
        >
          ✨
        </button>
        <button
          v-if="aiResponse.content"
          class="secondary-button icon-button"
          title="Regenerate Prompt"
          @click="regeneratePrompt"
        >
          ↻
        </button>
        <button
          v-if="aiResponse.content"
          class="success-button icon-button"
          title="Use This Prompt"
          @click="useGeneratedPrompt"
        >
          ✓
        </button>
      </div>
    </div>

    <div class="questionnaire-content">
      <!-- Current Question -->
      <transition
        name="fade"
        mode="out-in"
      >
        <div
          v-if="!generatingPrompt && !aiResponse.content"
          :key="currentQuestion.id"
          class="question-container"
        >
          <h4 class="question-text">
            {{ currentQuestion.text }}
          </h4>

          <div
            v-if="currentQuestion.type === 'text'"
            class="question-input text-input"
          >
            <textarea
              v-model="currentAnswer"
              :placeholder="
                currentQuestion.placeholder || 'Type your answer...'
              "
              rows="4"
              @keydown.enter.exact.prevent="nextQuestion"
            />
          </div>

          <div
            v-else-if="currentQuestion.type === 'options'"
            class="question-input options-input"
          >
            <div
              v-for="option in currentQuestion.options"
              :key="option.value"
              class="option-item"
              :class="{ selected: currentAnswer === option.value }"
              @click="currentAnswer = option.value"
            >
              <div class="option-selector">
                <div class="option-checkbox" />
              </div>
              <div class="option-content">
                <div class="option-label">
                  {{ option.label }}
                </div>
                <div
                  v-if="option.description"
                  class="option-description"
                >
                  {{ option.description }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="currentQuestion.type === 'multi-select'"
            class="question-input multiselect-input"
          >
            <div
              v-for="option in currentQuestion.options"
              :key="option.value"
              class="option-item"
              :class="{ selected: currentAnswerArray.includes(option.value) }"
              @click="toggleMultiSelect(option.value)"
            >
              <div class="option-selector">
                <div class="option-checkbox" />
              </div>
              <div class="option-content">
                <div class="option-label">
                  {{ option.label }}
                </div>
                <div
                  v-if="option.description"
                  class="option-description"
                >
                  {{ option.description }}
                </div>
              </div>
            </div>
          </div>

          <div
            v-else-if="currentQuestion.type === 'slider'"
            class="question-input slider-input"
          >
            <div class="slider-labels">
              <span>{{
                currentQuestion.min_label || currentQuestion.min
              }}</span>
              <span>{{
                currentQuestion.max_label || currentQuestion.max
              }}</span>
            </div>
            <input
              v-model.number="currentAnswer"
              type="range"
              :min="currentQuestion.min || 1"
              :max="currentQuestion.max || 10"
              :step="currentQuestion.step || 1"
            >
            <div class="slider-value">
              {{ currentAnswer }}
            </div>
          </div>
        </div>

        <!-- Loading State -->
        <div
          v-else-if="generatingPrompt"
          key="generating"
          class="generating-container"
        >
          <div class="loading-spinner" />
          <h4>Generating your prompt...</h4>
          <p>Creating a tailored prompt based on your inputs</p>
        </div>

        <!-- AI Response -->
        <div
          v-else-if="aiResponse.content"
          key="aiResponse"
          class="ai-response-container"
        >
          <h4>Your AI-Generated Prompt</h4>

          <div class="prompt-preview">
            <MarkdownPreview :content="aiResponse.content" />
          </div>

          <div class="prompt-details">
            <div class="details-section">
              <h5>Suggested Title</h5>
              <input
                v-model="aiResponse.title"
                type="text"
                class="title-input"
              >
            </div>

            <div class="details-section">
              <h5>Suggested Tags</h5>
              <div class="tags-container">
                <div
                  v-for="(tag, index) in aiResponse.tags"
                  :key="index"
                  class="tag-item"
                >
                  <span class="tag-text">{{ tag }}</span>
                  <button
                    class="tag-remove"
                    @click="removeTag(index)"
                  >
                    ×
                  </button>
                </div>
                <input
                  v-if="showTagInput"
                  ref="newTagInput"
                  v-model="newTag"
                  class="tag-input"
                  placeholder="Add tag..."
                  style="padding: 8px 12px; margin: 4px; min-width: 120px"
                  @keydown.enter.prevent="addTag"
                  @blur="hideTagInput"
                >
                <button
                  v-else
                  class="add-tag-button"
                  @click="
                    showTagInput = true;
                    focusTagInput();
                  "
                >
                  + Add
                </button>
              </div>
            </div>
          </div>
        </div>
      </transition>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from "vue";
import MarkdownPreview from "@/components/MarkdownPreview.vue";
import { usePromptStore } from "@/stores/promptStore";

const props = defineProps({
  promptType: {
    type: String,
    required: true,
  },
  promptPurpose: {
    type: String,
    required: true,
  },
});

const emit = defineEmits(["complete"]);

const promptStore = usePromptStore();

// Questionnaire state
const currentQuestionIndex = ref(0);
const answers = ref({});
const currentAnswer = ref("");
const currentAnswerArray = ref([]);
const generatingPrompt = ref(false);
const aiResponse = ref({
  content: "",
  title: "",
  tags: [],
});

// Tag management
const newTag = ref("");
const showTagInput = ref(false);
const newTagInput = ref(null);

// Define questions based on prompt type and purpose
const questions = ref([
  {
    id: "goal",
    text: "What is the main goal of this prompt?",
    type: "text",
    placeholder:
      "For example: Generate a story, explain a concept, analyze data...",
    required: true,
  },
  {
    id: "audience",
    text: "Who is the intended audience for the AI's response?",
    type: "options",
    options: [
      {
        value: "technical",
        label: "Technical Audience",
        description: "People with specialized knowledge in this domain",
      },
      {
        value: "non-technical",
        label: "Non-Technical Audience",
        description: "People without specialized knowledge in this domain",
      },
      {
        value: "mixed",
        label: "Mixed Audience",
        description: "Variety of knowledge levels",
      },
      {
        value: "children",
        label: "Children",
        description: "Simplified explanations for younger audiences",
      },
    ],
    required: true,
  },
  {
    id: "tone",
    text: "What tone should the AI use in its response?",
    type: "options",
    options: [
      {
        value: "formal",
        label: "Formal",
        description: "Professional and structured",
      },
      {
        value: "casual",
        label: "Casual",
        description: "Relaxed and conversational",
      },
      {
        value: "educational",
        label: "Educational",
        description: "Instructive and informative",
      },
      {
        value: "creative",
        label: "Creative",
        description: "Imaginative and original",
      },
      {
        value: "technical",
        label: "Technical",
        description: "Precise and specialized",
      },
    ],
    required: true,
  },
  {
    id: "length",
    text: "How detailed should the response be?",
    type: "slider",
    min: 1,
    max: 5,
    step: 1,
    min_label: "Concise",
    max_label: "Comprehensive",
    required: true,
  },
  {
    id: "components",
    text: "Which components should be included in the response?",
    type: "multi-select",
    options: [
      {
        value: "examples",
        label: "Examples",
        description: "Practical examples that illustrate concepts",
      },
      {
        value: "steps",
        label: "Step-by-step instructions",
        description: "Sequential instructions or procedures",
      },
      {
        value: "context",
        label: "Background context",
        description: "Historical or theoretical background information",
      },
      {
        value: "visuals",
        label: "Visual descriptions",
        description: "Descriptive language that creates visual imagery",
      },
      {
        value: "data",
        label: "Data/statistics",
        description: "Numerical information and analysis",
      },
      {
        value: "analogies",
        label: "Analogies/metaphors",
        description: "Comparative explanations to simplify concepts",
      },
    ],
    required: true,
  },
  {
    id: "constraints",
    text: "Any specific constraints or requirements?",
    type: "text",
    placeholder:
      "For example: must include specific keywords, must follow a particular format...",
    required: false,
  },
]);

// Add type-specific questions
watch(
  () => props.promptType,
  () => {
    // This would dynamically adjust questions based on the selected prompt type
    // For now, we'll use a common set of questions for all types
  },
  { immediate: true },
);

// Computed properties
const currentQuestion = computed(() => {
  return questions.value[currentQuestionIndex.value] || {};
});

const isLastQuestion = computed(() => {
  return currentQuestionIndex.value === questions.value.length - 1;
});

const progressPercentage = computed(() => {
  return Math.round(
    (currentQuestionIndex.value / questions.value.length) * 100,
  );
});

const canProceed = computed(() => {
  const question = currentQuestion.value;

  if (!question.required) {
    return true;
  }

  if (question.type === "multi-select") {
    return currentAnswerArray.value.length > 0;
  }

  return !!currentAnswer.value || currentAnswer.value === 0;
});

// Methods
function nextQuestion() {
  if (!canProceed.value) return;

  // Save the current answer
  saveCurrentAnswer();

  // Move to the next question if not at the end
  if (currentQuestionIndex.value < questions.value.length - 1) {
    currentQuestionIndex.value++;
    loadCurrentAnswer();
  }
}

function previousQuestion() {
  // Save the current answer even when going back
  saveCurrentAnswer();

  // Move to the previous question if not at the beginning
  if (currentQuestionIndex.value > 0) {
    currentQuestionIndex.value--;
    loadCurrentAnswer();
  }
}

function saveCurrentAnswer() {
  const question = currentQuestion.value;

  if (question.type === "multi-select") {
    answers.value[question.id] = [...currentAnswerArray.value];
  } else {
    answers.value[question.id] = currentAnswer.value;
  }
}

function loadCurrentAnswer() {
  const question = currentQuestion.value;
  const savedAnswer = answers.value[question.id];

  if (question.type === "multi-select") {
    currentAnswerArray.value = savedAnswer ? [...savedAnswer] : [];
    currentAnswer.value = "";
  } else if (question.type === "slider") {
    // For slider questions, initialize with min value or saved value
    currentAnswer.value =
      savedAnswer !== undefined ? savedAnswer : question.min || 1;
    currentAnswerArray.value = [];
  } else {
    currentAnswer.value = savedAnswer !== undefined ? savedAnswer : "";
    currentAnswerArray.value = [];
  }
}

function toggleMultiSelect(value) {
  const index = currentAnswerArray.value.indexOf(value);

  if (index === -1) {
    currentAnswerArray.value.push(value);
  } else {
    currentAnswerArray.value.splice(index, 1);
  }
}

async function generatePrompt() {
  // Save the current answer
  saveCurrentAnswer();

  // Start loading state
  generatingPrompt.value = true;

  try {
    // Add type and purpose to the answers
    const allAnswers = {
      ...answers.value,
      promptType: props.promptType,
      promptPurpose: props.promptPurpose,
    };

    // Call the AI generation service through the store
    const response =
      await promptStore.generatePromptFromQuestionnaire(allAnswers);

    // Store the AI response
    console.log("Response received:", response);

    if (!response || !response.content) {
      console.error("No content received in response");
      throw new Error("No prompt content received from the service");
    }

    // Deduplicate tags if they exist
    let uniqueTags = [];
    if (response.suggestedTags && response.suggestedTags.length > 0) {
      // Create a Set to ensure uniqueness and convert back to array
      uniqueTags = [...new Set(response.suggestedTags)];
    }

    console.log(
      "Setting aiResponse with content of length:",
      response.content.length,
    );
    aiResponse.value = {
      content: response.content,
      title: response.title || `${getReadableType()} Prompt`,
      tags: uniqueTags,
    };

    console.log("aiResponse is now:", aiResponse.value);
  } catch (error) {
    console.error("Error generating prompt:", error);
    // Provide a fallback response with helpful error message
    aiResponse.value = {
      content:
        "# Generated Prompt\n\nUnable to generate prompt from your inputs. Please try again or use a different creation method.\n\nError: " +
        (error.message || "Unknown error"),
      title: `${getReadableType()} Prompt (Error)`,
      tags: [],
    };
  } finally {
    generatingPrompt.value = false;
  }
}

function getReadableType() {
  switch (props.promptType) {
    case "general":
      return "General Purpose";
    case "coding":
      return "Code Generation";
    case "creative":
      return "Creative";
    case "analytical":
      return "Analytical";
    default:
      return "Custom";
  }
}

function regeneratePrompt() {
  // Reset AI response and regenerate
  console.log("Regenerating prompt...");
  aiResponse.value = {
    content: "",
    title: "",
    tags: [],
  };
  generatePrompt();
}

function useGeneratedPrompt() {
  // Debug the state before emitting
  console.log("useGeneratedPrompt called with aiResponse:", aiResponse.value);
  console.log("Content length:", aiResponse.value.content?.length || 0);

  // Emit the completed event with the generated content
  emit("complete", {
    content: aiResponse.value.content,
    title: aiResponse.value.title,
    tags: aiResponse.value.tags,
  });
}

// Tag management methods
function addTag() {
  if (newTag.value.trim()) {
    aiResponse.value.tags.push(newTag.value.trim());
    newTag.value = "";
  }
}

function removeTag(index) {
  aiResponse.value.tags.splice(index, 1);
}

function focusTagInput() {
  nextTick(() => {
    if (newTagInput.value) {
      newTagInput.value.focus();
    }
  });
}

function hideTagInput() {
  if (newTag.value.trim()) {
    addTag();
  }
  showTagInput.value = false;
}

// Watch aiResponse.content to debug state transitions
watch(
  () => aiResponse.value.content,
  (newContent, oldContent) => {
    console.log(
      `aiResponse.content changed: now ${newContent.length} chars (was ${oldContent?.length || 0} chars)`,
    );
    if (newContent) {
      console.log("Content excerpt:", newContent.substring(0, 50) + "...");
    }
  },
);

// Initialize
loadCurrentAnswer();
</script>

<style lang="scss" scoped>
.ai-prompt-questionnaire {
  display: flex;
  flex-direction: column;
  height: auto; /* Changed from 100% to auto to prevent cutoff */
  background-color: var(--card-bg-color, white);
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 2rem; /* Add bottom margin to ensure visibility */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  .questionnaire-progress {
    margin-bottom: 0; /* Remove margin */

    .progress-bar {
      height: 6px;
      background-color: #f0f0f0;
      border-radius: 3px;
      overflow: hidden;
      margin-bottom: 0.5rem;

      .progress-filled {
        height: 100%;
        background-color: var(--primary-color);
        transition: width 0.3s ease;
      }
    }

    .progress-text {
      font-size: 0.85rem;
      color: #666;
      text-align: right;
      padding-bottom: 0.5rem; /* Add a small padding instead of margin */
    }
  }

  .questionnaire-content {
    flex: 1;
    overflow-y: auto;
    padding: 0.5rem 0;

    .question-container {
      .question-text {
        margin-bottom: 1.5rem;
        font-size: 1.1rem;
      }

      .question-input {
        &.text-input {
          textarea {
            width: 100%;
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            font-size: 1rem;
            resize: vertical;
            min-height: 120px;

            &:focus {
              outline: none;
              border-color: var(--primary-color);
            }
          }
        }

        &.options-input,
        &.multiselect-input {
          .option-item {
            display: flex;
            align-items: flex-start;
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 6px;
            margin-bottom: 1rem;
            cursor: pointer;
            transition: all 0.2s ease;

            &:hover {
              border-color: var(--primary-color-light);
              background-color: rgba(var(--primary-color-rgb), 0.05);
            }

            &.selected {
              border-color: var(--primary-color);
              background-color: var(
                --selected-item-bg,
                rgba(var(--primary-color-rgb, 74, 108, 247), 0.1)
              );
              color: var(--selected-item-text, inherit);

              .option-selector {
                .option-checkbox {
                  border-color: var(--primary-color);
                  background-color: var(--primary-color);

                  &::after {
                    opacity: 1;
                  }
                }
              }

              .option-description {
                color: var(--selected-item-description, #666);
              }
            }

            .option-selector {
              margin-right: 1rem;
              padding-top: 0.2rem;

              .option-checkbox {
                width: 20px;
                height: 20px;
                border: 2px solid #ccc;
                border-radius: 4px;
                position: relative;
                transition: all 0.2s ease;

                &::after {
                  content: "";
                  position: absolute;
                  top: 3px;
                  left: 6px;
                  width: 5px;
                  height: 10px;
                  border: solid white;
                  border-width: 0 2px 2px 0;
                  transform: rotate(45deg);
                  opacity: 0;
                  transition: opacity 0.2s ease;
                }
              }
            }

            .option-content {
              flex: 1;

              .option-label {
                font-weight: bold;
                margin-bottom: 0.3rem;
              }

              .option-description {
                font-size: 0.9rem;
                color: #666;
              }
            }
          }
        }

        &.slider-input {
          padding: 1rem 0;

          .slider-labels {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.5rem;
            font-size: 0.85rem;
            color: #666;
          }

          input[type="range"] {
            width: 100%;
            -webkit-appearance: none;
            height: 8px;
            border-radius: 4px;
            background: #f0f0f0;
            outline: none;
            margin: 15px 0;

            &::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }

            &::-moz-range-thumb {
              width: 22px;
              height: 22px;
              border-radius: 50%;
              background: var(--primary-color);
              cursor: pointer;
              border: 2px solid white;
              box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
            }
          }

          .slider-value {
            text-align: center;
            font-weight: bold;
            font-size: 1.2rem;
            color: var(--primary-color);
            margin-top: 0.5rem;
          }
        }
      }
    }

    .generating-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;

      .loading-spinner {
        width: 40px;
        height: 40px;
        border: 3px solid #f0f0f0;
        border-top: 3px solid var(--primary-color);
        border-radius: 50%;
        animation: spin 1.5s linear infinite;
        margin-bottom: 1.5rem;
      }

      @keyframes spin {
        0% {
          transform: rotate(0deg);
        }
        100% {
          transform: rotate(360deg);
        }
      }

      h4 {
        margin-bottom: 0.5rem;
        font-size: 1.2rem;
      }

      p {
        color: #666;
      }
    }

    .ai-response-container {
      h4 {
        margin-bottom: 1.5rem;
        font-size: 1.2rem;
      }

      .prompt-preview {
        padding: 1rem;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        background-color: #f9f9f9;
        margin-bottom: 1.5rem;
        max-height: 300px;
        overflow-y: auto;
      }

      .prompt-details {
        .details-section {
          margin-bottom: 1.5rem;

          h5 {
            margin-bottom: 0.5rem;
            font-size: 1rem;
            color: #555;
          }

          .title-input {
            width: 100%;
            padding: 0.8rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-size: 1rem;

            &:focus {
              outline: none;
              border-color: var(--primary-color);
            }
          }

          .tags-container {
            display: flex;
            flex-wrap: wrap;
            gap: 0.5rem;

            .tag-item {
              display: flex;
              align-items: center;
              background-color: var(--tag-bg-color, #f0f0f0);
              color: var(
                --tag-text-color,
                #333
              ); /* Darker text for better contrast */
              border-radius: 16px;
              padding: 0.3rem 0.7rem;
              font-size: 0.85rem;
              font-weight: 500; /* Slightly bolder for better readability */

              .tag-text {
                margin-right: 0.3rem;
              }

              .tag-remove {
                background: none;
                border: none;
                color: var(--tag-remove-color, #666);
                cursor: pointer;
                font-size: 1.1rem;
                line-height: 1;
                padding: 0;

                &:hover {
                  color: var(--tag-remove-hover-color, #ff3b30);
                }
              }
            }

            .tag-input {
              border: none;
              background: transparent;
              padding: 8px 12px !important;
              margin: 4px !important;
              font-size: 0.85rem;
              min-width: 120px !important;
              border-radius: 4px;

              &:focus {
                outline: none;
                background-color: rgba(0, 0, 0, 0.04);
              }
            }

            .add-tag-button {
              background: none;
              border: 1px dashed var(--tag-border-color, #ccc);
              color: var(--tag-text-color, #666);
              border-radius: 16px;
              padding: 0.3rem 0.7rem;
              font-size: 0.85rem;
              cursor: pointer;

              &:hover {
                border-color: var(--primary-color);
                color: var(--primary-color);
              }
            }
          }
        }
      }
    }
  }

  .questionnaire-actions {
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 0;
    margin: 0 0 1rem;

    &.top-actions {
      border-bottom: 1px solid rgba(0, 0, 0, 0.08);
      margin-top: 0;
      padding-top: 0.5rem;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
    }

    .action-right {
      margin-left: auto;
      display: flex;
      gap: 0.5rem;
    }

    button {
      padding: 0.8rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;

      &.icon-button {
        display: inline-flex !important;
        align-items: center;
        justify-content: center;
        min-width: 38px; /* Fixed width for round buttons */
        min-height: 38px; /* Fixed height for round buttons */
        width: 38px;
        height: 38px;
        padding: 0;
        border-radius: 50%; /* Round shape */
        box-sizing: border-box;
        font-size: 1.5rem; /* Larger icons */
        line-height: 1;

        &:hover:not(:disabled) {
          transform: scale(1.1);
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      &.primary-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          filter: brightness(110%);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
        }
      }

      &.secondary-button {
        background-color: transparent;
        color: #666;
        border: 1px solid #ccc;

        &:hover:not(:disabled) {
          background-color: #f0f0f0;
        }
      }

      &.generate-button {
        background-color: var(--primary-color);
        color: white;
        border: none;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          filter: brightness(110%);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
        }
      }

      &.success-button {
        background-color: var(--success-color, #28a745);
        color: white;
        border: none;
        transition: all 0.2s ease;

        &:hover:not(:disabled) {
          filter: brightness(110%);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
        }
      }
    }
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
