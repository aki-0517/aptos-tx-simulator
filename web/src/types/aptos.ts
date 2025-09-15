import { Network, Account, TransactionPayload, TransactionPayloadEntryFunction, TransactionPayloadScript, SimpleTransaction } from '@aptos-labs/ts-sdk';

export type AptosNetwork = Network;

export interface NetworkConfig {
  name: string;
  network: Network;
  rpcUrl: string;
  faucetUrl?: string;
  explorerUrl: string;
}

export interface AptosAccount extends Account {
  address: string;
}

export interface TransactionInput {
  sender: string;
  payload: TransactionPayload;
  maxGasAmount?: number;
  gasUnitPrice?: number;
  expirationTimestampSecs?: number;
  sequenceNumber?: number;
}

export interface FunctionCall {
  function: string;
  functionArguments: any[];
  typeArguments?: string[];
}

export interface TransactionData {
  type: 'entry_function' | 'script' | 'batch' | 'sponsored';
  payload: TransactionPayloadEntryFunction | TransactionPayloadScript | BatchTransactionData | SponsoredTransactionData;
  sender: string;
  maxGasAmount?: number;
  gasUnitPrice?: number;
}

export interface ScriptTransactionData {
  type: 'script';
  code: string; // Move bytecode (hex)
  typeArgs: string[];
  functionArgs: any[];
}

export interface BatchTransactionData {
  type: 'batch';
  transactions: TransactionData[];
  executeSequentially: boolean;
}

export interface SponsoredTransactionData {
  type: 'sponsored';
  transaction: TransactionData;
  sponsor: string;
  sender: string;
}

export interface BatchSimulationResult {
  results: SimulationResult[];
  totalGasUsed: number;
  totalCost: number;
  dependencyGraph?: DependencyNode[];
}

export interface DependencyNode {
  transactionIndex: number;
  dependencies: number[];
  stateChanges: string[];
}

export interface SponsoredSimulationResult {
  normal: SimulationResult;
  sponsored: SimulationResult;
  gasSavings: number;
  costComparison: {
    senderCost: number;
    sponsorCost: number;
  };
}

export interface MoveFunction {
  name: string;
  module: string;
  parameters: MoveParameter[];
  typeParameters: string[];
  description?: string;
}

export interface MoveParameter {
  name: string;
  type: string;
  description?: string;
}