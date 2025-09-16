import { 
  VMExecutionTrace, 
  VMInstruction, 
  StackState, 
  GasUsageStep, 
  ModuleLoad, 
  ResourceAccess 
} from '@/types/simulation';

export class VMExecutionTracer {
  async analyzeExecution(simulationResult: any): Promise<VMExecutionTrace> {
    // Extract VM trace information from simulation result
    const trace: VMExecutionTrace = {
      instructions: this.extractInstructions(simulationResult),
      stackStates: this.extractStackStates(simulationResult),
      gasUsage: this.extractGasUsage(simulationResult),
      moduleLoads: this.extractModuleLoads(simulationResult),
      resourceAccesses: this.extractResourceAccesses(simulationResult),
    };

    return trace;
  }

  private extractInstructions(result: any): VMInstruction[] {
    // In a real implementation, this would parse the VM execution trace
    // For now, we'll create a simulated trace based on the transaction
    const instructions: VMInstruction[] = [];
    
    if (result.events && result.events.length > 0) {
      result.events.forEach((event: any, index: number) => {
        instructions.push({
          opcode: this.inferOpcode(event),
          operands: [event.data || {}],
          stackBefore: [],
          stackAfter: [],
          gasConsumed: Math.floor(result.gas_used / (result.events.length || 1)),
          timestamp: Date.now() + index,
        });
      });
    } else {
      // Create basic instruction sequence for entry function
      instructions.push(
        {
          opcode: 'CALL',
          operands: [result.function || 'unknown'],
          stackBefore: [],
          stackAfter: [],
          gasConsumed: Math.floor(result.gas_used * 0.1),
          timestamp: Date.now(),
        },
        {
          opcode: 'RET',
          operands: [],
          stackBefore: [],
          stackAfter: [],
          gasConsumed: Math.floor(result.gas_used * 0.05),
          timestamp: Date.now() + 1,
        }
      );
    }

    return instructions;
  }

  private extractStackStates(result: any): StackState[] {
    // Simulate stack states during execution
    const stackStates: StackState[] = [];
    const instructionCount = result.events?.length || 2;

    for (let i = 0; i <= instructionCount; i++) {
      stackStates.push({
        index: i,
        values: this.simulateStackAtStep(i, result),
      });
    }

    return stackStates;
  }

  private extractGasUsage(result: any): GasUsageStep[] {
    const totalGas = result.gas_used || 0;
    const steps = Math.min(10, Math.max(3, Math.floor(totalGas / 1000)));
    const gasSteps: GasUsageStep[] = [];
    
    let cumulativeGas = 0;
    const gasPerStep = Math.floor(totalGas / steps);

    for (let i = 0; i < steps; i++) {
      const stepGas = i === steps - 1 ? totalGas - cumulativeGas : gasPerStep;
      cumulativeGas += stepGas;
      
      gasSteps.push({
        step: i + 1,
        gasUsed: cumulativeGas,
        category: this.categorizeGasUsage(i, steps),
      });
    }

    return gasSteps;
  }

  private extractModuleLoads(result: any): ModuleLoad[] {
    const moduleLoads: ModuleLoad[] = [];
    
    // Extract module information from function calls
    if (result.function) {
      const functionParts = result.function.split('::');
      if (functionParts.length >= 2) {
        moduleLoads.push({
          address: functionParts[0],
          moduleName: functionParts[1],
          gasUsed: Math.floor((result.gas_used || 0) * 0.1),
        });
      }
    }

    return moduleLoads;
  }

  private extractResourceAccesses(result: any): ResourceAccess[] {
    const resourceAccesses: ResourceAccess[] = [];
    
    // Extract from state changes
    if (result.changes) {
      result.changes.forEach((change: any) => {
        resourceAccesses.push({
          address: change.address || 'unknown',
          resourceType: change.type || 'unknown',
          accessType: this.inferAccessType(change),
          gasUsed: Math.floor((result.gas_used || 0) * 0.05),
          beforeValue: change.data?.before,
          afterValue: change.data?.after || change.data,
        });
      });
    }

    return resourceAccesses;
  }

  private inferOpcode(event: any): string {
    if (event.type) {
      if (event.type.includes('withdraw')) return 'WITHDRAW';
      if (event.type.includes('deposit')) return 'DEPOSIT';
      if (event.type.includes('transfer')) return 'MOVE_TO';
      if (event.type.includes('create')) return 'CREATE';
    }
    return 'CALL';
  }

  private simulateStackAtStep(step: number, result: any): any[] {
    // Simulate stack contents based on execution step
    const baseStack: any[] = [];
    
    if (step > 0) {
      baseStack.push(`Step${step}_Value`);
    }
    
    if (result.function_arguments && step > 1) {
      baseStack.push(...result.function_arguments.slice(0, Math.min(step - 1, 3)));
    }

    return baseStack;
  }

  private categorizeGasUsage(step: number, totalSteps: number): 'intrinsic' | 'execution' | 'io' | 'storage' {
    if (step === 0) return 'intrinsic';
    if (step < totalSteps - 2) return 'execution';
    if (step === totalSteps - 2) return 'io';
    return 'storage';
  }

  private inferAccessType(change: any): 'read' | 'write' | 'create' | 'delete' {
    if (change.type === 'delete_resource') return 'delete';
    if (change.type === 'write_resource') return 'write';
    if (change.type === 'create_account') return 'create';
    return 'read';
  }

  // Advanced analysis methods
  analyzeResourceDependencies(trace: VMExecutionTrace): ResourceDependency[] {
    const dependencies: ResourceDependency[] = [];
    const accessMap = new Map<string, ResourceAccess[]>();

    // Group accesses by resource
    trace.resourceAccesses.forEach(access => {
      const key = `${access.address}::${access.resourceType}`;
      if (!accessMap.has(key)) {
        accessMap.set(key, []);
      }
      accessMap.get(key)!.push(access);
    });

    // Identify dependencies
    for (const [resource, accesses] of accessMap) {
      if (accesses.length > 1) {
        for (let i = 1; i < accesses.length; i++) {
          dependencies.push({
            resource,
            fromAccess: i - 1,
            toAccess: i,
            dependencyType: this.getDependencyType(accesses[i - 1], accesses[i]),
          });
        }
      }
    }

    return dependencies;
  }

  analyzeExecutionPath(trace: VMExecutionTrace): ExecutionPath {
    return {
      totalInstructions: trace.instructions.length,
      criticalPath: this.identifyCriticalPath(trace),
      branchPoints: this.identifyBranchPoints(trace),
      loopDetection: this.detectLoops(trace),
    };
  }

  private getDependencyType(access1: ResourceAccess, access2: ResourceAccess): 'read-after-write' | 'write-after-read' | 'write-after-write' {
    if (access1.accessType === 'write' && access2.accessType === 'read') return 'read-after-write';
    if (access1.accessType === 'read' && access2.accessType === 'write') return 'write-after-read';
    if (access1.accessType === 'write' && access2.accessType === 'write') return 'write-after-write';
    return 'read-after-write';
  }

  private identifyCriticalPath(trace: VMExecutionTrace): number[] {
    // Identify the sequence of instructions that consume the most gas
    return trace.instructions
      .map((_, index) => index)
      .sort((a, b) => trace.instructions[b].gasConsumed - trace.instructions[a].gasConsumed)
      .slice(0, Math.min(5, trace.instructions.length));
  }

  private identifyBranchPoints(trace: VMExecutionTrace): number[] {
    // In a real implementation, this would identify conditional branches
    return trace.instructions
      .map((inst, index) => ({ inst, index }))
      .filter(({ inst }) => inst.opcode.includes('BR') || inst.opcode.includes('IF'))
      .map(({ index }) => index);
  }

  private detectLoops(trace: VMExecutionTrace): LoopInfo[] {
    // 最適化されたループ検出 - 大量の命令がある場合は制限を設ける
    const loops: LoopInfo[] = [];
    const maxInstructions = 1000; // 最大1000命令まで処理
    
    if (trace.instructions.length > maxInstructions) {
      // 大量の命令の場合は簡略化された検出を行う
      return this.detectLoopsOptimized(trace.instructions.slice(0, maxInstructions));
    }
    
    const opcodeSequence = trace.instructions.map(inst => inst.opcode);
    
    // パターンサイズを動的に調整（大量の命令の場合は小さくする）
    const patternSize = opcodeSequence.length > 500 ? 2 : 3;
    
    for (let i = 0; i < opcodeSequence.length - patternSize; i++) {
      const pattern = opcodeSequence.slice(i, i + patternSize);
      const nextOccurrence = this.findPattern(opcodeSequence, pattern, i + patternSize);
      
      if (nextOccurrence !== -1) {
        loops.push({
          startIndex: i,
          endIndex: nextOccurrence + patternSize - 1,
          iterations: Math.floor((nextOccurrence - i) / pattern.length),
          pattern: pattern.join(' -> '),
        });
        
        // ループが見つかったら次のパターンにスキップ
        i = nextOccurrence + patternSize - 1;
      }
    }

    return loops;
  }

  private detectLoopsOptimized(instructions: VMInstruction[]): LoopInfo[] {
    // 簡略化されたループ検出（大量データ用）
    const loops: LoopInfo[] = [];
    const opcodeSequence = instructions.map(inst => inst.opcode);
    
    // より効率的なアルゴリズムを使用
    const patternMap = new Map<string, number[]>();
    
    for (let i = 0; i < opcodeSequence.length - 1; i++) {
      const pattern = opcodeSequence.slice(i, i + 2).join(' -> ');
      if (!patternMap.has(pattern)) {
        patternMap.set(pattern, []);
      }
      patternMap.get(pattern)!.push(i);
    }
    
    // 繰り返しパターンを検出
    for (const [pattern, positions] of patternMap) {
      if (positions.length > 1) {
        const firstPos = positions[0];
        const secondPos = positions[1];
        if (secondPos - firstPos <= 10) { // 近い位置での繰り返しのみ
          loops.push({
            startIndex: firstPos,
            endIndex: secondPos + 1,
            iterations: positions.length,
            pattern,
          });
        }
      }
    }
    
    return loops;
  }

  private findPattern(sequence: string[], pattern: string[], startFrom: number): number {
    for (let i = startFrom; i <= sequence.length - pattern.length; i++) {
      if (pattern.every((op, j) => sequence[i + j] === op)) {
        return i;
      }
    }
    return -1;
  }
}

// Additional types for VM analysis
export interface ResourceAccess {
  address: string;
  resourceType: string;
  accessType: 'read' | 'write' | 'create' | 'delete';
  gasUsed: number;
  beforeValue?: any;
  afterValue?: any;
}

export interface ResourceDependency {
  resource: string;
  fromAccess: number;
  toAccess: number;
  dependencyType: 'read-after-write' | 'write-after-read' | 'write-after-write';
}

export interface ExecutionPath {
  totalInstructions: number;
  criticalPath: number[];
  branchPoints: number[];
  loopDetection: LoopInfo[];
}

export interface LoopInfo {
  startIndex: number;
  endIndex: number;
  iterations: number;
  pattern: string;
}

export const vmExecutionTracer = new VMExecutionTracer();