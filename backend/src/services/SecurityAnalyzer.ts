import { ethers } from 'ethers';
import axios from 'axios';

interface SecurityReport {
  findings: Finding[];
}

interface Finding {
  title: string;
  severity: string;
  description: string;
  recommendation: string;
  line: number;
}

interface SWCVulnerability {
  title: string;
  description: string;
  severity: string;
  remediation: string;
}

interface SWCRegistryResponse {
  [key: string]: SWCVulnerability;
}

export class SecurityAnalyzer {
  private vulnerabilityDB: Map<string, SWCVulnerability>;
  
  constructor() {
    this.vulnerabilityDB = new Map();
    this.initializeVulnerabilityDB();
  }

  private async initializeVulnerabilityDB() {
    try {
      // Fetch latest vulnerabilities from SWC Registry
      const response = await axios.get<SWCRegistryResponse>(
        'https://raw.githubusercontent.com/SmartContractSecurity/SWC-registry/master/export/swc-definition.json'
      );
      
      // Process and store vulnerabilities with proper typing
      Object.entries(response.data).forEach(([id, vulnerability]) => {
        this.vulnerabilityDB.set(id, {
          title: vulnerability.title,
          description: vulnerability.description,
          severity: vulnerability.severity,
          remediation: vulnerability.remediation
        });
      });
    } catch (error) {
      console.error('Failed to initialize vulnerability database:', error);
    }
  }

  async analyzeSecurity(contractCode: string): Promise<SecurityReport> {
    try {
      // Check for common vulnerabilities
      const findings: Finding[] = [];
      
      // Add findings from each check
      findings.push(...await this.checkReentrancy(contractCode));
      findings.push(...await this.checkIntegerOverflow(contractCode));
      findings.push(...await this.checkAccessControl(contractCode));
      
      // Get latest security recommendations
      const recommendations = await this.getSecurityRecommendations();
      findings.push(...recommendations);
      
      return { findings };
    } catch (error) {
      console.error('Security analysis error:', error);
      return { findings: [] };
    }
  }

  private async checkReentrancy(code: string): Promise<Finding[]> {
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

  private async checkIntegerOverflow(code: string): Promise<Finding[]> {
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

  private async checkAccessControl(code: string): Promise<Finding[]> {
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

  async getSecurityRecommendations(): Promise<Finding[]> {
    try {
      const response = await axios.get('http://localhost:3001/api/recommendations');
      const { data } = response;
      return data.recommendations.map((rec: any) => ({
        title: 'Security Recommendation',
        severity: 'INFO',
        description: rec,
        recommendation: rec,
        line: 0
      }));
    } catch (error) {
      console.error('Error fetching security recommendations:', error);
      return [];
    }
  }

  private calculateRiskLevel(findings: Finding[]): string {
    const highSeverityCount = findings.filter(f => f.severity === 'HIGH').length;
    const mediumSeverityCount = findings.filter(f => f.severity === 'MEDIUM').length;
    
    if (highSeverityCount > 0) return 'HIGH';
    if (mediumSeverityCount > 0) return 'MEDIUM';
    return 'LOW';
  }

  private findLineNumber(code: string, pattern: string): number {
    const lines = code.split('\n');
    return lines.findIndex(line => line.includes(pattern)) + 1;
  }
} 