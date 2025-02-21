import React, { useState } from 'react';
import { 
  FormControl, 
  InputLabel, 
  Select, 
  MenuItem, 
  Box,
  SelectChangeEvent,
  styled,
  Theme,
  Typography,
  Paper,
  Container,
  Alert
} from '@mui/material';
import { motion } from 'framer-motion';

const GlassContainer = styled(Container)(({ theme }) => ({
  marginTop: '2rem',
}));

const GlassBox = styled(Paper)(({ theme }) => ({
  background: 'rgba(255, 255, 255, 0.15)',
  backdropFilter: 'blur(10px)',
  borderRadius: '15px',
  padding: '30px',
  boxShadow: '0 8px 32px rgba(31, 38, 135, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.18)',
  transition: 'transform 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-5px)',
  }
}));

const StyledFormControl = styled(FormControl)(({ theme }) => ({
  margin: theme.spacing(1),
  minWidth: 250,
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    transition: 'all 0.3s ease',
    color: 'white',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      boxShadow: '0 0 15px rgba(124, 77, 255, 0.2)'
    },
    '&.Mui-focused': {
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      border: '1px solid rgba(124, 77, 255, 0.5)',
      boxShadow: '0 0 20px rgba(124, 77, 255, 0.3)'
    },
    '&.Mui-disabled': {
      backgroundColor: 'rgba(255, 255, 255, 0.05)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      color: 'rgba(255, 255, 255, 0.3)'
    },
    '& .MuiSelect-select': {
      color: 'white'
    }
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: 500,
    '&.Mui-focused': {
      color: '#7c4dff'
    },
    '&.Mui-disabled': {
      color: 'rgba(255, 255, 255, 0.3)'
    }
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.8)'
  },
  '& .MuiMenuItem-root': {
    '&:hover': {
      backgroundColor: 'rgba(124, 77, 255, 0.1)'
    },
    '&.Mui-selected': {
      backgroundColor: 'rgba(124, 77, 255, 0.2)',
      '&:hover': {
        backgroundColor: 'rgba(124, 77, 255, 0.3)'
      }
    }
  }
}));

const DropdownContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(3),
  padding: theme.spacing(4),
  backgroundColor: 'rgba(0, 0, 0, 0.2)',
  backdropFilter: 'blur(20px)',
  borderRadius: '20px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  maxWidth: '800px',
  margin: '0 auto',
  marginTop: theme.spacing(4),
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  position: 'relative',
  overflow: 'hidden',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '2px',
    background: 'linear-gradient(90deg, #7c4dff, #f50057)',
    opacity: 0.7
  }
}));

const DropdownRow = styled(Box)({
  display: 'flex',
  gap: '20px',
  flexWrap: 'wrap',
  justifyContent: 'center',
});

interface SelectionChangeProps {
  entityType: string;
  transactionType: string;
  contractType: string;
}

interface DropdownsProps {
  entityType: string;
  setEntityType: React.Dispatch<React.SetStateAction<string>>;
  transactionType: string;
  setTransactionType: React.Dispatch<React.SetStateAction<string>>;
  contractType: string;
  setContractType: React.Dispatch<React.SetStateAction<string>>;
}

const entityTypes = [
  'PRIVATE LIMITED COMPANY',
  'LIMITED LIABILITY PARTNERSHIP',
  'GENERAL PARTNERSHIP',
  'SOLE PROPRIETORSHIP',
  'ONE PERSON COMPANY',
  'GOVERNMENT ENTITY',
  'INDIVIDUAL'
];

const transactionTypes: Record<string, string[]> = {
  'PRIVATE LIMITED COMPANY': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'LIMITED LIABILITY PARTNERSHIP': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'GENERAL PARTNERSHIP': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'SOLE PROPRIETORSHIP': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'ONE PERSON COMPANY': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'GOVERNMENT ENTITY': ['B2C', 'B2B', 'B2B2C', 'B2G', 'C2B', 'D2C', 'C2C', 'G2C', 'G2B'],
  'INDIVIDUAL': ['i2i', 'i2m', 'i2G', 'C2E', 'E2C', 'B2E', 'E2B', 'G2E', 'E2G', 'E2E']
};

const contractTypes: Record<string, Record<string, string[]>> = {
  'PRIVATE LIMITED COMPANY': {
    'B2C': ['White Label', 'Private Label', 'Wholesaling', 'Dropshipping', 'Subscription Service'],
    'B2B': [
      'Equity Tokenization',
      'Vesting Agreements',
      'Supply Chain Management',
      'Revenue Sharing Agreement',
      'Corporate Governance',
      'Intellectual Property Licensing'
    ],
    'B2B2C': ['White Label', 'Private Label', 'Wholesaling', 'Dropshipping', 'Subscription Service'],
    'B2G': ['Equity Tokenization', 'Vesting Agreements'],
    'C2B': ['White Label', 'Private Label'],
    'D2C': ['White Label', 'Private Label'],
    'C2C': ['White Label', 'Private Label'],
    'G2C': ['White Label', 'Private Label'],
    'G2B': ['White Label', 'Private Label']
  },
  'LIMITED LIABILITY PARTNERSHIP': {
    'B2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'B2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'B2B2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'B2G': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'C2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'D2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'C2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'G2C': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions'],
    'G2B': ['Profit Sharing Agreement', 'Dissolution Agreement', 'Partner Exit Agreement', 'Project Collaboration Agreement', 'Dispute Resolution Mechanism', 'Partner Capital Contributions']
  },
  'GENERAL PARTNERSHIP': {
    'B2C': ['Purchase of any assets'],
    'B2B': ['Purchase of any assets'],
    'B2B2C': ['Purchase of any assets'],
    'B2G': ['Purchase of any assets'],
    'C2B': ['Purchase of any assets'],
    'D2C': ['Purchase of any assets'],
    'C2C': ['Purchase of any assets'],
    'G2C': ['Purchase of any assets'],
    'G2B': ['Purchase of any assets']
  },
  'SOLE PROPRIETORSHIP': {
    'B2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'B2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'B2B2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'B2G': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'C2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'D2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'C2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'G2C': ['Sale of any assets (Sale deed)', 'Franchisee agreement'],
    'G2B': ['Sale of any assets (Sale deed)', 'Franchisee agreement']
  },
  'ONE PERSON COMPANY': {
    'B2C': ['Franchisee agreement', 'Commercialisation agreement'],
    'B2B': ['Franchisee agreement', 'Commercialisation agreement'],
    'B2B2C': ['Franchisee agreement', 'Commercialisation agreement'],
    'B2G': ['Franchisee agreement', 'Commercialisation agreement'],
    'C2B': ['Franchisee agreement', 'Commercialisation agreement'],
    'D2C': ['Franchisee agreement', 'Commercialisation agreement'],
    'C2C': ['Franchisee agreement', 'Commercialisation agreement'],
    'G2C': ['Franchisee agreement', 'Commercialisation agreement'],
    'G2B': ['Franchisee agreement', 'Commercialisation agreement']
  },
  'GOVERNMENT ENTITY': {
    'B2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'B2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'B2B2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'B2G': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'C2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'D2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'C2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'G2C': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement'],
    'G2B': ['Freelancing agreement', 'Consulting contract', 'Rental agreement', 'Project management agreement']
  },
  'INDIVIDUAL': {
    'i2i': ['Will documentation'],
    'i2m': ['Parent to children agreements'],
    'i2G': ['Individual to Government agreements'],
    'C2E': ['Commercialisation agreement'],
    'E2C': ['Commercialisation agreement'],
    'B2E': ['Commercialisation agreement'],
    'E2B': ['Commercialisation agreement'],
    'G2E': ['Commercialisation agreement'],
    'E2G': ['Commercialisation agreement'],
    'E2E': ['Commercialisation agreement']
  }
};

const Dropdowns: React.FC<DropdownsProps> = ({
  entityType,
  setEntityType,
  transactionType,
  setTransactionType,
  contractType,
  setContractType,
}) => {
  const [error, setError] = useState<string | null>(null);
  const handleEntityChange = (event: SelectChangeEvent) => {
    try {
      const value = event.target.value;
      setEntityType(value);
      setTransactionType('');
      setContractType('');
      setError(null);
    } catch (error) {
      console.error('Error in handleEntityChange:', error);
      setError('Failed to update entity type');
    }
  };

  const handleTransactionChange = (event: SelectChangeEvent) => {
    try {
      const value = event.target.value;
      setTransactionType(value);
      setContractType('');
      setError(null);
    } catch (error) {
      console.error('Error in handleTransactionChange:', error);
      setError('Failed to update transaction type');
    }
  };

  const handleContractChange = (event: SelectChangeEvent) => {
    try {
      const value = event.target.value;
      setContractType(value);
      setError(null);
    } catch (error) {
      console.error('Error in handleContractChange:', error);
      setError('Failed to update contract type');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <DropdownContainer>
        <Typography
          variant="h5"
          align="center"
          sx={{
            mb: 4,
            background: 'linear-gradient(45deg, #7c4dff 30%, #f50057 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 600
          }}
        >
          Smart Contract Configuration
        </Typography>

        {error && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          </motion.div>
        )}
        <DropdownRow>
          <StyledFormControl>
            <InputLabel>Entity Type</InputLabel>
            <Select
              value={entityType}
              label="Entity Type"
              onChange={handleEntityChange}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(124, 77, 255, 0.1)'
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(124, 77, 255, 0.2)'
                      }
                    }
                  }
                }
              }}
            >
              {entityTypes.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </StyledFormControl>

          <StyledFormControl>
            <InputLabel>Transaction Type</InputLabel>
            <Select
              value={transactionType}
              label="Transaction Type"
              onChange={handleTransactionChange}
              disabled={!entityType}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(124, 77, 255, 0.1)'
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(124, 77, 255, 0.2)'
                      }
                    }
                  }
                }
              }}
            >
              {entityType && transactionTypes[entityType]?.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        </DropdownRow>

        <DropdownRow>
          <StyledFormControl>
            <InputLabel>Contract Type</InputLabel>
            <Select
              value={contractType}
              label="Contract Type"
              onChange={handleContractChange}
              disabled={!transactionType}
              MenuProps={{
                PaperProps: {
                  sx: {
                    backgroundColor: 'rgba(30, 30, 30, 0.95)',
                    backdropFilter: 'blur(10px)',
                    '& .MuiMenuItem-root': {
                      color: 'white',
                      '&:hover': {
                        backgroundColor: 'rgba(124, 77, 255, 0.1)'
                      },
                      '&.Mui-selected': {
                        backgroundColor: 'rgba(124, 77, 255, 0.2)'
                      }
                    }
                  }
                }
              }}
            >
              {transactionType && entityType && contractTypes[entityType]?.[transactionType]?.map((type) => (
                <MenuItem key={type} value={type}>{type}</MenuItem>
              ))}
            </Select>
          </StyledFormControl>
        </DropdownRow>
      </DropdownContainer>
    </motion.div>
  );
};

export default Dropdowns;