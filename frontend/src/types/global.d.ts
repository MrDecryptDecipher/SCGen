declare namespace NodeJS {
  interface ProcessEnv {
    REACT_APP_SEPOLIA_RPC_URL: string;
    NODE_ENV: 'development' | 'production';
    REACT_APP_API_URL: string;
    SKIP_PREFLIGHT_CHECK: string;
  }
}

declare module 'web3-core' {
  export type { Contract } from 'web3-eth-contract';
}

declare module 'web3-utils' {
  export interface AbiItem {
    anonymous?: boolean;
    constant?: boolean;
    inputs?: AbiInput[];
    name?: string;
    outputs?: AbiOutput[];
    payable?: boolean;
    stateMutability?: StateMutabilityType;
    type: AbiType;
    gas?: number;
  }

  export interface AbiInput {
    name: string;
    type: string;
    indexed?: boolean;
    components?: AbiInput[];
    internalType?: string;
  }

  export interface AbiOutput {
    name: string;
    type: string;
    components?: AbiOutput[];
    internalType?: string;
  }
}

declare module 'framer-motion' {
  export interface AnimationProps {
    initial?: any;
    animate?: any;
    exit?: any;
    variants?: any;
    transition?: any;
    whileHover?: any;
    whileTap?: any;
  }
}

declare module '*.svg' {
  const content: any;
  export default content;
}

declare module '*.json' {
  const content: any;
  export default content;
}

export {};
