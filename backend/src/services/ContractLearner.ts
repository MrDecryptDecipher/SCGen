import { ethers, JsonRpcProvider, Filter, Log as EthersLog } from 'ethers';
import axios from 'axios';

interface ContractPattern {
  name: string;
  frequency: number;
  context: string[];
  successRate: number;
}

interface DeploymentMetrics {
  gasUsed: number;
  transactionCount: number;
  uniqueUsers: number;
  avgResponseTime: number;
}

interface ExtendedLog extends EthersLog {
  gasUsed?: number;
}

export class ContractLearner {
  private patterns: Map<string, ContractPattern>;
  private deploymentHistory: Map<string, DeploymentMetrics>;
  private provider: JsonRpcProvider;

  constructor() {
    this.patterns = new Map();
    this.deploymentHistory = new Map();
    this.provider = new JsonRpcProvider('http://localhost:8545');
    this.initializePatterns();
  }

  private async initializePatterns() {
    // Fetch initial patterns from successful contracts
    const topContracts = await this.getTopContracts();
    await this.analyzeContracts(topContracts);
  }

  private async getTopContracts(): Promise<string[]> {
    // Get top verified contracts from Etherscan
    const response = await axios.get(
      `https://api.etherscan.io/api?module=contract&action=getsourcecode&apikey=${process.env.ETHERSCAN_API_KEY}`
    );
    return response.data.result.map((contract: any) => contract.ContractAddress);
  }

  async analyzeContracts(contractAddresses: string[]) {
    for (const address of contractAddresses) {
      try {
        const code = await this.provider.getCode(address);
        const metrics = await this.getContractMetrics(address);
        
        // Extract patterns
        const patterns = await this.extractPatterns(code);
        
        // Update pattern database with success metrics
        patterns.forEach(pattern => {
          const existing = this.patterns.get(pattern.name);
          if (existing) {
            existing.frequency += 1;
            existing.successRate = (existing.successRate * (existing.frequency - 1) + metrics.transactionCount) / existing.frequency;
            this.patterns.set(pattern.name, existing);
          } else {
            this.patterns.set(pattern.name, {
              ...pattern,
              frequency: 1,
              successRate: metrics.transactionCount
            });
          }
        });

        // Store deployment metrics
        this.deploymentHistory.set(address, metrics);
      } catch (error) {
        console.error(`Error analyzing contract ${address}:`, error);
      }
    }
  }

  private async getContractMetrics(address: string): Promise<DeploymentMetrics> {
    const filter: Filter = {
      address,
      fromBlock: 0,
      toBlock: 'latest'
    };

    const logs = await this.provider.getLogs(filter);
    const logMetrics = await this.analyzeLogs(logs);

    return {
      gasUsed: logMetrics.gasUsed,
      transactionCount: logs.length,
      uniqueUsers: logMetrics.uniqueUsers,
      avgResponseTime: 0 // Would need block timestamps for this
    };
  }

  async analyzeLogs(logs: ExtendedLog[]): Promise<any> {
    return {
      uniqueUsers: new Set(logs.map(log => log.topics[1])).size,
      gasUsed: logs.reduce((total: number, log: ExtendedLog) => total + (log.gasUsed || 0), 0),
    };
  }

  private async extractPatterns(code: string): Promise<ContractPattern[]> {
    const patterns: ContractPattern[] = [];
    
    // Example pattern detection
    if (code.includes('ReentrancyGuard')) {
      patterns.push({
        name: 'ReentrancyGuard',
        frequency: 0,
        context: ['Security'],
        successRate: 0
      });
    }

    if (code.includes('SafeMath')) {
      patterns.push({
        name: 'SafeMath',
        frequency: 0,
        context: ['Arithmetic'],
        successRate: 0
      });
    }

    return patterns;
  }

  async getRecommendations(contractType: string): Promise<string[]> {
    // Sort patterns by success rate and frequency
    const relevantPatterns = Array.from(this.patterns.values())
      .filter(p => p.context.includes(contractType))
      .sort((a, b) => (b.successRate * b.frequency) - (a.successRate * a.frequency));

    return relevantPatterns.map(p => 
      `Consider using ${p.name} pattern (${p.frequency} successful implementations)`
    );
  }

  async updateFromDeployment(address: string, success: boolean) {
    const metrics = await this.getContractMetrics(address);
    this.deploymentHistory.set(address, metrics);
    
    // Update pattern success rates based on this deployment
    const code = await this.provider.getCode(address);
    const patterns = await this.extractPatterns(code);
    
    patterns.forEach(pattern => {
      const existing = this.patterns.get(pattern.name);
      if (existing) {
        existing.successRate = (existing.successRate * existing.frequency + (success ? 1 : 0)) / (existing.frequency + 1);
        existing.frequency += 1;
        this.patterns.set(pattern.name, existing);
      }
    });
  }
} 