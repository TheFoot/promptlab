# PromptLab

A full-stack application for managing, editing, and filtering LLM prompts with tag support.

## Features

- Create, edit, and delete LLM prompts
- Add and manage tags for each prompt
- Filter prompts by tags
- Search prompts with free-text search
- Split-view interface with markdown editor and preview
- Dark/light mode theming
- Integrated chat sidebar for testing prompts with:
  - OpenAI and Anthropic Claude API integrations
  - Streaming responses via WebSockets
  - Configurable models and temperature
  - Multiple model options (GPT-3.5, GPT-4, Claude 3 Opus, Sonnet, Haiku)
  - Syntax highlighting for code blocks

## Tech Stack

**Backend:**
- Node.js v22
- Express.js
- MongoDB
- ESM modules

**Frontend:**
- Vue 3
- Vite
- Vue Router
- Pinia
- SCSS

## Getting Started

### Prerequisites

- Node.js v22+
- MongoDB (or Docker for containerized setup)
- OpenAI API key for testing prompts with GPT models
- Anthropic API key for testing prompts with Claude models (optional)

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd backend && npm install
   cd frontend && npm install
   ```
3. Create an `.env` file in the backend directory (copy from `.env.example`):
   ```
   cp backend/.env.example backend/.env
   ```
4. Add your API keys to the backend `.env` file:
   - Add your OpenAI API key for GPT models
   - Add your Anthropic API key for Claude models (optional)
5. Start the development servers:
   ```
   npm run dev
   ```

### Docker Setup

To run the application using Docker:

```
docker-compose up -d
```

## Documentation Structure

This project uses a comprehensive documentation system with README files in each major directory:

- [Frontend Documentation](./frontend/README.md) - Vue 3 frontend details
  - [Components](./frontend/src/components/README.md) - UI component documentation
  - [Views](./frontend/src/views/README.md) - Page components
  - [Stores](./frontend/src/stores/README.md) - State management
  - [Router](./frontend/src/router/README.md) - Routing configuration
  - [Styles](./frontend/src/styles/README.md) - Styling guidelines

- [Backend Documentation](./backend/README.md) - Express.js backend details
  - [Models](./backend/src/models/README.md) - Database schema definitions
  - [Controllers](./backend/src/controllers/README.md) - Request handlers
  - [Routes](./backend/src/routes/README.md) - API endpoint definitions
  - [Services](./backend/src/services/README.md) - Business logic
  - [Config](./backend/src/config/README.md) - Configuration management
  - [Modules](./backend/src/modules/README.md) - Utility modules

- [Docs](./docs/README.md) - Additional project documentation
  - [Specs](./docs/specs/README.md) - Technical specifications

## Project Structure

```
promptlab/
├── .env                     # Environment variables
├── docker-compose.yml       # Docker configuration
├── package.json             # Root package.json for project management
├── README.md                # Project documentation
├── CLAUDE.md                # Claude AI assistant guide
├── backend/                 # Backend application
│   ├── src/
│   │   ├── index.js         # Entry point
│   │   ├── config/          # Configuration management
│   │   ├── controllers/     # Request handlers
│   │   ├── models/          # Database models
│   │   ├── modules/         # Utility modules
│   │   ├── routes/          # API routes
│   │   └── services/        # Business logic
│   ├── test/                # Backend tests
│   └── package.json         # Backend dependencies
├── docs/                    # Additional documentation
│   └── specs/               # Technical specifications
└── frontend/                # Frontend application
    ├── index.html           # HTML entry
    ├── vite.config.js       # Vite configuration
    ├── vitest.config.js     # Vitest configuration
    ├── package.json         # Frontend dependencies
    ├── public/              # Static assets
    ├── src/
    │   ├── main.js          # Entry point
    │   ├── App.vue          # Root component
    │   ├── assets/          # Assets (images, fonts)
    │   ├── components/      # Vue components
    │   ├── router/          # Vue Router configuration
    │   ├── stores/          # Pinia stores
    │   ├── styles/          # Global styles
    │   └── views/           # Page components
    └── tests/               # Frontend tests
        └── unit/            # Unit tests for components
```

## Development Commands

See [CLAUDE.md](./CLAUDE.md) for detailed development commands and workflow guidelines.

## Testing

This project uses:
- **Frontend**: Vitest with Vue Test Utils for component testing
- **Backend**: Node.js built-in test runner

### Running Tests
```
# Run all tests
npm test

# Run only frontend tests
npm run test:frontend

# Run only backend tests  
npm run test:backend

# Generate test coverage reports
npm run test:coverage
```

Coverage reports are generated in:
- Frontend: `frontend/coverage/`
- Backend: Coverage summary printed to console
