# Prompt Library - Claude Code Build Specification

## Project Overview

Create a prompt library application that allows users to manage, edit, and filter LLM prompts with tag support. The application will feature a left sidebar for navigation and a split-view main area for editing and previewing markdown prompts.

## Technology Stack

**Backend:**
- Node.js v22
- Express.js (REST API)
- MongoDB (database)
- Modern ESM modules (not CommonJS)
- Environment-based configuration via .env file

**Frontend:**
- Vue 3 (SPA)
- Vite (build tool)
- Vue Router (routing)
- Pinia (state management)
- SCSS (styling)
- Single File Components with script setup syntax
- Dark/Light theme support

**DevOps:**
- Docker Compose for containerization
- Custom MongoDB configuration

## Application Requirements

1. Create, edit, and delete LLM prompts
2. Add and manage tags for each prompt
3. Filter prompts by tags
4. Search prompts with free-text search
5. Split-view interface with markdown editor and preview
6. Dark/light mode theming

## Project Structure

Create a project with the following structure:

```
prompt-library/
├── .env                     # Environment variables
├── docker-compose.yml       # Docker configuration
├── package.json             # Root package.json for project management
├── README.md                # Project documentation
├── backend/                 # Backend application
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── config/          # Configuration management
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   └── package.json         # Backend dependencies
└── frontend/                # Frontend application
    ├── index.html           # HTML entry
    ├── vite.config.js       # Vite configuration
    ├── package.json         # Frontend dependencies
    ├── public/              # Static assets
    └── src/
        ├── main.js          # Entry point
        ├── App.vue          # Root component
        ├── assets/          # Assets (images, fonts)
        ├── components/      # Vue components
        ├── router/          # Vue Router configuration
        ├── stores/          # Pinia stores
        ├── styles/          # Global styles
        └── views/           # Page components
```

## Build Instructions for Claude Code

### 1. Project Initialization

```
// Initialize the main project folder
init-project prompt-library

// Create backend structure
init-backend-express prompt-library/backend
switch-to-esm prompt-library/backend  # Ensure ESM modules, not CJS

// Create frontend Vue 3 structure with Vite
init-frontend-vue prompt-library/frontend --vite --vue3 --scss --pinia --router
```

### 2. Backend Development

#### a. Environment Configuration

Create an `.env` file with the following variables:
```
PORT=3131
MONGODB_URI=mongodb://mongodb:27717/prompt-library
NODE_ENV=development
```

#### b. Database Model

Create a Prompt schema with:
- title (String, required)
- content (String, required)
- tags (Array of Strings)
- timestamps (createdAt, updatedAt)
- Text index on title, content, and tags fields

#### c. REST API Endpoints

Implement these REST endpoints following proper HTTP verbs and semantic naming:

1. **GET /api/prompts**
   - Get all prompts with optional search and tag filters
   - Query parameters: `search` (text search) and `tag` (filter by tag)

2. **GET /api/prompts/:id**
   - Get a specific prompt by ID

3. **POST /api/prompts**
   - Create a new prompt
   - Required fields: title, content
   - Optional: tags

4. **PUT /api/prompts/:id**
   - Update an existing prompt
   - Updatable fields: title, content, tags

5. **DELETE /api/prompts/:id**
   - Delete a prompt

6. **GET /api/tags**
   - Get all unique tags from prompts

#### d. API Implementation Guidelines

- Use async/await for all asynchronous operations
- Follow Google JavaScript style guidelines
- Implement proper error handling
- Use mongoose for MongoDB interactions
- Configure API to serve the Vue SPA in production
- Use an async IIFE for outer code wrappers

### 3. Frontend Development

#### a. Vue 3 Setup

- Configure Vite with development proxy for API calls
- Set up Vue Router for navigation
- Create Pinia store for state management
- Implement script setup syntax for all components

#### b. Core Components

1. **App Component**
   - Implement layout with header and main content area
   - Add theme toggle functionality (dark/light mode)
   - Persist theme preferences to localStorage

2. **PromptSidebar Component**
   - Create sidebar with search input and tag filter
   - Implement prompt list with active state highlighting
   - Show prompt tags in list items
   - Add create new prompt button

3. **PromptDetailView**
   - Create split view layout
   - Implement edit mode toggle
   - Add form fields for title and tags
   - Create side-by-side markdown editor and preview
   - Add save, cancel, and delete functionality

4. **MarkdownPreview Component**
   - Create component to render markdown preview

#### c. Pinia Store for State Management

Create a prompt store with:
- State for prompts, currentPrompt, loading, error, search query, and tag filters
- Actions for CRUD operations
- Search and filtering functionality

#### d. Styling Guidelines

- Create SCSS variables for theme colors
- Implement dark/light mode with CSS variables
- Keep global styles minimal
- Use scoped component styles for specific component styling

### 4. Docker Compose Setup

Create a `docker-compose.yml` file with:
- Node.js service for the application
- MongoDB service with custom port (27717)
- Volume for persistent data storage
- Environment variable configuration

### 5. Build and Deployment

Set up scripts in package.json for:
- Development with hot reloading
- Production build
- Docker build and start
- Linting and formatting

## Coding Guidelines

- Follow Google JavaScript style guidelines
- Use modern ESM modules (no CommonJS)
- Use async/await for all asynchronous operations (no .then/.catch)
- Use proper error handling
- Follow REST API best practices
- Use Vue 3 composition API with script setup
- Apply SOLID principles and clean code practices
- Use async IIFE for outer code wrappers

## Components and Views

### Main Views

1. **HomeView**
   - Landing page with welcome message and sidebar
   - Create new prompt button

2. **PromptDetailView**
   - Display and edit a selected prompt
   - Split view with editor and preview
   - Save, revert, and delete functionality

3. **PromptCreateView**
   - Form to create a new prompt
   - Submit and cancel actions

### Components

1. **PromptSidebar**
   - Search input
   - Tag filter dropdown
   - List of prompts
   - Active prompt highlighting

2. **MarkdownPreview**
   - Render markdown content as HTML
   - Support all standard markdown syntax

3. **TagInput**
   - Input field for tags
   - Comma-separated tag entry
   - Tag display with delete functionality

## API Implementation

### Prompt Controller

Implement these methods:
- `getPrompts` - Get all prompts with search and tag filters
- `getPromptById` - Get a specific prompt
- `createPrompt` - Create a new prompt
- `updatePrompt` - Update an existing prompt
- `deletePrompt` - Delete a prompt

### Tag Controller

Implement:
- `getAllTags` - Get all unique tags from prompts

## Theme Implementation

Create a theme system with:
- Dark and light mode support
- CSS variables for colors
- Theme toggle in the header
- Theme persistence using localStorage
- System preference detection

## Testing

Implement basic tests for:
- API endpoints
- Vue components
- Store actions

## Deployment

Configure Docker Compose for easy deployment with:
- MongoDB on custom port (27717)
- Node.js application container
- Proper environment variables
- Persistent data storage
