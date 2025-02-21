import type { Transaction } from 'web3-types';

export interface TransactionInfo extends Partial<Transaction> {
  hash: string;
  from: string;
  to?: string;
  value?: string;
  blockHash?: string;
  blockNumber?: bigint;
  transactionIndex?: bigint;
  gas?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
  nonce?: number;
  input?: string;
  r?: string;
  s?: string;
  v?: string;
  type?: number | string;
}
