import { SimulationResult } from '@/types/simulation';
import { TransactionData } from '@/types/aptos';

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

export interface ResourceAccess {
  resource_type: string;
  address: string;
  operation: 'read' | 'write' | 'create' | 'delete';
  before_value?: any;
  after_value?: any;
  gas_cost: number;
  instruction_index: number;
}

export interface GasUsageStep {
  instruction_index: number;
  gas_consumed: number;
  cumulative_gas: number;
  gas_remaining: number;
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

export class TraceSimulator {
  /**
   * Generate execution trace from simulation result
   */
  async simulateWithTrace(
    transactionData: TransactionData,
    simulationResult: SimulationResult
  ): Promise<VMExecutionTrace> {
    try {
      const instructions = await this.reconstructInstructions(simulationResult, transactionData);
      const functionCalls = this.extractFunctionCalls(simulationResult, transactionData);
      const resourceAccesses = this.extractResourceAccesses(simulationResult);
      const gasUsageSteps = this.calculateGasUsageSteps(instructions);
      
      return {
        instructions,
        function_calls: functionCalls,
        resource_accesses: resourceAccesses,
        gas_usage_steps: gasUsageSteps,
        execution_summary: this.generateExecutionSummary(instructions, functionCalls)
      };
    } catch (error) {
      throw new Error(`Trace simulation failed: ${error.message}`);
    }
  }

  private async reconstructInstructions(
    simulation: SimulationResult,
    transactionData: TransactionData
  ): Promise<VMInstruction[]> {
    const instructions: VMInstruction[] = [];
    const totalGas = simulation.gasUsed || 0;
    let instructionIndex = 0;
    let cumulativeGas = 0;
    
    const payload = transactionData.payload as any;
    
    // 1. Transaction prologue
    const prologueGas = 300;
    instructions.push(this.createInstruction(
      'TxnPrologue',
      [],
      prologueGas,
      [],
      [],
      instructionIndex++,
      0
    ));
    cumulativeGas += prologueGas;

    // 2. Load sender address
    const loadAddrGas = 50;
    instructions.push(this.createInstruction(
      'LdAddr',
      [transactionData.sender],
      loadAddrGas,
      [],
      [{ type: 'address', value: transactionData.sender }],
      instructionIndex++,
      0
    ));
    cumulativeGas += loadAddrGas;

    // 3. Load function arguments
    if (payload?.function_arguments) {
      payload.function_arguments.forEach((arg: any, index: number) => {
        const argGas = 25;
        instructions.push(this.createInstruction(
          'LdConst',
          [arg],
          argGas,
          [],
          [{ type: this.inferType(arg), value: arg }],
          instructionIndex++,
          0
        ));
        cumulativeGas += argGas;
      });
    }

    // 4. Load type arguments
    if (payload?.type_arguments) {
      payload.type_arguments.forEach((typeArg: string) => {
        const typeGas = 15;
        instructions.push(this.createInstruction(
          'LdType',
          [typeArg],
          typeGas,
          [],
          [{ type: 'type', value: typeArg }],
          instructionIndex++,
          0
        ));
        cumulativeGas += typeGas;
      });
    }

    // 5. Function call preparation
    if (payload?.function) {
      const prepGas = 100;
      instructions.push(this.createInstruction(
        'PrepareCall',
        [payload.function],
        prepGas,
        [],
        [],
        instructionIndex++,
        0
      ));
      cumulativeGas += prepGas;
    }

    // 6. Main function execution (bulk of gas consumption)
    const executionGas = Math.floor(totalGas * 0.6); // 60% of total gas
    const executionInstructions = this.generateExecutionInstructions(
      payload,
      executionGas,
      instructionIndex,
      1 // call depth 1 for main function
    );
    instructions.push(...executionInstructions);
    instructionIndex += executionInstructions.length;
    cumulativeGas += executionGas;

    // 7. Storage operations
    if (simulation.changes && simulation.changes.length > 0) {
      simulation.changes.forEach((change, index) => {
        const storageGas = this.calculateStorageGas(change);
        instructions.push(this.createInstruction(
          this.getStorageOpcode(change),
          [change],
          storageGas,
          [],
          [],
          instructionIndex++,
          0
        ));
        cumulativeGas += storageGas;
      });
    }

    // 8. Event emissions
    if (simulation.events && simulation.events.length > 0) {
      simulation.events.forEach((event, index) => {
        const eventGas = 100;
        instructions.push(this.createInstruction(
          'EmitEvent',
          [event],
          eventGas,
          [],
          [],
          instructionIndex++,
          0
        ));
        cumulativeGas += eventGas;
      });
    }

    // 9. Transaction epilogue
    const epilogueGas = 150;
    instructions.push(this.createInstruction(
      'TxnEpilogue',
      [],
      epilogueGas,
      [],
      [],
      instructionIndex++,
      0
    ));
    cumulativeGas += epilogueGas;

    // Adjust gas values to match actual total
    this.adjustGasValues(instructions, totalGas);

    return instructions;
  }

  private generateExecutionInstructions(
    payload: any,
    totalExecutionGas: number,
    startIndex: number,
    callDepth: number
  ): VMInstruction[] {
    const instructions: VMInstruction[] = [];
    const instructionCount = Math.floor(totalExecutionGas / 40); // Average 40 gas per instruction
    
    const moveOpcodes = [
      'LdU8', 'LdU16', 'LdU32', 'LdU64', 'LdU128', 'LdU256',
      'CopyLoc', 'MoveLoc', 'StLoc',
      'Call', 'CallGeneric', 'Ret',
      'BrTrue', 'BrFalse', 'Branch',
      'ReadRef', 'WriteRef', 'FreezeRef',
      'MutBorrowLoc', 'ImmBorrowLoc',
      'MutBorrowField', 'ImmBorrowField',
      'Pack', 'Unpack', 'Exists',
      'MoveFrom', 'MoveTo',
      'Add', 'Sub', 'Mul', 'Div', 'Mod',
      'BitOr', 'BitAnd', 'Xor',
      'Shl', 'Shr',
      'Lt', 'Gt', 'Le', 'Ge', 'Eq', 'Neq',
      'CastU8', 'CastU16', 'CastU32', 'CastU64', 'CastU128', 'CastU256',
      'Not', 'Pop', 'Dup'
    ];

    for (let i = 0; i < instructionCount; i++) {
      const opcode = moveOpcodes[i % moveOpcodes.length];
      const gasPerInstruction = Math.floor(totalExecutionGas / instructionCount);
      const variation = Math.floor(Math.random() * 20) - 10; // ±10 gas variation
      
      instructions.push(this.createInstruction(
        opcode,
        this.generateOperandsForOpcode(opcode),
        Math.max(1, gasPerInstruction + variation),
        this.generateMockStack(i),
        this.generateMockStack(i + 1),
        startIndex + i,
        callDepth
      ));
    }

    return instructions;
  }

  private generateOperandsForOpcode(opcode: string): any[] {
    switch (true) {
      case opcode.startsWith('Ld'):
        return [Math.floor(Math.random() * 1000)];
      case opcode.includes('Loc'):
        return [Math.floor(Math.random() * 10)];
      case opcode === 'Call':
        return ['0x1::coin::transfer'];
      case opcode.includes('Branch'):
        return [Math.floor(Math.random() * 5)];
      default:
        return [];
    }
  }

  private generateMockStack(depth: number): StackValue[] {
    const stackSize = Math.min(depth % 8, 5); // Realistic stack depth
    return Array.from({ length: stackSize }, (_, i) => ({
      type: ['u64', 'address', 'bool', 'vector<u8>'][i % 4],
      value: Math.floor(Math.random() * 1000)
    }));
  }

  private createInstruction(
    opcode: string,
    operands: any[],
    gasConsumed: number,
    stackBefore: StackValue[],
    stackAfter: StackValue[],
    instructionIndex: number,
    callDepth: number
  ): VMInstruction {
    return {
      opcode,
      operands,
      stack_before: stackBefore,
      stack_after: stackAfter,
      gas_consumed: gasConsumed,
      execution_time_ns: gasConsumed * 1000, // Approximate execution time
      instruction_index: instructionIndex,
      call_depth: callDepth
    };
  }

  private extractFunctionCalls(
    simulation: SimulationResult,
    transactionData: TransactionData
  ): FunctionCall[] {
    const calls: FunctionCall[] = [];
    const payload = transactionData.payload as any;
    
    if (payload?.function) {
      calls.push({
        module_id: this.extractModuleId(payload.function),
        function_name: this.extractFunctionName(payload.function),
        type_arguments: payload.type_arguments || [],
        arguments: payload.function_arguments || [],
        call_depth: 0,
        entry_instruction: 5, // After prologue and setup
        exit_instruction: Math.floor((simulation.gasUsed || 0) / 50), // Approximate
        gas_consumed: Math.floor((simulation.gasUsed || 0) * 0.7), // 70% of total gas
        success: simulation.success,
        return_values: []
      });
    }
    
    return calls;
  }

  private extractResourceAccesses(simulation: SimulationResult): ResourceAccess[] {
    const accesses: ResourceAccess[] = [];
    
    simulation.changes?.forEach((change, index) => {
      accesses.push({
        resource_type: this.inferResourceType(change),
        address: change.address || '',
        operation: this.determineOperation(change),
        before_value: undefined, // Not available in simulation
        after_value: change.data,
        gas_cost: this.calculateStorageGas(change),
        instruction_index: index + 10 // Approximate instruction index
      });
    });
    
    return accesses;
  }

  private calculateGasUsageSteps(instructions: VMInstruction[]): GasUsageStep[] {
    const steps: GasUsageStep[] = [];
    let cumulativeGas = 0;
    
    instructions.forEach((instruction, index) => {
      cumulativeGas += instruction.gas_consumed;
      steps.push({
        instruction_index: index,
        gas_consumed: instruction.gas_consumed,
        cumulative_gas: cumulativeGas,
        gas_remaining: Math.max(0, 200000 - cumulativeGas) // Assume 200k max gas
      });
    });
    
    return steps;
  }

  private generateExecutionSummary(
    instructions: VMInstruction[],
    functionCalls: FunctionCall[]
  ): VMExecutionTrace['execution_summary'] {
    return {
      total_instructions: instructions.length,
      total_function_calls: functionCalls.length,
      max_call_depth: Math.max(...instructions.map(i => i.call_depth), 0),
      total_execution_time_ns: instructions.reduce((sum, i) => sum + i.execution_time_ns, 0)
    };
  }

  // Helper methods
  private extractModuleId(functionName: string): string {
    const parts = functionName.split('::');
    return parts.length >= 2 ? `${parts[0]}::${parts[1]}` : '0x1::unknown';
  }

  private extractFunctionName(functionName: string): string {
    const parts = functionName.split('::');
    return parts[parts.length - 1] || 'unknown';
  }

  private inferResourceType(change: any): string {
    if (change.type === 'write_resource') {
      return change.state_key_hash ? '0x1::coin::CoinStore' : '0x1::account::Account';
    }
    return '0x1::unknown::Resource';
  }

  private determineOperation(change: any): 'read' | 'write' | 'create' | 'delete' {
    switch (change.type) {
      case 'write_resource':
        return change.data === null ? 'delete' : 'write';
      case 'write_module':
        return 'create';
      case 'delete_resource':
        return 'delete';
      default:
        return 'write';
    }
  }

  private calculateStorageGas(change: any): number {
    switch (change.type) {
      case 'write_resource':
        return change.data === null ? 100 : 500; // Delete vs write
      case 'write_module':
        return 1000;
      case 'delete_resource':
        return 100;
      default:
        return 200;
    }
  }

  private getStorageOpcode(change: any): string {
    switch (change.type) {
      case 'write_resource':
        return change.data === null ? 'DeleteResource' : 'WriteResource';
      case 'write_module':
        return 'WriteModule';
      case 'delete_resource':
        return 'DeleteResource';
      default:
        return 'WriteResource';
    }
  }

  private inferType(value: any): string {
    if (typeof value === 'string') {
      if (value.startsWith('0x')) return 'address';
      if (!isNaN(Number(value))) return 'u64';
      return 'string';
    }
    if (typeof value === 'number') return 'u64';
    if (typeof value === 'boolean') return 'bool';
    if (Array.isArray(value)) return 'vector<u8>';
    return 'unknown';
  }

  private adjustGasValues(instructions: VMInstruction[], targetTotal: number): void {
    const currentTotal = instructions.reduce((sum, i) => sum + i.gas_consumed, 0);
    if (currentTotal === 0) return;
    
    const ratio = targetTotal / currentTotal;
    instructions.forEach(instruction => {
      instruction.gas_consumed = Math.max(1, Math.floor(instruction.gas_consumed * ratio));
    });
  }
}

export const traceSimulator = new TraceSimulator();