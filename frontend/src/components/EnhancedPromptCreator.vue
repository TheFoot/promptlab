<template>
  <div class="enhanced-prompt-creator">
    <div class="creator-header">
      <div class="creator-progress">
        <div 
          v-for="(step, index) in steps" 
          :key="index" 
          class="progress-step"
          :class="{ 
            'active': currentStep === index,
            'completed': currentStep > index
          }"
          @click="goToStep(index)"
        >
          <div class="step-number">
            {{ index + 1 }}
          </div>
          <div class="step-details">
            <div class="step-name">
              {{ step.name }}
            </div>
            <div
              v-if="currentStep > index"
              class="step-choice"
            >
              {{ getStepChoiceLabel(index) }}
            </div>
          </div>
        </div>
      </div>
      
      <!-- Relocated action buttons -->
      <div class="creator-actions header-actions">
        <button 
          v-if="currentStep > 0" 
          class="secondary-button"
          @click="previousStep"
        >
          Back
        </button>
        <button 
          v-if="currentStep < steps.length - 1" 
          class="primary-button"
          :disabled="!canProceed"
          @click="nextStep"
        >
          Continue
        </button>
        <button 
          v-if="currentStep === steps.length - 1" 
          class="success-button"
          :disabled="!canSave"
          @click="savePrompt"
        >
          Create Prompt
        </button>
      </div>
    </div>

    <div class="creator-content">
      <!-- Step 1: Purpose Selection -->
      <div
        v-if="currentStep === 0"
        class="creator-step purpose-selection"
      >
        <h3>What are you creating this prompt for?</h3>
        <div class="purpose-options">
          <div 
            v-for="purpose in purposes" 
            :key="purpose.id" 
            class="purpose-option"
            :class="{ 'selected': selectedPurpose === purpose.id }"
            @click="selectPurpose(purpose.id)"
          >
            <i :class="purpose.icon" />
            <h4>{{ purpose.name }}</h4>
            <p>{{ purpose.description }}</p>
          </div>
        </div>
      </div>

      <!-- Step 2: Type Selection -->
      <div
        v-if="currentStep === 1"
        class="creator-step type-selection"
      >
        <h3>What type of prompt do you need?</h3>
        <div class="type-options">
          <div 
            v-for="type in promptTypes" 
            :key="type.id" 
            class="type-option"
            :class="{ 'selected': selectedType === type.id }"
            @click="selectType(type.id)"
          >
            <i :class="type.icon" />
            <h4>{{ type.name }}</h4>
            <p>{{ type.description }}</p>
            <div 
              v-if="type.example" 
              class="type-examples"
            >
              <div class="example-label">
                Example:
              </div>
              <div class="example-content">
                {{ type.example }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Step 3: Creation Method -->
      <div
        v-if="currentStep === 2"
        class="creator-step creation-method"
      >
        <h3>How would you like to create your prompt?</h3>
        <div class="method-options">
          <div 
            class="method-option"
            :class="{ 'selected': creationMethod === 'blank' }"
            @click="creationMethod = 'blank'"
          >
            <i class="fas fa-file" />
            <h4>Start from Blank</h4>
            <p>Create your prompt from scratch with full control.</p>
          </div>
          <div 
            class="method-option"
            :class="{ 'selected': creationMethod === 'template' }"
            @click="creationMethod = 'template'"
          >
            <i class="fas fa-puzzle-piece" />
            <h4>Use a Template</h4>
            <p>Start with a pre-built template tailored to your needs.</p>
          </div>
          <div 
            class="method-option"
            :class="{ 'selected': creationMethod === 'ai' }"
            @click="creationMethod = 'ai'"
          >
            <i class="fas fa-magic" />
            <h4>AI-Assisted Creation</h4>
            <p>Answer a few questions and let AI craft a prompt for you.</p>
          </div>
        </div>
      </div>

      <!-- Step 4A: Template Selection -->
      <div
        v-if="currentStep === 3 && creationMethod === 'template'"
        class="creator-step template-selection"
      >
        <h3>Choose a Template</h3>
        <div class="template-search">
          <input 
            v-model="templateSearch" 
            type="text" 
            placeholder="Search templates..."
          >
        </div>
        <div class="templates-grid">
          <TemplatePreview 
            v-for="template in filteredTemplates" 
            :key="template.id"
            :template="template"
            :selected="selectedTemplate === template.id"
            @select="selectTemplate(template.id)"
          />
        </div>
      </div>

      <!-- Step 4B: AI Assisted Creation -->
      <div
        v-if="currentStep === 3 && creationMethod === 'ai'"
        class="creator-step ai-assisted"
      >
        <h3>Tell us about your prompt needs</h3>
        <AIPromptQuestionnaire 
          :prompt-type="selectedType"
          :prompt-purpose="selectedPurpose"
          @complete="handleAIQuestionnaireComplete"
        />
      </div>

      <!-- Step 5: Final Preview and Customization -->
      <div
        v-if="currentStep === 4"
        class="creator-step final-preview"
      >
        <h3>Preview and Customize</h3>
        <div class="preview-container">
          <div class="prompt-editor">
            <div class="editor-header">
              <input 
                v-model="promptTitle" 
                type="text" 
                placeholder="Enter prompt title..."
                class="title-input"
              >
              <div class="tag-input-wrapper">
                <TagInput v-model="promptTags" />
              </div>
            </div>
            <textarea 
              v-model="promptContent" 
              placeholder="Your prompt content..."
              class="content-editor"
            />
          </div>
          <div class="prompt-preview">
            <MarkdownPreview :content="promptContent" />
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom buttons removed and relocated to header -->
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { usePromptStore } from '@/stores/promptStore';
import TagInput from '@/components/TagInput.vue';
import MarkdownPreview from '@/components/MarkdownPreview.vue';
import TemplatePreview from '@/components/TemplatePreview.vue';
import AIPromptQuestionnaire from '@/components/AIPromptQuestionnaire.vue';
import { isNil } from 'lodash-es';

// Router and store
const router = useRouter();
const promptStore = usePromptStore();

// Steps for the creation process
const steps = ref([
  { name: 'Purpose', description: 'Define the purpose of your prompt' },
  { name: 'Type', description: 'Select the type of prompt you need' },
  { name: 'Method', description: 'Choose how to create your prompt' },
  { name: 'Creation', description: 'Create your prompt content' },
  { name: 'Finalize', description: 'Review and customize your prompt' }
]);

// Current step tracker
const currentStep = ref(0);

// Step 1: Purpose selection
const purposes = ref([
  { 
    id: 'information', 
    name: 'Information Extraction', 
    icon: 'fas fa-search', 
    description: 'Extract specific information or insights from data or text' 
  },
  { 
    id: 'generation', 
    name: 'Content Generation', 
    icon: 'fas fa-pen-fancy', 
    description: 'Generate creative or structured content like text, code, or ideas' 
  },
  { 
    id: 'transformation', 
    name: 'Content Transformation', 
    icon: 'fas fa-exchange-alt', 
    description: 'Transform content from one format or style to another' 
  },
  { 
    id: 'analysis', 
    name: 'Analysis & Reasoning', 
    icon: 'fas fa-chart-line', 
    description: 'Analyze data or situations and provide reasoned conclusions' 
  },
  { 
    id: 'conversation', 
    name: 'Conversation Design', 
    icon: 'fas fa-comments', 
    description: 'Create conversational agents or structured dialogues' 
  }
]);
const selectedPurpose = ref(null);

// Step 2: Type selection
const promptTypes = ref([]);
const selectedType = ref(null);

// Step 3: Creation method
const creationMethod = ref('blank');

// Step 4A: Template selection
const templateSearch = ref('');
const templates = ref([]);
const selectedTemplate = ref(null);

// Step 4B: AI Questionnaire results
const aiGeneratedContent = ref('');

// Step 5: Final prompt details
const promptTitle = ref('');
const promptTags = ref([]);
const promptContent = ref('');

// Computed properties
const filteredTemplates = computed(() => {
  if (!templateSearch.value) {
    return templates.value.filter(template => 
      template.purpose === selectedPurpose.value &&
      template.type === selectedType.value
    );
  }
  
  const search = templateSearch.value.toLowerCase();
  return templates.value.filter(template => 
    (template.purpose === selectedPurpose.value) &&
    (template.type === selectedType.value) &&
    (
      template.name.toLowerCase().includes(search) ||
      template.description.toLowerCase().includes(search) ||
      template.tags.some(tag => tag.toLowerCase().includes(search))
    )
  );
});

const canProceed = computed(() => {
  switch (currentStep.value) {
    case 0: 
      return !isNil(selectedPurpose.value);
    case 1: 
      return !isNil(selectedType.value);
    case 2: 
      return !isNil(creationMethod.value);
    case 3:
      if (creationMethod.value === 'template') {
        return !isNil(selectedTemplate.value);
      } else if (creationMethod.value === 'ai') {
        return !isNil(aiGeneratedContent.value) && aiGeneratedContent.value !== '';
      }
      return true; // blank doesn't need validation
    case 4:
      return canSave.value;
    default:
      return true;
  }
});

const canSave = computed(() => {
  return !!promptTitle.value && !!promptContent.value;
});

// Methods
function goToStep(stepIndex) {
  // Only allow going to completed steps or the next available step
  if (stepIndex <= currentStep.value || (stepIndex === currentStep.value + 1 && canProceed.value)) {
    // If we're moving to step 1 (Type), make sure to load prompt types
    if (stepIndex === 1) {
      loadPromptTypes();
    }
    currentStep.value = stepIndex;
  }
}

function getStepChoiceLabel(stepIndex) {
  switch(stepIndex) {
    case 0: // Purpose
      if (selectedPurpose.value) {
        const purpose = purposes.value.find(p => p.id === selectedPurpose.value);
        return purpose ? purpose.name : '';
      }
      return '';
    
    case 1: // Type
      if (selectedType.value) {
        const type = promptTypes.value.find(t => t.id === selectedType.value);
        return type ? type.name : '';
      }
      return '';
    
    case 2: // Method
      switch(creationMethod.value) {
        case 'blank':
          return 'Start from Blank';
        case 'template':
          return 'Use a Template';
        case 'ai':
          return 'AI-Assisted';
        default:
          return '';
      }
    
    case 3: // Creation
      if (creationMethod.value === 'template' && selectedTemplate.value) {
        const template = templates.value.find(t => t.id === selectedTemplate.value);
        return template ? template.name : 'Template Selected';
      } else if (creationMethod.value === 'ai' && aiGeneratedContent.value) {
        return 'AI Content Generated';
      } else if (creationMethod.value === 'blank') {
        return 'Blank Template';
      }
      return '';
    
    default:
      return '';
  }
}

function nextStep() {
  if (currentStep.value < steps.value.length - 1 && canProceed.value) {
    // If we're about to move to step 1 (Type), preload prompt types
    if (currentStep.value === 0) {
      loadPromptTypes();
    }
    
    currentStep.value++;
    
    // If we're moving to step 4 (final) and we need to prepare content
    if (currentStep.value === 4) {
      preparePromptContent();
    }
  }
}

function previousStep() {
  if (currentStep.value > 0) {
    currentStep.value--;
  }
}

function selectPurpose(purposeId) {
  selectedPurpose.value = purposeId;
  // Reset type when purpose changes as they're related
  selectedType.value = null;
}

function selectType(typeId) {
  selectedType.value = typeId;
}

function selectTemplate(templateId) {
  selectedTemplate.value = templateId;
  
  // Get the template content to populate the prompt content
  const template = templates.value.find(t => t.id === templateId);
  if (template) {
    promptContent.value = template.content;
    
    // If template has suggested title/tags, use them
    if (template.name && !promptTitle.value) {
      promptTitle.value = `${template.name} (Custom)`;
    }
    
    if (template.tags && template.tags.length) {
      promptTags.value = [...template.tags];
    }
  }
}

function handleAIQuestionnaireComplete(result) {
  console.log('handleAIQuestionnaireComplete called with result:', result);
  aiGeneratedContent.value = result.content;
  
  // Auto-suggest title and tags if provided
  if (result.title) {
    promptTitle.value = result.title;
  }
  
  if (result.tags && result.tags.length) {
    promptTags.value = [...result.tags];
  }
  
  // Automatically advance to the next step (Finalize)
  nextStep();
}

function preparePromptContent() {
  console.log('preparePromptContent called, creationMethod:', creationMethod.value);
  
  // Set the prompt content based on the creation method
  if (creationMethod.value === 'template' && selectedTemplate.value) {
    // Already set when template was selected
    console.log('Using template content');
  } else if (creationMethod.value === 'ai' && aiGeneratedContent.value) {
    console.log('Using AI-generated content:', aiGeneratedContent.value.substring(0, 50) + '...');
    promptContent.value = aiGeneratedContent.value;
  } else if (creationMethod.value === 'blank') {
    // Get a minimal starter template based on purpose and type
    console.log('Using blank template');
    promptContent.value = getBlankTemplate();
  }
  
  console.log('promptContent is now set to length:', promptContent.value.length);
}

function getBlankTemplate() {
  // Return a minimal template based on the selected purpose and type
  const purposeText = purposes.value.find(p => p.id === selectedPurpose.value)?.name || '';
  const typeText = promptTypes.value.find(t => t.id === selectedType.value)?.name || '';
  
  return `# ${purposeText} Prompt (${typeText})

## Instructions

[Add specific instructions for the AI model here]

## Context

[Add any relevant context or background information here]

## Examples

[Add examples of expected inputs and outputs here]
`;
}

async function savePrompt() {
  if (!canSave.value) return;
  
  try {
    const newPrompt = {
      title: promptTitle.value,
      content: promptContent.value,
      tags: promptTags.value,
      metadata: {
        purpose: selectedPurpose.value,
        type: selectedType.value,
        creationMethod: creationMethod.value
      }
    };
    
    const savedPrompt = await promptStore.createPrompt(newPrompt);
    router.push({ name: 'prompt-detail', params: { id: savedPrompt._id } });
  } catch (error) {
    console.error('Error saving prompt:', error);
    // Implement error handling
  }
}

// Lifecycle hooks
onMounted(async () => {
  try {
    // Load templates and prompt types initially to ensure data is available
    await Promise.all([
      loadTemplates(),
      loadPromptTypes()
    ]);
  } catch (error) {
    console.error('Error initializing prompt creator:', error);
    // Implement error handling
  }
});

async function loadPromptTypes() {
  try {
    promptTypes.value = await promptStore.fetchPromptTypes();
  } catch {
    // Fallback to default types if API fails
    promptTypes.value = [
      {
        id: 'general',
        name: 'General Purpose',
        icon: 'fas fa-globe',
        description: 'Standard prompts for general use cases',
        example: 'Explain the concept of climate change in simple terms.'
      },
      {
        id: 'coding',
        name: 'Code Generation',
        icon: 'fas fa-code',
        description: 'Prompts optimized for generating and explaining code',
        example: 'Write a JavaScript function that sorts an array of objects by a specific property.'
      },
      {
        id: 'creative',
        name: 'Creative Writing',
        icon: 'fas fa-feather-alt',
        description: 'Prompts for generating creative content and stories',
        example: 'Write a short story about a robot discovering emotions.'
      },
      {
        id: 'analytical',
        name: 'Data Analysis',
        icon: 'fas fa-chart-pie',
        description: 'Prompts for analyzing and extracting insights from data',
        example: 'Analyze this sales data and identify key trends and outliers.'
      }
    ];
  }
}

async function loadTemplates() {
  try {
    templates.value = await promptStore.fetchTemplates({
      purpose: selectedPurpose.value,
      type: selectedType.value
    });
  } catch {
    // Fallback to empty templates array if API fails
    templates.value = [];
  }
}
</script>

<style lang="scss" scoped>
.enhanced-prompt-creator {
  display: flex;
  flex-direction: column;
  height: 100%; /* Fill parent container */
  
  .creator-header {
    padding: 0.75rem 1rem 1rem;
    border-bottom: 1px solid #e0e0e0;
    background-color: var(--step-header-bg, var(--step-number-bg, #f0f0f0)); /* Use a slightly different variable for dark mode */
    
    @media (prefers-color-scheme: dark) {
      background-color: color-mix(in srgb, var(--step-number-bg, #333) 95%, black); /* Very subtle darker shade in dark mode */
    }
    
    .creator-progress {
      display: flex;
      justify-content: space-between;
      margin: 0 -0.5rem;
      margin-top: 0.5rem; /* Add space above the progress steps */
      
      .progress-step {
        flex: 1;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 0 0.5rem;
        margin-top: 0.5rem; /* Add additional space above each step */
        position: relative;
        cursor: pointer;
        
        &:not(:last-child)::after {
          content: '';
          position: absolute;
          top: 20px;
          left: 50%;
          width: 100%;
          height: 2px;
          background-color: #e0e0e0;
          z-index: 1;
        }
        
        &.active, &.completed {
          .step-number {
            background-color: var(--primary-color);
            color: white;
            box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15); /* Add shadow for better visibility */
          }
          
          .step-name {
            color: var(--primary-color); /* Ensure active step name is highlighted */
          }
        }
        
        &.completed:not(:last-child)::after {
          background-color: var(--primary-color);
        }
        
        .step-number {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--step-number-bg, #f0f0f0);
          color: var(--step-number-color, #333); /* Darker text color for better contrast */
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 0.5rem;
          font-weight: bold;
          z-index: 2;
        }
        
        .step-details {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
          min-width: 140px;
          max-width: 180px;
        }
        
        .step-name {
          font-size: 0.9rem;
          color: var(--step-name-color, #444); /* Darker color for better contrast */
          text-align: center;
          font-weight: 600; /* Slightly bolder */
          margin-bottom: 0.2rem;
          
          .active & {
            color: var(--primary-color);
            font-weight: bold;
          }
        }
        
        .step-choice {
          font-size: 0.8rem;
          color: var(--step-choice-color, #555); /* Color for light mode */
          text-align: center;
          width: 100%;
          opacity: 0.9; /* Higher opacity for better visibility */
          line-height: 1.2;
          padding: 0 4px;
          
          @media (prefers-color-scheme: dark) {
            color: var(--step-choice-color-dark, rgba(255, 255, 255, 0.7)); /* Lighter color for dark mode */
          }
        }
      }
    }
  }
  
  .creator-content {
    flex: 1;
    padding: 1.5rem;
    overflow-y: auto;
    max-height: calc(100vh - 220px); /* Further adjusted for increased header spacing */
    background-color: var(--bg-color, white); /* Ensure background is consistent */
    
    .creator-step {
      h3 {
        margin-bottom: 1.5rem;
        font-size: 1.2rem;
      }
      padding-bottom: 2rem; /* Add bottom padding to all steps for better spacing */
      
      &.ai-assisted {
        padding-bottom: 3rem; /* Extra padding for the AI assisted view */
      }
      
      &.final-preview {
        display: flex;
        flex-direction: column;
      }
      
      .purpose-options, .type-options, .method-options {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        grid-gap: 1.5rem;
        
        .purpose-option, .type-option, .method-option {
          padding: 1.5rem;
          border: 1px solid #e0e0e0;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          
          &:hover {
            border-color: var(--primary-color);
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          &.selected {
            border-color: var(--primary-color);
            background-color: rgba(var(--primary-color-rgb), 0.05);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          }
          
          i {
            font-size: 2rem;
            color: var(--primary-color);
            margin-bottom: 1rem;
          }
          
          h4 {
            margin-bottom: 0.5rem;
            font-size: 1.1rem;
          }
          
          p {
            color: #666;
            font-size: 0.9rem;
          }
          
          .type-examples {
            margin-top: 1rem;
            padding-top: 1rem;
            border-top: 1px solid #eee;
            
            .example-label {
              font-weight: bold;
              font-size: 0.8rem;
              margin-bottom: 0.5rem;
            }
            
            .example-content {
              font-size: 0.85rem;
              font-style: italic;
              color: #444;
              background-color: #f9f9f9;
              padding: 0.5rem;
              border-radius: 4px;
            }
          }
        }
      }
      
      .template-search {
        margin-bottom: 1.5rem;
        
        input {
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
      }
      
      .templates-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        grid-gap: 1.5rem;
      }
      
      .preview-container {
        display: grid;
        grid-template-columns: 1fr 1fr;
        grid-gap: 1.5rem;
        flex: 1; /* Fill remaining space */
        height: calc(100vh - 260px); /* Adjusted for increased header spacing */
        min-height: 350px; /* Minimum height for usability */
        margin-bottom: 2rem; /* Reduced since we no longer have bottom buttons */
        
        .prompt-editor {
          display: flex;
          flex-direction: column;
          
          .editor-header {
            margin-bottom: 1rem;
            
            .title-input {
              width: 100%;
              padding: 0.8rem;
              margin-bottom: 0.8rem;
              border: 1px solid #e0e0e0;
              border-radius: 4px;
              font-size: 1.1rem;
              font-weight: bold;
              
              &:focus {
                outline: none;
                border-color: var(--primary-color);
              }
            }
            
            .tag-input-wrapper {
              margin-bottom: 0.8rem;
              
              /* Apply a subtle border to make the tag input more visible */
              :deep(.tag-list) {
                border: 1px solid var(--input-border-color, #d0d0d0);
                padding: 0.6rem;
                background-color: var(--input-bg-color, rgba(255, 255, 255, 0.05));
              }
              
              /* Make the tag input more visible with an outline */
              :deep(.tag-input) {
                border: 1px dashed var(--input-border-color, #d0d0d0);
                padding: 0.5rem 0.8rem;
                border-radius: 4px;
                min-width: 150px;
                height: auto;
                
                &:focus {
                  border-style: solid;
                  border-color: var(--primary-color);
                  background-color: rgba(0, 0, 0, 0.03);
                }
              }
              
              /* Make the add button more visible */
              :deep(.add-tag-button) {
                padding: 0.5rem 0.8rem;
                border-width: 1px;
                border-style: dashed;
                border-radius: 4px;
              }
              
              /* Style for tag text in dark mode */
              @media (prefers-color-scheme: dark) {
                :deep(.tag-item) {
                  color: rgba(255, 255, 255, 0.9);
                  background-color: rgba(255, 255, 255, 0.1);
                  
                  .tag-remove {
                    color: rgba(255, 255, 255, 0.9); /* Match text color */
                  }
                }
                
                :deep(.tag-input) {
                  color: rgba(255, 255, 255, 0.9);
                  border-color: rgba(255, 255, 255, 0.3);
                  
                  &::placeholder {
                    color: rgba(255, 255, 255, 0.5);
                  }
                }
                
                :deep(.add-tag-button) {
                  color: rgba(255, 255, 255, 0.7);
                  border-color: rgba(255, 255, 255, 0.3);
                }
              }
            }
          }
          
          .content-editor {
            flex: 1;
            height: 100%; /* Fill the available height */
            min-height: 380px; /* Adjusted to be slightly shorter */
            padding: 1rem;
            border: 1px solid #e0e0e0;
            border-radius: 4px;
            font-family: monospace;
            font-size: 0.9rem;
            line-height: 1.5;
            resize: none; /* Disable resize to maintain layout */
            overflow: auto; /* Add scrolling */
            
            &:focus {
              outline: none;
              border-color: var(--primary-color);
            }
          }
        }
        
        .prompt-preview {
          padding: 1rem;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          background-color: #f9f9f9;
          overflow: auto; /* Add overflow handling */
          display: flex;
          flex-direction: column;
          height: 100%; /* Fill full height of container */
          
          /* Make the MarkdownPreview component take the remaining space */
          :deep(.markdown-preview) {
            overflow: auto;
            flex: 1;
          }
        }
      }
    }
  }
  
  .creator-actions {
    padding: 0.75rem 1rem; /* Reduce padding to save space */
    display: flex;
    justify-content: flex-end;
    gap: 0.5rem;
    
    &.header-actions {
      padding: 0.75rem 0 0;
      margin-top: 1.5rem;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }
    
    button {
      padding: 0.8rem 1.5rem;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
      transition: all 0.2s ease;
      
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
          transform: translateY(-1px);
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
      
      &.success-button {
        background-color: var(--success-color, #28a745);
        color: white;
        border: none;
        transition: all 0.2s ease;
        
        &:hover:not(:disabled) {
          filter: brightness(110%);
          box-shadow: 0 2px 5px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }
      }
    }
    
    // If there's no back button, push continue/create to the right
    &:has(.secondary-button) {
      justify-content: space-between;
    } 
    
    &:not(:has(.secondary-button)) {
      justify-content: flex-end;
    }
  }
}
</style>