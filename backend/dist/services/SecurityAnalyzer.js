"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityAnalyzer = void 0;
const axios_1 = __importDefault(require("axios"));
class SecurityAnalyzer {
    constructor() {
        this.vulnerabilityDB = new Map();
        this.initializeVulnerabilityDB();
    }
    async initializeVulnerabilityDB() {
        try {
            // Fetch latest vulnerabilities from SWC Registry
            const response = await axios_1.default.get('https://raw.githubusercontent.com/SmartContractSecurity/SWC-registry/master/export/swc-definition.json');
            // Process and store vulnerabilities with proper typing
            Object.entries(response.data).forEach(([id, vulnerability]) => {
                this.vulnerabilityDB.set(id, {
                    title: vulnerability.title,
                    description: vulnerability.description,
                    severity: vulnerability.severity,
                    remediation: vulnerability.remediation
                });
            });
        }
        catch (error) {
            console.error('Failed to initialize vulnerability database:', error);
        }
    }
    async analyzeSecurity(contractCode) {
        try {
            // Check for common vulnerabilities
            const findings = [];
            // Add findings from each check
            findings.push(...await this.checkReentrancy(contractCode));
            findings.push(...await this.checkIntegerOverflow(contractCode));
            findings.push(...await this.checkAccessControl(contractCode));
            // Get latest security recommendations
            const recommendations = await this.getSecurityRecommendations();
            findings.push(...recommendations);
            return { findings };
        }
        catch (error) {
            console.error('Security analysis error:', error);
            return { findings: [] };
        }
    }
    async checkReentrancy(code) {
        const findings = [];
        if (code.includes('call.value')) {
            findings.push({
                title: 'Reentrancy',
                severity: 'HIGH',
                description: 'Potential reentrancy vulnerability detected',
                recommendation: 'Use ReentrancyGuard or checks-effects-interactions pattern',
                line: this.findLineNumber(code, 'call.value')
            });
        }
        return findings;
    }
    async checkIntegerOverflow(code) {
        const findings = [];
        if (!code.includes('SafeMath') && !code.includes('using SafeMath')) {
            findings.push({
                title: 'Integer Overflow',
                severity: 'MEDIUM',
                description: 'No SafeMath usage detected',
                recommendation: 'Use SafeMath library for arithmetic operations',
                line: 0
            });
        }
        return findings;
    }
    async checkAccessControl(code) {
        const findings = [];
        if (!code.includes('Ownable') && !code.includes('AccessControl')) {
            findings.push({
                title: 'Access Control',
                severity: 'MEDIUM',
                description: 'No standard access control detected',
                recommendation: 'Implement OpenZeppelin AccessControl or Ownable',
                line: 0
            });
        }
        return findings;
    }
    async getSecurityRecommendations() {
        try {
            const response = await axios_1.default.get('http://localhost:3001/api/recommendations');
            const { data } = response;
            return data.recommendations.map((rec) => ({
                title: 'Security Recommendation',
                severity: 'INFO',
                description: rec,
                recommendation: rec,
                line: 0
            }));
        }
        catch (error) {
            console.error('Error fetching security recommendations:', error);
            return [];
        }
    }
    calculateRiskLevel(findings) {
        const highSeverityCount = findings.filter(f => f.severity === 'HIGH').length;
        const mediumSeverityCount = findings.filter(f => f.severity === 'MEDIUM').length;
        if (highSeverityCount > 0)
            return 'HIGH';
        if (mediumSeverityCount > 0)
            return 'MEDIUM';
        return 'LOW';
    }
    findLineNumber(code, pattern) {
        const lines = code.split('\n');
        return lines.findIndex(line => line.includes(pattern)) + 1;
    }
}
exports.SecurityAnalyzer = SecurityAnalyzer;
