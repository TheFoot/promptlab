# PromptLab

> **An AI-assisted laboratory for prompt design, testing, and optimization**

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![GitHub Issues](https://img.shields.io/github/issues/TheFoot/promptlab)
![GitHub Stars](https://img.shields.io/github/stars/TheFoot/promptlab)
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=alert_status)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=coverage)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)
[![Maintainability Rating](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=sqale_rating)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)
[![Security Rating](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=security_rating)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)
[![Bugs](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=bugs)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)
[![Code Smells](https://sonarcloud.io/api/project_badges/measure?project=TheFoot_promptlab&metric=code_smells)](https://sonarcloud.io/summary/new_code?id=TheFoot_promptlab)

## 📋 Table of Contents
- [About](#-about)
- [Features](#-features)
- [Agent Modes](#-agent-modes)
- [Quick Start](#-quick-start)
- [Installation](#-installation)
- [Usage Guide](#-usage-guide)
- [Development](#️-development)
- [Contributing](#-contributing)
- [License](#-license)

## 🧪 About

PromptLab is a comprehensive **AI-assisted laboratory** designed for prompt engineers, researchers, and developers who work with Large Language Models. It transforms the art of prompt design into a scientific process with structured testing, intelligent analysis, and iterative refinement capabilities.

Whether you're crafting prompts for GPT, Claude, or other LLMs, PromptLab provides the tools you need to design, test, analyze, and optimize your prompts with confidence.

### 🎯 Core Philosophy
- **Systematic Design**: Structure your prompt creation process with proven methodologies
- **Intelligent Analysis**: Get AI-powered insights on prompt effectiveness and improvements
- **Iterative Testing**: Test variations and track what works best
- **Knowledge Management**: Build a curated library of high-performing prompts

### 🏗️ Built With
- **Backend**: Node.js, Express, MongoDB, WebSockets
- **Frontend**: Vue 3, Vite, SCSS, Markdown rendering
- **AI Integration**: OpenAI GPT models, Anthropic Claude models
- **Testing**: Vitest, Node.js test runner, comprehensive test coverage

## ✨ Features

### 🎨 **Prompt Design Studio**
- **Rich Editor**: Create prompts with live markdown preview and syntax highlighting
- **Template System**: Start from proven prompt templates or build your own
- **Version Control**: Track prompt iterations and compare performance across versions
- **Tag Organization**: Categorize prompts with flexible tagging system

### 🤖 **AI Agent Modes**
PromptLab features intelligent agent modes that assist with different aspects of prompt engineering:

#### **Chat Agent** 🗨️
- **Purpose**: Test and validate your prompts in real conversations
- **How it works**: Uses your prompt as system instructions for direct testing
- **Best for**: Evaluating prompt effectiveness, testing edge cases, user acceptance testing

#### **Design Agent** 🎨
- **Purpose**: Get expert analysis and improvement suggestions for your prompts
- **How it works**: AI assistant trained in prompt engineering best practices
- **Best for**: Prompt optimization, clarity improvements, effectiveness analysis

### 🔬 **Testing Laboratory**
- **Real-time Testing**: Instant feedback with streaming responses via WebSockets
- **Multi-Model Support**: Test with GPT-3.5, GPT-4, Claude 3, and other leading models
- **Parameter Control**: Adjust temperature, max tokens, and other generation parameters
- **Conversation Management**: Save and review test conversations for analysis

### 📊 **Analysis & Optimization**
- **Performance Metrics**: Track response quality and consistency across test sessions
- **Comparative Analysis**: A/B test different prompt variations
- **Expert Insights**: AI-powered recommendations for prompt improvements
- **Best Practices**: Built-in guidance following prompt engineering principles

### 🔧 **Professional Tools**
- **Export/Import**: Share prompts and test results with your team
- **API Integration**: Seamless integration with OpenAI and Anthropic APIs
- **Responsive Design**: Work efficiently on desktop, tablet, or mobile
- **Dark/Light Themes**: Comfortable viewing in any environment

## 🤖 Agent Modes

### Chat Agent Mode
```
System Instructions: [Your Prompt Content]
User: Your test message
Assistant: Response based on your prompt...
```
Perfect for testing how your prompt performs in real conversations.

### Design Agent Mode  
```
Design Assistant: Ready to analyze your prompt!
User: Please analyze this prompt
Assistant: Here's my analysis and suggestions for improvement...
```
Get expert feedback on prompt structure, clarity, and effectiveness.

## 🚀 Quick Start

### One-Command Setup
```bash
# Clone and start PromptLab
git clone https://github.com/TheFoot/promptlab.git
cd promptlab
npm install
cp .env.example .env
# Add your API keys to .env
npm run dev
```

### Docker Setup
```bash
# Start with Docker Compose
docker-compose up -d
```

Access PromptLab at `http://localhost:3000`

## 💻 Installation

### Prerequisites
- **Node.js** v22+ 
- **MongoDB** (local or cloud)
- **API Keys**: 
  - OpenAI API key (required)
  - Anthropic API key (optional, for Claude models)

### Detailed Setup

1. **Clone & Install**
   ```bash
   git clone https://github.com/TheFoot/promptlab.git
   cd promptlab
   npm install
   ```

2. **Environment Configuration**
   ```bash
   cp .env.example .env
   ```
   
   Edit `.env` with your configuration:
   ```env
   OPENAI_API_KEY=your_openai_key_here
   ANTHROPIC_API_KEY=your_anthropic_key_here
   MONGODB_URI=mongodb://localhost:27017/promptlab
   PORT=3131
   ```

3. **Start Development**
   ```bash
   # Start both frontend and backend
   npm run dev
   
   # Or start individually
   npm run dev:backend  # API server on :3131
   npm run dev:frontend # Vue app on :3000
   ```

4. **Production Build**
   ```bash
   npm run build
   npm start
   ```

## 📚 Usage Guide

### Getting Started

1. **Create Your First Prompt**
   - Click "New Prompt" in the sidebar
   - Give it a descriptive title
   - Write your prompt using markdown formatting
   - Add relevant tags for organization

2. **Test with Chat Agent**
   - Select "Chat" mode in the prompt detail view
   - Configure your preferred AI model and temperature
   - Send test messages to see how your prompt performs
   - Iterate based on the responses

3. **Analyze with Design Agent**
   - Switch to "Design" mode
   - Click "Analyze" to get AI-powered feedback
   - Review suggestions for improvements
   - Apply recommendations and retest

4. **Organize and Refine**
   - Use tags to categorize prompts by use case, quality, or project
   - Create collections of related prompts
   - Track which prompts work best for different scenarios

### Advanced Workflows

- **A/B Testing**: Create prompt variations and compare performance
- **Team Collaboration**: Export/import prompts for team sharing
- **Template Creation**: Build reusable prompt templates for common use cases
- **Performance Tracking**: Monitor prompt effectiveness over time

### Best Practices

- **Start Simple**: Begin with clear, focused prompts
- **Test Early**: Use Chat Agent mode to validate basic functionality
- **Iterate Often**: Use Design Agent feedback to refine and improve
- **Document Results**: Keep notes on what works for different use cases
- **Version Control**: Save successful prompt iterations

## 🛠️ Development

### Development Commands
```bash
# Install dependencies
npm install

# Start development servers
npm run dev

# Run tests
npm test
npm run test:frontend
npm run test:backend
npm run test:coverage

# Linting and formatting
npm run lint
npm run format

# Build for production
npm run build

# Quality analysis
npm run sonar
```

### Project Structure
```
promptlab/
├── backend/           # Express API server
│   ├── src/
│   │   ├── controllers/  # API controllers
│   │   ├── services/     # Business logic & AI agents
│   │   ├── models/       # Database models
│   │   └── routes/       # API routes
│   └── test/          # Backend tests
├── frontend/          # Vue 3 application
│   ├── src/
│   │   ├── components/   # Vue components
│   │   ├── services/     # Frontend services
│   │   ├── stores/       # Pinia stores
│   │   └── views/        # Page components
│   └── tests/         # Frontend tests
└── docs/              # Documentation
```

### Architecture Highlights

- **Agent System**: Extensible architecture for different AI assistant modes
- **WebSocket Communication**: Real-time streaming for responsive user experience
- **Modular Design**: Clean separation between frontend and backend concerns
- **Test Coverage**: Comprehensive testing for reliability and maintainability

## 🤝 Contributing

We welcome contributions from the community! Whether you're fixing bugs, adding features, or improving documentation, your help makes PromptLab better.

### How to Contribute

1. **Fork the Repository**
2. **Create a Feature Branch** (`git checkout -b feature/amazing-feature`)
3. **Make Your Changes** (following our coding standards)
4. **Add Tests** (ensure your changes are tested)
5. **Commit Your Changes** (`git commit -m 'Add amazing feature'`)
6. **Push to Your Branch** (`git push origin feature/amazing-feature`)
7. **Open a Pull Request**

### Development Guidelines

- Follow the existing code style and patterns
- Write tests for new functionality
- Update documentation for user-facing changes
- Ensure all tests pass before submitting

See our [Contributing Guide](CONTRIBUTING.md) for detailed guidelines.

## 🔒 Security

Security is important to us. If you discover a security vulnerability, please email security@thefootonline.com instead of opening a public issue. We'll address all security concerns promptly.

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Contact & Support

- **Email**: support@thefootonline.com
- **Issues**: [GitHub Issues](https://github.com/TheFoot/promptlab/issues)
- **Discussions**: [GitHub Discussions](https://github.com/TheFoot/promptlab/discussions)

## 🙏 Acknowledgments

- **Contributors**: Thanks to all the developers who have contributed to PromptLab
- **Community**: The prompt engineering and AI development communities
- **Technology**: Vue.js, Express.js, OpenAI, Anthropic, and all the open-source projects that make PromptLab possible

---

**Ready to transform your prompt engineering workflow?** [Get started with PromptLab today!](https://github.com/TheFoot/promptlab)