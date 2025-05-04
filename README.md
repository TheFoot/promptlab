# Prompt Library

A full-stack application for managing, editing, and filtering LLM prompts with tag support.

## Features

- Create, edit, and delete LLM prompts
- Add and manage tags for each prompt
- Filter prompts by tags
- Search prompts with free-text search
- Split-view interface with markdown editor and preview
- Dark/light mode theming
- Integrated chat sidebar for testing prompts with:
  - OpenAI API integration
  - Streaming responses via WebSockets
  - Configurable models and temperature
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
- OpenAI API key for testing prompts

### Development Setup

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   cd backend && npm install
   cd frontend && npm install
   ```
3. Create a `.env` file in the root directory (copy from `.env.example`):
   ```
   cp .env.example .env
   ```
4. Add your OpenAI API key to the `.env` file
5. Start the development servers:
   ```
   npm run dev
   ```

### Docker Setup

To run the application using Docker:

```
docker-compose up -d
```

## Project Structure

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
