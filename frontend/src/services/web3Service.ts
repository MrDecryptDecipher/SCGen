import { Web3 } from 'web3';
import { Contract } from 'web3-eth-contract';

class Web3Service {
  private static instance: Web3Service;
  private web3: Web3 | null = null;
  private contracts: Map<string, Contract<any>> = new Map();

  private constructor() {}

  static getInstance(): Web3Service {
    if (!Web3Service.instance) {
      Web3Service.instance = new Web3Service();
    }
    return Web3Service.instance;
  }

  async initialize(provider?: string): Promise<Web3> {
    if (this.web3) return this.web3;

    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        return this.web3;
      } catch (error) {
        throw new Error('User denied account access');
      }
    } else if (provider) {
      this.web3 = new Web3(provider);
      return this.web3;
    }
    
    throw new Error('No Web3 provider found');
  }

  getWeb3(): Web3 {
    if (!this.web3) {
      throw new Error('Web3 not initialized');
    }
    return this.web3;
  }

  async getAccounts(): Promise<string[]> {
    if (!this.web3) throw new Error('Web3 not initialized');
    return await this.web3.eth.getAccounts();
  }

  async getChainId(): Promise<string> {
    if (!this.web3) throw new Error('Web3 not initialized');
    return (await this.web3.eth.getChainId()).toString();
  }
}

export const web3Service = Web3Service.getInstance();