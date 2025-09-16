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

// Advanced Transaction Types
export interface ScriptTransactionData {
  type: 'script';
  sender: string;
  code: string; // Move bytecode
  typeArgs?: string[];
  functionArgs?: any[];
  maxGasAmount?: number;
  gasUnitPrice?: number;
}

export interface BatchTransactionData {
  type: 'batch';
  transactions: TransactionData[];
  executeSequentially: boolean;
  maxGasAmount?: number;
  gasUnitPrice?: number;
}

export interface SponsoredTransactionData {
  type: 'sponsored';
  transaction: TransactionData;
  sponsorAddress: string;
  maxGasAmount?: number;
  gasUnitPrice?: number;
}

export interface MultiSigTransactionData {
  type: 'multisig';
  multiSigAddress: string;
  payload: TransactionPayloadEntryFunction;
  requiredSignatures: number;
  availableSigners: string[];
  maxGasAmount?: number;
  gasUnitPrice?: number;
}

// Enhanced simulation result for advanced features
export interface BatchSimulationResult extends SimulationResult {
  individualResults: SimulationResult[];
  dependencies: TransactionDependency[];
  parallelExecutionSavings?: number;
}

export interface SponsoredSimulationResult extends SimulationResult {
  sponsorCost: number;
  senderSavings: number;
  sponsorBalance: number;
  costComparison: {
    withSponsorship: number;
    withoutSponsorship: number;
  };
}

export interface MultiSigSimulationResult extends SimulationResult {
  signaturesRequired: number;
  signaturesProvided: number;
  signers: {
    address: string;
    signed: boolean;
    publicKey?: string;
  }[];
  approvalStatus: 'pending' | 'approved' | 'rejected';
}

export interface TransactionDependency {
  fromTransaction: number;
  toTransaction: number;
  dependencyType: 'state' | 'resource' | 'account';
  conflictRisk: 'low' | 'medium' | 'high';
}

// State Fork Types
export interface StateFork {
  id: string;
  name: string;
  description: string;
  baseBlockHeight: number;
  createdAt: Date;
  modifications: StateModification[];
  metadata: {
    network: 'devnet' | 'testnet' | 'mainnet';
    creator: string;
    tags: string[];
  };
}

export interface StateModification {
  address: string;
  resourceType: string;
  action: 'create' | 'modify' | 'delete';
  beforeValue?: any;
  afterValue?: any;
  timestamp: Date;
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