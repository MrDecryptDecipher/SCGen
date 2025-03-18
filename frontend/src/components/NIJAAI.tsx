import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { 
  Box, 
  Button, 
  CircularProgress, 
  Typography, 
  Tooltip, 
  Stepper,
  Step,
  StepLabel,
  Alert,
  AlertTitle,
  Paper,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  LinearProgress,
  Backdrop
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import axios from 'axios';
import { ContractDeployment } from '../services/ContractDeployment';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { atomOneDark } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { Interface, ContractFactory, BytesLike } from 'ethers';
import api, { ApiError } from '../services/api';
import io from 'socket.io-client';

// Determine API URL based on environment variable or default to localhost:3001
const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

// Configure axios defaults with retries
axios.defaults.timeout = 120000; // 2 minutes timeout

// Create axios instance with retry configuration
const axiosInstance = axios.create({
  timeout: 120000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Add response interceptor for retry logic
axiosInstance.interceptors.response.use(undefined, async (err) => {
  const { config } = err;
  if (!config || !config.retry) {
    return Promise.reject(err);
  }
  
  // Don't retry on certain error codes
  if (err.response?.status === 401 || err.response?.status === 402) {
    return Promise.reject(err);
  }
  
  config.retry -= 1;
  
  // Exponential backoff
  const backoffDelay = ((3 - config.retry) * 1000) * 2;
  const delayRetry = new Promise(resolve => setTimeout(resolve, backoffDelay));
  await delayRetry;
  
  return axiosInstance(config);
});

// Add request interceptor to check API key
axiosInstance.interceptors.request.use((config) => {
  if (!process.env.REACT_APP_OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key is not configured');
  }
  return config;
});

const ETHERSCAN_API_KEY = process.env.REACT_APP_ETHERSCAN_API_KEY;

interface NIJAAIProps {
  onGenerateClick: () => void;
  isProcessing: boolean;
  currentPersona: string;
  selectedOptions: {
    entityType: string;
    transactionType: string;
    contractType: string;
  };
  generatedContract: string | null;
  onError: (error: Error) => void;
  setGeneratedContract: (contract: string | null) => void;
}

// Loading states interface
interface LoadingStates {
  generating: boolean;
  analyzing: boolean;
  deploying: boolean;
  verifying: boolean;
}

// Add response types
interface GenerateResponse {
  success: boolean;
  data: {
    analysis: string;
    code: string;
    security: {
      vulnerabilities: string[];
      recommendations: string[];
    };
    gasAnalysis: {
      functionName: string;
      estimatedGas: number;
      recommendations: string[];
    }[];
    vulnerabilityScan: {
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
      location: string;
      recommendation: string;
    }[];
  };
  processingTime: number;
}

interface DeploymentResponse {
  success: boolean;
  data: {
    address: string;
    transactionHash: string;
    network: string;
  };
}

interface ValidationResponse {
  success: boolean;
  compilationResult: {
    abi: any[];
    bytecode: string;
  };
}

// Add type enums
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

export const NIJAAI: React.FC<NIJAAIProps> = ({
  onGenerateClick,
  isProcessing,
  currentPersona,
  selectedOptions,
  generatedContract,
  onError,
  setGeneratedContract
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [selectedNetwork, setSelectedNetwork] = useState('sepolia');
  const [copySuccess, setCopySuccess] = useState(false);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'pending' | 'success' | 'failed';
    message: string;
    contractAddress?: string;
    transactionHash?: string;
  }>({ status: 'pending', message: '' });

  // Add loading states
  const [loadingStates, setLoadingStates] = useState<LoadingStates>({
    generating: false,
    analyzing: false,
    deploying: false,
    verifying: false
  });

  // Add error handling state
  const [apiError, setApiError] = useState<ApiError | null>(null);

  // Add success state
  const [success, setSuccess] = useState<string | null>(null);

  const contractDeployment = useMemo(() => new ContractDeployment(), []);

  // Steps in the deployment process
  const deploymentSteps = [
    'Analyzing Contract',
    'Security Check',
    'Gas Optimization',
    'Deployment',
    'Verification'
  ];

// Initialize WebSocket connection
useEffect(() => {
  // Use a dedicated WebSocket URL environment variable if available
  const wsUrl = process.env.REACT_APP_WS_URL || 'wss://13.126.230.108.nip.io';
  console.log('Attempting to connect to WebSocket at:', wsUrl);
  
  const socket = io(wsUrl, {
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    timeout: 20000,
    path: '/socket.io',
    forceNew: true,
    withCredentials: false,
    autoConnect: true,
    rejectUnauthorized: false,
    extraHeaders: {
      'Access-Control-Allow-Origin': '*'
    }
  });

  socket.on('connect', () => {
    console.log('Connected to WebSocket server');
    setApiError(null);
  });

  socket.on('connect_error', (error: Error) => {
    console.error('WebSocket connection error:', error);
    setApiError({
      message: `WebSocket connection error: ${error.message}. Please check server status.`,
      severity: 'warning',
      details: 'Connection failed'
    });
  });

  socket.on('disconnect', (reason: string) => {
    console.log('Disconnected from WebSocket server:', reason);
    setApiError({
      message: `Disconnected from event monitoring service: ${reason}`,
      severity: 'warning'
    });
  });

  socket.on('error', (error: Error) => {
    console.error('WebSocket error:', error);
    setApiError({
      message: `WebSocket error: ${error.message || 'Unknown error'}`,
      severity: 'error',
      details: error.message
    });
  });

  // Cleanup on unmount
  return () => {
    if (socket.connected) {
      socket.disconnect();
    }
  };
}, []);

  // Effect to handle deployment status updates
  useEffect(() => {
    let statusCheckInterval: NodeJS.Timeout;

    if (deploymentStatus.status === 'pending' && deploymentStatus.transactionHash) {
      statusCheckInterval = setInterval(async () => {
        try {
          const status = await contractDeployment.getDeploymentStatus(deploymentStatus.transactionHash!);
          if (status.status !== 'pending') {
            setDeploymentStatus(prev => ({
              ...prev,
              status: status.status,
              message: status.status === 'success' 
                ? `Contract deployed successfully! Gas used: ${status.gasUsed}` 
                : 'Deployment failed'
            }));
            clearInterval(statusCheckInterval);
          }
        } catch (error) {
          console.error('Error checking deployment status:', error);
        }
      }, 5000);
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [deploymentStatus.transactionHash, deploymentStatus.status, contractDeployment]);

  const handleCopyCode = () => {
    if (generatedContract) {
      navigator.clipboard.writeText(generatedContract);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 3000);
    }
  };

  const getAlchemyUrl = (network: string) => {
    switch (network) {
      case 'mainnet':
        return process.env.REACT_APP_ALCHEMY_MAINNET_URL;
      case 'sepolia':
        return process.env.REACT_APP_ALCHEMY_SEPOLIA_URL;
      case 'holesky':
        return process.env.REACT_APP_ALCHEMY_HOLESKY_URL;
      default:
        return process.env.REACT_APP_ALCHEMY_SEPOLIA_URL;
    }
  };

  // Function to handle API errors
  const handleApiError = (error: ApiError) => {
    setApiError(error);
    onError(new Error(error.message));
  };

  // Function to generate contract
  const handleGenerateContract = async () => {
    try {
      setLoadingStates(prev => ({ ...prev, generating: true }));
      setApiError(null);
      setSuccess(null);
      setGeneratedContract(null);

      console.log('Starting contract generation with Nija AI...');

      // Format the request data according to the backend's expectations
      const requestData = {
        entityType: selectedOptions.entityType,
        transactionType: selectedOptions.transactionType,
        contractType: selectedOptions.contractType,
        options: {
          generateFullCode: true,
          includeComments: true,
          includeTests: true,
          optimizeGas: true,
          useFreeModel: true  // Always use free tier models
        }
      };

      console.log('Request data:', requestData);

      // Show immediate feedback to user
      onGenerateClick();

      // Implement retry logic for potential API failures
      let retries = 2;
      let success = false;
      let response;

      while (retries >= 0 && !success) {
        try {
          console.log(`API attempt ${2-retries + 1}/3`);
          
          // Add a progress notification to improve UX while waiting
          setApiError({
            message: `Generating your contract... attempt ${2-retries + 1}/3`,
            severity: 'info',
            details: 'This may take 1-2 minutes with free tier models'
          });
          
          response = await axios.post(
            `${API_URL}/generate`,
            requestData,
            {
              headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'Access-Control-Allow-Origin': '*'
              },
              timeout: 300000, // 5 minutes timeout for free tier model generation
              maxRedirects: 5,
              validateStatus: (status) => status >= 200 && status < 500,
              withCredentials: false,
              proxy: false
            }
          );
          
          console.log('API response status:', response?.status);
          console.log('Processing time:', response?.data?.processingTime ? `${response.data.processingTime}ms` : 'unknown');
          
          if (response?.status === 200 && response?.data?.success) {
            success = true;
            console.log('API call successful');
            
            // Check if response came from cache
            if (response.data.fromCache) {
              console.log('Retrieved from cache');
            }
          } else if (response?.status === 402) {
            // Free tier limit reached
            console.log('Free tier limit reached, retrying...');
            await new Promise(resolve => setTimeout(resolve, 5000));
          } else if (response?.status === 401) {
            // Authentication error
            console.error('Authentication error with API key');
            throw new Error('API authentication failed. Please check API keys in server configuration.');
          } else if (response?.status === 429) {
            // Rate limit error
            console.error('Rate limit exceeded');
            throw new Error('Rate limit exceeded. Please wait a few minutes and try again.');
          } else {
            throw new Error(response?.data?.error || `HTTP Error ${response?.status}: ${response?.statusText}`);
          }
        } catch (error) {
          console.error(`API attempt failed, retries left: ${retries}`, error);
          
          // Make error message more user-friendly based on error type
          let errorMessage = 'API request failed';
          
          if (axios.isAxiosError(error)) {
            if (error.code === 'ECONNABORTED') {
              errorMessage = 'Request timed out. Contract generation is taking longer than expected.';
            } else if (error.response?.status === 401) {
              errorMessage = 'API authentication failed. Configured API key may be invalid.';
            } else if (error.response?.status === 429) {
              errorMessage = 'Rate limit exceeded. Please wait a few minutes before trying again.';
            }
          }
          
          // Set temporary error message but don't stop retrying yet
          setApiError({
            message: `${errorMessage} (Retry ${2-retries + 1}/3)`,
            severity: 'warning'
          });
          
          retries--;
          if (retries < 0) throw error;
          await new Promise(resolve => setTimeout(resolve, 3000)); // Wait 3 seconds before retrying
        }
      }

      console.log('Contract generation response:', response);

      if (response?.data?.success && response?.data?.data?.code) {
        setSuccess('Smart contract generated successfully with Nija AI!');
        setGeneratedContract(response.data.data.code);

        // Log additional details if available
        if (response.data.data.analysis) {
          console.log('Contract Analysis:', response.data.data.analysis);
        }
        if (response.data.data.security) {
          console.log('Security Vulnerabilities:', response.data.data.security.vulnerabilities);
          console.log('Security Recommendations:', response.data.data.security.recommendations);
        }
        if (response.data.data.gasAnalysis) {
          console.log('Gas Analysis:', response.data.data.gasAnalysis);
        }
        
        console.log('Processing Time:', response.data.processingTime, 'ms');
      } else {
        throw new Error(response?.data?.error || 'Failed to generate contract: Invalid response format');
      }
    } catch (error) {
      console.error('Contract generation error:', error);
      let errorMessage = 'Failed to generate contract';
      
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 400) {
          errorMessage = error.response.data.error || 'Invalid request parameters';
          console.error('Request validation failed:', error.response.data.details);
        } else if (error.response?.status === 500) {
          errorMessage = 'Server error: Contract generation failed. Please try again.';
        } else if (error.code === 'ECONNABORTED') {
          errorMessage = 'Request timed out. The smart contract generation is taking longer than expected. Please try again later.';
        } else if (error.response?.status === 402) {
          errorMessage = 'Free API tier limit reached. The system will automatically try an alternative model.';
        } else if (error.response?.status === 429) {
          errorMessage = 'Rate limit exceeded. Please wait a few minutes and try again.';
        } else if (error.response?.status === 401) {
          errorMessage = 'API authentication failed. Please check API keys in server configuration.';
        } else if (error.response?.data?.error) {
          errorMessage = error.response.data.error;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      setApiError({
        message: errorMessage,
        severity: 'error',
        details: error instanceof Error ? error.message : undefined
      });
      onError(new Error(errorMessage));
    } finally {
      setLoadingStates(prev => ({ ...prev, generating: false }));
    }
  };

  // Function to deploy contract
  const handleDeploy = async () => {
    if (!generatedContract) return;

    try {
      setLoadingStates(prev => ({ ...prev, deploying: true }));
      setDeploymentStep(0);
      setDeploymentStatus({ status: 'pending', message: 'Starting deployment process...' });
      setApiError(null);

      // Step 1: Analyze Contract
      setLoadingStates(prev => ({ ...prev, analyzing: true }));
      setDeploymentStep(0);
      
      const analysis = await api.post<ValidationResponse>('/test/validate-contract', {
        contractCode: generatedContract,
        network: selectedNetwork
      });

      if (!analysis.compilationResult) {
        throw new Error('Contract analysis failed. Please check the contract code.');
      }

      // Step 2: Deploy Contract
      setLoadingStates(prev => ({ ...prev, analyzing: false, deploying: true }));
      setDeploymentStep(3);

      const deploymentResult = await api.post<DeploymentResponse>('/deploy', {
        contractCode: generatedContract,
        network: selectedNetwork,
        constructorArgs: []
      });

      // Step 3: Verify Contract
      if (deploymentResult.success) {
        setLoadingStates(prev => ({ ...prev, deploying: false, verifying: true }));
      setDeploymentStep(4);

        await api.post('/verify', {
          address: deploymentResult.data.address,
          network: selectedNetwork,
          contractCode: generatedContract
        });

        setDeploymentStatus({
          status: 'success',
          message: `Contract deployed and verified at ${deploymentResult.data.address}`,
          contractAddress: deploymentResult.data.address,
          transactionHash: deploymentResult.data.transactionHash
        });
      }
    } catch (error) {
      handleApiError(error as ApiError);
      setDeploymentStatus({
        status: 'failed',
        message: (error as ApiError).message
      });
    } finally {
      setLoadingStates({
        generating: false,
        analyzing: false,
        deploying: false,
        verifying: false
      });
    }
  };

  const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [hasError, setHasError] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
      const handleError = (error: ErrorEvent) => {
        console.error('Error caught by boundary:', error);
        setHasError(true);
        setErrorMessage(error.message);
      };

      window.addEventListener('error', handleError);
      return () => window.removeEventListener('error', handleError);
    }, []);

    if (hasError) {
      return (
        <Alert severity="error" sx={{ mb: 2 }}>
          <AlertTitle>Error</AlertTitle>
          {errorMessage}
          <Button
            onClick={() => window.location.reload()}
            sx={{ mt: 1 }}
            variant="outlined"
            color="error"
          >
            Reload Page
          </Button>
        </Alert>
      );
    }

    return <>{children}</>;
  };

  // Add loading indicator component
  const LoadingIndicator = () => (
    <Backdrop open={Object.values(loadingStates).some(state => state)} sx={{ zIndex: 9999 }}>
      <Box sx={{ textAlign: 'center', color: 'white' }}>
        <CircularProgress color="inherit" />
        <Typography variant="h6" sx={{ mt: 2 }}>
          {loadingStates.generating && 'Generating Contract...'}
          {loadingStates.analyzing && 'Analyzing Contract...'}
          {loadingStates.deploying && 'Deploying Contract...'}
          {loadingStates.verifying && 'Verifying Contract...'}
        </Typography>
        <LinearProgress sx={{ mt: 2, width: '200px' }} />
      </Box>
    </Backdrop>
  );

  // Add this right after the handleGenerateContract function
  const [progress, setProgress] = useState(0);
  const [progressText, setProgressText] = useState('');
  const [stats, setStats] = useState({
    gasEstimation: 0,
    securityScore: 0,
    processingTime: 0
  });

  return (
    <ErrorBoundary>
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
        <LoadingIndicator />
        
        {/* Show API error if exists */}
        {apiError && (
          <Alert 
            severity={apiError.severity} 
            onClose={() => setApiError(null)}
            sx={{ mb: 2 }}
          >
            <AlertTitle>Error</AlertTitle>
            {apiError.message}
            {apiError.details && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Details: {JSON.stringify(apiError.details)}
              </Typography>
            )}
          </Alert>
        )}

        {/* Show success message */}
        {success && (
          <Alert 
            severity="success" 
            onClose={() => setSuccess(null)}
            sx={{ mb: 2 }}
          >
            {success}
          </Alert>
        )}

      <AnimatePresence>
        {selectedOptions.entityType && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Box sx={{
              mb: 3,
              p: 2,
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(10px)'
            }}>
              <Typography variant="subtitle1" color="white">
                Selected: {selectedOptions.entityType} → {selectedOptions.transactionType} → {selectedOptions.contractType}
              </Typography>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <Button
          variant="contained"
            onClick={handleGenerateContract}
            disabled={isProcessing || !selectedOptions.contractType || loadingStates.generating}
          sx={{
            background: 'linear-gradient(45deg, #7c4dff 30%, #f50057 90%)',
            borderRadius: '28px',
            border: 0,
            color: 'white',
            height: 56,
            padding: '0 30px',
            boxShadow: '0 3px 5px 2px rgba(124, 77, 255, .3)',
            textTransform: 'none',
            fontSize: '1.1rem',
            fontWeight: 600,
            position: 'relative',
            overflow: 'hidden',
            '&:disabled': {
              background: 'rgba(255, 255, 255, 0.12)',
              color: 'rgba(255, 255, 255, 0.3)'
            }
          }}
        >
            {loadingStates.generating ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} color="inherit" />
                <Typography>Generating Contract...</Typography>
            </Box>
          ) : (
            'Generate with Nija AI'
          )}
        </Button>
      </motion.div>

      {generatedContract && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper
            sx={{
              mt: 4,
              p: 3,
              background: 'rgba(0, 0, 0, 0.2)',
              backdropFilter: 'blur(10px)',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.1)'
            }}
          >
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="white">
              Generated Contract
            </Typography>
                <IconButton onClick={handleCopyCode} color="primary" sx={{ color: 'white' }}>
                  <ContentCopyIcon />
                </IconButton>
              </Box>
            
            <Box
              sx={{
                maxHeight: '300px',
                overflow: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                p: 2,
                borderRadius: '8px',
                  mb: 3,
                  position: 'relative'
                }}
              >
                <SyntaxHighlighter
                  language="solidity"
                  style={atomOneDark}
                  customStyle={{
                    margin: 0,
                    padding: '16px',
                    borderRadius: '8px',
                    fontSize: '14px',
                    lineHeight: '1.5'
                  }}
                >
                {generatedContract}
                </SyntaxHighlighter>
            </Box>

              <FormControl fullWidth sx={{ mb: 3 }}>
                <InputLabel id="network-select-label" sx={{ color: 'white' }}>Network</InputLabel>
                <Select
                  labelId="network-select-label"
                  value={selectedNetwork}
                  onChange={(e) => setSelectedNetwork(e.target.value)}
                  sx={{ color: 'white', '& .MuiSelect-icon': { color: 'white' } }}
                >
                  <MenuItem value="mainnet">Ethereum Mainnet</MenuItem>
                  <MenuItem value="sepolia">Sepolia Testnet</MenuItem>
                  <MenuItem value="holesky">Holesky Testnet</MenuItem>
                </Select>
              </FormControl>

            <Stepper
              activeStep={deploymentStep}
              sx={{
                mb: 3,
                '& .MuiStepLabel-label': {
                  color: 'white',
                  '&.Mui-active': {
                    color: '#7c4dff'
                  }
                }
              }}
            >
              {deploymentSteps.map((label) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
              ))}
            </Stepper>

            {deploymentStatus.status !== 'pending' && (
              <Alert
                severity={deploymentStatus.status === 'success' ? 'success' : 'error'}
                sx={{ mb: 3 }}
              >
                {deploymentStatus.message}
              </Alert>
            )}

            <Button
              variant="contained"
              onClick={handleDeploy}
              disabled={isDeploying}
              sx={{
                background: 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                borderRadius: '28px',
                color: 'white',
                '&:disabled': {
                  background: 'rgba(255, 255, 255, 0.12)',
                  color: 'rgba(255, 255, 255, 0.3)'
                }
              }}
            >
              {isDeploying ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <CircularProgress size={24} color="inherit" />
                  <Typography>Deploying Contract...</Typography>
                </Box>
              ) : (
                'Deploy Contract'
              )}
            </Button>
          </Paper>
        </motion.div>
      )}

        <Snackbar
          open={copySuccess}
          autoHideDuration={3000}
          onClose={() => setCopySuccess(false)}
          message="Contract code copied to clipboard!"
        />
    </Box>
    </ErrorBoundary>
  );
};