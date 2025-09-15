export interface SimulationResult {
  success: boolean;
  gasUsed: number;
  gasUnitPrice: number;
  totalGasCost: number;
  totalGasCostAPT: number;
  vmStatus: string;
  changes?: StateChange[];
  events?: SimulationEvent[];
  error?: SimulationError;
  executionTime: number;
}

export interface StateChange {
  address: string;
  data: any;
  type: 'write_resource' | 'delete_resource' | 'write_module' | 'delete_module';
}

export interface SimulationEvent {
  type: string;
  data: any;
}

export interface SimulationError {
  code: string;
  message: string;
  details?: string;
  suggestion?: string;
}

export interface GasEstimation {
  gasUsed: number;
  gasUnitPrice: number;
  maxGasAmount: number;
  totalCost: number;
  totalCostAPT: number;
  efficiency: 'low' | 'medium' | 'high';
  recommendation?: string;
}

export interface SimulationConfig {
  network: string;
  estimateMaxGas: boolean;
  includeChanges: boolean;
  includeEvents: boolean;
}

export interface TransactionStatus {
  status: 'pending' | 'simulating' | 'success' | 'error';
  result?: SimulationResult;
  error?: string;
}