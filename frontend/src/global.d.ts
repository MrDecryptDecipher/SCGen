declare global {
  namespace NodeJS {
    interface ProcessEnv {
      REACT_APP_SEPOLIA_RPC_URL: string;
      NODE_ENV: 'development' | 'production';
      REACT_APP_API_URL: string;
    }
  }
}

export {};
