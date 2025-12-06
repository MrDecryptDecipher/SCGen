import { 
    BlockOutput, 
    TransactionOutput as Web3TransactionOutput,
    TransactionInput,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    BlockNumberOrTag,
    HexString32Bytes,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    TransactionHash,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    HexString, 
    Numbers,
    Bytes,
    Filter,
    ContractAbi,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Log,
    EventLog,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Web3BaseProvider
} from 'web3-types';
import Web3 from 'web3';
import { ethers } from 'ethers';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Contract, ContractOptions } from 'web3-eth-contract';
import { ContractExecutionError, ContractTransactionDataAndInputError } from 'web3-errors';
import axios from 'axios';

// Constant for Sepolia RPC URL
const SEPOLIA_RPC_URL = process.env.REACT_APP_SEPOLIA_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/gRcliAnQ2ysaJacOBBlOCd7eT9NxGLd0';

// Type for raw block data from RPC
interface RawBlockData {
    hash: string;
    parentHash: string;
    number: string | number;
    timestamp: string | number;
    nonce: string | number;
    difficulty: string | number;
    gasLimit: string | number;
    gasUsed: string | number;
    miner: string;
    extraData: string;
    transactions: Array<string | RawTransactionData>;
    totalDifficulty: string | number;
    size: string | number;
    uncles: string[];
    sha3Uncles: string[];
    logsBloom: string;
    stateRoot: string;
    transactionsRoot: string;
    receiptsRoot: string;
    mixHash: string;
}

// Type for raw transaction data
interface RawTransactionData {
    blockHash?: string;
    blockNumber?: string | number;
    from: string;
    gas: string | number;
    gasPrice?: string | number;
    hash: string;
    input: string;
    nonce: string | number;
    to?: string;
    transactionIndex?: string | number;
    value: string | number;
    type?: string | number;
    chainId?: string | number;
    maxFeePerGas?: string | number;
    maxPriorityFeePerGas?: string | number;
}

// Enhanced type definitions
interface Web3Block {
    hash: HexString32Bytes;
    parentHash: HexString32Bytes;
    number: Numbers;
    timestamp: Numbers;
    nonce: Numbers;
    difficulty: Numbers;
    gasLimit: Numbers;
    gasUsed: Numbers;
    miner: string;
    extraData: Bytes;
    transactions: TransactionInput[];
    totalDifficulty: Numbers;
    size: Numbers;
    uncles: HexString32Bytes[];
    sha3Uncles: HexString32Bytes[];
    logsBloom: Bytes;
    stateRoot: HexString32Bytes;
    transactionsRoot: HexString32Bytes;
    receiptsRoot: HexString32Bytes;
    mixHash: HexString32Bytes;
}

interface FeeData {
    baseFeePerGas: bigint;
    gasPrice: bigint;
    maxPriorityFeePerGas: bigint;
    maxFeePerGas: bigint;
}

interface MethodEstimation {
    gasEstimate: string;
    gasPrice: string;
    gasCost: string;
    totalCost: string;
}

type EventCallback = (error: Error | null, event?: EventLog) => void;

// Convert raw block data to Web3Block
function convertToWeb3Block(rawBlock: RawBlockData): Web3Block {
    return {
        hash: rawBlock.hash as HexString32Bytes,
        parentHash: rawBlock.parentHash as HexString32Bytes,
        number: rawBlock.number.toString(),
        timestamp: rawBlock.timestamp.toString(),
        nonce: rawBlock.nonce.toString(),
        difficulty: rawBlock.difficulty.toString(),
        gasLimit: rawBlock.gasLimit.toString(),
        gasUsed: rawBlock.gasUsed.toString(),
        miner: rawBlock.miner,
        extraData: rawBlock.extraData as Bytes,
        transactions: rawBlock.transactions.map(tx => 
            typeof tx === 'string' 
                ? { input: tx } as TransactionInput 
                : convertToTransactionInput(tx)
        ),
        totalDifficulty: rawBlock.totalDifficulty.toString(),
        size: rawBlock.size.toString(),
        uncles: rawBlock.uncles.map(uncle => uncle as HexString32Bytes),
        sha3Uncles: rawBlock.sha3Uncles.map(uncle => uncle as HexString32Bytes),
        logsBloom: rawBlock.logsBloom as Bytes,
        stateRoot: rawBlock.stateRoot as HexString32Bytes,
        transactionsRoot: rawBlock.transactionsRoot as HexString32Bytes,
        receiptsRoot: rawBlock.receiptsRoot as HexString32Bytes,
        mixHash: rawBlock.mixHash as HexString32Bytes
    };
}

// Convert raw transaction data to TransactionInput
function convertToTransactionInput(tx: RawTransactionData): TransactionInput {
    // Create the complete object at once with all required fields
    return {
        input: tx.input,
        from: tx.from,
        gas: tx.gas.toString(),
        value: tx.value.toString(),
        nonce: tx.nonce?.toString() ?? '0',  // Required field, default to '0'
        to: tx.to ?? undefined,
        gasPrice: tx.gasPrice?.toString(),
        maxFeePerGas: tx.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas?.toString(),
        type: tx.type?.toString(),  // Convert to string as required by TransactionInput
        chainId: tx.chainId?.toString()  // Convert to string as required by TransactionInput
    };
}

// Convert block data with proper type handling
function convertBlockData(block: any): RawBlockData {
    return {
        hash: block.hash?.toString() ?? '',
        parentHash: block.parentHash?.toString() ?? '',
        number: typeof block.number === 'bigint' ? block.number.toString() : block.number ?? '',
        timestamp: typeof block.timestamp === 'bigint' ? block.timestamp.toString() : block.timestamp ?? '',
        nonce: typeof block.nonce === 'bigint' ? block.nonce.toString() : block.nonce ?? '',
        difficulty: typeof block.difficulty === 'bigint' ? block.difficulty.toString() : block.difficulty ?? '',
        gasLimit: typeof block.gasLimit === 'bigint' ? block.gasLimit.toString() : block.gasLimit ?? '',
        gasUsed: typeof block.gasUsed === 'bigint' ? block.gasUsed.toString() : block.gasUsed ?? '',
        miner: block.miner?.toString() ?? '',
        extraData: block.extraData?.toString() ?? '',
        transactions: Array.isArray(block.transactions) 
            ? block.transactions.map((tx: any) => 
                typeof tx === 'string' ? tx : {
                    ...tx,
                    gas: typeof tx.gas === 'bigint' ? tx.gas.toString() : tx.gas,
                    value: typeof tx.value === 'bigint' ? tx.value.toString() : tx.value,
                    nonce: typeof tx.nonce === 'bigint' ? tx.nonce.toString() : tx.nonce
                }
            ) 
            : [],
        totalDifficulty: typeof block.totalDifficulty === 'bigint' ? block.totalDifficulty.toString() : block.totalDifficulty ?? '',
        size: typeof block.size === 'bigint' ? block.size.toString() : block.size ?? '',
        uncles: Array.isArray(block.uncles) ? block.uncles.map(String) : [],
        sha3Uncles: Array.isArray(block.sha3Uncles) ? block.sha3Uncles.map(String) : [],
        logsBloom: block.logsBloom?.toString() ?? '',
        stateRoot: block.stateRoot?.toString() ?? '',
        transactionsRoot: block.transactionsRoot?.toString() ?? '',
        receiptsRoot: block.receiptsRoot?.toString() ?? '',
        mixHash: block.mixHash?.toString() ?? ''
    };
}

// Utility function to convert to bigint safely
function toBigInt(value: string | number | bigint | undefined): bigint {
    if (value === undefined) return BigInt(0);
    return typeof value === 'bigint' ? value : BigInt(String(value));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function toNumber(value: string | number | bigint | undefined): number {
    if (!value || typeof value === 'object') {
        return 0;
    }
    if (typeof value === 'bigint') {
        return Number(value);
    }
    return Number(value);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function normalizeHexValue(value: string | undefined): string {
    if (!value) return '0x0';
    return value.startsWith('0x') ? value : `0x${value}`;
}

// Normalize transaction to match Web3TransactionOutput type
function normalizeTransaction(tx: TransactionInput): Web3TransactionOutput {
    return {
        input: tx.input ?? tx.data ?? '',
        nonce: toBigInt(tx.nonce),
        value: toBigInt(tx.value),
        from: tx.from ?? '',
        gas: toBigInt(tx.gas),
        gasPrice: tx.gasPrice ? toBigInt(tx.gasPrice) : undefined,
        maxFeePerGas: tx.maxFeePerGas ? toBigInt(tx.maxFeePerGas) : undefined,
        maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? toBigInt(tx.maxPriorityFeePerGas) : undefined,
        to: tx.to,
        type: tx.type ? String(tx.type) : undefined,
        chainId: tx.chainId ? String(tx.chainId) : undefined
    } as Web3TransactionOutput;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function processBlock(block: Web3Block | Promise<Web3Block>): BlockOutput | Promise<BlockOutput> {
    return isPromise(block) ? normalizeBlockAsync(block) : normalizeBlock(block);
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isPromise<T>(value: any): value is Promise<T> {
    return value && typeof value.then === 'function';
}

function normalizeBlock(block: Web3Block): BlockOutput {
    return {
        baseFeePerGas: undefined,
        difficulty: toBigInt(block.difficulty),
        extraData: block.extraData,
        gasLimit: toBigInt(block.gasLimit),
        gasUsed: toBigInt(block.gasUsed),
        hash: block.hash,
        logsBloom: block.logsBloom,
        miner: block.miner,
        mixHash: block.mixHash,
        nonce: toBigInt(block.nonce),
        number: toBigInt(block.number),
        parentHash: block.parentHash,
        receiptsRoot: block.receiptsRoot,
        sha3Uncles: block.sha3Uncles,
        size: toBigInt(block.size),
        stateRoot: block.stateRoot,
        timestamp: toBigInt(block.timestamp),
        totalDifficulty: toBigInt(block.totalDifficulty),
        transactions: block.transactions.map(tx => normalizeTransaction(tx)),
        transactionsRoot: block.transactionsRoot,
        uncles: block.uncles
    };
}

async function normalizeBlockAsync(block: Promise<Web3Block>): Promise<BlockOutput> {
    const resolvedBlock = await block;
    return normalizeBlock(resolvedBlock);
}

// Define all interfaces and types
interface DeploymentConfig {
    abi: ContractAbi;
    bytecode: string;
    from?: string;
    rpcUrl?: string;
    gas?: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
    constructorArgs?: unknown[];
}

interface DeploymentResult {
    success: boolean;
    contractAddress?: string;
    transactionHash?: string;
    blockNumber?: number;
    gasUsed?: number;
    events?: EventLog[];
    error?: Error | ContractExecutionError | ContractTransactionDataAndInputError;
}

interface ContractDeploymentReceipt {
    contractAddress: string;
    transactionHash: string;
    blockNumber: bigint;
    gasUsed: bigint;
    events: EventLog[];
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DeploymentEstimate {
    gasEstimate: number;
    gasCost: string;
    totalCost: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface DeploymentContext {
    network: string;
    chainId: number;
    gasPrice: string;
    balance: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ExtendedTransactionData {
    from: string;
    to?: string;
    value?: string;
    gas?: number;
    gasPrice?: string;
    maxFeePerGas?: string;
    maxPriorityFeePerGas?: string;
    nonce?: number;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ExtendedTransaction {
    hash: string;
    blockNumber: number;
    from: string;
    to: string;
    value: string;
    gasUsed: number;
    effectiveGasPrice: string;
}

interface ContractAnalysis {
    gasAnalysis: GasAnalysis;
    securityScan: SecurityScan;
    estimatedCost: string;
    recommendations: string[];
    compilationResult?: CompilationResult;
}

interface CompilationResult {
    success: boolean;
    bytecode?: string;
    abi?: ContractAbi;
    error?: string;
}

interface GasAnalysis {
    currentGasPrice: string;
    estimatedGas: string;
    totalCost: string;
    recommendations: string[];
    feeData: FeeData;
}

interface SecurityScan {
    vulnerabilities: Vulnerability[];
    score: number;
    recommendations: string[];
}

interface Vulnerability {
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: string;
    description: string;
    location?: string;
    mitigation?: string;
}

export class ContractDeployment {
    private web3: Web3;
    private provider: ethers.JsonRpcProvider;
    private lastAnalysis: ContractAnalysis | null = null;
    private deployedContracts: Map<string, Contract<ContractAbi>> = new Map();

    constructor() {
        this.web3 = new Web3(SEPOLIA_RPC_URL);
        this.provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);
    }

    async analyzeContract(sourceCode: string): Promise<ContractAnalysis> {
        try {
            const compiled = await this.compileContract(sourceCode);
            if (!compiled.success || !compiled.bytecode) {
                throw new Error('Compilation failed: ' + compiled.error);
            }

            const feeData = await this.getFeeData();
            const [gasAnalysis, securityScan] = await Promise.all([
                this.analyzeGasUsage(compiled.bytecode, feeData),
                this.performSecurityScan(sourceCode)
            ]);

            const estimatedCost = this.calculateDeploymentCost(
                gasAnalysis.estimatedGas,
                gasAnalysis.currentGasPrice
            );

            const recommendations = [
                ...new Set([
                    ...gasAnalysis.recommendations,
                    ...securityScan.recommendations
                ])
            ];

            const analysis: ContractAnalysis = {
                gasAnalysis,
                securityScan,
                estimatedCost,
                recommendations,
                compilationResult: compiled
            };

            this.lastAnalysis = analysis;
            return analysis;
        } catch (error: any) {
            console.error('Contract analysis error:', error);
            throw new Error('Failed to analyze contract: ' + 
                (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async getFeeData(): Promise<FeeData> {
        try {
            const feeData = await this.web3.eth.calculateFeeData();
            return {
                baseFeePerGas: BigInt(feeData.baseFeePerGas || 0),
                gasPrice: BigInt(feeData.gasPrice || 0),
                maxPriorityFeePerGas: BigInt(feeData.maxPriorityFeePerGas || 0),
                maxFeePerGas: BigInt(feeData.maxFeePerGas || 0)
            };
        } catch (error: any) {
            console.error('Error getting fee data:', error);
            throw new Error(`Failed to get fee data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    private async compileContract(sourceCode: string): Promise<CompilationResult> {
        try {
            const response = await axios.post('/api/compile', { 
                sourceCode,
                compilerVersion: '0.8.17',
                optimizationEnabled: true,
                optimizationRuns: 200,
                evmVersion: 'london'
            });

            const result = response.data;
            return {
                success: result.success,
                bytecode: result.bytecode,
                abi: result.abi,
                error: result.error
            };
        } catch (error: any) {
            console.error('Compilation error:', error);
            return { 
                success: false, 
                error: 'Compilation failed: ' + 
                    (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }

    private async analyzeGasUsage(bytecode: string, feeData: FeeData): Promise<GasAnalysis> {
        try {
            const estimatedGas = await this.web3.eth.estimateGas({
                data: bytecode
            });
            
            const currentGasPrice = feeData.gasPrice.toString();
            const totalCost = this.calculateDeploymentCost(
                estimatedGas.toString(),
                currentGasPrice
            );
            
            return {
                currentGasPrice,
                estimatedGas: estimatedGas.toString(),
                totalCost,
                feeData,
                recommendations: this.getGasOptimizationTips(Number(estimatedGas))
            };
        } catch (error: any) {
            throw new Error('Gas analysis failed: ' + 
                (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    private async performSecurityScan(sourceCode: string): Promise<SecurityScan> {
        try {
            const response = await axios.post('/api/security-scan', {
                sourceCode,
                toolchain: 'hardhat',
                solcVersion: '0.8.17',
                optimizationEnabled: true,
                checkAll: true,
                enableMythril: true,
                enableSlither: true
            });

            if (!response.data.success) {
                throw new Error(response.data.error);
            }

            return {
                vulnerabilities: response.data.vulnerabilities,
                score: response.data.score,
                recommendations: response.data.recommendations
            };
        } catch (error: any) {
            console.error('Security scan error:', error);
            return {
                vulnerabilities: [],
                score: 0,
                recommendations: ['Security scan failed. Please review manually.']
            };
        }
    }

    private getGasOptimizationTips(estimatedGas: number): string[] {
        const tips: string[] = [];
        
        if (estimatedGas > 2000000) {
            tips.push('Consider breaking down contract into smaller components');
            tips.push('Optimize loops and storage operations');
            tips.push('Review data structures for gas efficiency');
        }
        
        if (estimatedGas > 1000000) {
            tips.push('Use events instead of storage where possible');
            tips.push('Implement gas-efficient data structures');
            tips.push('Consider using packed storage variables');
        }
        
        tips.push('Use view/pure functions when possible');
        tips.push('Batch operations to save gas');
        tips.push('Consider using bytes32 instead of string where possible');

        return tips;
    }

    private calculateDeploymentCost(estimatedGas: string, gasPrice: string): string {
        try {
            const gasBigInt = BigInt(estimatedGas);
            const priceBigInt = BigInt(gasPrice);
            return (gasBigInt * priceBigInt).toString();
        } catch (error: any) {
            console.error('Cost calculation error:', error);
            return '0';
        }
    }

    private async initializeDeployment(config: DeploymentConfig): Promise<{ web3: Web3, contract: Contract<ContractAbi> }> {
        try {
            const web3 = new Web3(config.rpcUrl || SEPOLIA_RPC_URL);
            const contract = new web3.eth.Contract(config.abi) as Contract<ContractAbi>;
            contract.handleRevert = true;
            return { web3, contract };
        } catch (error) {
            throw new Error(`Failed to initialize deployment: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }

    async deployContract(config: DeploymentConfig): Promise<DeploymentResult> {
        try {
            const { web3, contract } = await this.initializeDeployment(config);
            const fromAddress = config.from || (await web3.eth.getAccounts())[0];
            const contractBytecode = config.bytecode;

            if (!fromAddress) {
                throw new Error('No from address specified');
            }

            if (!contractBytecode) {
                throw new Error('No bytecode provided');
            }

            try {
                const deploy = contract.deploy({
                    data: contractBytecode.startsWith('0x') ? contractBytecode : '0x' + contractBytecode,
                    arguments: config?.constructorArgs || []
                });

                const gas = await deploy.estimateGas({ from: fromAddress });
                console.log('Estimated gas:', gas);

                const txData: any = {
                    from: fromAddress,
                    gas: Number(gas)
                };

                if (config.maxFeePerGas && config.maxPriorityFeePerGas) {
                    txData.maxFeePerGas = config.maxFeePerGas;
                    txData.maxPriorityFeePerGas = config.maxPriorityFeePerGas;
                } else if (config.gasPrice) {
                    txData.gasPrice = config.gasPrice;
                }

                if (config.nonce !== undefined) {
                    txData.nonce = config.nonce;
                }

                const receipt = await deploy.send(txData) as unknown as ContractDeploymentReceipt;
                console.log('Contract deployed at:', receipt.contractAddress);

                return {
                    success: true,
                    contractAddress: receipt.contractAddress,
                    transactionHash: receipt.transactionHash,
                    blockNumber: Number(receipt.blockNumber),
                    gasUsed: Number(receipt.gasUsed),
                    events: receipt.events
                };
            } catch (error) {
                if (error instanceof ContractExecutionError || error instanceof ContractTransactionDataAndInputError) {
                    return {
                        success: false,
                        error: error
                    };
                }
                return {
                    success: false,
                    error: new Error(error instanceof Error ? error.message : 'Contract deployment failed')
                };
            }
        } catch (error) {
            return {
                success: false,
                error: new Error(error instanceof Error ? error.message : 'Contract deployment initialization failed')
            };
        }
    }

    async getContractEvents(
        contract: Contract<ContractAbi>,
        eventName: string,
        fromBlock: number | 'latest' = 'latest',
        toBlock?: number | 'latest'
    ): Promise<EventLog[]> {
        try {
            const filter: Filter = {
                address: contract.options.address,
                fromBlock,
                toBlock: toBlock || 'latest',
                topics: [this.web3.utils.sha3(eventName) ?? null]
            };

            const events = await contract.getPastEvents({
                ...filter,
                fromBlock,
                toBlock
            });

            // Fetch blocks and analyze timestamps for event timing analysis
            const blockPromises = Array.from({ length: 10 }, (_, i) => 
                this.web3.eth.getBlock(BigInt(fromBlock) - BigInt(i))
            );

            const blocks = await Promise.all(blockPromises);
            const validBlocks = blocks
                .filter((block): block is NonNullable<typeof block> => block !== null)
                .map(block => normalizeBlock(convertToWeb3Block(convertBlockData(block))));
            
            const blockTimes = validBlocks
                .slice(1)
                .map((block, i) => Number(validBlocks[i].timestamp) - Number(block.timestamp))
                .filter(time => time > 0);

            const avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;

            const currentBlock = await this.web3.eth.getBlockNumber();
            const latestBlock = await this.web3.eth.getBlock(currentBlock);
            const networkInfo = {
                chainId: (await this.web3.eth.getChainId()).toString(),
                networkType: await this.web3.eth.getNodeInfo(),
                gasPrice: (await this.web3.eth.getGasPrice()).toString(),
                blockNumber: latestBlock.number.toString(),
                averageBlockTime: avgBlockTime.toString(),
                averageGasUsed: (latestBlock.gasUsed / latestBlock.gasLimit).toString()
            };

            // Log network stats and event analysis
            console.log('Network info:', networkInfo);
            console.log('Event timing analysis:', {
                totalEvents: events.length,
                averageBlockTime: `${avgBlockTime} seconds`,
                averageGasUsed: (latestBlock.gasUsed / latestBlock.gasLimit)
            });

            return events as EventLog[];
        } catch (error: any) {
            console.error('Event error:', error);
            throw error;
        }
    }

    async subscribeToContractEvents(
        contract: Contract<ContractAbi>,
        eventName: string,
        callback: EventCallback
    ): Promise<void> {
        try {
            const subscription = contract.events[eventName]({
                fromBlock: 'latest'
            });

            subscription.on('data', (event: EventLog) => callback(null, event));
            subscription.on('error', (error: Error) => callback(error));
        } catch (error: any) {
            console.error('Event subscription error:', error);
            throw new Error('Failed to subscribe to contract events: ' + 
                (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async estimateDeploymentTime(gasPrice: string): Promise<number> {
        try {
            const latestBlock = await this.web3.eth.getBlockNumber();
            
            const blockPromises = Array.from({ length: 10 }, (_, i) => 
                this.web3.eth.getBlock(BigInt(latestBlock) - BigInt(i))
            );

            const blocks = await Promise.all(blockPromises);
            const validBlocks = blocks
                .filter((block): block is NonNullable<typeof block> => block !== null)
                .map(block => normalizeBlock(convertToWeb3Block(convertBlockData(block))));
            
            const blockTimes = validBlocks
                .slice(1)
                .map((block, i) => Number(validBlocks[i].timestamp) - Number(block.timestamp))
                .filter(time => time > 0);

            const avgBlockTime = blockTimes.reduce((a, b) => a + b, 0) / blockTimes.length;

            const currentGasPrice = await this.web3.eth.getGasPrice();
            const priceRatio = Number(gasPrice) / Number(currentGasPrice);
            const estimatedBlocks = Math.ceil(12 / Math.max(priceRatio, 0.1));

            const networkInfo = {
                chainId: (await this.web3.eth.getChainId()).toString(),
                networkType: await this.web3.eth.getNodeInfo(),
                gasPrice: currentGasPrice.toString(),
                blockNumber: latestBlock.toString()
            } as const;
            console.log('Network info for deployment estimate:', networkInfo);

            return Math.ceil(avgBlockTime * estimatedBlocks);
        } catch (error: any) {
            console.error('Time estimation error:', error);
            return 180; // Default to 3 minutes on error
        }
    }

    async estimateContractMethod(
        contract: Contract<ContractAbi>,
        methodName: string,
        params: any[],
        from: string
    ): Promise<MethodEstimation> {
        try {
            const method = contract.methods[methodName](...params);
            
            const [gasEstimate, gasPrice] = await Promise.all([
                method.estimateGas({ from }),
                this.web3.eth.getGasPrice()
            ]);

            const totalCost = this.calculateDeploymentCost(
                gasEstimate.toString(),
                gasPrice.toString()
            );

            return {
                gasEstimate: gasEstimate.toString(),
                gasPrice: gasPrice.toString(),
                gasCost: (BigInt(gasEstimate) * BigInt(gasPrice)).toString(),
                totalCost
            };
        } catch (error: any) {
            console.error('Method estimation error:', error);
            throw new Error('Failed to estimate contract method: ' + 
                (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async getContractBalance(address: string): Promise<string> {
        try {
            const balance = await this.web3.eth.getBalance(address);
            return balance.toString();
        } catch (error: any) {
            console.error('Balance check error:', error);
            throw new Error('Failed to get contract balance: ' + 
                (error instanceof Error ? error.message : 'Unknown error'));
        }
    }

    async validateContractCode(address: string, expectedBytecode: string): Promise<boolean> {
        try {
            const deployedBytecode = await this.web3.eth.getCode(address);
            const deployedCode = deployedBytecode.slice(0, -86);
            const expectedCode = (expectedBytecode.startsWith('0x') ? expectedBytecode : '0x' + expectedBytecode).slice(0, -86);
            
            if (!deployedCode || !expectedCode) {
                console.error('Invalid bytecode format');
                return false;
            }

            return deployedCode === expectedCode;
        } catch (error: any) {
            console.error('Code validation error:', error);
            return false;
        }
    }

    async getDeploymentStatus(txHash: string): Promise<{
        confirmations: number;
        status: 'pending' | 'success' | 'failed';
        blockNumber?: string;
        gasUsed?: string;
    }> {
        try {
            const receipt = await this.web3.eth.getTransactionReceipt(txHash);
            if (!receipt?.blockNumber) {
                return { confirmations: 0, status: 'pending' };
            }

            const currentBlock = await this.web3.eth.getBlockNumber();
            const confirmations = Number(currentBlock - receipt.blockNumber);

            const block = await this.web3.eth.getBlock(receipt.blockNumber);
            if (!block?.transactions.some(tx => typeof tx === 'object' && tx.hash === receipt.transactionHash)) {
                throw new Error('Block validation failed');
            }

            return {
                confirmations,
                status: receipt.status ? 'success' : 'failed',
                blockNumber: receipt.blockNumber?.toString(),
                gasUsed: receipt.gasUsed?.toString()
            };
        } catch (error: any) {
            console.error('Status error:', error);
            return { confirmations: 0, status: 'pending' };
        }
    }

    async checkVerificationStatus(guid: string): Promise<{
        success: boolean;
        status: 'Pending' | 'Pass' | 'Fail';
        message: string;
    }> {
        try {
            const response = await axios.get(
                `https://api-sepolia.etherscan.io/api`,
                {
                    params: {
                        apikey: process.env.REACT_APP_ETHERSCAN_API_KEY,
                        module: 'contract',
                        action: 'checkverifystatus',
                        guid
                    }
                }
            );

            if (response.data.status === '1') {
                return {
                    success: true,
                    status: 'Pass',
                    message: 'Contract verified successfully'
                };
            } else if (response.data.result === 'Pending in queue') {
                return {
                    success: true,
                    status: 'Pending',
                    message: 'Verification still pending'
                };
            } else {
                return {
                    success: false,
                    status: 'Fail',
                    message: response.data.result
                };
            }
        } catch (error: any) {
            console.error('Verification status check error:', error);
            return {
                success: false,
                status: 'Fail',
                message: 'Failed to check verification status: ' + 
                    (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }

    async verifyContractOnEtherscan(
        address: string,
        constructorArguments: any[],
        contractName: string,
        sourceCode: string
    ): Promise<{
        success: boolean;
        message: string;
        guid?: string;
    }> {
        try {
            // Set up deployment monitoring
            const deploymentInfo = {
                fromBlock: 'latest',
                filter: {
                    contractAddress: address
                }
            };

            // Monitor deployment events
            const deploymentEvents = await this.web3.eth.getPastLogs(deploymentInfo);
            const deploymentStats = {
                totalEvents: deploymentEvents.length,
                contractAddress: address,
                deploymentTime: Date.now()
            };

            // Use deployment info for verification request
            const response = await axios.post(
                `https://api-sepolia.etherscan.io/api`,
                {
                    apikey: process.env.REACT_APP_ETHERSCAN_API_KEY,
                    module: 'contract',
                    action: 'verifysourcecode',
                    sourceCode,
                    contractaddress: address,
                    codeformat: 'solidity-single-file',
                    contractname: contractName,
                    compilerversion: 'v0.8.19+commit.7dd6d404', // Make sure this matches your contract's compiler version
                    constructorArguments: this.web3.eth.abi.encodeParameters(
                        constructorArguments.map(() => 'address'), 
                        constructorArguments
                    ).slice(2)
                }
            );

            console.log('Contract deployment stats:', deploymentStats);
            if (response.data.status === '1') {
                return {
                    success: true,
                    message: 'Contract verification submitted successfully',
                    guid: response.data.result
                };
            } else {
                throw new Error(response.data.result);
            }
        } catch (error: any) {
            console.error('Contract verification error:', error);
            return {
                success: false,
                message: 'Failed to verify contract: ' + 
                    (error instanceof Error ? error.message : 'Unknown error')
            };
        }
    }

    getLastAnalysis(): ContractAnalysis | null {
        return this.lastAnalysis;
    }

    getDeployedContract(address: string): Contract<ContractAbi> | undefined {
        return this.deployedContracts.get(address);
    }
}

export const contractDeployment = new ContractDeployment();