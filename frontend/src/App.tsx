import React, { useState, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { Box, Container, Typography, Snackbar, Alert } from '@mui/material';
import { motion } from 'framer-motion';
import Dropdowns from './components/Dropdowns';
import { NIJAAI } from './components/NIJAAI';
import { PersonaVisual } from './components/PersonaVisual';
import { Debug } from './components/Debug';
import axios from 'axios';

const personas = [
  {
    name: 'Nanjunda',
    role: 'Request Analyzer',
    avatar: '🦸‍♂️',
    description: 'Analyzing contract requirements and specifications'
  },
  {
    name: 'Achyutha',
    role: 'Code Optimizer',
    avatar: '🧑‍💻',
    description: 'Optimizing smart contract code for efficiency'
  },
  {
    name: 'Sandeep',
    role: 'Security Expert',
    avatar: '🛡️',
    description: 'Ensuring contract security and best practices'
  }
];

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#7c4dff',
    },
    secondary: {
      main: '#f50057',
    },
  },
  typography: {
    fontFamily: '"Poppins", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const AppContainer = motion(Box);

// API configuration
const API_URL = process.env.REACT_APP_API_URL || 'http://13.126.230.108:3001';

function App() {
  const [entityType, setEntityType] = useState('');
  const [transactionType, setTransactionType] = useState('');
  const [contractType, setContractType] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentPersona, setCurrentPersona] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedContract, setGeneratedContract] = useState<string | null>(null);

  const handleError = useCallback((err: Error) => {
    setError(err.message);
  }, []);

  const handleGenerateContract = useCallback(async () => {
    if (!entityType || !transactionType || !contractType) {
      setError('Please select all options before generating the contract');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);
    setGeneratedContract(null);

    try {
      // Process through each persona
      for (const persona of personas) {
        setCurrentPersona(persona.name.toLowerCase());
        await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate processing time
      }

      const response = await axios.post(`${API_URL}/api/generate`, {
        entityType,
        transactionType,
        contractType,
      }, {
        timeout: 120000, // 2 minutes timeout
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (response.data.success) {
        setGeneratedContract(response.data.data.contract);
        setSuccess('Contract generated successfully!');
      } else {
        throw new Error(response.data.error || 'Failed to generate contract');
      }
    } catch (err) {
      console.error('Error generating contract:', err);
      setError(err instanceof Error ? err.message : 'Failed to connect to server');
    } finally {
      setIsProcessing(false);
      setCurrentPersona('');
    }
  }, [entityType, transactionType, contractType]);

  return (
    <ThemeProvider theme={theme}>
      <AppContainer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1 }}
        sx={{
          minHeight: '100vh',
          background: 'linear-gradient(135deg, #1a237e 0%, #9c27b0 100%)',
          padding: '2rem 0',
        }}
      >
        <Container maxWidth="lg">
          <motion.div
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <Typography
              variant="h2"
              align="center"
              sx={{
                color: 'white',
                fontWeight: 700,
                marginBottom: '2rem',
                textShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}
            >
              Smart Contract Generator
            </Typography>
          </motion.div>

          <Dropdowns
            entityType={entityType}
            setEntityType={setEntityType}
            transactionType={transactionType}
            setTransactionType={setTransactionType}
            contractType={contractType}
            setContractType={setContractType}
          />

          <Box sx={{ my: 4 }}>
            <NIJAAI
              onGenerateClick={handleGenerateContract}
              isProcessing={isProcessing}
              currentPersona={currentPersona}
              selectedOptions={{
                entityType,
                transactionType,
                contractType
              }}
              generatedContract={generatedContract}
              onError={handleError}
              setGeneratedContract={setGeneratedContract}
            />
          </Box>

          <Box 
            sx={{ 
              display: 'flex',
              justifyContent: 'space-around',
              flexWrap: 'wrap',
              gap: 3,
              mt: 4 
            }}
          >
            {personas.map((persona) => (
              <PersonaVisual
                key={persona.name}
                avatar={persona.avatar}
                name={persona.name}
                role={persona.role}
                description={persona.description}
                isActive={currentPersona === persona.name.toLowerCase()}
                progress={isProcessing && currentPersona === persona.name.toLowerCase() ? 100 : 0}
              />
            ))}
          </Box>

          {generatedContract && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <Box
                sx={{
                  marginTop: '2rem',
                  padding: '2rem',
                  backgroundColor: 'rgba(0, 0, 0, 0.2)',
                  borderRadius: '16px',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ color: 'white', marginBottom: '1rem' }}
                >
                  Generated Contract:
                </Typography>
                <pre
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    padding: '1rem',
                    borderRadius: '8px',
                    overflowX: 'auto',
                    color: 'white',
                    fontFamily: 'monospace',
                  }}
                >
                  {generatedContract}
                </pre>
              </Box>
            </motion.div>
          )}

          <Snackbar
            open={!!error}
            autoHideDuration={6000}
            onClose={() => setError(null)}
          >
            <Alert
              onClose={() => setError(null)}
              severity="error"
              sx={{ width: '100%' }}
            >
              {error}
            </Alert>
          </Snackbar>

          <Snackbar
            open={!!success}
            autoHideDuration={6000}
            onClose={() => setSuccess(null)}
          >
            <Alert
              onClose={() => setSuccess(null)}
              severity="success"
              sx={{ width: '100%' }}
            >
              {success}
            </Alert>
          </Snackbar>

          <Debug />
        </Container>
      </AppContainer>
    </ThemeProvider>
  );
}

export default App;