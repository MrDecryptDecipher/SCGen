import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Stepper,
  Step,
  StepLabel,
  Button,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  Divider,
  Tooltip,
  IconButton,
  Skeleton,
  Snackbar,
  useTheme,
  useMediaQuery,
  Link,
  Chip
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { ForceGraph2D } from 'react-force-graph';
import { ethers } from 'ethers';
import InfoIcon from '@mui/icons-material/Info';
import WarningIcon from '@mui/icons-material/Warning';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import HelpIcon from '@mui/icons-material/Help';
import TimelineIcon from '@mui/icons-material/Timeline';
import SimulationIcon from '@mui/icons-material/Science';
import MonitorIcon from '@mui/icons-material/Monitor';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { io, Socket } from 'socket.io-client';
import SyntaxHighlighter from 'react-syntax-highlighter';
import { docco } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import * as d3 from 'd3';
import { TooltipProps } from 'recharts';
import { Selection, BaseType } from 'd3-selection';
import { Simulation, SimulationNodeDatum } from 'd3-force';

interface ContractVisualizerProps {
  contractCode: string;
  gasAnalysis: any[];
  vulnerabilityScan: any[];
  onDeploy: (network: string) => Promise<void>;
}

interface ErrorState {
  message: string;
  severity: 'error' | 'warning' | 'info' | 'success';
}

interface ForceGraphNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  val: number;
  color: string;
  group: number;
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

interface ForceGraphLink extends d3.SimulationLinkDatum<ForceGraphNode> {
  source: string | ForceGraphNode;
  target: string | ForceGraphNode;
  value: number;
}

interface ForceGraphData {
  nodes: ForceGraphNode[];
  links: ForceGraphLink[];
}

interface ChartTooltipData {
  name: string;
  value: number;
  dataKey: string;
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: ChartTooltipData[];
  label?: string;
}

interface ValidationResult {
  staticAnalysis: {
    hasReentrancyGuard: boolean;
    hasAccessControl: boolean;
    hasPausable: boolean;
    hasEvents: number;
    functionCount: number;
  };
  imports: {
    openzeppelin: boolean;
    chainlink: boolean;
    customImports: number;
  };
  constructorParams: string[];
  recommendations: string[];
}

interface SimulationResult {
  network: string;
  gasEstimate: string;
  gasCost: string;
  estimatedTimeToMine: string;
  currentBlockNumber: number;
  networkConditions: {
    congestion: string;
    recommendedAction: string;
  };
}

interface ContractEvent {
  blockNumber: number;
  transactionHash: string;
  eventType: string;
  data: string;
  timestamp: string;
}

interface EventSubscription {
  socket: Socket | null;
  contractAddress: string;
  network: string;
}

interface Node extends SimulationNodeDatum {
  id: string;
  group: number;
  name: string;
  val: number;
  color: string;
}

interface Link {
  source: string;
  target: string;
  value: number;
}

interface SimNode extends d3.SimulationNodeDatum {
  id: string;
  name: string;
  val: number;
  color: string;
}

interface SimLink extends d3.SimulationLinkDatum<SimNode> {
  source: string;
  target: string;
  value: number;
}

const ChartTooltip: React.FC<ChartTooltipProps> = ({ active, payload }) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  return (
    <Box sx={{ bgcolor: 'background.paper', p: 2, border: 1, borderColor: 'divider' }}>
      <Typography variant="body2">
        Function: {payload[0].name}
      </Typography>
      <Typography variant="body2">
        Estimated Gas: {payload[0].value}
      </Typography>
    </Box>
  );
};

export const ContractVisualizer: React.FC<ContractVisualizerProps> = ({
  contractCode,
  gasAnalysis,
  vulnerabilityScan,
  onDeploy
}) => {
  const [graphData, setGraphData] = useState<ForceGraphData | null>(null);
  const [selectedFunction, setSelectedFunction] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<ErrorState | null>(null);
  const [isTestingOracle, setIsTestingOracle] = useState(false);
  const [isVerifyingAnalytics, setIsVerifyingAnalytics] = useState(false);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [simulationResult, setSimulationResult] = useState<SimulationResult | null>(null);
  const [contractEvents, setContractEvents] = useState<ContractEvent[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [eventSubscription, setEventSubscription] = useState<EventSubscription>({
    socket: null,
    contractAddress: '',
    network: ''
  });
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    const parseContractStructure = async () => {
      try {
        setIsLoading(true);
        const nodes: ForceGraphNode[] = [];
        const links: ForceGraphLink[] = [];
        
        nodes.push({
          id: 'contract',
          name: 'Contract',
          val: 20,
          color: theme.palette.primary.main,
          group: 1
        });
        
        gasAnalysis.forEach((func) => {
          nodes.push({
            id: func.functionName,
            name: func.functionName,
            val: 10,
            color: theme.palette.secondary.main,
            group: 2
          });
          
          links.push({
            source: 'contract',
            target: func.functionName,
            value: func.estimatedGas
          });
        });
        
        setGraphData({ nodes, links });
      } catch (err) {
        setError({
          message: 'Failed to parse contract structure',
          severity: 'error'
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    parseContractStructure();
  }, [contractCode, gasAnalysis, theme]);

  // Initialize WebSocket connection
  useEffect(() => {
    const socket = io('http://localhost:3001');
    
    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
      setError({
        message: 'Connected to event monitoring service',
        severity: 'success'
      });
    });
    
    socket.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
      setError({
        message: 'Disconnected from event monitoring service',
        severity: 'warning'
      });
    });
    
    socket.on('new-events', (events: ContractEvent[]) => {
      setContractEvents(prevEvents => [...events, ...prevEvents]);
    });
    
    socket.on('subscription-error', (error: { error: string }) => {
      setError({
        message: error.error,
        severity: 'error'
      });
    });
    
    setEventSubscription(prev => ({ ...prev, socket }));
    
    return () => {
      socket.disconnect();
    };
  }, []);

  const handleTestOracle = async (network: string) => {
    try {
      setIsTestingOracle(true);
      const response = await fetch(`/api/test/oracle/${network}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setError({
        message: 'Oracle test successful',
        severity: 'success'
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to test Oracle',
        severity: 'error'
      });
    } finally {
      setIsTestingOracle(false);
    }
  };

  const handleVerifyAnalytics = async (contractAddress: string) => {
    try {
      setIsVerifyingAnalytics(true);
      const response = await fetch(`/api/test/analytics/${contractAddress}`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error);
      }
      
      setError({
        message: 'Analytics verification successful',
        severity: 'success'
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to verify analytics',
        severity: 'error'
      });
    } finally {
      setIsVerifyingAnalytics(false);
    }
  };

  const handleValidateContract = async () => {
    try {
      setIsValidating(true);
      const response = await fetch('/api/test/validate-contract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contractCode, network: 'sepolia' })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      setValidationResult(data.data);
      setError({
        message: 'Contract validation completed successfully',
        severity: 'success'
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to validate contract',
        severity: 'error'
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleSimulateDeployment = async () => {
    try {
      setIsSimulating(true);
      const response = await fetch('/api/test/simulate-deployment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contractCode,
          network: 'sepolia',
          constructorArgs: [] 
        })
      });
      
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      
      setSimulationResult(data.data);
      setError({
        message: 'Deployment simulation completed successfully',
        severity: 'success'
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to simulate deployment',
        severity: 'error'
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // Enhanced event monitoring with real-time updates
  const handleMonitorEvents = async (contractAddress: string) => {
    try {
      setIsMonitoring(true);
      
      // Subscribe to real-time events
      if (eventSubscription.socket) {
        eventSubscription.socket.emit('subscribe-events', {
          contractAddress,
          network: 'sepolia'
        });
        
        setEventSubscription(prev => ({
          ...prev,
          contractAddress,
          network: 'sepolia'
        }));
      }
      
      // Get historical events
      const response = await fetch(`/api/test/monitor-events/${contractAddress}?network=sepolia`);
      const data = await response.json();
      
      if (!data.success) throw new Error(data.error);
      
      setContractEvents(data.data.events);
      setError({
        message: `Monitoring ${data.data.eventCount} events`,
        severity: 'success'
      });
    } catch (err) {
      setError({
        message: err instanceof Error ? err.message : 'Failed to monitor events',
        severity: 'error'
      });
      setIsMonitoring(false);
    }
  };

  // Enhanced contract visualization with D3
  const renderEnhancedContractGraph = () => {
    const width = isMobile ? 300 : 600;
    const height = isMobile ? 250 : 350;
    
    useEffect(() => {
      if (!graphData || !graphData.nodes.length) return;
      
      const svg = d3.select('#contract-graph')
        .append('svg')
        .attr('width', width)
        .attr('height', height);
      
      const simulation = d3.forceSimulation<ForceGraphNode>()
        .nodes(graphData.nodes)
        .force('link', d3.forceLink<ForceGraphNode, ForceGraphLink>(graphData.links)
          .id((d) => d.id)
          .distance(100))
        .force('charge', d3.forceManyBody<ForceGraphNode>().strength(-200))
        .force('center', d3.forceCenter<ForceGraphNode>(width / 2, height / 2));
      
      const link = svg.append('g')
        .selectAll<SVGLineElement, ForceGraphLink>('line')
        .data(graphData.links)
        .enter()
        .append('line')
        .attr('stroke', theme.palette.divider)
        .attr('stroke-width', 2);
      
      const node = svg.append('g')
        .selectAll<SVGCircleElement, ForceGraphNode>('circle')
        .data(graphData.nodes)
        .enter()
        .append('circle')
        .attr('r', d => d.val)
        .attr('fill', d => d.color)
        .call(d3.drag<SVGCircleElement, ForceGraphNode>()
          .on('start', (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on('drag', (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on('end', (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            d.fx = null;
            d.fy = null;
          }));
      
      const text = svg.append('g')
        .selectAll<SVGTextElement, ForceGraphNode>('text')
        .data(graphData.nodes)
        .enter()
        .append('text')
        .text(d => d.name)
        .attr('font-size', '12px')
        .attr('dx', 15)
        .attr('dy', 4);
      
      simulation.on('tick', () => {
        link
          .attr('x1', d => (d.source as ForceGraphNode).x || 0)
          .attr('y1', d => (d.source as ForceGraphNode).y || 0)
          .attr('x2', d => (d.target as ForceGraphNode).x || 0)
          .attr('y2', d => (d.target as ForceGraphNode).y || 0);
        
        node
          .attr('cx', d => d.x || 0)
          .attr('cy', d => d.y || 0);
        
        text
          .attr('x', d => d.x || 0)
          .attr('y', d => d.y || 0);
      });
      
      return () => {
        simulation.stop();
        svg.remove();
      };
    }, [graphData, width, height, theme]);
    
    return (
      <div id="contract-graph" style={{ width, height }} />
    );
  };
  
  // Enhanced code display
  const renderCodeDisplay = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Contract Code</Typography>
          <Tooltip title="View and analyze contract code">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <SyntaxHighlighter
          language="solidity"
          style={docco}
          showLineNumbers
          customStyle={{
            maxHeight: '400px',
            overflow: 'auto'
          }}
        >
          {contractCode}
        </SyntaxHighlighter>
      </CardContent>
    </Card>
  );

  const renderGasAnalysis = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Gas Analysis</Typography>
          <Tooltip title="View estimated gas costs for each function">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {isLoading ? (
          <Skeleton variant="rectangular" height={200} />
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={gasAnalysis}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="functionName" />
              <YAxis />
              <RechartsTooltip
                content={(props) => {
                  if (!props.active || !props.payload || !props.payload.length) {
                    return null;
                  }
                  const data = props.payload[0];
                  return (
                    <Box sx={{ bgcolor: 'background.paper', p: 2, border: 1, borderColor: 'divider' }}>
                      <Typography variant="body2">
                        Function: {data.name}
                      </Typography>
                      <Typography variant="body2">
                        Estimated Gas: {data.value}
                      </Typography>
                    </Box>
                  );
                }}
              />
              <Bar dataKey="estimatedGas" fill={theme.palette.primary.main} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </CardContent>
    </Card>
  );

  const renderVulnerabilities = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Security Analysis</Typography>
          <Tooltip title="View potential security vulnerabilities and recommendations">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {isLoading ? (
          Array(3).fill(0).map((_, i) => (
            <Skeleton key={i} variant="rectangular" height={60} sx={{ mb: 1 }} />
          ))
        ) : (
          vulnerabilityScan.map((vuln, index) => (
            <Alert
              key={index}
              severity={vuln.severity.toLowerCase() as 'error' | 'warning' | 'info'}
              sx={{ mb: 1 }}
              icon={
                vuln.severity === 'HIGH' ? <ErrorIcon /> :
                vuln.severity === 'MEDIUM' ? <WarningIcon /> :
                <InfoIcon />
              }
            >
              <Typography variant="subtitle2">{vuln.description}</Typography>
              <Typography variant="body2">{vuln.recommendation}</Typography>
            </Alert>
          ))
        )}
      </CardContent>
    </Card>
  );

  const renderContractGraph = () => (
    <Card sx={{ mb: 3, height: isMobile ? 300 : 400 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Contract Structure</Typography>
          <Tooltip title="Interactive visualization of contract functions and their relationships">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {isLoading ? (
          <Skeleton variant="rectangular" height={isMobile ? 250 : 350} />
        ) : graphData ? (
          <ForceGraph2D
            graphData={graphData as any}
            nodeLabel="name"
            nodeColor="color"
            nodeRelSize={6}
            linkDirectionalParticles={2}
            linkDirectionalParticleSpeed={0.005}
            onNodeClick={(node: any) => setSelectedFunction(node.id)}
            width={isMobile ? 300 : 600}
            height={isMobile ? 250 : 350}
          />
        ) : (
          <Alert severity="error">Failed to load contract structure</Alert>
        )}
      </CardContent>
    </Card>
  );

  const renderFunctionDetails = () => {
    if (!selectedFunction) return null;
    
    const functionData = gasAnalysis.find(f => f.functionName === selectedFunction);
    if (!functionData) return null;

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6">Function Details: {selectedFunction}</Typography>
            <Tooltip title="Detailed analysis of the selected function">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpIcon />
              </IconButton>
            </Tooltip>
          </Box>
          {isLoading ? (
            <Skeleton variant="rectangular" height={150} />
          ) : (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Estimated Gas:</Typography>
                <Typography>{functionData.estimatedGas}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="subtitle2">Optimization Tips:</Typography>
                <ul>
                  {functionData.recommendations.map((rec: string, index: number) => (
                    <li key={index}>{rec}</li>
                  ))}
                </ul>
              </Grid>
            </Grid>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderValidationResults = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Validation Results</Typography>
          <Tooltip title="Contract validation results and recommendations">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {isValidating ? (
          <Skeleton variant="rectangular" height={200} />
        ) : validationResult ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Static Analysis</Typography>
              <ul>
                <li>ReentrancyGuard: {validationResult.staticAnalysis.hasReentrancyGuard ? '✅' : '❌'}</li>
                <li>AccessControl: {validationResult.staticAnalysis.hasAccessControl ? '✅' : '❌'}</li>
                <li>Pausable: {validationResult.staticAnalysis.hasPausable ? '✅' : '❌'}</li>
                <li>Events: {validationResult.staticAnalysis.hasEvents}</li>
                <li>Functions: {validationResult.staticAnalysis.functionCount}</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Recommendations</Typography>
              <ul>
                {validationResult.recommendations.map((rec, index) => (
                  <li key={index}>{rec}</li>
                ))}
              </ul>
            </Grid>
          </Grid>
        ) : null}
      </CardContent>
    </Card>
  );

  const renderSimulationResults = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Deployment Simulation</Typography>
          <Tooltip title="Estimated deployment costs and network conditions">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        {isSimulating ? (
          <Skeleton variant="rectangular" height={200} />
        ) : simulationResult ? (
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Cost Estimation</Typography>
              <ul>
                <li>Gas Estimate: {simulationResult.gasEstimate}</li>
                <li>Gas Cost: {simulationResult.gasCost} ETH</li>
                <li>Estimated Time: {simulationResult.estimatedTimeToMine}</li>
              </ul>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="subtitle2">Network Conditions</Typography>
              <ul>
                <li>Network: {simulationResult.network}</li>
                <li>Block: {simulationResult.currentBlockNumber}</li>
                <li>Congestion: {simulationResult.networkConditions.congestion}</li>
                <li>Recommendation: {simulationResult.networkConditions.recommendedAction}</li>
              </ul>
            </Grid>
          </Grid>
        ) : null}
      </CardContent>
    </Card>
  );

  // Enhanced event monitoring display
  const renderEventMonitoring = () => {
    const columns: GridColDef[] = [
      { field: 'blockNumber', headerName: 'Block', width: 100 },
      { field: 'timestamp', headerName: 'Time', width: 200 },
      { field: 'eventType', headerName: 'Event', width: 200,
        renderCell: (params: GridRenderCellParams) => (
          <Tooltip title={params.value}>
            <span>{params.value.substring(0, 10)}...</span>
          </Tooltip>
        )
      },
      { field: 'transactionHash', headerName: 'Transaction', width: 300,
        renderCell: (params: GridRenderCellParams) => (
          <Link
            href={`https://sepolia.etherscan.io/tx/${params.value}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            {params.value.substring(0, 10)}...
          </Link>
        )
      },
      { field: 'data', headerName: 'Data', width: 200,
        renderCell: (params: GridRenderCellParams) => (
          <Tooltip title={params.value}>
            <span>{params.value.substring(0, 10)}...</span>
          </Tooltip>
        )
      }
    ];

    return (
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={2}>
            <Typography variant="h6">Event Monitor</Typography>
            <Tooltip title="Monitor contract events in real-time">
              <IconButton size="small" sx={{ ml: 1 }}>
                <HelpIcon />
              </IconButton>
            </Tooltip>
            {eventSubscription.contractAddress && (
              <Chip
                label={`Monitoring ${eventSubscription.contractAddress.substring(0, 6)}...`}
                color="primary"
                size="small"
                sx={{ ml: 2 }}
              />
            )}
          </Box>
          {isMonitoring ? (
            <Skeleton variant="rectangular" height={400} />
          ) : contractEvents.length > 0 ? (
            <Box sx={{ height: 400 }}>
              <DataGrid
                rows={contractEvents.map((event, index) => ({ id: index, ...event }))}
                columns={columns}
                initialState={{
                  pagination: {
                    paginationModel: {
                      pageSize: 5,
                    },
                  },
                }}
                pageSizeOptions={[5]}
                disableRowSelectionOnClick
                components={{
                  NoRowsOverlay: () => (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography color="text.secondary">No events to display</Typography>
                    </Box>
                  )
                }}
              />
            </Box>
          ) : (
            <Alert severity="info">No events to display</Alert>
          )}
        </CardContent>
      </Card>
    );
  };

  const renderAdvancedTools = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <Typography variant="h6">Advanced Tools</Typography>
          <Tooltip title="Additional contract analysis and testing tools">
            <IconButton size="small" sx={{ ml: 1 }}>
              <HelpIcon />
            </IconButton>
          </Tooltip>
        </Box>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleValidateContract}
              disabled={isValidating}
              startIcon={isValidating ? <CircularProgress size={20} /> : <TimelineIcon />}
            >
              Validate Contract
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="secondary"
              fullWidth
              onClick={handleSimulateDeployment}
              disabled={isSimulating}
              startIcon={isSimulating ? <CircularProgress size={20} /> : <SimulationIcon />}
            >
              Simulate Deployment
            </Button>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Button
              variant="contained"
              color="info"
              fullWidth
              onClick={() => handleMonitorEvents('your-contract-address')}
              disabled={isMonitoring}
              startIcon={isMonitoring ? <CircularProgress size={20} /> : <MonitorIcon />}
            >
              Monitor Events
            </Button>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ mt: 4 }}>
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        {error ? (
          <Alert
            onClose={() => setError(null)}
            severity={error.severity}
            sx={{ width: '100%' }}
          >
            {error.message}
          </Alert>
        ) : <Alert severity="info" sx={{ display: 'none' }}>Placeholder</Alert>}
      </Snackbar>
      
      <Grid container spacing={3}>
        <Grid item xs={12}>
          {renderAdvancedTools()}
        </Grid>
        <Grid item xs={12}>
          {renderValidationResults()}
        </Grid>
        <Grid item xs={12}>
          {renderSimulationResults()}
        </Grid>
        <Grid item xs={12}>
          {renderEventMonitoring()}
        </Grid>
        <Grid item xs={12}>
          {renderCodeDisplay()}
        </Grid>
        <Grid item xs={12} md={8}>
          {renderEnhancedContractGraph()}
          {renderGasAnalysis()}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderVulnerabilities()}
          {renderFunctionDetails()}
        </Grid>
      </Grid>
    </Box>
  );
}; 