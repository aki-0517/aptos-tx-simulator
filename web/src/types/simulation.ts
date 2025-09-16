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
  trace?: VMExecutionTrace;
  gasBreakdown?: DetailedGasBreakdown;
  stateAnalysis?: StateChangeAnalysis;
}

export interface VMExecutionTrace {
  instructions: VMInstruction[];
  stackStates: StackState[];
  gasUsage: GasUsageStep[];
  moduleLoads: ModuleLoad[];
  resourceAccesses: ResourceAccess[];
}

export interface VMInstruction {
  opcode: string;
  operands: any[];
  stackBefore: any[];
  stackAfter: any[];
  gasConsumed: number;
  timestamp: number;
}

export interface StackState {
  index: number;
  values: any[];
}

export interface GasUsageStep {
  step: number;
  gasUsed: number;
  category: 'intrinsic' | 'execution' | 'io' | 'storage';
}

export interface ModuleLoad {
  address: string;
  moduleName: string;
  gasUsed: number;
}

export interface ResourceAccess {
  address: string;
  resourceType: string;
  accessType: 'read' | 'write' | 'create' | 'delete';
  gasUsed: number;
  beforeValue?: any;
  afterValue?: any;
}

export interface DetailedGasBreakdown {
  intrinsic: {
    signature_verification: number;
    transaction_size: number;
    prologue_execution: number;
  };
  execution: {
    bytecode_instruction: number;
    function_call_overhead: number;
    move_value_operations: number;
  };
  io: {
    storage_read: number;
    storage_write: number;
    event_emission: number;
  };
  storage: {
    state_item_creation: number;
    state_item_modification: number;
    state_item_deletion: number;
  };
}

export interface StateChangeAnalysis {
  beforeState: any;
  afterState: any;
  coinStoreDiff: CoinStoreDiff;
  resourceDiff: ResourceDiff[];
}

export interface CoinStoreDiff {
  balanceChanges: Map<string, bigint>;
  newCoinTypes: string[];
  removedCoinTypes: string[];
}

export interface ResourceDiff {
  resourceType: string;
  action: 'created' | 'modified' | 'deleted';
  beforeValue?: any;
  afterValue?: any;
  fieldChanges?: Map<string, any>;
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
  enableTrace?: boolean;
  enableDetailedGasAnalysis?: boolean;
}

export interface TransactionStatus {
  status: 'pending' | 'simulating' | 'success' | 'error';
  result?: SimulationResult;
  error?: string;
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