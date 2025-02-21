"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ContractLearner = void 0;
const ethers_1 = require("ethers");
const axios_1 = __importDefault(require("axios"));
class ContractLearner {
    constructor() {
        this.patterns = new Map();
        this.deploymentHistory = new Map();
        this.provider = new ethers_1.JsonRpcProvider('http://localhost:8545');
        this.initializePatterns();
    }
    async initializePatterns() {
        // Fetch initial patterns from successful contracts
        const topContracts = await this.getTopContracts();
        await this.analyzeContracts(topContracts);
    }
    async getTopContracts() {
        // Get top verified contracts from Etherscan
        const response = await axios_1.default.get(`https://api.etherscan.io/api?module=contract&action=getsourcecode&apikey=${process.env.ETHERSCAN_API_KEY}`);
        return response.data.result.map((contract) => contract.ContractAddress);
    }
    async analyzeContracts(contractAddresses) {
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
                    }
                    else {
                        this.patterns.set(pattern.name, {
                            ...pattern,
                            frequency: 1,
                            successRate: metrics.transactionCount
                        });
                    }
                });
                // Store deployment metrics
                this.deploymentHistory.set(address, metrics);
            }
            catch (error) {
                console.error(`Error analyzing contract ${address}:`, error);
            }
        }
    }
    async getContractMetrics(address) {
        const filter = {
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
    async analyzeLogs(logs) {
        return {
            uniqueUsers: new Set(logs.map(log => log.topics[1])).size,
            gasUsed: logs.reduce((total, log) => total + (log.gasUsed || 0), 0),
        };
    }
    async extractPatterns(code) {
        const patterns = [];
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
    async getRecommendations(contractType) {
        // Sort patterns by success rate and frequency
        const relevantPatterns = Array.from(this.patterns.values())
            .filter(p => p.context.includes(contractType))
            .sort((a, b) => (b.successRate * b.frequency) - (a.successRate * a.frequency));
        return relevantPatterns.map(p => `Consider using ${p.name} pattern (${p.frequency} successful implementations)`);
    }
    async updateFromDeployment(address, success) {
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
exports.ContractLearner = ContractLearner;
