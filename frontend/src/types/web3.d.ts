import { Contract, ContractAbi } from 'web3';
import { FMT_BYTES, FMT_NUMBER } from 'web3';
import { Numbers } from 'web3-types';

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (params: any) => void) => void;
      removeListener: (event: string, callback: (params: any) => void) => void;
      selectedAddress: string | null;
      isMetaMask?: boolean;
    };
  }
}

export interface Web3Provider {
  on(event: 'connect', listener: (connectInfo: { chainId: string }) => void): this;
  on(event: 'disconnect', listener: (error: { code: number; message: string }) => void): this;
  on(event: 'chainChanged', listener: (chainId: string) => void): this;
  on(event: 'accountsChanged', listener: (accounts: string[]) => void): this;
  request(args: { method: string; params?: any[] }): Promise<any>;
}

export interface ContractConfig {
  returnFormat?: {
    bytes: typeof FMT_BYTES;
    number: typeof FMT_NUMBER;
  };
  handleRevert?: boolean;
}

export interface TransactionConfig {
  from?: string;
  to?: string;
  value?: string | Numbers;
  gas?: number;
  gasPrice?: string;
  maxPriorityFeePerGas?: string | Numbers;
  maxFeePerGas?: string | Numbers;
  data?: string;
  nonce?: number;
  chainId?: number;
  type?: number;
  accessList?: Array<{ address: string; storageKeys: string[] }>;
}