import { VMExecutionTrace, VMInstruction, StackState, GasUsageStep, ModuleLoad, ResourceAccess } from '@/types';
import { aptosClient } from './aptos-client';

export class VMTraceAnalyzer {
  constructor() {}

  /**
   * Get execution trace from simulation result
   */
  async getExecutionTrace(simulationResult: any): Promise<VMExecutionTrace | null> {
    if (!simulationResult.trace) {
      return null;
    }

    return this.parseVMTrace(simulationResult.trace);
  }

  /**
   * Parse VM trace data from Aptos simulation
   */
  parseVMTrace(traceData: any): VMExecutionTrace {
    const instructions: VMInstruction[] = [];
    const stackStates: StackState[] = [];
    const gasUsage: GasUsageStep[] = [];
    const moduleLoads: ModuleLoad[] = [];
    const resourceAccesses: ResourceAccess[] = [];

    // Parse execution events
    if (traceData.execution_gas_events) {
      traceData.execution_gas_events.forEach((event: any, index: number) => {
        if (event.type === 'instruction') {
          instructions.push({
            opcode: event.instruction?.opcode || 'unknown',
            operands: event.instruction?.operands || [],
            stack_before: (event.stack_before || []).map((item: any) => ({ type: typeof item, value: item })),
            stack_after: (event.stack_after || []).map((item: any) => ({ type: typeof item, value: item })),
            gas_consumed: parseInt(event.gas_consumed || '0'),
            execution_time_ns: (event.execution_time_ns || index * 1000),
            instruction_index: index,
            call_depth: event.call_depth || 0,
          });
        }
      });
    }

    // Parse stack states
    if (traceData.stack_trace) {
      traceData.stack_trace.forEach((trace: any, index: number) => {
        stackStates.push({
          index,
          values: trace.values || [],
        });
      });
    }

    // Parse gas usage
    if (traceData.gas_events) {
      traceData.gas_events.forEach((event: any, index: number) => {
        gasUsage.push({
          instruction_index: index,
          gas_consumed: parseInt(event.gas_used || '0'),
          cumulative_gas: parseInt(event.cumulative_gas || '0'),
          gas_remaining: parseInt(event.gas_remaining || '0'),
        });
      });
    }

    // Parse module loads
    if (traceData.module_events) {
      traceData.module_events.forEach((event: any) => {
        if (event.type === 'module_load') {
          moduleLoads.push({
            address: event.address || '',
            moduleName: event.module_name || '',
            gasUsed: parseInt(event.gas_used || '0'),
          });
        }
      });
    }

    // Parse resource accesses
    if (traceData.io_events) {
      traceData.io_events.forEach((event: any) => {
        resourceAccesses.push({
          address: event.address || '',
          resource_type: event.resource_type || '',
          operation: this.mapOperationType(event.operation || 'read'),
          gas_cost: parseInt(event.gas_used || '0'),
          instruction_index: index,
        });
      });
    }

    return {
      instructions,
      function_calls: [],
      resource_accesses: resourceAccesses,
      gas_usage_steps: gasUsage,
      execution_summary: {
        total_instructions: instructions.length,
        total_function_calls: 0,
        max_call_depth: Math.max(...instructions.map(i => i.call_depth), 0),
        total_execution_time_ns: instructions.reduce((sum, i) => sum + i.execution_time_ns, 0),
      },
    };
  }

  /**
   * Simulate transaction with trace enabled
   */
  async simulateWithTrace(transaction: any): Promise<{ result: any; trace: VMExecutionTrace | null }> {
    const aptos = aptosClient.getCurrentClient();

    try {
      // Note: This would require SDK support for trace simulation
      // For now, we simulate the API call structure
      const response = await fetch(`${aptos.config.fullnode}/transactions/simulate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Aptos-Simulate-Enable-Trace': 'true', // Custom header for trace
        },
        body: JSON.stringify({
          ...transaction,
          options: {
            ...transaction.options,
            enable_trace: true,
          },
        }),
      });

      const result = await response.json();
      const trace = result.trace ? this.parseVMTrace(result.trace) : null;

      return { result, trace };
    } catch (error) {
      console.warn('Trace simulation not available:', error);
      // Fallback to regular simulation
      const result = await aptos.transaction.simulate.simple(transaction);
      return { result: result[0] || null, trace: null };
    }
  }

  /**
   * Analyze execution steps for patterns
   */
  analyzeExecutionPattern(trace: VMExecutionTrace): {
    totalInstructions: number;
    gasHotspots: Array<{ instruction: string; gasUsed: number; count: number }>;
    stackDepthAnalysis: { maxDepth: number; avgDepth: number };
    moduleUsage: Array<{ module: string; loadCount: number; gasUsed: number }>;
  } {
    const totalInstructions = trace.instructions.length;

    // Gas hotspots analysis
    const gasHotspots = new Map<string, { gasUsed: number; count: number }>();
    trace.instructions.forEach(instruction => {
      const existing = gasHotspots.get(instruction.opcode) || { gasUsed: 0, count: 0 };
      gasHotspots.set(instruction.opcode, {
        gasUsed: existing.gasUsed + instruction.gas_consumed,
        count: existing.count + 1,
      });
    });

    const sortedHotspots = Array.from(gasHotspots.entries())
      .map(([instruction, data]) => ({ instruction, ...data }))
      .sort((a, b) => b.gasUsed - a.gasUsed);

    // Stack depth analysis
    const stackDepths = trace.instructions.map(inst => inst.stack_after.length);
    const maxDepth = Math.max(...stackDepths, 0);
    const avgDepth = stackDepths.reduce((sum, depth) => sum + depth, 0) / Math.max(stackDepths.length, 1);

    // Module usage analysis
    const moduleUsage = new Map<string, { loadCount: number; gasUsed: number }>();
    trace.function_calls.forEach(call => {
      const key = `${call.module_id}::${call.function_name}`;
      const existing = moduleUsage.get(key) || { loadCount: 0, gasUsed: 0 };
      moduleUsage.set(key, {
        loadCount: existing.loadCount + 1,
        gasUsed: existing.gasUsed + call.gas_consumed,
      });
    });

    const sortedModuleUsage = Array.from(moduleUsage.entries())
      .map(([module, data]) => ({ module, ...data }))
      .sort((a, b) => b.gasUsed - a.gasUsed);

    return {
      totalInstructions,
      gasHotspots: sortedHotspots,
      stackDepthAnalysis: { maxDepth, avgDepth },
      moduleUsage: sortedModuleUsage,
    };
  }

  /**
   * Get execution timeline for visualization
   */
  getExecutionTimeline(trace: VMExecutionTrace): Array<{
    timestamp: number;
    event: string;
    details: any;
    gasUsed: number;
  }> {
    const timeline: Array<{
      timestamp: number;
      event: string;
      details: any;
      gasUsed: number;
    }> = [];

    // Add instruction events
    trace.instructions.forEach(instruction => {
      timeline.push({
        timestamp: instruction.execution_time_ns / 1000000, // Convert to ms
        event: 'instruction',
        details: {
          opcode: instruction.opcode,
          operands: instruction.operands,
        },
        gasUsed: instruction.gas_consumed,
      });
    });

    // Add module load events
    trace.function_calls.forEach((call, index) => {
      timeline.push({
        timestamp: index, // Module loads don't have timestamps, use index
        event: 'module_load',
        details: {
          module_id: call.module_id,
          function_name: call.function_name,
        },
        gasUsed: call.gas_consumed,
      });
    });

    // Add resource access events
    trace.resource_accesses.forEach((access, index) => {
      timeline.push({
        timestamp: index,
        event: 'resource_access',
        details: {
          address: access.address,
          resource_type: access.resource_type,
          operation: access.operation,
        },
        gasUsed: access.gas_cost,
      });
    });

    return timeline.sort((a, b) => a.timestamp - b.timestamp);
  }

  private categorizeGasUsage(eventType: string): 'intrinsic' | 'execution' | 'io' | 'storage' {
    if (eventType.includes('signature') || eventType.includes('prologue')) {
      return 'intrinsic';
    }
    if (eventType.includes('read') || eventType.includes('write')) {
      return 'storage';
    }
    if (eventType.includes('event') || eventType.includes('emit')) {
      return 'io';
    }
    return 'execution';
  }

  private mapOperationType(operation: string): 'read' | 'write' | 'create' | 'delete' {
    switch (operation.toLowerCase()) {
      case 'write':
      case 'modify':
        return 'write';
      case 'create':
      case 'new':
        return 'create';
      case 'delete':
      case 'remove':
        return 'delete';
      default:
        return 'read';
    }
  }
}

export const vmTraceAnalyzer = new VMTraceAnalyzer();