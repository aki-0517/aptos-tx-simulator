import { SimulationResult } from '@/types/simulation';

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

export interface GasEfficiencyMetrics {
  overall_efficiency: number;
  category_efficiency: {
    intrinsic: number;
    execution: number;
    io: number;
    storage: number;
  };
  optimization_potential: number;
  recommendations: OptimizationRecommendation[];
}

export interface OptimizationRecommendation {
  category: 'intrinsic' | 'execution' | 'io' | 'storage';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_savings: number;
  implementation_difficulty: 'easy' | 'medium' | 'hard';
}

export class GasBreakdownGenerator {
  /**
   * Generate detailed gas breakdown from simulation result
   */
  generateFromSimulation(result: SimulationResult): DetailedGasBreakdown {
    const totalGas = result.gasUsed || 0;
    
    return {
      intrinsic: this.estimateIntrinsicCosts(result),
      execution: this.estimateExecutionCosts(result),
      io: this.estimateIOCosts(result),
      storage: this.estimateStorageCosts(result)
    };
  }

  private estimateIntrinsicCosts(result: SimulationResult): DetailedGasBreakdown['intrinsic'] {
    // Base transaction processing costs based on Aptos gas model
    const baseCost = 100;
    const sizeCost = this.calculateTransactionSizeCost(result);
    
    return {
      signature_verification: 300, // Ed25519 signature verification fixed cost
      transaction_size: sizeCost,
      prologue_execution: baseCost,
      epilogue_execution: baseCost / 2
    };
  }

  private estimateExecutionCosts(result: SimulationResult): DetailedGasBreakdown['execution'] {
    const totalGas = result.gasUsed || 0;
    // Execution costs typically account for 40-60% of total gas
    const executionPortion = totalGas * 0.5;
    
    return {
      bytecode_instruction: executionPortion * 0.6,
      function_call_overhead: executionPortion * 0.2,
      move_value_operations: executionPortion * 0.15,
      type_checking: executionPortion * 0.05
    };
  }

  private estimateIOCosts(result: SimulationResult): DetailedGasBreakdown['io'] {
    const changes = result.changes || [];
    const events = result.events || [];
    
    return {
      storage_read: changes.length * 300,
      storage_write: changes.length * 500,
      event_emission: events.length * 200,
      resource_access: changes.length * 100
    };
  }

  private estimateStorageCosts(result: SimulationResult): DetailedGasBreakdown['storage'] {
    const changes = result.changes || [];
    let creation = 0, modification = 0, deletion = 0;
    
    changes.forEach(change => {
      switch (change.type) {
        case 'write_resource':
          if (change.data === null) deletion++;
          else if (change.state_key_hash) modification++;
          else creation++;
          break;
        case 'write_module':
          creation++;
          break;
        case 'delete_resource':
          deletion++;
          break;
        default:
          modification++;
      }
    });
    
    return {
      state_item_creation: creation * 1000,
      state_item_modification: modification * 300,
      state_item_deletion: deletion * 100,
      storage_refund: deletion * 50
    };
  }

  private calculateTransactionSizeCost(result: SimulationResult): number {
    // Estimate transaction size cost based on payload complexity
    const baseSize = 100;
    const complexityMultiplier = (result.changes?.length || 0) + (result.events?.length || 0);
    return baseSize + (complexityMultiplier * 10);
  }

  /**
   * Analyze gas efficiency and generate recommendations
   */
  analyzeEfficiency(gasBreakdown: DetailedGasBreakdown, totalGas: number): GasEfficiencyMetrics {
    const categoryEfficiency = this.calculateCategoryEfficiency(gasBreakdown, totalGas);
    const overallEfficiency = this.calculateOverallEfficiency(categoryEfficiency);
    
    return {
      overall_efficiency: overallEfficiency,
      category_efficiency: categoryEfficiency,
      optimization_potential: this.calculateOptimizationPotential(gasBreakdown),
      recommendations: this.generateRecommendations(gasBreakdown, categoryEfficiency)
    };
  }

  private calculateCategoryEfficiency(
    gasBreakdown: DetailedGasBreakdown, 
    totalGas: number
  ): GasEfficiencyMetrics['category_efficiency'] {
    // Benchmarks based on Aptos network analysis
    const benchmarks = {
      intrinsic: 0.15,  // 15% of total gas is ideal
      execution: 0.50,  // 50% of total gas is ideal
      io: 0.25,         // 25% of total gas is ideal
      storage: 0.10     // 10% of total gas is ideal
    };

    const actual = {
      intrinsic: this.sumCategory(gasBreakdown.intrinsic) / totalGas,
      execution: this.sumCategory(gasBreakdown.execution) / totalGas,
      io: this.sumCategory(gasBreakdown.io) / totalGas,
      storage: this.sumCategory(gasBreakdown.storage) / totalGas
    };

    return {
      intrinsic: Math.max(0, 100 - Math.abs(actual.intrinsic - benchmarks.intrinsic) * 200),
      execution: Math.max(0, 100 - Math.abs(actual.execution - benchmarks.execution) * 200),
      io: Math.max(0, 100 - Math.abs(actual.io - benchmarks.io) * 200),
      storage: Math.max(0, 100 - Math.abs(actual.storage - benchmarks.storage) * 200)
    };
  }

  private calculateOverallEfficiency(categoryEfficiency: GasEfficiencyMetrics['category_efficiency']): number {
    const weights = { intrinsic: 0.2, execution: 0.4, io: 0.3, storage: 0.1 };
    return Math.round(
      categoryEfficiency.intrinsic * weights.intrinsic +
      categoryEfficiency.execution * weights.execution +
      categoryEfficiency.io * weights.io +
      categoryEfficiency.storage * weights.storage
    );
  }

  private calculateOptimizationPotential(gasBreakdown: DetailedGasBreakdown): number {
    const totalGas = this.sumAllCategories(gasBreakdown);
    const potentialSavings = 
      this.sumCategory(gasBreakdown.execution) * 0.2 + // 20% execution savings possible
      this.sumCategory(gasBreakdown.io) * 0.3 +        // 30% I/O savings possible
      this.sumCategory(gasBreakdown.storage) * 0.1;    // 10% storage savings possible
    
    return Math.round((potentialSavings / totalGas) * 100);
  }

  private generateRecommendations(
    gasBreakdown: DetailedGasBreakdown,
    efficiency: GasEfficiencyMetrics['category_efficiency']
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // Execution efficiency recommendations
    if (efficiency.execution < 70) {
      recommendations.push({
        category: 'execution',
        priority: 'high',
        title: 'Optimize Bytecode Execution',
        description: 'Reduce Move function complexity to improve gas efficiency',
        estimated_savings: this.sumCategory(gasBreakdown.execution) * 0.2,
        implementation_difficulty: 'medium'
      });
    }

    // I/O efficiency recommendations
    if (efficiency.io < 60) {
      recommendations.push({
        category: 'io',
        priority: 'medium',
        title: 'Batch Storage Operations',
        description: 'Combine multiple storage accesses to reduce I/O overhead',
        estimated_savings: this.sumCategory(gasBreakdown.io) * 0.3,
        implementation_difficulty: 'easy'
      });
    }

    // Storage efficiency recommendations
    if (efficiency.storage < 50) {
      recommendations.push({
        category: 'storage',
        priority: 'medium',
        title: 'Minimize State Changes',
        description: 'Reduce unnecessary state modifications and deletions',
        estimated_savings: this.sumCategory(gasBreakdown.storage) * 0.15,
        implementation_difficulty: 'easy'
      });
    }

    // High gas usage warning
    const totalGas = this.sumAllCategories(gasBreakdown);
    if (totalGas > 100000) {
      recommendations.push({
        category: 'execution',
        priority: 'high',
        title: 'High Gas Usage Detected',
        description: 'Consider breaking down complex operations into smaller transactions',
        estimated_savings: totalGas * 0.4,
        implementation_difficulty: 'hard'
      });
    }

    return recommendations;
  }

  private sumCategory(category: Record<string, number>): number {
    return Object.values(category).reduce((sum, value) => sum + value, 0);
  }

  private sumAllCategories(gasBreakdown: DetailedGasBreakdown): number {
    return this.sumCategory(gasBreakdown.intrinsic) +
           this.sumCategory(gasBreakdown.execution) +
           this.sumCategory(gasBreakdown.io) +
           this.sumCategory(gasBreakdown.storage);
  }
}

export const gasBreakdownGenerator = new GasBreakdownGenerator();