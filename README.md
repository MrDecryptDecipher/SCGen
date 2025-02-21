# 🚀 SCGen - Smart Contract Generator

> A cutting-edge web application that leverages advanced AI technology to generate secure, optimized smart contracts through a stunning glassmorphic UI and an innovative multi-persona analysis system.

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Ethereum](https://img.shields.io/badge/Ethereum-3C3C3D?style=for-the-badge&logo=Ethereum&logoColor=white)](https://ethereum.org/)
[![Docker](https://img.shields.io/badge/Docker-2CA5E0?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)

## ✨ Features

### 🎯 Core Capabilities
- **Intelligent Contract Generation**: Advanced AI-powered system using NIJA LLM
- **Multi-level Selection System**: Intuitive contract customization workflow
- **One-Click Deployment**: Seamless deployment to Ethereum Sepolia network
- **Real-time Validation**: Instant feedback and error checking

### 👥 Triple-Persona Analysis Pipeline
1. 🦸‍♂️ **Nanjunda - The Analyzer**
   - Deep request analysis and requirement validation
   - Context understanding and parameter optimization
   - Business logic verification

2. 🧑‍💻 **Achyutha - The Developer**
   - Smart contract code generation
   - Gas optimization techniques
   - Best practices implementation
   - Code quality assurance

3. 🛠️ **Sandeep - The Guardian**
   - Security vulnerability scanning
   - Compliance verification
   - Code audit and optimization
   - Risk assessment

### 🎨 UI/UX Excellence
- **Glassmorphic Design**: Modern, sleek interface with depth
- **Responsive Layout**: Perfect adaptation across all devices
- **Interactive Elements**: Smooth animations and transitions
- **Real-time Feedback**: Immediate visual response to user actions

## 💻 Technical Stack

### 📦 Core Dependencies
- **Node.js**: v18 or higher
- **TypeScript**: v4.9.5
- **React**: v18.2.0
- **Material-UI**: v6.4.5
- **Framer Motion**: v12.4.4
- **Web3.js**: v4.16.0
- **Ethers.js**: v6.13.5

### 🔧 Development Tools
- **Docker**: Latest version
- **Docker Compose**: v3.8
- **ESLint**: v8.24.1
- **TypeScript ESLint**: v8.24.1

### 🔑 Required Credentials
- OpenRouter API key (for AI integration)
- Ethereum wallet
- Infura project ID (for deployment)

## 📍 Installation

### 1️⃣ Clone & Configure
```bash
# Clone the repository
git clone <repository-url>
cd SCGen

# Set up environment
cp .env.example .env
```

### 2️⃣ Environment Setup
Configure your `.env` file with:
```env
OPENROUTER_API_KEY=your_api_key_here
INFURA_PROJECT_ID=your_infura_id
ETHEREUM_PRIVATE_KEY=your_private_key
REACT_APP_API_URL=http://localhost:3001
```

### 3️⃣ Installation Methods

#### 📦 Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up --build
```

#### 💻 Local Development
```bash
# Install backend dependencies
cd backend
npm install

# Start backend server
npm run dev

# In a new terminal, install frontend dependencies
cd ../frontend
npm install

# Start frontend development server
npm start
```

## 💻 Usage Guide

### 🎥 Quick Start
1. **Entity Selection**
   - Navigate to the main dashboard
   - Choose your entity type (e.g., Private Limited Company, NGO)
   - System adapts options based on your selection

2. **Transaction Configuration**
   - Select transaction type (B2B, B2C, P2P)
   - Configure specific transaction parameters
   - Review automated suggestions

3. **Contract Generation**
   - Choose contract type (e.g., Equity Tokenization)
   - Click "Use NIJA AI" to initiate generation
   - Monitor real-time generation progress

4. **Review & Deploy**
   - Examine generated contract code
   - Use built-in code viewer with syntax highlighting
   - Deploy directly to Ethereum Sepolia network

### 🛠️ Advanced Options
- **Custom Parameters**: Fine-tune contract variables
- **Gas Optimization**: Adjust deployment settings
- **Security Checks**: Run additional vulnerability scans

## 🏗️ Architecture

### 💻 Frontend Architecture
```
frontend/
├── src/
│   ├── components/      # Reusable UI components
│   ├── services/        # API and blockchain services
│   ├── hooks/           # Custom React hooks
│   ├── utils/           # Helper functions
│   └── types/           # TypeScript definitions
└── public/            # Static assets
```

### 🌐 Backend Architecture
```
backend/
├── src/
│   ├── controllers/     # Request handlers
│   ├── services/        # Business logic
│   ├── models/          # Data models
│   └── utils/           # Helper functions
└── config/            # Configuration files
```

### 🔗 Integration Points
- **Frontend ↔️ Backend**: REST API (Port 3001)
- **Backend ↔️ AI**: OpenRouter API
- **Frontend ↔️ Blockchain**: Web3.js & Ethers.js

## 📈 Development

### 📍 Port Configuration
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:3001`
- API Documentation: `http://localhost:3001/api-docs`

### 💾 Build Commands
```bash
# Frontend Production Build
cd frontend
npm run build

# Backend Production Build
cd backend
npm run build
```

### 🔍 Monitoring
- Frontend dev server includes hot reloading
- Backend supports nodemon for development
- Docker containers include health checks

## 🧠 AI Pipeline

### 🔎 Nanjunda - Analysis Phase
- Request parsing and validation
- Context extraction and enrichment
- Parameter optimization and validation
- Business rule compliance checking

### 💻 Achyutha - Development Phase
- Smart contract template selection
- Code generation and optimization
- Gas usage analysis and optimization
- Code quality metrics validation

### 🔒 Sandeep - Security Phase
- Vulnerability pattern detection
- Compliance standard verification
- Gas optimization validation
- Final security audit and reporting
   - Final code optimization

## 🎨 UI/UX Features

### ✨ Glassmorphic Design System
- **Transparency Effects**: Subtle backdrop filters
- **Depth Layers**: Multiple z-index levels
- **Light Effects**: Dynamic shadows and highlights
- **Smooth Transitions**: Fluid state changes

### 📱 Responsive Design
- **Mobile-First**: Optimized for all screen sizes
- **Grid System**: Flexible layout management
- **Breakpoints**: Tailored viewing experience
- **Touch Support**: Mobile-friendly interactions

### 💡 User Experience
- **Intuitive Flow**: Clear user journey
- **Progress Tracking**: Visual feedback
- **Error Handling**: Friendly error messages
- **Loading States**: Animated indicators

## 📘 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch
   ```bash
   git checkout -b feature/amazing-feature
   ```
3. Commit your changes
   ```bash
   git commit -m 'Add amazing feature'
   ```
4. Push to your branch
   ```bash
   git push origin feature/amazing-feature
   ```
5. Open a Pull Request

### 📖 Code Style
- Follow TypeScript best practices
- Use ESLint configuration
- Write meaningful commit messages
- Add appropriate documentation

## 🔒 Security

- Regular security audits
- Automated vulnerability scanning
- Secure API key management
- Protected contract deployment

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Support

For support, please:
1. Check the [Documentation](docs/)
2. Open an [Issue](issues/)
3. Join our [Discord Community]()

---

Built with ❤️ by the SCGen Team
- Fluid animations and transitions
- Real-time visual feedback
- Interactive persona visualization
- Responsive glassmorphic design
- Dark mode optimization

## Security

- Rate limiting implemented
- Environment variables for sensitive data
- Input validation and sanitization
- Secure API key handling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Create a Pull Request

## License

MIT License - See LICENSE file for details 