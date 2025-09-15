import { DetailedGasBreakdown, SimulationResult, StateChange, SimulationEvent } from '@/types';

export class GasAnalyzer {
  constructor() {}

  /**
   * Analyze detailed gas breakdown from simulation result
   */
  analyzeDetailedGas(simulationResult: any): DetailedGasBreakdown {
    const totalGasUsed = parseInt(simulationResult.gas_used || '0');
    
    // Default breakdown structure
    const breakdown: DetailedGasBreakdown = {
      intrinsic: {
        signature_verification: 0,
        transaction_size: 0,
        prologue_execution: 0,
      },
      execution: {
        bytecode_instruction: 0,
        function_call_overhead: 0,
        move_value_operations: 0,
      },
      io: {
        storage_read: 0,
        storage_write: 0,
        event_emission: 0,
      },
      storage: {
        state_item_creation: 0,
        state_item_modification: 0,
        state_item_deletion: 0,
      },
    };

    // Estimate intrinsic gas costs
    breakdown.intrinsic.signature_verification = this.estimateSignatureVerificationGas();
    breakdown.intrinsic.transaction_size = this.estimateTransactionSizeGas(simulationResult);
    breakdown.intrinsic.prologue_execution = this.estimatePrologueGas();

    // Analyze execution gas from changes and events
    if (simulationResult.changes) {
      const storageAnalysis = this.analyzeStorageOperations(simulationResult.changes);
      breakdown.storage.state_item_creation = storageAnalysis.creations;
      breakdown.storage.state_item_modification = storageAnalysis.modifications;
      breakdown.storage.state_item_deletion = storageAnalysis.deletions;
      breakdown.io.storage_read = storageAnalysis.reads;
      breakdown.io.storage_write = storageAnalysis.writes;
    }

    if (simulationResult.events) {
      breakdown.io.event_emission = this.analyzeEventEmissionGas(simulationResult.events);
    }

    // Calculate remaining execution gas
    const intrinsicTotal = Object.values(breakdown.intrinsic).reduce((sum, val) => sum + val, 0);
    const ioTotal = Object.values(breakdown.io).reduce((sum, val) => sum + val, 0);
    const storageTotal = Object.values(breakdown.storage).reduce((sum, val) => sum + val, 0);
    
    const executionGas = Math.max(0, totalGasUsed - intrinsicTotal - ioTotal - storageTotal);
    
    // Distribute execution gas
    breakdown.execution.bytecode_instruction = Math.floor(executionGas * 0.6);
    breakdown.execution.function_call_overhead = Math.floor(executionGas * 0.3);
    breakdown.execution.move_value_operations = executionGas - breakdown.execution.bytecode_instruction - breakdown.execution.function_call_overhead;

    return breakdown;
  }

  /**
   * Estimate gas cost for signature verification
   */
  private estimateSignatureVerificationGas(): number {
    // Ed25519 signature verification typically costs around 61 gas units
    return 61;
  }

  /**
   * Estimate gas cost based on transaction size
   */
  private estimateTransactionSizeGas(simulationResult: any): number {
    // Estimate based on transaction complexity
    // Base cost: 20 gas units
    // Additional cost based on payload size
    let baseCost = 20;
    
    if (simulationResult.payload) {
      const payloadSize = JSON.stringify(simulationResult.payload).length;
      baseCost += Math.floor(payloadSize / 100); // 1 gas per ~100 bytes
    }
    
    return baseCost;
  }

  /**
   * Estimate prologue execution gas
   */
  private estimatePrologueGas(): number {
    // Prologue typically includes sequence number check, balance check, etc.
    return 150;
  }

  /**
   * Analyze gas costs from storage operations
   */
  private analyzeStorageOperations(changes: any[]): {
    creations: number;
    modifications: number;
    deletions: number;
    reads: number;
    writes: number;
  } {
    const analysis = {
      creations: 0,
      modifications: 0,
      deletions: 0,
      reads: 0,
      writes: 0,
    };

    changes.forEach(change => {
      switch (change.type) {
        case 'write_resource':
          analysis.modifications += 300; // Estimated cost for resource modification
          analysis.writes += 100;
          break;
        case 'delete_resource':
          analysis.deletions += 200;
          break;
        case 'write_module':
          analysis.creations += 1000; // Module publication is expensive
          analysis.writes += 500;
          break;
        case 'delete_module':
          analysis.deletions += 500;
          break;
        default:
          analysis.reads += 50; // Default read cost
      }
    });

    return analysis;
  }

  /**
   * Analyze gas costs from event emission
   */
  private analyzeEventEmissionGas(events: any[]): number {
    // Each event emission costs approximately 80-100 gas units
    return events.length * 90;
  }

  /**
   * Calculate gas efficiency metrics
   */
  calculateGasEfficiency(gasBreakdown: DetailedGasBreakdown): {
    efficiency: 'low' | 'medium' | 'high';
    recommendations: string[];
    optimizationPotential: number;
  } {
    const totalGas = this.getTotalGasFromBreakdown(gasBreakdown);
    const executionGas = Object.values(gasBreakdown.execution).reduce((sum, val) => sum + val, 0);
    const storageGas = Object.values(gasBreakdown.storage).reduce((sum, val) => sum + val, 0);
    
    const recommendations: string[] = [];
    let optimizationPotential = 0;

    // Analyze execution efficiency
    const executionRatio = executionGas / totalGas;
    if (executionRatio > 0.7) {
      recommendations.push('Consider optimizing Move bytecode - high execution gas usage detected');
      optimizationPotential += 20;
    }

    // Analyze storage efficiency
    const storageRatio = storageGas / totalGas;
    if (storageRatio > 0.4) {
      recommendations.push('High storage operation costs - consider batching or reducing state modifications');
      optimizationPotential += 15;
    }

    // Analyze creation vs modification ratio
    if (gasBreakdown.storage.state_item_creation > gasBreakdown.storage.state_item_modification * 2) {
      recommendations.push('Many new state items created - consider resource pooling strategies');
      optimizationPotential += 10;
    }

    // Overall efficiency rating
    let efficiency: 'low' | 'medium' | 'high' = 'medium';
    if (totalGas < 500) {
      efficiency = 'high';
    } else if (totalGas > 2000 || optimizationPotential > 30) {
      efficiency = 'low';
    }

    return {
      efficiency,
      recommendations,
      optimizationPotential,
    };
  }

  /**
   * Get gas usage by category as percentages
   */
  getGasDistribution(gasBreakdown: DetailedGasBreakdown): {
    intrinsic: number;
    execution: number;
    io: number;
    storage: number;
  } {
    const totalGas = this.getTotalGasFromBreakdown(gasBreakdown);
    
    if (totalGas === 0) {
      return { intrinsic: 0, execution: 0, io: 0, storage: 0 };
    }

    const intrinsicTotal = Object.values(gasBreakdown.intrinsic).reduce((sum, val) => sum + val, 0);
    const executionTotal = Object.values(gasBreakdown.execution).reduce((sum, val) => sum + val, 0);
    const ioTotal = Object.values(gasBreakdown.io).reduce((sum, val) => sum + val, 0);
    const storageTotal = Object.values(gasBreakdown.storage).reduce((sum, val) => sum + val, 0);

    return {
      intrinsic: (intrinsicTotal / totalGas) * 100,
      execution: (executionTotal / totalGas) * 100,
      io: (ioTotal / totalGas) * 100,
      storage: (storageTotal / totalGas) * 100,
    };
  }

  /**
   * Compare gas usage between two simulation results
   */
  compareGasUsage(
    baseline: DetailedGasBreakdown,
    comparison: DetailedGasBreakdown
  ): {
    totalDifference: number;
    categoryDifferences: {
      intrinsic: number;
      execution: number;
      io: number;
      storage: number;
    };
    recommendations: string[];
  } {
    const baselineTotal = this.getTotalGasFromBreakdown(baseline);
    const comparisonTotal = this.getTotalGasFromBreakdown(comparison);
    
    const totalDifference = ((comparisonTotal - baselineTotal) / baselineTotal) * 100;
    
    const baselineIntrinsic = Object.values(baseline.intrinsic).reduce((sum, val) => sum + val, 0);
    const comparisonIntrinsic = Object.values(comparison.intrinsic).reduce((sum, val) => sum + val, 0);
    
    const baselineExecution = Object.values(baseline.execution).reduce((sum, val) => sum + val, 0);
    const comparisonExecution = Object.values(comparison.execution).reduce((sum, val) => sum + val, 0);
    
    const baselineIo = Object.values(baseline.io).reduce((sum, val) => sum + val, 0);
    const comparisonIo = Object.values(comparison.io).reduce((sum, val) => sum + val, 0);
    
    const baselineStorage = Object.values(baseline.storage).reduce((sum, val) => sum + val, 0);
    const comparisonStorage = Object.values(comparison.storage).reduce((sum, val) => sum + val, 0);

    const categoryDifferences = {
      intrinsic: baselineIntrinsic === 0 ? 0 : ((comparisonIntrinsic - baselineIntrinsic) / baselineIntrinsic) * 100,
      execution: baselineExecution === 0 ? 0 : ((comparisonExecution - baselineExecution) / baselineExecution) * 100,
      io: baselineIo === 0 ? 0 : ((comparisonIo - baselineIo) / baselineIo) * 100,
      storage: baselineStorage === 0 ? 0 : ((comparisonStorage - baselineStorage) / baselineStorage) * 100,
    };

    const recommendations: string[] = [];
    
    if (categoryDifferences.execution > 50) {
      recommendations.push('Execution gas increased significantly - review algorithmic changes');
    }
    
    if (categoryDifferences.storage > 30) {
      recommendations.push('Storage operations increased - consider optimization');
    }
    
    if (totalDifference > 20) {
      recommendations.push('Overall gas usage increased substantially - comprehensive review recommended');
    }

    return {
      totalDifference,
      categoryDifferences,
      recommendations,
    };
  }

  private getTotalGasFromBreakdown(gasBreakdown: DetailedGasBreakdown): number {
    const intrinsicTotal = Object.values(gasBreakdown.intrinsic).reduce((sum, val) => sum + val, 0);
    const executionTotal = Object.values(gasBreakdown.execution).reduce((sum, val) => sum + val, 0);
    const ioTotal = Object.values(gasBreakdown.io).reduce((sum, val) => sum + val, 0);
    const storageTotal = Object.values(gasBreakdown.storage).reduce((sum, val) => sum + val, 0);
    
    return intrinsicTotal + executionTotal + ioTotal + storageTotal;
  }
}

export const gasAnalyzer = new GasAnalyzer();