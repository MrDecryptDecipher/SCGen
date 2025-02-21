import { Web3 } from 'web3';
import { Contract } from 'web3-eth-contract';
import { FMT_BYTES, FMT_NUMBER } from 'web3';

export const defaultWeb3Config = {
  returnFormat: {
    bytes: FMT_BYTES.HEX,
    number: FMT_NUMBER.BIGINT,
  },
  handleRevert: true,
};

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

  async initialize(): Promise<Web3> {
    if (this.web3) return this.web3;

    if (window.ethereum) {
      this.web3 = new Web3(window.ethereum);
      try {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        this.setupEventListeners();
        return this.web3;
      } catch (error) {
        console.error('User denied account access');
        throw error;
      }
    } else if (process.env.REACT_APP_RPC_URL) {
      this.web3 = new Web3(process.env.REACT_APP_RPC_URL);
      return this.web3;
    }
    
    throw new Error('No Web3 provider found');
  }

  private setupEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      console.log('Accounts changed:', accounts);
      // Implement account change handling
    });

    window.ethereum.on('chainChanged', (chainId: string) => {
      console.log('Chain changed:', chainId);
      // Implement chain change handling
      window.location.reload();
    });

    window.ethereum.on('connect', (connectInfo: { chainId: string }) => {
      console.log('Connected to chain:', connectInfo.chainId);
    });

    window.ethereum.on('disconnect', (error: { code: number; message: string }) => {
      console.log('Disconnected from chain:', error);
    });
  }

  async getAccounts(): Promise<string[]> {
    if (!this.web3) throw new Error('Web3 not initialized');
    return await this.web3.eth.getAccounts();
  }

  async getChainId(): Promise<number> {
    if (!this.web3) throw new Error('Web3 not initialized');
    const chainId = await this.web3.eth.getChainId();
    return Number(chainId);
  }

  async estimateGas(txParams: any): Promise<bigint> {
    if (!this.web3) throw new Error('Web3 not initialized');
    return await this.web3.eth.estimateGas(txParams);
  }

  getWeb3(): Web3 {
    if (!this.web3) throw new Error('Web3 not initialized');
    return this.web3;
  }
}

export const web3Service = Web3Service.getInstance();