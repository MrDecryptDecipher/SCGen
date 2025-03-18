# 📝 SCGen - Smart Contract Generator

<div align="center">
  <img src="frontend/public/logo.png" alt="SCGen Logo" width="200"/>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
  [![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636.svg)](https://docs.soliditylang.org/)
  [![Docker](https://img.shields.io/badge/Docker-24.x-2496ED.svg)](https://www.docker.com/)
</div>

## 🌟 Overview

SCGen is a powerful platform for generating, visualizing, and deploying smart contracts. It provides an intuitive interface for creating smart contracts with real-time visualization and deployment capabilities. The platform supports multiple blockchain networks and offers a comprehensive suite of tools for smart contract development.

## ✨ Features

- 📝 **Smart Contract Generation**
- 🔄 **Real-time Visualization**
- 🚀 **One-Click Deployment**
- 🔍 **Contract Verification**
- 📊 **Contract Analytics**
- 🔗 **Multi-Chain Support**
  - Ethereum
  - BSC
  - Polygon
- 💻 **Interactive IDE**
- 📱 **Responsive Design**
- 🔒 **Security Checks**
- 📚 **Template Library**

## 🚀 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Docker (optional, for containerized deployment)
- Web3 wallet (MetaMask, etc.)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/scgen.git
cd scgen
```

2. Install dependencies:
```bash
npm run install:all
```

3. Create a `.env` file in the root directory:
```env
# Backend Configuration
BACKEND_PORT=3001
NODE_ENV=development

# Frontend Configuration
REACT_APP_API_URL=http://localhost:3001
REACT_APP_WEB3_PROVIDER=your_web3_provider_url
```

4. Start the development servers:
```bash
npm run dev
```

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Smart Contract**: Solidity
- **Testing**: Hardhat
- **API**: REST & GraphQL

### Frontend
- **Framework**: React
- **Styling**: TailwindCSS
- **State Management**: Redux
- **Web3 Integration**: ethers.js
- **Visualization**: D3.js
- **UI Components**: Material-UI

## 📁 Project Structure

```
scgen/
├── backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── models/        # Database models
│   │   ├── routes/        # API routes
│   │   ├── services/      # Business logic
│   │   └── utils/         # Utility functions
│   ├── contracts/         # Smart contracts
│   └── tests/             # Test files
├── frontend/
│   ├── src/
│   │   ├── components/    # UI components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   └── utils/        # Utility functions
│   └── public/           # Static assets
└── docs/                 # Documentation
```

## 🔧 Configuration

The application can be configured through environment variables:

### Backend
- `BACKEND_PORT`: Server port
- `NODE_ENV`: Environment (development/production)
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: JWT secret key

### Frontend
- `REACT_APP_API_URL`: Backend API URL
- `REACT_APP_WEB3_PROVIDER`: Web3 provider URL
- `REACT_APP_CHAIN_ID`: Target chain ID

## 🐳 Docker Deployment

1. Build the images:
```bash
docker-compose build
```

2. Start the containers:
```bash
docker-compose up -d
```

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Ethereum](https://ethereum.org/)
- [Solidity](https://docs.soliditylang.org/)
- [Hardhat](https://hardhat.org/)
- [Material-UI](https://mui.com/)
- [Docker](https://www.docker.com/)

## 📞 Support

For support, email support@scgen.com or join our Discord channel.

---

<div align="center">
  Made with ❤️ by the SCGen Team
</div> 