import React, { useState, useCallback, useEffect } from 'react';
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
  Paper
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { ethers } from 'ethers';
import axios from 'axios';
import { ContractDeployment } from '../services/ContractDeployment';

// Load environment variables
const API_URL = process.env.REACT_APP_API_URL || 'http://13.126.230.108:3002';
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
}

export const NIJAAI: React.FC<NIJAAIProps> = ({
  onGenerateClick,
  isProcessing,
  currentPersona,
  selectedOptions,
  generatedContract,
  onError
}) => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deploymentStep, setDeploymentStep] = useState(0);
  const [deploymentStatus, setDeploymentStatus] = useState<{
    status: 'pending' | 'success' | 'failed';
    message: string;
    contractAddress?: string;
    transactionHash?: string;
  }>({ status: 'pending', message: '' });

  const contractDeployment = new ContractDeployment();

  // Steps in the deployment process
  const deploymentSteps = [
    'Analyzing Contract',
    'Security Check',
    'Gas Optimization',
    'Deployment',
    'Verification'
  ];

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
      }, 5000); // Check every 5 seconds
    }

    return () => {
      if (statusCheckInterval) {
        clearInterval(statusCheckInterval);
      }
    };
  }, [deploymentStatus.transactionHash, deploymentStatus.status]);

  const handleDeploy = async () => {
    if (!generatedContract) return;
    
    setIsDeploying(true);
    setDeploymentStep(0);
    setDeploymentStatus({ status: 'pending', message: 'Starting deployment process...' });

    try {
      // Step 1: Analyze Contract
      setDeploymentStep(0);
      const analysis = await contractDeployment.analyzeContract(generatedContract);
      
      // Step 2: Security Check
      setDeploymentStep(1);
      if (analysis.securityScan.score < 70) {
        throw new Error(`Security check failed. Score: ${analysis.securityScan.score}. Please review vulnerabilities.`);
      }

      // Step 3: Gas Optimization
      setDeploymentStep(2);
      const feeData = await contractDeployment.getFeeData();
      const gasAnalysis = analysis.gasAnalysis;

      // Step 4: Deploy Contract
      setDeploymentStep(3);
      const deploymentResult = await contractDeployment.deployContract({
        abi: analysis.compilationResult?.abi!,
        bytecode: analysis.compilationResult?.bytecode!,
        maxFeePerGas: feeData.maxFeePerGas.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas.toString()
      });

      if (!deploymentResult.success || !deploymentResult.contractAddress) {
        throw new Error(deploymentResult.error?.message || 'Deployment failed');
      }

      setDeploymentStatus(prev => ({
        ...prev,
        transactionHash: deploymentResult.transactionHash,
        contractAddress: deploymentResult.contractAddress
      }));

      // Step 5: Verify Contract
      setDeploymentStep(4);
      if (ETHERSCAN_API_KEY) {
        const verificationResult = await contractDeployment.verifyContractOnEtherscan(
          deploymentResult.contractAddress,
          [],
          selectedOptions.contractType,
          generatedContract
        );

        if (!verificationResult.success) {
          console.warn('Contract verification warning:', verificationResult.message);
        }
      }

      setDeploymentStatus(prev => ({
        ...prev,
        status: 'success',
        message: `Contract deployed successfully at ${deploymentResult.contractAddress}`
      }));

    } catch (error) {
      console.error('Deployment error:', error);
      setDeploymentStatus({
        status: 'failed',
        message: error instanceof Error ? error.message : 'Unknown deployment error'
      });
      onError(error instanceof Error ? error : new Error('Unknown deployment error'));
    } finally {
      setIsDeploying(false);
    }
  };

  return (
    <Box sx={{ textAlign: 'center', position: 'relative' }}>
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
          onClick={onGenerateClick}
          disabled={isProcessing || !selectedOptions.contractType}
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
          {isProcessing ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <CircularProgress size={24} color="inherit" />
              <Typography>Processing with NIJA AI...</Typography>
            </Box>
          ) : (
            'Generate with NIJA AI'
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
            <Typography variant="h6" color="white" gutterBottom>
              Generated Contract
            </Typography>
            
            <Box
              sx={{
                maxHeight: '300px',
                overflow: 'auto',
                background: 'rgba(0, 0, 0, 0.3)',
                p: 2,
                borderRadius: '8px',
                mb: 3
              }}
            >
              <pre style={{ color: 'white', margin: 0 }}>
                {generatedContract}
              </pre>
            </Box>

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
    </Box>
  );
};