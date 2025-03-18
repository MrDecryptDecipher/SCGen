import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import axios, { AxiosError } from 'axios';
import { ethers, Log } from 'ethers';
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { generateCustomContract } from './utils/aiService';
import https from 'https';
import fs from 'fs';

// Import ABIs from JSON files
// Using import statements for better TypeScript compatibility
import AggregatorV3InterfaceABI from '@chainlink/contracts/abi/v0.8/AggregatorV3Interface.json';
import ChainlinkClientABI from '@chainlink/contracts/abi/v0.8/ChainlinkClient.json';

dotenv.config();

// Load environment variables
const envVars = {
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  AIML_API_KEY: process.env.AIML_API_KEY || '',
  AIML_API_URL: process.env.AIML_API_URL || 'https://api.aimlapi.com/v1',
  TOGETHER_API_KEY: process.env.TOGETHER_API_KEY || '',
  NODE_ENV: process.env.NODE_ENV || 'development'
};

// Add API key validation here, before the AIML_API_CONFIG
const API_KEYS = {
  TOGETHER: process.env.TOGETHER_API_KEY,
  OPENROUTER: process.env.OPENROUTER_API_KEY,
  AIML: process.env.AIML_API_KEY
};

// Validate essential API keys
if (!API_KEYS.TOGETHER && !API_KEYS.OPENROUTER && !API_KEYS.AIML) {
  console.error('No API keys configured for AI providers. At least one is required.');
  process.exit(1);
}

console.log('API Configuration:', {
  TOGETHER: API_KEYS.TOGETHER ? 'Configured' : 'Missing',
  OPENROUTER: API_KEYS.OPENROUTER ? 'Configured' : 'Missing',
  AIML: API_KEYS.AIML ? 'Configured' : 'Missing'
});


// AIML API configuration
const AIML_API_CONFIG = {
  BASE_URL: envVars.AIML_API_URL,
  API_KEY: envVars.AIML_API_KEY,
  MODELS: {
    DEFAULT: 'mistralai/Mistral-7B-Instruct-v0.2',
    CODE: 'mistralai/Mistral-7B-Instruct-v0.2',
    SECURITY: 'mistralai/Mistral-7B-Instruct-v0.2'
  }
};

console.log('Environment variables loaded:', {
  OPENROUTER_API_KEY: envVars.OPENROUTER_API_KEY ? 'Set' : 'Not set',
  AIML_API_KEY: envVars.AIML_API_KEY ? 'Set' : 'Not set',
  NODE_ENV: envVars.NODE_ENV
});

// Initialize Express app and HTTP server
const app = express();
const httpServer = createServer(app);

// Configure port and host with fallback options
const DEFAULT_PORT = 3001;
const MAX_PORT_ATTEMPTS = 10;

async function startServer(initialPort: number): Promise<void> {
  let currentPort = initialPort;
  let attempts = 0;

  while (attempts < MAX_PORT_ATTEMPTS) {
    try {
      await new Promise<void>((resolve, reject) => {
        httpServer.once('error', (err: any) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${currentPort} is in use, trying ${currentPort + 1}`);
            httpServer.close();
            currentPort++;
            attempts++;
          } else {
            reject(err);
          }
        });

        httpServer.once('listening', () => {
          console.log(`Server running at http://0.0.0.0:${currentPort}`);
          resolve();
        });

        httpServer.listen(currentPort, process.env.HOST || '0.0.0.0');
      });
      break;
    } catch (error) {
      if (attempts === MAX_PORT_ATTEMPTS - 1) {
        throw new Error(`Could not find an available port after ${MAX_PORT_ATTEMPTS} attempts`);
      }
    }
  }
}

// Start the server with error handling
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  if (httpServer) {
    httpServer.close(() => {
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  console.info('SIGTERM signal received. Closing HTTP server');
  httpServer.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Initialize server
startServer(DEFAULT_PORT).catch((error) => {
  console.error('Failed to start server:', error);
  process.exit(1);
});

// Create HTTPS server if certificates exist
let httpsServer;
try {
  const privateKey = fs.readFileSync('/etc/letsencrypt/live/13.126.230.108.nip.io/privkey.pem', 'utf8');
  const certificate = fs.readFileSync('/etc/letsencrypt/live/13.126.230.108.nip.io/fullchain.pem', 'utf8');
  const credentials = { key: privateKey, cert: certificate };
  httpsServer = https.createServer(credentials, app);
  
  // Initialize Socket.IO for HTTPS
  const httpsIo = new Server(httpsServer, {
    cors: {
      origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://13.126.230.108:3000', 'https://your-surge-domain.sh'],
      methods: ['GET', 'POST', 'OPTIONS'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
    },
    path: '/socket.io',
    transports: ['websocket', 'polling'],
    allowEIO3: true,
  });
  
  // Mirror event handlers for HTTPS server
  httpsIo.on('connection', handleSocketConnection);
  
  // Start HTTPS server
  httpsServer.listen(8443, () => {
    console.log('HTTPS server running on port 8443');
  });
} catch (error) {
  console.log('HTTPS server not started due to missing certificates:', error);
}

// Extract socket connection handler
function handleSocketConnection(socket: Socket) {
  console.log('Client connected:', socket.id);
  
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', { message: 'Internal socket error', details: error.message });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
  
  // Add your existing subscribe-events handler here
 

// CORS configuration with proper origins
const corsOptions = {
  origin: ['http://localhost:3000', 'http://13.126.230.108:3000', 'https://scgen.surge.sh'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin', 'Access-Control-Allow-Methods', 'Access-Control-Allow-Headers'],
  credentials: true,
  preflightContinue: false,
  optionsSuccessStatus: 204
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Enable preflight for all routes

// Add CORS headers to all responses
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Access-Control-Allow-Origin');
  next();
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: false
}));

// Initialize Socket.IO with proper CORS
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://13.126.230.108:3000', 'https://scgen.surge.sh'],
    methods: ['GET', 'POST', 'OPTIONS'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization', 'Access-Control-Allow-Origin']
  },
  path: '/socket.io',
  transports: ['websocket', 'polling'],
  allowEIO3: true,
  connectTimeout: 45000,
  pingTimeout: 30000,
  pingInterval: 25000,
  upgradeTimeout: 30000,
  maxHttpBufferSize: 1e8
});


// Add connection logging
io.engine.on("connection_error", (err) => {
  console.log('Socket.IO connection error:', err);
});

// Rate limiting configuration
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  message: 'Too many requests from this IP, please try again later.'
});

app.use(limiter);

// Body parser configuration
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({
  limit: '50mb',
  extended: true,
  parameterLimit: 50000
}));

// Test route to verify that the backend is accessible
app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});

// Test route to verify that the backend is accessible
app.get('/', (req: Request, res: Response) => {
  res.send('Backend is running!');
});



// Initialize providers with proper error handling
const providers: Record<string, ethers.JsonRpcProvider> = {};
const wsProviders: Record<string, ethers.WebSocketProvider> = {};

try {
  // Initialize HTTP providers
  if (process.env.ALCHEMY_API_KEY) {
    const networks = {
      sepolia: process.env.ALCHEMY_SEPOLIA_URL,
      mainnet: process.env.ALCHEMY_MAINNET_URL,
      holesky: process.env.ALCHEMY_HOLESKY_URL
    };

    for (const [network, url] of Object.entries(networks)) {
      if (url) {
        try {
          providers[network] = new ethers.JsonRpcProvider(url);
          console.log(`Initialized HTTP provider for ${network}`);

          // Initialize WebSocket provider with proper URL format and authentication
          const wsUrl = url.replace('https://', 'wss://');
          const headers = {
            'Authorization': `Bearer ${process.env.ALCHEMY_API_KEY}`
          };
          
          // Create WebSocket provider with proper configuration
          wsProviders[network] = new ethers.WebSocketProvider(wsUrl, undefined);
          console.log(`Initialized WebSocket provider for ${network}`);
        } catch (error) {
          console.error(`Failed to initialize providers for ${network}:`, error);
        }
      }
    }
  } else {
    console.warn('ALCHEMY_API_KEY not set - some features will be limited');
  }
} catch (error) {
  console.error('Error initializing providers:', error);
}

// Add formatError function here, before the global axios interceptor
interface ApiError {
  message: string;
  code: string;
  status?: number;
  details?: any;
  severity: 'error' | 'warning';
}

function formatError(error: AxiosError): ApiError {
  if (error.response) {
    // Server responded with an error
    const data = error.response.data as { message?: string; error?: string };
    return {
      message: data.message || data.error || 'Server error occurred',
      code: 'SERVER_ERROR',
      status: error.response.status,
      details: error.response.data,
      severity: error.response.status >= 500 ? 'error' : 'warning'
    };
  } else if (error.request) {
    // Request made but no response received
    console.error('Network Error:', error.request);
    return {
      message: 'No response from server. Please check your internet connection.',
      code: 'NETWORK_ERROR',
      details: error.request,
      severity: 'error'
    };
  } else {
    // Error in setting up the request
    console.error('Request Error:', error.message);
    return {
      message: error.message || 'An error occurred while setting up the request',
      code: 'REQUEST_ERROR',
      severity: 'error'
    };
  }
}

// Global axios request retry and error handling interceptor
axios.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Check if the error is from an axios request
    if (!error.config) {
      return Promise.reject(error);
    }

    const { config } = error;
    
    // Default retry configuration
    config.retryCount = config.retryCount || 0;
    config.maxRetries = config.maxRetries || 3;

    // Don't retry on these status codes
    if (error.response && 
        (error.response.status === 400 || 
         error.response.status === 401 || 
         error.response.status === 403)) {
      return Promise.reject(error);
    }

    // Check if we can retry
    if (config.retryCount < config.maxRetries) {
      config.retryCount += 1;

      // Exponential backoff
      const backoffDelay = Math.pow(2, config.retryCount) * 1000; // Exponential delay

      console.log(`Retrying request (${config.retryCount}/${config.maxRetries}), Delay: ${backoffDelay}ms`);

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, backoffDelay));

      // Retry the request
      return axios(config);
    }

    // If max retries reached, reject
    return Promise.reject(error);
  }
);

// Convert types to enums for value checking
enum EntityType {
  PRIVATE_LIMITED = 'PRIVATE LIMITED COMPANY',
  PUBLIC_LIMITED = 'PUBLIC LIMITED COMPANY',
  PARTNERSHIP = 'PARTNERSHIP',
  LLP = 'LLP'
}

enum TransactionType {
  B2B = 'B2B',
  B2C = 'B2C',
  P2P = 'P2P'
}

enum ContractType {
  EQUITY = 'Equity Tokenization',
  REVENUE = 'Revenue Sharing',
  SUPPLY_CHAIN = 'Supply Chain',
  WHITE_LABEL = 'White Label',
  VESTING = 'Vesting Agreements',
  GOVERNANCE = 'Governance Token',
  STAKING = 'Staking Contract',
  LIQUIDITY = 'Liquidity Pool'
}

// Add timestamp middleware for tracking request processing time
app.use((req: Request, res: Response, next: () => void) => {
  (req as any).startTime = Date.now();
  next();
});

interface PersonaConfig {
  role: string;
  expertise: string;
  focus: string[];
  maxTokens: number;  // Make maxTokens required
}

const PERSONA_CONFIGS: Record<string, PersonaConfig> = {
  nanjunda: {
    role: 'smart contract architect',
    expertise: 'architecture and tokenomics',
    focus: ['Token economics', 'Access control', 'Integration', 'Compliance'],
    maxTokens: 4000
  },
  achyutha: {
    role: 'smart contract developer',
    expertise: 'development and optimization',
    focus: ['Gas optimization', 'Security', 'Events', 'Access controls'],
    maxTokens: 8000
  },
  sandeep: {
    role: 'smart contract security expert',
    expertise: 'security and compliance',
    focus: ['Attack vectors', 'Vulnerabilities', 'Economic risks', 'Compliance'],
    maxTokens: 4000
  }
} as const;

type PersonaType = keyof typeof PERSONA_CONFIGS;

interface ContractRequest {
  entityType: EntityType;
  transactionType: TransactionType;
  contractType: ContractType;
  customizations?: Record<string, any>;
}

interface AIResponse {
  analysis: string;
  code: string;
  security: {
    vulnerabilities: string[];
    recommendations: string[];
  };
}

// Add gas optimization and security features
interface GasAnalysis {
  functionName: string;
  estimatedGas: number;
  recommendations: string[];
}

interface SecurityScan {
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  description: string;
  location: string;
  recommendation: string;
}

// Add cache interface and implementation
interface ContractCache {
  code: string;
  timestamp: number;
  analysis: string;
  security: {
    vulnerabilities: string[];
    recommendations: string[];
  };
  gasAnalysis: any[];
}

// Add cache duration constant
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days

// Add comprehensive contract templates based on latest OpenZeppelin patterns
const CONTRACT_TEMPLATES: Record<ContractType, Record<string, string>> = {
  [ContractType.WHITE_LABEL]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/structs/BitMaps.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";

/**
 * @title White Label Token Contract
 * @dev Implementation of a customizable white label token with advanced features
 * @custom:security-contact security@yourcompany.com
 */
contract WhiteLabelToken is 
    Initializable,
    ERC20Upgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable,
    EIP712
{
    using BitMaps for BitMaps.BitMap;

    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant PAUSER_ROLE = keccak256("PAUSER_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");

    struct TokenConfig {
        string name;
        string symbol;
        uint256 maxSupply;
        bool transferable;
        mapping(address => bool) authorizedMinters;
    }

    TokenConfig private _config;
    BitMaps.BitMap private _mintedTokens;

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(
        string memory name_,
        string memory symbol_,
        uint256 maxSupply_,
        bool transferable_
    ) public initializer {
        __ERC20_init(name_, symbol_);
        __AccessControl_init();
        __Pausable_init();
        __UUPSUpgradeable_init();
        __EIP712_init(name_, "1");

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _grantRole(PAUSER_ROLE, msg.sender);
        _grantRole(UPGRADER_ROLE, msg.sender);

        _config.name = name_;
        _config.symbol = symbol_;
        _config.maxSupply = maxSupply_;
        _config.transferable = transferable_;
    }

    // ... rest of implementation
}`,
    B2C: `// Additional B2C features
    mapping(address => uint256) public consumerLimits;
    mapping(address => uint256) public lastPurchaseTime;
    
    event ConsumerLimitSet(address indexed consumer, uint256 limit);
    event PurchaseRecorded(address indexed consumer, uint256 amount);`,
    B2B: `// Additional B2B features
    mapping(address => bool) public verifiedBusinesses;
    mapping(address => uint256) public businessLimits;
    
    event BusinessVerified(address indexed business, bool status);
    event BusinessLimitSet(address indexed business, uint256 limit);`
  },
  [ContractType.EQUITY]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/extensions/ERC20VotesUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

contract EquityToken is 
    Initializable,
    ERC20Upgradeable,
    ERC20VotesUpgradeable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for equity tokens
    mapping(address => uint256) public vestingSchedules;
    mapping(address => bool) public whitelisted;
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event WhitelistUpdated(address indexed account, bool status);`,
    B2C: `// Additional B2C features for equity tokens
    mapping(address => bool) public retailInvestors;
    mapping(address => uint256) public investmentLimits;
    
    event RetailInvestorAdded(address indexed investor);
    event InvestmentLimitSet(address indexed investor, uint256 limit);`
  },
  [ContractType.REVENUE]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/VestingWalletUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract RevenueSharing is 
    Initializable,
    ERC20Upgradeable,
    VestingWalletUpgradeable,
    AccessControlUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for revenue sharing
    mapping(address => uint256) public revenueShares;
    mapping(address => uint256) public lastDistribution;
    
    event RevenueDistributed(address indexed partner, uint256 amount);
    event ShareUpdated(address indexed partner, uint256 share);`,
    B2C: `// Additional B2C features for revenue sharing
    mapping(address => uint256) public customerRewards;
    mapping(address => uint256) public rewardRates;
    
    event RewardsClaimed(address indexed customer, uint256 amount);
    event RewardRateSet(address indexed customer, uint256 rate);`
  },
  [ContractType.SUPPLY_CHAIN]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";

contract SupplyChain is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for supply chain
    mapping(bytes32 => address) public shipmentOwners;
    mapping(bytes32 => uint256) public shipmentStatus;
    
    event ShipmentCreated(bytes32 indexed shipmentId, address owner);
    event StatusUpdated(bytes32 indexed shipmentId, uint256 status);`,
    B2C: `// Additional B2C features for supply chain
    mapping(bytes32 => address) public consumerOrders;
    mapping(bytes32 => uint256) public deliveryStatus;
    
    event OrderPlaced(bytes32 indexed orderId, address consumer);
    event DeliveryUpdated(bytes32 indexed orderId, uint256 status);`
  },
  [ContractType.VESTING]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/finance/VestingWalletUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract VestingToken is 
    Initializable,
    ERC20Upgradeable,
    VestingWalletUpgradeable,
    AccessControlUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for vesting
    mapping(address => uint256) public vestingSchedules;
    mapping(address => uint256) public cliffPeriods;
    
    event ScheduleCreated(address indexed beneficiary, uint256 amount);
    event CliffUpdated(address indexed beneficiary, uint256 period);`,
    B2C: `// Additional B2C features for vesting
    mapping(address => uint256) public employeeVesting;
    mapping(address => uint256) public vestingStart;
    
    event EmployeeVestingCreated(address indexed employee, uint256 amount);
    event VestingStarted(address indexed employee, uint256 timestamp);`
  },
  [ContractType.GOVERNANCE]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/governance/GovernorUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorSettingsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorCountingSimpleUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/governance/extensions/GovernorVotesUpgradeable.sol";

contract Governance is 
    Initializable,
    GovernorUpgradeable,
    GovernorSettingsUpgradeable,
    GovernorCountingSimpleUpgradeable,
    GovernorVotesUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for governance
    mapping(uint256 => bytes32) public proposals;
    mapping(address => uint256) public votingPower;
    
    event ProposalCreated(uint256 indexed proposalId, address proposer);
    event VoteCast(address indexed voter, uint256 proposalId, uint8 support);`,
    B2C: `// Additional B2C features for governance
    mapping(address => bool) public delegates;
    mapping(address => uint256) public delegatedPower;
    
    event DelegateAppointed(address indexed delegate, address appointer);
    event PowerDelegated(address indexed from, address indexed to, uint256 amount);`
  },
  [ContractType.STAKING]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract Staking is 
    Initializable,
    ERC20Upgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for staking
    mapping(address => uint256) public stakingBalances;
    mapping(address => uint256) public rewardRates;
    
    event Staked(address indexed staker, uint256 amount);
    event RewardsClaimed(address indexed staker, uint256 amount);`,
    B2C: `// Additional B2C features for staking
    mapping(address => uint256) public userStakes;
    mapping(address => uint256) public stakingStart;
    
    event UserStaked(address indexed user, uint256 amount);
    event RewardsDistributed(address indexed user, uint256 amount);`
  },
  [ContractType.LIQUIDITY]: {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract LiquidityPool is 
    Initializable,
    ERC20Upgradeable,
    ReentrancyGuardUpgradeable,
    AccessControlUpgradeable
{
    // ... implementation
}`,
    B2B: `// Additional B2B features for liquidity pools
    mapping(address => uint256) public lpTokens;
    mapping(address => uint256) public providerShares;
    
    event LiquidityAdded(address indexed provider, uint256 amount);
    event LiquidityRemoved(address indexed provider, uint256 amount);`,
    B2C: `// Additional B2C features for liquidity pools
    mapping(address => uint256) public userLiquidity;
    mapping(address => uint256) public lastDeposit;
    
    event UserDeposited(address indexed user, uint256 amount);
    event UserWithdrew(address indexed user, uint256 amount);`
  }
};

// Add token usage tracking
interface TokenUsageStats {
  totalTokensUsed: number;
  totalCost: number;
  requestCount: number;
  lastRequest: Date;
  usageByModel: Record<string, {
    tokens: number;
    cost: number;
    requests: number;
  }>;
}

const tokenUsageStats: TokenUsageStats = {
  totalTokensUsed: 0,
  totalCost: 0,
  requestCount: 0,
  lastRequest: new Date(),
  usageByModel: {}
};

// Add token usage interface
interface TokenUsage {
  total: number;
  cost: number;
}

// Update ModelConfig interface and configuration
interface ModelConfig {
  OPENROUTER: {
    DEFAULT: string;
    FALLBACK: string;
    LARGE: string;
  };
  AIML: {
    DEFAULT: string;
    FALLBACK: string;
    LARGE: string;
  };
  TOGETHER: {
    DEFAULT: string;
    FALLBACK: string;
    LARGE: string;
    CODE: string;
  };
}

// Single source of truth for model configuration
const MODEL_CONFIG: ModelConfig = {
  OPENROUTER: {
    DEFAULT: 'cognitivecomputations/dolphin3.0-r1-mistral-24b:free',
    FALLBACK: 'mistralai/Mistral-7B-Instruct-v0.1',
    LARGE: 'meta-llama/Llama-2-70b-chat:free'
  },
  AIML: {
    DEFAULT: 'mistralai/Mistral-7B-Instruct-v0.2',
    FALLBACK: 'mistralai/Mistral-7B-Instruct-v0.1',
    LARGE: 'mistralai/Mixtral-8x7B-Instruct-v0.1'
  },
  TOGETHER: {
    DEFAULT: 'meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo',
    FALLBACK: 'mistralai/Mistral-7B-Instruct-v0.2',
    LARGE: 'meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo',
    CODE: 'Qwen/Qwen2.5-Coder-32B-Instruct'
  }
};

// Enhanced caching system with template fragments
interface CacheEntry {
  code: string;
  timestamp: number;
  analysis: string;
  security: {
    vulnerabilities: string[];
    recommendations: string[];
  };
  gasAnalysis: GasAnalysis[];
  fragments: {
    base: string;
    features: string[];
    customizations: Record<string, string>;
  };
  metadata: {
    compiler: string;
    framework: string;
    dependencies: Record<string, string>;
  };
  validation: {
    lastChecked: Date;
    status: 'valid' | 'outdated' | 'invalid';
    issues: string[];
  };
}

const contractCache = new Map<string, CacheEntry>();

// Add cache helpers
function generateCacheKey(entityType: EntityType, transactionType: TransactionType, contractType: ContractType): string {
  return `${entityType}_${transactionType}_${contractType}_${process.env.SOLIDITY_VERSION || '0.8.20'}`;
}

async function getFromCache(cacheKey: string): Promise<CacheEntry | null> {
  const entry = contractCache.get(cacheKey);
  if (!entry) return null;

  // Check if cache is valid
  const now = new Date();
  if (now.getTime() - entry.validation.lastChecked.getTime() > CACHE_DURATION) {
    entry.validation.status = 'outdated';
    return null;
  }

  // Check if dependencies are up to date
  const outdatedDeps = await checkDependencyVersions(entry.metadata.dependencies);
  if (outdatedDeps.length > 0) {
    entry.validation.status = 'outdated';
    entry.validation.issues = outdatedDeps;
    return null;
  }

  return entry;
}

async function saveToCache(cacheKey: string, entry: Partial<CacheEntry>): Promise<void> {
  const now = new Date();
  
  const newEntry: CacheEntry = {
    code: entry.code || '',
    timestamp: now.getTime(),
    analysis: entry.analysis || '',
    security: entry.security || {
      vulnerabilities: [],
      recommendations: []
    },
    gasAnalysis: entry.gasAnalysis || [],
    fragments: entry.fragments || {
      base: '',
      features: [],
      customizations: {}
    },
    metadata: entry.metadata || {
      compiler: process.env.SOLIDITY_VERSION || '0.8.20',
      framework: 'OpenZeppelin 5.0.0',
      dependencies: {
        '@openzeppelin/contracts-upgradeable': '^5.0.0',
        '@openzeppelin/contracts': '^5.0.0'
      }
    },
    validation: {
      lastChecked: now,
      status: 'valid',
      issues: []
    }
  };

  contractCache.set(cacheKey, newEntry);
}

// Add dependency version checker
async function checkDependencyVersions(deps: Record<string, string>): Promise<string[]> {
  const outdated: string[] = [];
  
  for (const [pkg, version] of Object.entries(deps)) {
    try {
      const response = await axios.get(`https://registry.npmjs.org/${pkg}/latest`);
      const latestVersion = response.data.version;
      
      if (version.replace('^', '') < latestVersion) {
        outdated.push(`${pkg}: ${version} -> ${latestVersion}`);
      }
    } catch (error) {
      console.warn(`Failed to check version for ${pkg}:`, error);
    }
  }
  
  return outdated;
}

// Add token usage tracking
function trackTokenUsage(model: string, usage: TokenUsage): void {
  tokenUsageStats.totalTokensUsed += usage.total;
  tokenUsageStats.totalCost += usage.cost;
  tokenUsageStats.requestCount++;
  tokenUsageStats.lastRequest = new Date();

  if (!tokenUsageStats.usageByModel[model]) {
    tokenUsageStats.usageByModel[model] = {
      tokens: 0,
      cost: 0,
      requests: 0
    };
  }

  tokenUsageStats.usageByModel[model].tokens += usage.total;
  tokenUsageStats.usageByModel[model].cost += usage.cost;
  tokenUsageStats.usageByModel[model].requests++;
}

// Update makeOpenRouterRequest function to handle errors better
async function makeOpenRouterRequest(
  model: string,
  messages: any[],
  maxTokens: number
): Promise<any> {
  try {
    console.log(`Making OpenRouter API request with model: ${model}`);
    
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('OpenRouter API key is not configured');
    }

    // Properly formatted request according to OpenRouter docs
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        top_p: 1,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,  // Make sure to include 'Bearer ' prefix
          'HTTP-Referer': 'http://13.126.230.108:3000',
          'X-Title': 'SCGen - Smart Contract Generator',
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('OpenRouter API Response:', JSON.stringify(response.data, null, 2));
    
    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content;
    }

    console.log('Unexpected API response:', JSON.stringify(response.data, null, 2));
    throw new Error('Unexpected API response format');
  } catch (error) {
    // Detailed error logging to diagnose issues
    console.error('OpenRouter API request failed for model:', model);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('OpenRouter API Response:', JSON.stringify(error.response.data, null, 2));
      
      // Specific error handling for common issues
      if (error.response.status === 401) {
        console.error('Authentication error: Check your OpenRouter API key format');
      } else if (error.response.status === 402) {
        console.error('Free tier limit reached: Consider adding credits to your OpenRouter account');
      } else if (error.response.status === 400) {
        console.error('Invalid model ID: Check your model ID format');
      }
    }
    
    throw error;
  }
}

// Add AIML API request function
async function makeAIMLRequest(
  model: string,
  messages: any[],
  maxTokens: number
): Promise<any> {
  try {
    console.log(`Making AIML API request to model: ${model}`);

    const apiKey = process.env.AIML_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('AIML API key is not configured');
    }

    const response = await axios.post(
      `${process.env.AIML_API_URL || 'https://api.aimlapi.com/v1'}/chat/completions`,
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('AIML API Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.choices?.[0]?.message?.content) {
      if (response.data.usage) {
        trackTokenUsage('aiml', {
          total: response.data.usage.total_tokens,
          cost: calculateCost(response.data.usage, model)
        });
      }
      return response.data.choices[0].message.content;
    }

    throw new Error('Invalid response format from AIML API');
  } catch (error) {
    console.error('AIML API request failed:', error);
    throw error;
  }
}

// Add Together API request function
async function makeTogetherRequest(
  model: string,
  messages: any[],
  maxTokens: number
): Promise<any> {
  try {
    console.log(`Making Together API request with model: ${model}`);

    const apiKey = process.env.TOGETHER_API_KEY?.trim();
    if (!apiKey) {
      throw new Error('Together API key is not configured');
    }

    const response = await axios.post(
      'https://api.together.xyz/v1/chat/completions',
      {
        model,
        messages,
        max_tokens: maxTokens,
        temperature: 0.7,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('Together API Response:', JSON.stringify(response.data, null, 2));

    if (response.data?.choices?.[0]?.message?.content) {
      if (response.data.usage) {
        trackTokenUsage('together', {
          total: response.data.usage.total_tokens,
          cost: calculateCost(response.data.usage, model)
        });
      }
      return response.data.choices[0].message.content;
    }

    throw new Error('Invalid response format from Together API');
  } catch (error) {
    // Detailed error logging to diagnose issues
    console.error('Together API request failed for model:', model);
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('Together API Response:', JSON.stringify(error.response.data, null, 2));
      
      // Specific error handling for common issues
      if (error.response.status === 401) {
        console.error('Authentication error: Check your Together API key format');
      } else if (error.response.status === 402) {
        console.error('Payment required: Your account needs more credits');
      } else if (error.response.status === 429) {
        console.error('Rate limit exceeded: Your requests are being throttled');
      }
    }
    
    throw error;
  }
}

// Add contract type specific templates
const contractTemplates: Record<ContractType, string> = {
  [ContractType.EQUITY]: `
    // Additional features for equity tokens
    uint256 public votingPower;
    mapping(address => uint256) public lastVoteCast;
    mapping(address => bool) public isWhitelisted;
    
    event VoteCast(address indexed voter, uint256 proposalId);
    event WhitelistUpdated(address indexed account, bool status);
  `,
  [ContractType.REVENUE]: `
    // Revenue sharing specific features
    uint256 public totalRevenue;
    uint256 public revenuePerToken;
    mapping(address => uint256) public lastRevenueWithdrawn;
    
    event RevenueDistributed(uint256 amount);
    event RevenueWithdrawn(address indexed holder, uint256 amount);
  `,
  [ContractType.SUPPLY_CHAIN]: `
    // Supply chain specific features
    struct Product {
        uint256 id;
      string metadata;
      address manufacturer;
        uint256 timestamp;
      Status status;
    }
    enum Status { Created, InTransit, Delivered }
    mapping(uint256 => Product) public products;
    
    event ProductCreated(uint256 indexed id, address manufacturer);
    event StatusUpdated(uint256 indexed id, Status status);
  `,
  [ContractType.WHITE_LABEL]: `
    // White Label specific features
    struct WhiteLabelConfig {
        string name;
        string symbol;
        address owner;
      uint256 maxSupply;
      bool transferable;
      mapping(address => bool) authorizedMinters;
    }
    WhiteLabelConfig public config;
    
    event ConfigUpdated(string name, string symbol, uint256 maxSupply);
    event MinterAuthorized(address indexed minter, bool status);
    event TokenMinted(address indexed to, uint256 amount);
  `,
  [ContractType.VESTING]: `
    // Vesting specific features
    struct VestingSchedule {
      uint256 totalAmount;
      uint256 startTime;
      uint256 cliffDuration;
      uint256 vestingDuration;
      uint256 releasedAmount;
      bool revocable;
      bool revoked;
    }
    mapping(address => VestingSchedule) public vestingSchedules;
    
    event VestingScheduleCreated(address indexed beneficiary, uint256 amount);
    event TokensVested(address indexed beneficiary, uint256 amount);
    event VestingRevoked(address indexed beneficiary);
  `,
  [ContractType.GOVERNANCE]: `
    // Governance specific features
    struct Proposal {
      uint256 id;
      address proposer;
      string description;
      uint256 forVotes;
      uint256 againstVotes;
      uint256 startBlock;
      uint256 endBlock;
      bool executed;
    }
    mapping(uint256 => Proposal) public proposals;
    
    event ProposalCreated(uint256 indexed id, address proposer);
    event VoteCast(address indexed voter, uint256 proposalId, bool support);
    event ProposalExecuted(uint256 indexed id);
  `,
  [ContractType.STAKING]: `
    // Staking specific features
    struct Stake {
      uint256 amount;
      uint256 timestamp;
      uint256 duration;
      uint256 rewards;
    }
    mapping(address => Stake) public stakes;
    
    event Staked(address indexed user, uint256 amount, uint256 duration);
    event Unstaked(address indexed user, uint256 amount);
    event RewardsClaimed(address indexed user, uint256 amount);
  `,
  [ContractType.LIQUIDITY]: `
    // Liquidity Pool specific features
    struct Pool {
      address token0;
      address token1;
      uint256 reserve0;
      uint256 reserve1;
      uint256 totalSupply;
    }
    mapping(bytes32 => Pool) public pools;
    
    event PoolCreated(address indexed token0, address indexed token1);
    event LiquidityAdded(address indexed provider, uint256 amount0, uint256 amount1);
    event LiquidityRemoved(address indexed provider, uint256 amount0, uint256 amount1);
  `
};

// Add entity-specific features
const entityFeatures: Record<EntityType, string> = {
  [EntityType.PRIVATE_LIMITED]: `
    // Private Limited Company specific features
    uint256 public maxShareholders;
    mapping(address => bool) public boardMembers;
    mapping(address => uint256) public shareholderClass; // 1: Promoter, 2: Investor, 3: Employee
    
    event BoardMemberAdded(address indexed member);
    event ShareholderClassUpdated(address indexed holder, uint256 class);
    event DirectorResolutionProposed(uint256 indexed proposalId, string description);
  `,
  [EntityType.PUBLIC_LIMITED]: `
    // Public Limited Company specific features
    uint256 public marketCap;
    uint256 public publicFloatPercentage;
    mapping(address => bool) public institutionalInvestors;
    
    event MarketCapUpdated(uint256 newMarketCap);
    event InstitutionalInvestorAdded(address indexed investor);
    event QuarterlyReportPublished(string reportURI);
  `,
  [EntityType.PARTNERSHIP]: `
    // Partnership specific features
    struct Partner {
        uint256 profitShare;
        uint256 capitalContribution;
        bool isManaging;
    }
    mapping(address => Partner) public partners;
    uint256 public totalPartners;
    
    event PartnerAdded(address indexed partner, uint256 profitShare);
    event ProfitDistributed(uint256 amount);
    event CapitalContributed(address indexed partner, uint256 amount);
  `,
  [EntityType.LLP]: `
    // LLP specific features
    struct LLPMember {
        uint256 liability;
        uint256 contribution;
        bool isDesignatedPartner;
    }
    mapping(address => LLPMember) public members;
    uint256 public totalLiability;
    
    event MemberAdded(address indexed member, bool isDesignated);
    event LiabilityUpdated(address indexed member, uint256 newLiability);
    event AnnualReturnFiled(uint256 year, string reportURI);
  `
};

// Add transaction-specific features
const transactionFeatures: Record<TransactionType, string> = {
  [TransactionType.B2B]: `
    // B2B specific features
    struct BusinessVerification {
        bool isVerified;
        uint256 creditLimit;
        uint256 tradingVolume;
    }
    mapping(address => BusinessVerification) public verifiedBusinesses;
    uint256 public minBusinessTransaction;
    
    event BusinessVerified(address indexed business);
    event CreditLimitUpdated(address indexed business, uint256 limit);
    event BulkTransferExecuted(address[] recipients, uint256[] amounts);
  `,
  [TransactionType.B2C]: `
    // B2C specific features
    struct ConsumerProtection {
        uint256 refundWindow;
        bool hasDispute;
        mapping(uint256 => bool) purchaseHistory;
    }
    mapping(address => ConsumerProtection) public consumerProtections;
    uint256 public maxConsumerPurchase;
    
    event ConsumerRefundRequested(address indexed consumer, uint256 amount);
    event DisputeResolved(address indexed consumer, bool infavorOfConsumer);
    event ConsumerLimitUpdated(uint256 newLimit);
  `,
  [TransactionType.P2P]: `
    // P2P specific features
    struct PeerProfile {
        uint256 trustScore;
        uint256 transactionCount;
        bool isVerified;
    }
    mapping(address => PeerProfile) public peerProfiles;
    uint256 public p2pTransactionLimit;
    
    event PeerVerified(address indexed peer);
    event TrustScoreUpdated(address indexed peer, uint256 newScore);
    event P2PTransferCompleted(address indexed from, address indexed to, uint256 amount);
  `
};

// Add Oracle features
const oracleFeatures = `
    // Chainlink Oracle Integration
    using Chainlink for Chainlink.Request;
    address private oracle;
    bytes32 private jobId;
    uint256 private fee;
    
    // Price Feed interfaces
    AggregatorV3Interface internal priceFeed;
    
    // Data storage
    struct ExternalData {
        uint256 timestamp;
        uint256 value;
        string source;
        bool isValid;
    }
    mapping(bytes32 => ExternalData) public externalData;
    
    event DataRequested(bytes32 indexed requestId, string dataType);
    event DataFulfilled(bytes32 indexed requestId, uint256 value);
`;

// Add Oracle initialization
const oracleInitialization = `
    // Initialize Chainlink Oracle
    setPublicChainlinkToken();
    oracle = 0x123...; // Oracle address for your network
    jobId = "your-job-id";
    fee = 0.1 * 10 ** 18; // 0.1 LINK
    
    // Initialize Price Feed
    priceFeed = AggregatorV3Interface(0x456...); // Price feed address
`;

// Add Oracle functions
const oracleFunctions = `
    function requestExternalData(string memory dataType) public returns (bytes32) {
        Chainlink.Request memory request = buildChainlinkRequest(jobId, address(this), this.fulfill.selector);
        request.add("dataType", dataType);
        bytes32 requestId = sendChainlinkRequestTo(oracle, request, fee);
        emit DataRequested(requestId, dataType);
        return requestId;
    }
    
    function fulfill(bytes32 _requestId, uint256 _value) public recordChainlinkFulfillment(_requestId) {
        externalData[_requestId] = ExternalData({
            timestamp: block.timestamp,
            value: _value,
            source: "Chainlink",
            isValid: true
        });
        emit DataFulfilled(_requestId, _value);
    }
    
    function getLatestPrice() public view returns (int) {
        (
            uint80 roundID,
            int price,
            uint startedAt,
            uint timeStamp,
            uint80 answeredInRound
        ) = priceFeed.latestRoundData();
        return price;
    }
`;

// Add analytics features
const analyticsFeatures = `
    // Analytics tracking
    struct Analytics {
        uint256 totalTransactions;
        uint256 totalVolume;
        uint256 lastActivityTime;
        mapping(uint256 => uint256) dailyVolume; // timestamp => volume
        mapping(address => uint256) userVolume; // user => volume
    }
    Analytics public analytics;
    
    // Transaction history
    struct Transaction {
        address from;
        address to;
        uint256 amount;
        uint256 timestamp;
        bytes32 transactionType;
        bool success;
    }
    Transaction[] public transactionHistory;
    mapping(address => uint256[]) public userTransactions; // user => transaction indices
    
    // Analytics events
    event VolumeUpdated(uint256 newTotalVolume, uint256 dailyVolume);
    event TransactionRecorded(uint256 indexed index, address from, address to, uint256 amount);
`;

// Add analytics functions
const analyticsFunctions = `
    function getAnalytics() public view returns (
        uint256 totalTx,
        uint256 totalVol,
        uint256 lastActivity,
        uint256 todayVol
    ) {
        uint256 today = block.timestamp - (block.timestamp % 1 days);
        return (
            analytics.totalTransactions,
            analytics.totalVolume,
            analytics.lastActivityTime,
            analytics.dailyVolume[today]
        );
    }
    
    function getUserAnalytics(address user) public view returns (
        uint256 userVol,
        uint256[] memory txIndices
    ) {
        return (
            analytics.userVolume[user],
            userTransactions[user]
        );
    }
    
    function getTransaction(uint256 index) public view returns (Transaction memory) {
        require(index < transactionHistory.length, "Invalid index");
        return transactionHistory[index];
    }
    
    function getUserTransactionCount(address user) public view returns (uint256) {
        return userTransactions[user].length;
    }
    
    function _recordTransaction(
        address from,
        address to,
        uint256 amount,
        bytes32 txType,
        bool success
    ) internal {
        // Update analytics
        analytics.totalTransactions++;
        analytics.totalVolume += amount;
        analytics.lastActivityTime = block.timestamp;
        
        uint256 today = block.timestamp - (block.timestamp % 1 days);
        analytics.dailyVolume[today] += amount;
        analytics.userVolume[from] += amount;
        
        // Record transaction
        uint256 index = transactionHistory.length;
        transactionHistory.push(Transaction({
            from: from,
            to: to,
            amount: amount,
            timestamp: block.timestamp,
            transactionType: txType,
            success: success
        }));
        
        // Update user transaction indices
        userTransactions[from].push(index);
        if (from != to) {
            userTransactions[to].push(index);
        }
        
        emit VolumeUpdated(analytics.totalVolume, analytics.dailyVolume[today]);
        emit TransactionRecorded(index, from, to, amount);
    }
    
    // Override transfer function to record analytics
    function transfer(address to, uint256 amount) public virtual override returns (bool) {
        bool success = super.transfer(to, amount);
        if (success) {
            _recordTransaction(msg.sender, to, amount, keccak256("TRANSFER"), true);
        }
        return success;
    }
    
    // Override transferFrom function to record analytics
    function transferFrom(address from, address to, uint256 amount) public virtual override returns (bool) {
        bool success = super.transferFrom(from, to, amount);
        if (success) {
            _recordTransaction(from, to, amount, keccak256("TRANSFER_FROM"), true);
        }
        return success;
    }
`;

function getContractTemplate(contractType: ContractType, entityType: EntityType, transactionType: TransactionType, customizations?: Record<string, any>): string {
  const baseTemplate = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
${contractType === ContractType.SUPPLY_CHAIN ? 'import "@openzeppelin/contracts/utils/Counters.sol";' : ''}
import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@chainlink/contracts/src/v0.8/ChainlinkClient.sol";

/**
 * @title ${contractType} for ${entityType}
 * @dev Implementation with ${transactionType} features, Oracle integration, and Analytics
 */
contract ${contractType}_${entityType}_${transactionType} is ERC20, AccessControl, ReentrancyGuard, Pausable, ChainlinkClient {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    ${contractType === ContractType.SUPPLY_CHAIN ? 'using Counters for Counters.Counter;' : ''}

    // Base contract features
    uint256 public constant TRANSFER_COOLDOWN = 1 hours;
    mapping(address => uint256) public lastTransferTime;
    
    // Contract type specific features
    ${contractTemplates[contractType] || ''}
    
    // Entity type specific features
    ${entityFeatures[entityType] || ''}
    
    // Transaction type specific features
    ${transactionFeatures[transactionType] || ''}
    
    // Oracle Integration
    ${oracleFeatures}
    
    // Analytics Integration
    ${analyticsFeatures}
    
    constructor(
        string memory name,
        string memory symbol,
        uint256 initialSupply,
        ${customizations?.extraParams || ''}
    ) ERC20(name, symbol) {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(MINTER_ROLE, msg.sender);
        _mint(msg.sender, initialSupply);
        
        // Initialize entity-specific settings
        ${getEntityInitialization(entityType)}
        
        // Initialize transaction-specific settings
        ${getTransactionInitialization(transactionType)}
        
        // Initialize Oracle
        ${oracleInitialization}
        
        // Initialize Analytics
        analytics.totalTransactions = 0;
        analytics.totalVolume = 0;
        analytics.lastActivityTime = block.timestamp;
        
        ${customizations?.constructorLogic || ''}
    }

    // Entity-specific functions
    ${getEntityFunctions(entityType)}
    
    // Transaction-specific functions
    ${getTransactionFunctions(transactionType)}
    
    // Oracle Functions
    ${oracleFunctions}
    
    // Analytics Functions
    ${analyticsFunctions}
    
    // ... rest of the base contract code ...
`;

  return baseTemplate;
}

function getEntityInitialization(entityType: EntityType): string {
  const initializations: Record<EntityType, string> = {
    [EntityType.PRIVATE_LIMITED]: `
        maxShareholders = 200; // Default max for private limited
        boardMembers[msg.sender] = true;
        shareholderClass[msg.sender] = 1; // Promoter class
    `,
    [EntityType.PUBLIC_LIMITED]: `
        marketCap = 0;
        publicFloatPercentage = 0;
    `,
    [EntityType.PARTNERSHIP]: `
        Partner memory newPartner = Partner({
            profitShare: 100,
            capitalContribution: 0,
            isManaging: true
        });
        partners[msg.sender] = newPartner;
        totalPartners = 1;
    `,
    [EntityType.LLP]: `
        LLPMember memory newMember = LLPMember({
            liability: 0,
            contribution: 0,
            isDesignatedPartner: true
        });
        members[msg.sender] = newMember;
        totalLiability = 0;
    `
  };
  return initializations[entityType];
}

function getTransactionInitialization(transactionType: TransactionType): string {
  const initializations: Record<TransactionType, string> = {
    [TransactionType.B2B]: `
        minBusinessTransaction = 1000;
        BusinessVerification memory bv = BusinessVerification({
            isVerified: true,
            creditLimit: 1000000,
            tradingVolume: 0
        });
        verifiedBusinesses[msg.sender] = bv;
    `,
    [TransactionType.B2C]: `
        maxConsumerPurchase = 10000;
    `,
    [TransactionType.P2P]: `
        p2pTransactionLimit = 5000;
        PeerProfile memory pp = PeerProfile({
            trustScore: 100,
            transactionCount: 0,
            isVerified: true
        });
        peerProfiles[msg.sender] = pp;
    `
  };
  return initializations[transactionType];
}

function getEntityFunctions(entityType: EntityType): string {
  const functions: Record<EntityType, string> = {
    [EntityType.PRIVATE_LIMITED]: `
        function addBoardMember(address member) external onlyRole(ADMIN_ROLE) {
            require(!boardMembers[member], "Already a board member");
            boardMembers[member] = true;
            emit BoardMemberAdded(member);
        }
        
        function updateShareholderClass(address holder, uint256 class) external onlyRole(ADMIN_ROLE) {
            require(class > 0 && class <= 3, "Invalid class");
            shareholderClass[holder] = class;
            emit ShareholderClassUpdated(holder, class);
        }
    `,
    [EntityType.PUBLIC_LIMITED]: `
        function updateMarketCap(uint256 newMarketCap) external onlyRole(ADMIN_ROLE) {
            marketCap = newMarketCap;
            emit MarketCapUpdated(newMarketCap);
        }
        
        function addInstitutionalInvestor(address investor) external onlyRole(ADMIN_ROLE) {
            require(!institutionalInvestors[investor], "Already registered");
            institutionalInvestors[investor] = true;
            emit InstitutionalInvestorAdded(investor);
        }
    `,
    [EntityType.PARTNERSHIP]: `
        function addPartner(address partner, uint256 profitShare, bool isManaging) external onlyRole(ADMIN_ROLE) {
            require(partners[partner].profitShare == 0, "Partner exists");
            partners[partner] = Partner({
                profitShare: profitShare,
                capitalContribution: 0,
                isManaging: isManaging
            });
            totalPartners++;
            emit PartnerAdded(partner, profitShare);
        }
        
        function contributeCapital() external payable {
            require(partners[msg.sender].profitShare > 0, "Not a partner");
            partners[msg.sender].capitalContribution += msg.value;
            emit CapitalContributed(msg.sender, msg.value);
        }
    `,
    [EntityType.LLP]: `
        function addMember(address member, bool isDesignated) external onlyRole(ADMIN_ROLE) {
            require(members[member].contribution == 0, "Member exists");
            members[member] = LLPMember({
                liability: 0,
                contribution: 0,
                isDesignatedPartner: isDesignated
            });
            emit MemberAdded(member, isDesignated);
        }
        
        function updateLiability(address member, uint256 newLiability) external onlyRole(ADMIN_ROLE) {
            require(members[member].contribution > 0, "Not a member");
            members[member].liability = newLiability;
            totalLiability = totalLiability + newLiability - members[member].liability;
            emit LiabilityUpdated(member, newLiability);
        }
    `
  };
  return functions[entityType];
}

function getTransactionFunctions(transactionType: TransactionType): string {
  const functions: Record<TransactionType, string> = {
    [TransactionType.B2B]: `
        function verifyBusiness(address business, uint256 creditLimit) external onlyRole(ADMIN_ROLE) {
            verifiedBusinesses[business] = BusinessVerification({
                isVerified: true,
                creditLimit: creditLimit,
                tradingVolume: 0
            });
            emit BusinessVerified(business);
        }
        
        function bulkTransfer(address[] calldata recipients, uint256[] calldata amounts) 
            external 
            whenNotPaused 
            nonReentrant 
        {
            require(recipients.length == amounts.length, "Length mismatch");
            require(verifiedBusinesses[msg.sender].isVerified, "Not verified");
            
            uint256 totalAmount = 0;
            for(uint256 i = 0; i < amounts.length; i++) {
                totalAmount += amounts[i];
            }
            
            require(totalAmount >= minBusinessTransaction, "Below min transaction");
            require(totalAmount <= verifiedBusinesses[msg.sender].creditLimit, "Exceeds credit limit");
            
            for(uint256 i = 0; i < recipients.length; i++) {
                _transfer(msg.sender, recipients[i], amounts[i]);
            }
            
            verifiedBusinesses[msg.sender].tradingVolume += totalAmount;
            emit BulkTransferExecuted(recipients, amounts);
        }
    `,
    [TransactionType.B2C]: `
        function requestRefund(uint256 purchaseId) external whenNotPaused {
            ConsumerProtection storage protection = consumerProtections[msg.sender];
            require(protection.purchaseHistory[purchaseId], "No purchase found");
            require(block.timestamp <= protection.refundWindow, "Refund window expired");
            require(!protection.hasDispute, "Existing dispute");
            
            protection.hasDispute = true;
            emit ConsumerRefundRequested(msg.sender, purchaseId);
        }
        
        function resolveDispute(address consumer, uint256 purchaseId, bool infavorOfConsumer) 
            external 
            onlyRole(ADMIN_ROLE) 
        {
            ConsumerProtection storage protection = consumerProtections[consumer];
            require(protection.hasDispute, "No active dispute");
            
            protection.hasDispute = false;
            emit DisputeResolved(consumer, infavorOfConsumer);
        }
    `,
    [TransactionType.P2P]: `
        function updateTrustScore(address peer, uint256 newScore) external onlyRole(ADMIN_ROLE) {
            require(newScore <= 100, "Invalid score");
            peerProfiles[peer].trustScore = newScore;
            emit TrustScoreUpdated(peer, newScore);
        }
        
        function p2pTransfer(address to, uint256 amount) 
            external 
            whenNotPaused 
            nonReentrant 
        {
            require(peerProfiles[msg.sender].isVerified, "Sender not verified");
            require(amount <= p2pTransactionLimit, "Exceeds P2P limit");
            
            _transfer(msg.sender, to, amount);
            
            peerProfiles[msg.sender].transactionCount++;
            emit P2PTransferCompleted(msg.sender, to, amount);
        }
    `
  };
  return functions[transactionType];
}

// Add gas analysis function
async function analyzeGasUsage(contractCode: string): Promise<GasAnalysis[]> {
  try {
    // Extract function definitions
    const functionRegex = /function\s+(\w+)\s*\([^)]*\)/g;
    const functions = [...contractCode.matchAll(functionRegex)].map(match => match[1]);
    
    const analysis: GasAnalysis[] = [];
    
    for (const func of functions) {
      const recommendations: string[] = [];
      
      // Check for gas optimization patterns
      if (contractCode.includes(`for (uint `)) {
        recommendations.push('Consider using unchecked blocks for loop counters to save gas');
      }
      
      if (contractCode.includes(`require(`)) {
        recommendations.push('Use custom errors instead of require statements to save gas');
      }
      
      if (contractCode.includes(`string memory`)) {
        recommendations.push('Consider using bytes instead of string to save gas');
      }
      
      // Estimate gas usage (placeholder - would need actual estimation logic)
      const estimatedGas = 50000; // Example value
      
      analysis.push({
        functionName: func,
        estimatedGas,
        recommendations
      });
    }
    
    return analysis;
  } catch (error) {
    console.error('Gas analysis error:', error);
    throw error;
  }
}

// Add security scanning function
async function performSecurityScan(contractCode: string): Promise<SecurityScan[]> {
  try {
    const vulnerabilities: SecurityScan[] = [];
    
    // Check for common vulnerabilities
    if (contractCode.includes('tx.origin')) {
      vulnerabilities.push({
        severity: 'HIGH',
        description: 'Usage of tx.origin for authorization',
        location: 'Contract',
        recommendation: 'Use msg.sender instead of tx.origin'
      });
    }
    
    if (contractCode.includes('selfdestruct')) {
      vulnerabilities.push({
        severity: 'HIGH',
        description: 'Presence of selfdestruct function',
        location: 'Contract',
        recommendation: 'Remove selfdestruct or implement strict access controls'
      });
    }
    
    if (!contractCode.includes('nonReentrant')) {
      vulnerabilities.push({
        severity: 'MEDIUM',
        description: 'Missing reentrancy protection',
        location: 'Contract',
        recommendation: 'Add nonReentrant modifier to external functions'
      });
    }
    
    // Add more security checks...
    
    return vulnerabilities;
  } catch (error) {
    console.error('Security scan error:', error);
    throw error;
  }
}

// Helper function to get Alchemy URL
function getAlchemyUrl(network: string): string {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is not set');
  }
  
  const networkUrls: Record<string, string> = {
    'mainnet': `https://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    'sepolia': `https://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
    'holesky': `https://eth-holesky.g.alchemy.com/v2/${apiKey}`
  };
  
  const url = networkUrls[network];
  if (!url) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  return url;
}

// WebSocket connection handling with error handling
io.on('connection', (socket: Socket) => {
  console.log('Client connected:', socket.id);
  
  // Handle connection errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', { message: 'Internal socket error', details: error.message });
  });
  
  socket.on('disconnect', (reason) => {
    console.log('Client disconnected:', socket.id, 'Reason:', reason);
  });
  
  socket.on('subscribe-events', async (data: { contractAddress: string, network: string }) => {
    try {
      console.log('Subscribe events request:', data);
      const { contractAddress, network } = data;
      const provider = wsProviders[network];
      
      if (!provider) {
        throw new Error(`WebSocket provider not available for network: ${network}`);
      }
      
      // Join room for this contract
      const room = `contract-${contractAddress}`;
      socket.join(room);
      
      // Listen for all events from the contract
      provider.on('block', async (blockNumber: number) => {
        try {
          const block = await provider.getBlock(blockNumber);
          const logs = await provider.getLogs({
            address: contractAddress,
            fromBlock: blockNumber,
            toBlock: blockNumber
          });
          
          const events = await Promise.all(logs.map(async (log) => ({
            blockNumber: log.blockNumber,
            transactionHash: log.transactionHash || '',
            eventType: log.topics[0],
            data: log.data,
            timestamp: block ? new Date(Number(block.timestamp) * 1000).toISOString() : new Date().toISOString()
          })));
          
          if (events.length > 0) {
            io.to(room).emit('new-events', events);
          }
        } catch (error) {
          console.error('Error processing block events:', error);
          socket.emit('event-error', { 
            error: 'Failed to process block events',
            details: error instanceof Error ? error.message : 'Unknown error'
          });
        }
      });

      socket.emit('subscription-success', {
        message: `Successfully subscribed to events for contract ${contractAddress} on ${network}`,
        room
      });
    } catch (error) {
      console.error('Event subscription error:', error);
      socket.emit('subscription-error', { 
        error: error instanceof Error ? error.message : 'Failed to subscribe to events',
        details: error
      });
    }
  });
});

// Helper function to get WebSocket URL
function getWebSocketUrl(network: string): string {
  const apiKey = process.env.ALCHEMY_API_KEY;
  if (!apiKey) {
    throw new Error('ALCHEMY_API_KEY environment variable is not set');
  }
  
  const networkUrls: Record<string, string> = {
    'mainnet': `wss://eth-mainnet.g.alchemy.com/v2/${apiKey}`,
    'sepolia': `wss://eth-sepolia.g.alchemy.com/v2/${apiKey}`,
    'holesky': `wss://eth-holesky.g.alchemy.com/v2/${apiKey}`
  };
  
  const url = networkUrls[network];
  if (!url) {
    throw new Error(`Unsupported network: ${network}`);
  }
  
  return url;
}

// Add real contract deployment endpoint
app.post('/api/deploy', async (req: Request, res: Response) => {
  try {
    const { contractCode, network, constructorArgs } = req.body;
    
    // Get provider and signer
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(network));
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY environment variable is not set');
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Compile and deploy contract
    const factory = new ethers.ContractFactory(
      [], // ABI will be generated from compilation
      contractCode,
      wallet
    );
    
    const contract = await factory.deploy(...constructorArgs);
    await contract.waitForDeployment();
    
    const deployedAddress = await contract.getAddress();
    
    res.json({
      success: true,
      data: {
        address: deployedAddress,
        network,
        transactionHash: contract.deploymentTransaction()?.hash,
        blockNumber: await provider.getBlockNumber()
      }
    });
  } catch (error) {
    console.error('Contract deployment error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to deploy contract'
    });
  }
});

// Add contract verification endpoint
app.post('/api/verify', async (req: Request, res: Response) => {
  try {
    const { address, network, contractCode } = req.body;
    
    // Get Etherscan API key
    const etherscanApiKey = process.env.ETHERSCAN_API_KEY;
    if (!etherscanApiKey) {
      throw new Error('ETHERSCAN_API_KEY environment variable is not set');
    }
    
    // Submit verification request to Etherscan
    const response = await axios.post(
      `https://api${network !== 'mainnet' ? `-${network}` : ''}.etherscan.io/api`,
      {
        apikey: etherscanApiKey,
        module: 'contract',
        action: 'verifysourcecode',
        sourceCode: contractCode,
        contractaddress: address,
        codeformat: 'solidity-single-file',
        contractname: extractContractName(contractCode),
        compilerversion: 'v0.8.20+commit.a1b79de6', // Use actual compiler version
        optimizationUsed: 1,
        runs: 200
      }
    );
    
    if (response.data.status !== '1') {
      throw new Error(response.data.result);
    }
    
    res.json({
      success: true,
      data: {
        guid: response.data.result,
        message: 'Contract verification submitted successfully'
      }
    });
  } catch (error) {
    console.error('Contract verification error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify contract'
    });
  }
});

// Add contract interaction endpoint
app.post('/api/interact', async (req: Request, res: Response) => {
  try {
    const { address, network, method, args } = req.body;
    
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(network));
    const privateKey = process.env.DEPLOYER_PRIVATE_KEY;
    if (!privateKey) {
      throw new Error('DEPLOYER_PRIVATE_KEY environment variable is not set');
    }
    const wallet = new ethers.Wallet(privateKey, provider);
    
    // Create contract instance
    const contract = new ethers.Contract(address, [], wallet);
    
    // Execute transaction
    const tx = await contract[method](...args);
    const receipt = await tx.wait();
    
    res.json({
      success: true,
      data: {
        transactionHash: receipt.hash,
        blockNumber: receipt.blockNumber,
        events: receipt.logs.map((log: Log) => ({
          event: log.topics[0],
          data: log.data,
          topics: log.topics.slice(1)
        }))
      }
    });
  } catch (error) {
    console.error('Contract interaction error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to interact with contract'
    });
  }
});

// Helper function to extract contract name
function extractContractName(contractCode: string): string {
  const match = contractCode.match(/contract\s+(\w+)/);
  return match ? match[1] : 'Contract';
}

// Contract generation endpoint
// Contract generation endpoint
app.post('/api/generate', async (req: Request, res: Response) => {
  const startTime = Date.now();
  try {
    console.log('Received request:', JSON.stringify(req.body, null, 2));
    
    const { entityType, transactionType, contractType, customizations } = req.body as ContractRequest;

    // Check cache first
    const cacheKey = generateCacheKey(entityType, transactionType, contractType);
    const cachedContract = contractCache.get(cacheKey);

    if (cachedContract && (Date.now() - cachedContract.timestamp) < CACHE_DURATION) {
      console.log('Cache hit for:', cacheKey);
      return res.json({
        success: true,
        data: {
          analysis: cachedContract.analysis,
          code: cachedContract.code,
          security: cachedContract.security,
          gasAnalysis: cachedContract.gasAnalysis
        },
        processingTime: Date.now() - startTime,
        fromCache: true
      });
    }

    // Validate request parameters
    console.log('Validating request parameters:', {
      entityType,
      validEntityTypes: Object.values(EntityType),
      isValidEntity: Object.values(EntityType).includes(entityType),
      transactionType,
      validTransactionTypes: Object.values(TransactionType),
      isValidTransaction: Object.values(TransactionType).includes(transactionType),
      contractType,
      validContractTypes: Object.values(ContractType),
      isValidContract: Object.values(ContractType).includes(contractType)
    });
    
    if (!Object.values(EntityType).includes(entityType) ||
        !Object.values(TransactionType).includes(transactionType) ||
        !Object.values(ContractType).includes(contractType)) {
      console.error('Invalid request parameters:', { entityType, transactionType, contractType });
      return res.status(400).json({
        success: false,
        error: 'Invalid entity type, transaction type, or contract type',
        details: {
          validEntityTypes: Object.values(EntityType),
          validTransactionTypes: Object.values(TransactionType),
          validContractTypes: Object.values(ContractType),
          received: {
            entityType,
            transactionType,
            contractType
          }
        }
      });
    }

    // Generate contract with each persona in parallel
    console.log('Starting contract generation pipeline...');
    
    try {
      const [analysis, code, securityAnalysis] = await Promise.all([
        // Analysis phase
        (async () => {
    console.log('Starting analysis phase...');
          const analysisPrompt = `Analyze the requirements for a ${contractType} smart contract for a ${entityType} doing ${transactionType} transactions. Focus on key requirements and constraints only.`;
          return await processWithPersona(analysisPrompt, 'nanjunda', contractType, entityType, transactionType);
        })(),

        // Code generation phase
        (async () => {
    console.log('Starting code generation phase...');
          const template = getContractTemplate(contractType, entityType, transactionType, customizations);
          const codePrompt = `Generate a complete, production-ready Solidity smart contract for ${contractType} (${entityType}, ${transactionType}). 
IMPORTANT: You must provide the COMPLETE code implementation. DO NOT use ellipsis (...) or comments like "rest remains the same". Every function, event, and feature must be fully implemented.

Requirements:
1. SPDX License and pragma statement
2. All necessary imports from OpenZeppelin and Chainlink
3. Complete contract implementation including:
   - All state variables and their visibility
   - All events with proper indexing
   - All modifiers with full implementation
   - Constructor with all necessary initialization
   - All public and external functions fully implemented
   - All internal and private helper functions
4. Proper error handling with custom errors
5. Full NatSpec documentation for all functions
6. Gas optimizations:
   - Use unchecked blocks for counters
   - Use custom errors instead of require statements
   - Use immutable for constants
   - Optimize storage layout
7. Security features:
   - Access control for all sensitive functions
   - Reentrancy protection
   - Integer overflow protection
   - Proper event emission
8. Features specific to:
   - Entity Type: ${entityType}
   - Transaction Type: ${transactionType}
   - Contract Type: ${contractType}

Base the implementation on this template but provide COMPLETE implementation:
${template}

Remember: DO NOT use any placeholders or ellipsis (...). Every part of the code must be completely implemented.`;
          
          const generatedCode = await processWithPersona(codePrompt, 'achyutha', contractType, entityType, transactionType);
          
          // Validate generated code
          if (!generatedCode.includes('SPDX-License-Identifier') || 
              !generatedCode.includes('pragma solidity') ||
              !generatedCode.includes('contract') ||
              generatedCode.includes('...') ||
              generatedCode.includes('rest of') ||
              generatedCode.includes('remains the same')) {
            throw new Error('Generated code is incomplete or invalid');
          }
          
          return generatedCode;
        })(),

        // Security analysis phase
        (async () => {
          console.log('Starting security analysis phase...');
          const securityPrompt = `Analyze critical security aspects for ${contractType} (${entityType}, ${transactionType}). List all potential vulnerabilities and provide detailed recommendations.`;
          return await processWithPersona(securityPrompt, 'sandeep', contractType, entityType, transactionType);
        })()
      ]);

      // Store in cache
      const now = new Date();
      const template = getContractTemplate(contractType, entityType, transactionType, customizations);
      const cacheEntry: CacheEntry = {
        code,
        timestamp: Date.now(),
        analysis,
        security: {
          vulnerabilities: extractVulnerabilities(securityAnalysis),
          recommendations: extractRecommendations(securityAnalysis)
        },
        gasAnalysis: await analyzeGasUsage(code),
        fragments: {
          base: template,
          features: [],
          customizations: customizations || {}
        },
        metadata: {
          compiler: process.env.SOLIDITY_VERSION || '0.8.20',
          framework: 'OpenZeppelin 5.0.0',
          dependencies: {
            '@openzeppelin/contracts-upgradeable': '^5.0.0',
            '@openzeppelin/contracts': '^5.0.0'
          }
        },
        validation: {
          lastChecked: now,
          status: 'valid',
          issues: []
        }
      };
      contractCache.set(cacheKey, cacheEntry);

      const response = {
        success: true,
        data: {
      analysis,
      code,
      security: {
            vulnerabilities: extractVulnerabilities(securityAnalysis),
            recommendations: extractRecommendations(securityAnalysis)
          },
          gasAnalysis: await analyzeGasUsage(code)
        },
        processingTime: Date.now() - startTime
      };

      console.log('Sending response:', JSON.stringify(response, null, 2));
      res.json(response);
    } catch (error) {
      console.error('Error in contract generation pipeline:', error);
      throw error;
    }
  } catch (error) {
    const endTime = Date.now();
    console.error('Contract generation error:', error);
    
    let errorMessage = 'An unknown error occurred';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('OPENROUTER_API_KEY')) {
        statusCode = 401;
      } else if (error.message.includes('rate limit')) {
        statusCode = 429;
      }
    }
    
    res.status(statusCode).json({
      success: false,
      error: errorMessage,
      processingTime: endTime - startTime
    });
  }
});

function extractVulnerabilities(securityAnalysis: string): string[] {
  const vulnerabilities: string[] = [];
  const lines = securityAnalysis.split('\n');
  let inVulnerabilitiesSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('vulnerabilities:')) {
      inVulnerabilitiesSection = true;
      continue;
    }
    if (inVulnerabilitiesSection && line.trim() && !line.toLowerCase().includes('recommendations:')) {
      vulnerabilities.push(line.trim());
    }
    if (inVulnerabilitiesSection && line.toLowerCase().includes('recommendations:')) {
      break;
    }
  }

  return vulnerabilities;
}

function extractRecommendations(securityAnalysis: string): string[] {
  const recommendations: string[] = [];
  const lines = securityAnalysis.split('\n');
  let inRecommendationsSection = false;

  for (const line of lines) {
    if (line.toLowerCase().includes('recommendations:')) {
      inRecommendationsSection = true;
      continue;
    }
    if (inRecommendationsSection && line.trim()) {
      recommendations.push(line.trim());
    }
  }

  return recommendations;
}

// Test endpoint for OpenRouter API key
app.get('/api/test-openrouter', async (req: Request, res: Response) => {
  try {
    const response = await axios.get('https://openrouter.ai/api/v1/auth/key', {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      }
    });
    
    res.json({
      success: true,
      data: response.data
    });
  } catch (error) {
    console.error('OpenRouter API key test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify OpenRouter API key'
    });
  }
});

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'healthy',
    providers: {
      sepolia: !!providers.sepolia,
      mainnet: !!providers.mainnet,
      holesky: !!providers.holesky
    },
    wsProviders: {
      sepolia: !!wsProviders.sepolia,
      mainnet: !!wsProviders.mainnet,
      holesky: !!wsProviders.holesky
    }
  });
});

// Test endpoints for Oracle and Analytics
app.get('/api/test/oracle/:network', async (req: Request, res: Response) => {
  try {
    const { network } = req.params;
    const alchemyUrl = getAlchemyUrl(network);
    const provider = new ethers.JsonRpcProvider(alchemyUrl);
    
    // Test price feed
    const priceFeedAddress = {
      'sepolia': '0x694AA1769357215DE4FAC081bf1f309aDC325306', // ETH/USD
      'mainnet': '0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419', // ETH/USD
      'holesky': '0x6D0F8D488B669aa9BA2D0f0b7B75a88bf5051CD3'  // ETH/USD
    }[network];
    
    if (!priceFeedAddress) {
      throw new Error('Unsupported network for price feed testing');
    }

    const aggregator = new ethers.Contract(
      priceFeedAddress,
      ['function latestRoundData() external view returns (uint80, int256, uint256, uint256, uint80)'],
      provider
    );

    const [roundId, price, startedAt, timestamp, answeredInRound] = await aggregator.latestRoundData();

    res.json({
      success: true,
      data: {
        network,
        priceFeed: {
          address: priceFeedAddress,
          roundId: roundId.toString(),
          price: price.toString(),
          timestamp: new Date(Number(timestamp) * 1000).toISOString()
        }
      }
    });
  } catch (error) {
    console.error('Oracle test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to test Oracle integration'
    });
  }
});

app.get('/api/test/analytics/:contractAddress', async (req: Request, res: Response) => {
  try {
    const { contractAddress } = req.params;
    const { network = 'sepolia' } = req.query;
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(network as string));
    
    // Basic contract interface for analytics
    const analyticsABI = [
      'function getAnalytics() view returns (uint256 totalTx, uint256 totalVol, uint256 lastActivity, uint256 todayVol)',
      'function getUserAnalytics(address user) view returns (uint256 userVol, uint256[] memory txIndices)'
    ];
    
    const contract = new ethers.Contract(contractAddress, analyticsABI, provider);
    
    const [totalTx, totalVol, lastActivity, todayVol] = await contract.getAnalytics();
    
    res.json({
      success: true,
      data: {
        analytics: {
          totalTransactions: totalTx.toString(),
          totalVolume: totalVol.toString(),
          lastActivityTime: new Date(Number(lastActivity) * 1000).toISOString(),
          todayVolume: todayVol.toString()
        }
      }
    });
  } catch (error) {
    console.error('Analytics test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to verify analytics'
    });
  }
});

app.post('/api/test/gas-estimation', async (req: Request, res: Response) => {
  try {
    const { contractCode, network = 'sepolia' } = req.body;
    const currentNetwork = network;
    
    // Perform detailed gas analysis
    const gasAnalysis = await analyzeGasUsage(contractCode);
    const securityScan = await performSecurityScan(contractCode);
    
    // Compare with actual deployment estimation
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(currentNetwork));
    const factory = new ethers.ContractFactory(
      [], // ABI will be generated from compilation
      contractCode,
      provider
    );
    
    const deployTx = await factory.getDeployTransaction();
    const gasEstimate = await provider.estimateGas(deployTx);
    const feeData = await provider.getFeeData();
    
    // Get current network stats
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    // Calculate costs using BigInt
    const maxFeePerGas = feeData.maxFeePerGas || BigInt(0);
    const gasCost = gasEstimate * maxFeePerGas;
    const estimatedTimeToMine = block ? 
      new Date(Number(block.timestamp) * 1000 + 12000).toISOString() : 
      'unknown';
    
    res.json({
      success: true,
      data: {
        network: currentNetwork,
        gasEstimate: gasEstimate.toString(),
        gasCost: ethers.formatEther(gasCost),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedTimeToMine,
        currentBlockNumber: blockNumber,
        networkConditions: {
          congestion: 'low', // This could be calculated based on gas prices
          recommendedAction: 'proceed'
        }
      }
    });
  } catch (error) {
    console.error('Gas estimation test error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to estimate gas'
    });
  }
});

// Add contract validation endpoint
app.post('/api/test/validate-contract', async (req: Request, res: Response) => {
  try {
    const { contractCode, network = 'sepolia' } = req.body;
    
    // Validate contract compilation
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(network));
    
    // Perform static analysis
    const staticAnalysis = {
      hasReentrancyGuard: contractCode.includes('ReentrancyGuard'),
      hasAccessControl: contractCode.includes('AccessControl'),
      hasPausable: contractCode.includes('Pausable'),
      hasEvents: (contractCode.match(/event\s+\w+/g) || []).length,
      functionCount: (contractCode.match(/function\s+\w+/g) || []).length
    };
    
    // Check for required imports
    const imports = {
      openzeppelin: contractCode.includes('@openzeppelin'),
      chainlink: contractCode.includes('@chainlink'),
      customImports: (contractCode.match(/import\s+.*?;/g) || []).length
    };
    
    // Validate constructor parameters
    const constructorMatch = contractCode.match(/constructor\s*\((.*?)\)/s);
    const constructorParams = constructorMatch ? 
      constructorMatch[1].split(',').map((param: string) => param.trim()) : 
      [];
    
    res.json({
      success: true,
      data: {
        staticAnalysis,
        imports,
        constructorParams,
        recommendations: [
          !staticAnalysis.hasReentrancyGuard && 'Consider adding ReentrancyGuard for external functions',
          !staticAnalysis.hasAccessControl && 'Consider implementing AccessControl for admin functions',
          !staticAnalysis.hasPausable && 'Consider making the contract pausable for emergency situations',
          staticAnalysis.hasEvents < 3 && 'Add more events for better contract monitoring',
        ].filter(Boolean)
      }
    });
  } catch (error) {
    console.error('Contract validation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to validate contract'
    });
  }
});

// Add deployment simulation endpoint
app.post('/api/test/simulate-deployment', async (req: Request, res: Response) => {
  try {
    const { contractCode, network = 'sepolia', constructorArgs = [] } = req.body;
    const currentNetwork = network;  // Create a local variable to use in response
    
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(currentNetwork));
    
    // Estimate deployment costs
    const factory = new ethers.ContractFactory(
      [], // ABI will be generated from compilation
      contractCode,
      provider
    );
    
    const deployTx = await factory.getDeployTransaction(...constructorArgs);
    const gasEstimate = await provider.estimateGas(deployTx);
    const feeData = await provider.getFeeData();
    
    // Get current network stats
    const blockNumber = await provider.getBlockNumber();
    const block = await provider.getBlock(blockNumber);
    
    // Calculate costs using BigInt
    const maxFeePerGas = feeData.maxFeePerGas || BigInt(0);
    const gasCost = gasEstimate * maxFeePerGas;
    const estimatedTimeToMine = block ? 
      new Date(Number(block.timestamp) * 1000 + 12000).toISOString() : 
      'unknown';
    
    res.json({
      success: true,
      data: {
        network: currentNetwork,
        gasEstimate: gasEstimate.toString(),
        gasCost: ethers.formatEther(gasCost),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        estimatedTimeToMine,
        currentBlockNumber: blockNumber,
        networkConditions: {
          congestion: 'low', // This could be calculated based on gas prices
          recommendedAction: 'proceed'
        }
      }
    });
  } catch (error) {
    console.error('Deployment simulation error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to simulate deployment'
    });
  }
});

// Add contract event monitoring endpoint
app.get('/api/test/monitor-events/:contractAddress', async (req: Request, res: Response) => {
  try {
    const { contractAddress } = req.params;
    const { network = 'sepolia', fromBlock: fromBlockParam = -1000 } = req.query;
    
    const provider = new ethers.JsonRpcProvider(getAlchemyUrl(network as string));
    
    // Convert fromBlock to number
    const fromBlock = typeof fromBlockParam === 'string' ? 
      parseInt(fromBlockParam) : 
      Number(fromBlockParam);
    
    // Get contract events
    const events = await provider.getLogs({
      address: contractAddress,
      fromBlock
    });
    
    // Parse events
    const parsedEvents = events.map(event => ({
      blockNumber: event.blockNumber,
      transactionHash: event.transactionHash,
      eventType: event.topics[0],
      data: event.data,
      timestamp: new Date().toISOString() // This should be fetched from block timestamp
    }));
    
    res.json({
      success: true,
      data: {
        contractAddress,
        network,
        eventCount: events.length,
        events: parsedEvents,
        monitoring: {
          status: 'active',
          fromBlock,
          latestBlock: await provider.getBlockNumber()
        }
      }
    });
  } catch (error) {
    console.error('Event monitoring error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to monitor events'
    });
  }
});

// Add modular contract fragments for reuse
const CONTRACT_FRAGMENTS = {
  access: {
    roles: `
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant OPERATOR_ROLE = keccak256("OPERATOR_ROLE");
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");`,
    modifiers: `
    modifier onlyRole(bytes32 role) {
        require(hasRole(role, msg.sender), "AccessControl: account is missing role");
        _;
    }
    modifier whenNotPaused() {
        require(!paused(), "Contract is paused");
        _;
    }`
  },
  security: {
    reentrancy: `
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;
    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }`,
    pausable: `
    event Paused(address account);
    event Unpaused(address account);
    bool private _paused;
    modifier whenNotPaused() {
        require(!_paused, "Pausable: paused");
        _;
    }
    modifier whenPaused() {
        require(_paused, "Pausable: not paused");
        _;
    }`
  },
  events: {
    common: `
    event RoleGranted(bytes32 indexed role, address indexed account, address indexed sender);
    event RoleRevoked(bytes32 indexed role, address indexed account, address indexed sender);
    event ContractUpgraded(address indexed implementation);
    event ConfigUpdated(string indexed key, bytes value);`
  }
};

// Add entity-specific templates
const ENTITY_TEMPLATES: Record<string, Record<string, string>> = {
  'PRIVATE LIMITED COMPANY': {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";

contract PrivateLimitedCompanyBase is 
    Initializable,
    AccessControlUpgradeable,
    PausableUpgradeable,
    ReentrancyGuardUpgradeable
{
    ${CONTRACT_FRAGMENTS.access.roles}
    ${CONTRACT_FRAGMENTS.security.reentrancy}
    ${CONTRACT_FRAGMENTS.events.common}

    struct CompanyConfig {
        string name;
        string registrationNumber;
        address[] directors;
        uint256 shareCapital;
    }
    CompanyConfig private _config;

    function initialize(
        string memory name_,
        string memory regNumber_,
        address[] memory directors_,
        uint256 shareCapital_
    ) public initializer {
        __AccessControl_init();
        __Pausable_init();
        __ReentrancyGuard_init();

        _config.name = name_;
        _config.registrationNumber = regNumber_;
        _config.directors = directors_;
        _config.shareCapital = shareCapital_;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        for (uint i = 0; i < directors_.length; i++) {
            _grantRole(ADMIN_ROLE, directors_[i]);
        }
    }
}`,
    B2C: `
    struct CustomerConfig {
        uint256 purchaseLimit;
        uint256 cooldownPeriod;
        bool requiresKYC;
    }
    mapping(address => CustomerConfig) public customerConfigs;
    mapping(address => bool) public kycApproved;
    
    event CustomerConfigured(address indexed customer, uint256 limit, uint256 cooldown);
    event KYCStatusUpdated(address indexed customer, bool status);`,
    B2B: `
    struct BusinessPartner {
        bool isVerified;
        uint256 creditLimit;
        uint256 settlementPeriod;
        string partnershipType;
    }
    mapping(address => BusinessPartner) public businessPartners;
    
    event PartnerVerified(address indexed partner, string partnershipType);
    event CreditLimitUpdated(address indexed partner, uint256 newLimit);`
  },
  'LIMITED LIABILITY PARTNERSHIP': {
    base: `// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/MulticallUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract LLPBase is 
    Initializable,
    MulticallUpgradeable,
    AccessControlUpgradeable
{
    struct Partner {
        address account;
        uint256 capitalContribution;
        uint256 profitShare;
        bool isDesignatedPartner;
    }
    
    mapping(address => Partner) public partners;
    uint256 public totalCapital;
    
    event PartnerAdded(address indexed account, uint256 capital, uint256 share);
    event CapitalContributed(address indexed partner, uint256 amount);
    event ProfitDistributed(uint256 amount);
}`,
    B2C: `
    struct CustomerConfig {
        uint256 purchaseLimit;
        uint256 cooldownPeriod;
        bool requiresKYC;
    }
    mapping(address => CustomerConfig) public customerConfigs;
    mapping(address => bool) public kycApproved;
    
    event CustomerConfigured(address indexed customer, uint256 limit, uint256 cooldown);
    event KYCStatusUpdated(address indexed customer, bool status);`,
    B2B: `
    struct BusinessPartner {
        bool isVerified;
        uint256 creditLimit;
        uint256 settlementPeriod;
        string partnershipType;
    }
    mapping(address => BusinessPartner) public businessPartners;
    
    event PartnerVerified(address indexed partner, string partnershipType);
    event CreditLimitUpdated(address indexed partner, uint256 newLimit);`
  }
};

// Add transaction-specific templates
const TRANSACTION_TEMPLATES: Record<string, string> = {
  'B2C': `
    struct ConsumerTransaction {
        uint256 id;
        address consumer;
        uint256 amount;
        uint256 timestamp;
        TransactionStatus status;
    }
    enum TransactionStatus { Pending, Completed, Refunded, Disputed }
    
    mapping(uint256 => ConsumerTransaction) public transactions;
    mapping(address => uint256[]) public consumerTransactions;`,
  'B2B': `
    struct BusinessTransaction {
        uint256 id;
        address business;
        uint256 amount;
        uint256 dueDate;
        bool isPaid;
        string terms;
    }
    
    mapping(uint256 => BusinessTransaction) public transactions;
    mapping(address => uint256) public creditLines;`
};

// Add contract type specific features
const CONTRACT_FEATURES: Record<string, string> = {
  'White Label': `
    struct BrandConfig {
        string name;
        string symbol;
        address owner;
        string brandGuidelines;
        mapping(address => bool) authorizedResellers;
    }
    
    mapping(uint256 => BrandConfig) public brands;
    mapping(address => uint256[]) public brandsByOwner;`,
  'Equity Tokenization': `
    struct ShareClass {
        string name;
        uint256 totalShares;
        uint256 votingPower;
        bool isFungible;
        mapping(address => uint256) balances;
    }
    
    mapping(uint256 => ShareClass) public shareClasses;
    mapping(address => uint256[]) public shareholderClasses;`
};

// Add template assembly function
function assembleContractTemplate(
  entityType: string,
  transactionType: string,
  contractType: string
): string {
  // Get base template
  const baseTemplate = ENTITY_TEMPLATES[entityType]?.base || '';
  
  // Add transaction features
  const transactionFeatures = TRANSACTION_TEMPLATES[transactionType] || '';
  
  // Add contract type features
  const contractFeatures = CONTRACT_FEATURES[contractType] || '';
  
  // Add common fragments
  const commonFragments = `
    ${CONTRACT_FRAGMENTS.access.roles}
    ${CONTRACT_FRAGMENTS.security.reentrancy}
    ${CONTRACT_FRAGMENTS.events.common}
  `;
  
  // Combine all parts
  return `${baseTemplate}
    
    // Transaction-specific features
    ${transactionFeatures}
    
    // Contract type features
    ${contractFeatures}
    
    // Common features
    ${commonFragments}`;
}

// Add aggressive caching with versioning
interface CacheVersion {
  solidity: string;
  openZeppelin: string;
  timestamp: number;
}

interface EnhancedCacheEntry extends CacheEntry {
  version: CacheVersion;
  fragments: {
    base: string;
    transaction: string;
    features: string[];
    customizations: Record<string, string>;
  };
  stats: {
    gasEstimate: number;
    bytecodeSizeEstimate: number;
    complexityScore: number;
  };
}

// Update cache duration based on contract type
const CACHE_DURATIONS: Record<string, number> = {
  'White Label': 7 * 24 * 60 * 60 * 1000, // 7 days
  'Equity Tokenization': 3 * 24 * 60 * 60 * 1000, // 3 days (more frequent updates)
  'Supply Chain': 5 * 24 * 60 * 60 * 1000, // 5 days
  default: 24 * 60 * 60 * 1000 // 1 day
};

// Helper function to calculate cost based on token usage (keeping this function)
function calculateCost(usage: { prompt_tokens: number; completion_tokens: number }, model: string): number {
  // Pricing from API documentation (keeping and updating this)
  const rates: Record<string, { prompt: number; completion: number }> = {
    // OpenRouter rates (free for specified model)
    'google/gemini-exp-1206:free': { prompt: 0, completion: 0 },

    // AIML rates (estimated, adjust as needed)
    'mistralai/codestral-2501': { prompt: 0.000007, completion: 0.000020 }, // Example rate, adjust

    // Together AI rates (free for specified model)
    'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free': { prompt: 0, completion: 0 },
  };

  const rate = rates[model] || { prompt: 0, completion: 0 };
  return (usage.prompt_tokens * rate.prompt) + (usage.completion_tokens * rate.completion);
}

// Unified implementation of processWithPersona, incorporating Together AI, OpenRouter, and AIML API
async function processWithPersona(
  prompt: string,
  persona: PersonaType,
  contractType: ContractType,
  entityType: EntityType,
  transactionType: TransactionType,
  options?: { useFreeModel?: boolean }
): Promise<string> {
  const config = PERSONA_CONFIGS[persona];
  console.log(`Processing with persona ${persona}`);

  // Model selection: Prioritize Together AI, then OpenRouter, then AIML API
  const togetherModel = 'deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free';
  const openRouterModel = 'google/gemini-exp-1206:free';
  const aimlModel = 'mistralai/codestral-2501';
  const maxTokens = config.maxTokens;

  // Enhance prompt with specific instructions for each persona
  let systemMessage = `You are ${persona}, specializing in smart contract ${config.expertise}. Focus on: ${config.focus.join(', ')}`;

  // Add specific instructions for code generation
  if (persona === 'achyutha') {
    systemMessage += `. IMPORTANT: Generate COMPLETE smart contract code with NO truncation. Include ALL necessary:
  1. SPDX license identifier and pragma statement
  2. Required imports from OpenZeppelin or other libraries
  3. Full contract implementation with ALL functions, modifiers, and events
  4. Detailed NatSpec comments for all functions
  5. Full implementation of all features requested
  6. Security best practices and gas optimizations
  Never end the code with ellipses or placeholders - provide the complete implementation.`;
  }

  const messages = [
    { role: 'system', content: systemMessage },
    { role: 'user', content: prompt },
  ];

  console.log(`Models selected:
  - Together: ${togetherModel}
  - OpenRouter: ${openRouterModel}
  - AIML: ${aimlModel}
`);
  console.log(`Using token limit: ${maxTokens}`);

  // Track start time for performance monitoring
  const startTime = Date.now();

  // Try APIs in sequence with fallbacks
  try {
    if (process.env.TOGETHER_API_KEY) {
      console.log(`Attempting Together API with model: ${togetherModel}`);
      // Use the Together AI chat completions API as provided by the user
      const togetherResponse = await axios.post(
        'https://api.together.xyz/v1/chat/completions',
        {
          model: togetherModel,
          messages: messages,
          max_tokens: maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.TOGETHER_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      const responseText = togetherResponse.data.choices[0].message.content;
      console.log(
        `Together API request completed in ${Date.now() - startTime}ms`
      );

      // Basic response validation (adjust as needed)
      if (!responseText || responseText.length < 50) {
        throw new Error(
          'Together API returned an empty or very short response.'
        );
      }

      return responseText;
    }
  } catch (error) {
    console.error(
      `Together API request failed: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  try {
    if (process.env.OPENROUTER_API_KEY) {
      console.log(`Trying OpenRouter model: ${openRouterModel}`);
      // Use the OpenRouter chat completions API as provided by the user

      const openRouterResponse = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          model: openRouterModel,
          messages: [
            {
              role: 'system',
              content: systemMessage
            },
            {
              "role": "user",
              "content": prompt
            }
          ],
          max_tokens: maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'http://localhost:3000', // Add your site URL here
            'X-Title': 'SCGen', // Add your site name here
          },
        }
      );

      const responseText =
        openRouterResponse.data.choices[0].message.content;
      console.log(
        `OpenRouter request completed in ${Date.now() - startTime}ms`
      );

      if (!responseText || responseText.length < 50) {
        throw new Error(
          'OpenRouter returned an empty or very short response.'
        );
      }

      return responseText;
    }
  } catch (error) {
    console.error(
      `OpenRouter request failed: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  try {
    if (process.env.AIML_API_KEY) {
      console.log(`Trying AIML API with model: ${aimlModel}`);
      // Use the AIML API as provided by the user
      const aimlResponse = await axios.post(
        `${envVars.AIML_API_URL}/chat/completions`,
        {
          model: aimlModel,
          messages: messages,
          max_tokens: maxTokens
        },
        {
          headers: {
            Authorization: `Bearer ${envVars.AIML_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const responseText = aimlResponse.data.choices[0].message.content;
      console.log(
        `AIML API request completed in ${Date.now() - startTime}ms`
      );

      if (!responseText || responseText.length < 50) {
        throw new Error('AIML API returned an empty or very short response.');
      }

      return responseText;
    }
  } catch (error) {
    console.error(
      `AIML API request failed: ${error instanceof Error ? error.message : 'Unknown error'
      }`
    );
  }

  // If all API calls fail, throw an error
  throw new Error('Failed to generate content with any available API');
}

// Removing the /api/test-apis route since we have integrated the API calls
// directly into processWithPersona and are handling fallbacks.
}
