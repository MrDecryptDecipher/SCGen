# SCGen: Next-Generation Smart Contract Generator

<div align="center">
  <img src="frontend/public/logo.png" alt="SCGen Logo" width="200"/>
  <h1>SCGen</h1>
  <p><strong>Limitless Smart Contract Generation & Real-time Visualization</strong></p>
  
  [![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
  [![React](https://img.shields.io/badge/React-18.2.0-blue.svg)](https://reactjs.org/)
  [![Solidity](https://img.shields.io/badge/Solidity-0.8.x-363636.svg)](https://docs.soliditylang.org/)
  [![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
</div>

---

## 📖 Introduction

**SCGen** is a state-of-the-art platform designed to democratize smart contract development. By bridging the gap between complex blockchain logic and intuitive user interfaces, SCGen allows developers and businesses to generate, visualize, and deploy smart contracts across multiple blockchains seamlessly.

Whether you are building a simple token or a complex decentralized finance (DeFi) protocol, SCGen's visual editor and automated code generation engine ensure security, efficiency, and scalability.

## 🚀 Key Features

*   **🤖 AI-Driven Generation**: Generate secure Solidity code from natural language descriptions or visual templates.
*   **📊 Real-time Visualization**: See your contract's logic flow and state changes instantly with our interactive visualizer.
*   **⚡ Multi-Chain Deployment**: One-click deployment to Ethereum, Binance Smart Chain, Polygon, and custom RPCs.
*   **🛡️ Automated Auditing**: Integrated security scanners check for common vulnerabilities (Reentrancy, Overflow, access control).
*   **📈 Analytics Dashboard**: Monitor contract interactions, gas usage, and events in real-time.

---

## 🏗️ Architecture

SCGen follows a modern microservices architecture, utilizing a robust backend for compilation and state management, and a reactive frontend for the best user experience.

### System Overview

```mermaid
graph TD
    User[👤 User] -->|Interacts| Frontend[💻 React Frontend]
    Frontend -->|API Calls| Backend[⚙️ Node.js/Express Backend]
    
    subgraph "Backend Services"
        Backend -->|Compiles| Compiler[🔨 Solidity Compiler]
        Backend -->|Stores| DB[(🗄️ MongoDB)]
        Backend -->|Deploys| Blockchain[🔗 Blockchain Network]
    end
    
    subgraph "External Integration"
        Blockchain -->|Events| Indexer[🔍 The Graph / Indexer]
        Indexer -->|Data| Backend
    end
```

### Application Flow

The following sequence diagram illustrates the flow from a user request to contract deployment:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant FE as Frontend (React)
    participant BE as Backend (Express)
    participant CP as Compiler (Solc)
    participant BC as Blockchain (EVM)
    participant DB as Database

    User->>FE: Define Contract Specs (Visual/Text)
    FE->>BE: Submit Specifications
    activate BE
    BE->>CP: Request Compilation
    activate CP
    CP-->>BE: Bytecode & ABI
    deactivate CP
    BE->>DB: Save Template Version
    BE-->>FE: Return Compilation Result
    deactivate BE
    
    User->>FE: Review & Deploy
    FE->>BC: Sign Transaction (Metamask)
    activate BC
    BC-->>FE: Transaction Hash
    deactivate BC
    
    FE->>BE: Register Deployment
    BE->>DB: Store Contract Address
    BE-->>User: Deployment Success & Dashboard Link
```

### Component Structure

```mermaid
classDiagram
    class Frontend {
        +React.js
        +Redux Toolkit
        +Ethers.js
        +TailwindCSS
    }
    class Backend {
        +Node.js
        +Express
        +Mongoose
        +Web3.js
    }
    class Services {
        +AuthService
        +ContractService
        +DeploymentService
        +AnalyticsService
    }
    
    Frontend <--> Backend : REST / WebSocket
    Backend --> Services : Uses
    Services --> DB : Persist
```

---

## 🛠️ Technology Stack

| Area | Technologies |
|------|--------------|
| **Frontend** | React 18, TailwindCSS, Framer Motion, D3.js, Ethers.js |
| **Backend** | Node.js, Express, MongoDB, Hardhat |
| **Blockchain** | Solidity 0.8+, Web3.js, IPFS |
| **DevOps** | Docker, Nginx, PM2, GitHub Actions |

---

## 🏁 Getting Started

### Prerequisites

*   Node.js v16+
*   MongoDB
*   Metamask installed in browser

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/MrDecryptDecipher/SCGen.git
    cd SCGen
    ```

2.  **Install Dependencies**
    ```bash
    # Install root, frontend, and backend dependencies
    npm run install:all
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```env
    PORT=3000
    MONGO_URI=mongodb://localhost:27017/scgen
    JWT_SECRET=your_super_secret_key
    ```

4.  **Run the Application**
    ```bash
    npm run dev
    ```
    *   Frontend running on: `http://localhost:3000`
    *   Backend running on: `http://localhost:3001` (or configured port)

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<div align="center">
  <p>Built with ❤️ by <strong>MrDecryptDecipher</strong></p>
</div>