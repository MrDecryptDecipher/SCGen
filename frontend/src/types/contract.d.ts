import { Abi } from 'web3';
import { FeeData } from 'web3-types';
import { Bytes, Numbers } from 'web3-utils';

export interface ContractTemplate {
    abi: Abi;
    bytecode: string;
    contractType: string;
}

export interface ContractDeploymentOptions {
    from: string;
    gas?: string;
    gasPrice?: string;
    arguments?: any[];
}

export interface ContractAnalysis {
    gasAnalysis: GasAnalysis;
    securityScan: SecurityScan;
    estimatedCost: string;
    recommendations: string[];
    sourceCode: string;
    bytecode: string;
    timestamp: string;
}

export interface GasAnalysis {
    estimatedGas: string;
    currentGasPrice: string;
    baseFee: string;
    priorityFee: string;
    totalCost: string;
    recommendations: string[];
}

export interface SecurityScan {
    vulnerabilities: Vulnerability[];
    score: number;
    recommendations: string[];
    criticalIssues: number;
    highIssues: number;
    details: SecurityIssueDetail[];
}

export interface Vulnerability {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
    description: string;
    location?: string;
    mitigation?: string;
}

export interface SecurityIssueDetail {
    type: string;
    description: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    location?: {
        start: number;
        end: number;
        file?: string;
    };
    suggestion?: string;
}

export interface DeploymentResult {
    success: boolean;
    contractAddress?: string;
    transactionHash?: string;
    error?: string;
    deploymentCost?: string;
    blockNumber?: number;
    gasUsed?: string;
    events?: Record<string, any>;
}

export interface TransactionConfig {
    from: string;
    to?: string;
    value?: string;
    gas?: string;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: string;
    data?: string;
}

export interface ContractEventOptions {
    filter?: Record<string, any>;
    fromBlock?: Numbers | string;
    toBlock?: Numbers | string;
    topics?: string[];
}

export interface PersonaState {
    nanjunda: {
        active: boolean;
        status: 'analyzing' | 'complete' | 'error';
        message?: string;
    };
    achyutha: {
        active: boolean;
        status: 'optimizing' | 'complete' | 'error';
        message?: string;
    };
    sandeep: {
        active: boolean;
        status: 'verifying' | 'complete' | 'error';
        message?: string;
    };
}

export interface NIJAAIProps {
    onGenerateClick: () => Promise<void>;
    isProcessing: boolean;
    currentPersona: keyof PersonaState;
    onAdvancedSettingsChange?: (settings: ContractGenerationSettings) => void;
}

export interface PersonaVisualProps {
    avatar: string;
    name: string;
    role: string;
    isActive: boolean;
    status?: string;
    description?: string;
    onRetry?: () => void;
}

export interface ContractGenerationSettings {
    optimizeGas: boolean;
    includeComments: boolean;
    securityLevel: 'standard' | 'high' | 'enterprise';
    customRpcUrl?: string;
}

export interface PersonaAnalysis {
    avatar: string;
    message: string;
    color: string;
    requirements?: string[];
    recommendations?: string[];
    vulnerabilities?: string[];
    status: string;
}