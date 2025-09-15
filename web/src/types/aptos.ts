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
  type: 'entry_function' | 'script';
  payload: TransactionPayloadEntryFunction | TransactionPayloadScript;
  sender: string;
  maxGasAmount?: number;
  gasUnitPrice?: number;
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