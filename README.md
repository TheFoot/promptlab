# PromptLab

> A full-stack application for managing, editing, and testing LLM prompts with tag support

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Issues](https://img.shields.io/github/issues/TheFoot/promptlab)
![GitHub Stars](https://img.shields.io/github/stars/TheFoot/promptlab)

## 📋 Table of Contents
- [About](#about)
- [Features](#features)
- [Quick Start](#quick-start)
- [Installation](#installation)
- [Usage](#usage)
- [Contributing](#contributing)
- [License](#license)
- [Contact](#contact)

## 📖 About
PromptLab is a comprehensive tool designed to help developers, researchers, and AI enthusiasts manage and test their LLM prompts efficiently. It provides a centralized workspace for creating, organizing, and experimenting with prompts for large language models like GPT and Claude.

The application addresses the challenge of maintaining a growing collection of prompts by providing powerful organization features, real-time preview capabilities, and direct integration with LLM APIs for immediate testing and iteration.

### Built With
- [Node.js](https://nodejs.org/) - Backend runtime
- [Express](https://expressjs.com/) - Backend framework
- [MongoDB](https://www.mongodb.com/) - Database
- [Vue 3](https://vuejs.org/) - Frontend framework
- [Vite](https://vitejs.dev/) - Frontend build tool

## ✨ Features
- 🔍 **Prompt Management**: Create, edit, and delete LLM prompts with a rich text editor
- 🏷️ **Tag System**: Organize prompts with customizable tags for easy filtering and searching
- 🔄 **Split-View Interface**: Edit and preview prompts with real-time markdown rendering
- 🌗 **Theme Support**: Toggle between dark and light modes for comfortable viewing
- 🤖 **API Integration**: Test prompts directly with OpenAI and Anthropic Claude models
- 📊 **Response Streaming**: Receive real-time streaming responses via WebSockets
- 📱 **Responsive Design**: Use on desktop or mobile with an adaptive interface
- 🧩 **Model Configuration**: Adjust temperature and other parameters for testing

## 🚀 Quick Start
```bash
# Clone the repository
git clone https://github.com/TheFoot/promptlab.git

# Navigate to the project directory
cd promptlab

# Install dependencies
npm install

# Set up environment variables
cp backend/.env.example backend/.env
# Edit .env with your API keys

# Start development servers
npm run dev
```

## 💻 Installation

### Prerequisites
- Node.js v22+
- MongoDB (or Docker for containerized setup)
- OpenAI API key for testing with GPT models
- Anthropic API key for testing with Claude models (optional)

### Step-by-step Installation
1. Clone the repository
```bash
git clone https://github.com/TheFoot/promptlab.git
```

2. Install dependencies
```bash
npm install
cd backend && npm install
cd frontend && npm install
```

3. Configure environment variables
```bash
cp backend/.env.example backend/.env
# Edit .env with your API keys
```

4. Start the application
```bash
# Development mode
npm run dev

# Or using Docker
docker-compose up -d
```

## 📚 Usage

### Basic Usage
1. **Creating Prompts**:
   - Click the "New Prompt" button
   - Enter a title, content, and optional tags
   - Save your prompt

2. **Testing Prompts**:
   - Open the chat sidebar
   - Select a model (GPT-3.5, GPT-4, Claude, etc.)
   - Adjust temperature if needed
   - Send your prompt to see the response

3. **Managing Prompts**:
   - Filter prompts by tags
   - Use search to find specific prompts
   - Edit or delete prompts as needed

### Advanced Usage
For detailed documentation on all features, see the [Documentation](docs/README.md) directory.

## 🛠️ Development

### Running Tests
```bash
# Run all tests
npm test

# Run only frontend tests
npm run test:frontend

# Run only backend tests
npm run test:backend

# Generate test coverage reports
npm run test:coverage
```

### Build
```bash
# Build for production
npm run build
```

## 🤝 Contributing
We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### How to Contribute
1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 🔒 Security
If you discover a security vulnerability, please send an email to security@thefootonline.com. All security vulnerabilities will be promptly addressed.

## 📝 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact
TheFoot - support@thefootonline.com

Project Link: [https://github.com/TheFoot/promptlab](https://github.com/TheFoot/promptlab)

## 🙏 Acknowledgments
- All the amazing contributors to this project
- The Vue.js and Express.js communities
- OpenAI and Anthropic for their powerful LLM APIs