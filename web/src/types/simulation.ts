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
  function_calls: FunctionCall[];
  resource_accesses: ResourceAccess[];
  gas_usage_steps: GasUsageStep[];
  execution_summary: {
    total_instructions: number;
    total_function_calls: number;
    max_call_depth: number;
    total_execution_time_ns: number;
  };
}

export interface VMInstruction {
  opcode: string;
  operands: any[];
  stack_before: StackValue[];
  stack_after: StackValue[];
  gas_consumed: number;
  execution_time_ns: number;
  instruction_index: number;
  call_depth: number;
}

export interface StackValue {
  type: string;
  value: any;
}

export interface FunctionCall {
  module_id: string;
  function_name: string;
  type_arguments: string[];
  arguments: any[];
  call_depth: number;
  entry_instruction: number;
  exit_instruction: number;
  gas_consumed: number;
  success: boolean;
  return_values: any[];
}

export interface StackState {
  index: number;
  values: any[];
}

export interface GasUsageStep {
  instruction_index: number;
  gas_consumed: number;
  cumulative_gas: number;
  gas_remaining: number;
}

export interface ModuleLoad {
  address: string;
  moduleName: string;
  gasUsed: number;
}

export interface ResourceAccess {
  resource_type: string;
  address: string;
  operation: 'read' | 'write' | 'create' | 'delete';
  before_value?: any;
  after_value?: any;
  gas_cost: number;
  instruction_index: number;
}

export interface DetailedGasBreakdown {
  intrinsic: {
    signature_verification: number;
    transaction_size: number;
    prologue_execution: number;
    epilogue_execution: number;
  };
  execution: {
    bytecode_instruction: number;
    function_call_overhead: number;
    move_value_operations: number;
    type_checking: number;
  };
  io: {
    storage_read: number;
    storage_write: number;
    event_emission: number;
    resource_access: number;
  };
  storage: {
    state_item_creation: number;
    state_item_modification: number;
    state_item_deletion: number;
    storage_refund: number;
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
  state_key_hash: string;
}

export interface SimulationEvent {
  type: string;
  data: any;
  guid: any;
  sequence_number: string;
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