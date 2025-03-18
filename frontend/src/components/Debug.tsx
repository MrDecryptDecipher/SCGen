import React, { useState } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Typography, 
  Collapse, 
  List, 
  ListItem, 
  ListItemText,
  Divider,
  IconButton
} from '@mui/material';
import { styled } from '@mui/material/styles';
import InfoIcon from '@mui/icons-material/Info';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import NetworkCheckIcon from '@mui/icons-material/NetworkCheck';

const DebugPaper = styled(Paper)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  padding: theme.spacing(2),
  zIndex: 9999,
  width: 350,
  maxHeight: '80vh',
  overflowY: 'auto',
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(0, 0, 0, 0.8)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  borderRadius: 16,
  boxShadow: '0 4px 30px rgba(0, 0, 0, 0.3)',
}));

const DebugButton = styled(Button)(({ theme }) => ({
  position: 'fixed',
  bottom: theme.spacing(2),
  right: theme.spacing(2),
  zIndex: 9998,
  backdropFilter: 'blur(10px)',
  backgroundColor: theme.palette.primary.main,
  color: 'white',
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
  },
}));

interface ExpandableSectionProps {
  title: string;
  children: React.ReactNode;
}

const ExpandableSection: React.FC<ExpandableSectionProps> = ({ title, children }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <ListItem 
        button 
        onClick={() => setExpanded(!expanded)} 
        sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
      >
        <ListItemText primary={title} />
        {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
      </ListItem>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        {children}
      </Collapse>
      <Divider sx={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
    </>
  );
};

export const Debug: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [apiStatus, setApiStatus] = useState<{status: string, time: number} | null>(null);

  const checkApi = async () => {
    try {
      const startTime = performance.now();
      const response = await fetch(process.env.REACT_APP_API_URL || 'http://13.126.230.108:3001/api/health');
      const endTime = performance.now();
      const responseTime = Math.round(endTime - startTime);
      
      if (response.ok) {
        setApiStatus({
          status: 'OK - ' + response.status,
          time: responseTime
        });
      } else {
        setApiStatus({
          status: 'ERROR - ' + response.status,
          time: responseTime
        });
      }
    } catch (error) {
      setApiStatus({
        status: 'FAILED - Network Error',
        time: 0
      });
    }
  };

  if (!open) {
    return (
      <DebugButton 
        variant="contained" 
        startIcon={<InfoIcon />}
        onClick={() => setOpen(true)}
        size="small"
      >
        Debug
      </DebugButton>
    );
  }

  return (
    <DebugPaper>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography variant="h6" color="primary.light">Debug Console</Typography>
        <IconButton size="small" onClick={() => setOpen(false)}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      <List component="nav" dense>
        <ExpandableSection title="Environment Info">
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Browser" 
                secondary={navigator.userAgent} 
                primaryTypographyProps={{ variant: 'body2', color: 'primary.light' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Window Size" 
                secondary={`${window.innerWidth}x${window.innerHeight}`} 
                primaryTypographyProps={{ variant: 'body2', color: 'primary.light' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="API URL" 
                secondary={process.env.REACT_APP_API_URL || 'http://13.126.230.108:3001'} 
                primaryTypographyProps={{ variant: 'body2', color: 'primary.light' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
          </List>
        </ExpandableSection>

        <ExpandableSection title="API Status">
          <List component="div" disablePadding>
            <ListItem sx={{ pl: 4 }}>
              <ListItemText 
                primary="Status" 
                secondary={apiStatus ? apiStatus.status : 'Not checked'} 
                primaryTypographyProps={{ variant: 'body2', color: 'primary.light' }}
                secondaryTypographyProps={{ variant: 'caption' }}
              />
            </ListItem>
            {apiStatus && (
              <ListItem sx={{ pl: 4 }}>
                <ListItemText 
                  primary="Response Time" 
                  secondary={`${apiStatus.time}ms`} 
                  primaryTypographyProps={{ variant: 'body2', color: 'primary.light' }}
                  secondaryTypographyProps={{ variant: 'caption' }}
                />
              </ListItem>
            )}
            <ListItem sx={{ pl: 4 }}>
              <Button 
                startIcon={<NetworkCheckIcon />} 
                size="small" 
                variant="outlined" 
                onClick={checkApi}
                fullWidth
              >
                Check API Connection
              </Button>
            </ListItem>
          </List>
        </ExpandableSection>

        <ExpandableSection title="Console Output">
          <Box sx={{ pl: 4, pr: 2, py: 1 }}>
            <Button 
              size="small" 
              variant="outlined" 
              onClick={() => {
                console.log("SCGen Debug Info:", {
                  time: new Date().toISOString(),
                  api: process.env.REACT_APP_API_URL || 'http://13.126.230.108:3001',
                  browser: navigator.userAgent,
                  windowSize: `${window.innerWidth}x${window.innerHeight}`,
                });
              }}
              fullWidth
              sx={{ mb: 1 }}
            >
              Log Debug Info to Console
            </Button>
            <Typography variant="caption" color="text.secondary">
              Open browser console (F12) to view logs
            </Typography>
          </Box>
        </ExpandableSection>
      </List>
    </DebugPaper>
  );
}; 