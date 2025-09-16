import { 
  TransactionData, 
  BatchTransactionData, 
  BatchSimulationResult,
  SimulationResult,
  TransactionDependency 
} from '@/types/aptos';
import { transactionSimulator } from './simulator';

export class BatchTransactionSimulator {
  async simulateBatch(batchData: BatchTransactionData): Promise<BatchSimulationResult> {
    const startTime = performance.now();
    
    try {
      const { transactions, executeSequentially } = batchData;
      const results: SimulationResult[] = [];
      const dependencies = this.analyzeDependencies(transactions);
      
      if (executeSequentially) {
        // Sequential execution - consider state changes
        return await this.executeSequentially(transactions, dependencies, startTime);
      } else {
        // Parallel execution - simulate concurrent execution
        return await this.executeParallel(transactions, dependencies, startTime);
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return this.createErrorResult(error, executionTime);
    }
  }

  private async executeSequentially(
    transactions: TransactionData[], 
    dependencies: TransactionDependency[],
    startTime: number
  ): Promise<BatchSimulationResult> {
    const results: SimulationResult[] = [];
    let totalGasUsed = 0;
    let totalCost = 0;
    let allSuccessful = true;
    let failureIndex = -1;

    for (let i = 0; i < transactions.length; i++) {
      const tx = transactions[i];
      
      try {
        const result = await transactionSimulator.simulateTransaction(tx);
        results.push(result);
        
        if (result.success) {
          totalGasUsed += result.gasUsed;
          totalCost += result.totalGasCost;
        } else {
          allSuccessful = false;
          failureIndex = i;
          break; // Stop on first failure in sequential execution
        }
      } catch (error) {
        allSuccessful = false;
        failureIndex = i;
        const errorResult: SimulationResult = {
          success: false,
          gasUsed: 0,
          gasUnitPrice: tx.gasUnitPrice || 100,
          totalGasCost: 0,
          totalGasCostAPT: 0,
          vmStatus: `Transaction ${i} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          executionTime: 0,
        };
        results.push(errorResult);
        break;
      }
    }

    const executionTime = performance.now() - startTime;
    const firstGasPrice = results[0]?.gasUnitPrice || 100;

    return {
      success: allSuccessful,
      gasUsed: totalGasUsed,
      gasUnitPrice: firstGasPrice,
      totalGasCost: totalCost,
      totalGasCostAPT: totalCost / 100000000,
      vmStatus: allSuccessful 
        ? 'All transactions executed successfully'
        : `Batch failed at transaction ${failureIndex + 1}`,
      executionTime,
      individualResults: results,
      dependencies,
      changes: results.flatMap(r => r.changes || []),
      events: results.flatMap(r => r.events || []),
    };
  }

  private async executeParallel(
    transactions: TransactionData[], 
    dependencies: TransactionDependency[],
    startTime: number
  ): Promise<BatchSimulationResult> {
    // Check if parallel execution is safe
    const hasConflicts = dependencies.some(dep => dep.conflictRisk === 'high');
    
    if (hasConflicts) {
      console.warn('High conflict risk detected, falling back to sequential execution');
      return await this.executeSequentially(transactions, dependencies, startTime);
    }

    // Simulate parallel execution
    const simulationPromises = transactions.map(async (tx, index) => {
      try {
        return await transactionSimulator.simulateTransaction(tx);
      } catch (error) {
        return {
          success: false,
          gasUsed: 0,
          gasUnitPrice: tx.gasUnitPrice || 100,
          totalGasCost: 0,
          totalGasCostAPT: 0,
          vmStatus: `Transaction ${index} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          executionTime: 0,
        } as SimulationResult;
      }
    });

    const results = await Promise.all(simulationPromises);
    const executionTime = performance.now() - startTime;
    
    const allSuccessful = results.every(r => r.success);
    const totalGasUsed = results.reduce((sum, r) => sum + r.gasUsed, 0);
    const totalCost = results.reduce((sum, r) => sum + r.totalGasCost, 0);
    const firstGasPrice = results[0]?.gasUnitPrice || 100;

    // Calculate parallel execution savings (estimated)
    const sequentialGasEstimate = totalGasUsed * 1.1; // 10% overhead for sequential
    const parallelExecutionSavings = Math.max(0, sequentialGasEstimate - totalGasUsed);

    return {
      success: allSuccessful,
      gasUsed: totalGasUsed,
      gasUnitPrice: firstGasPrice,
      totalGasCost: totalCost,
      totalGasCostAPT: totalCost / 100000000,
      vmStatus: allSuccessful 
        ? 'All transactions executed successfully in parallel'
        : 'Some transactions failed in parallel execution',
      executionTime,
      individualResults: results,
      dependencies,
      parallelExecutionSavings,
      changes: results.flatMap(r => r.changes || []),
      events: results.flatMap(r => r.events || []),
    };
  }

  private analyzeDependencies(transactions: TransactionData[]): TransactionDependency[] {
    const dependencies: TransactionDependency[] = [];
    
    // Simple dependency analysis based on sender addresses and function calls
    for (let i = 0; i < transactions.length; i++) {
      for (let j = i + 1; j < transactions.length; j++) {
        const tx1 = transactions[i];
        const tx2 = transactions[j];
        
        // Check if same sender (potential state conflict)
        if (tx1.sender === tx2.sender) {
          dependencies.push({
            fromTransaction: i,
            toTransaction: j,
            dependencyType: 'account',
            conflictRisk: 'medium'
          });
        }
        
        // Check if both are entry functions accessing same resources
        if (tx1.type === 'entry_function' && tx2.type === 'entry_function') {
          const payload1 = tx1.payload as any;
          const payload2 = tx2.payload as any;
          
          if (payload1.function === payload2.function) {
            dependencies.push({
              fromTransaction: i,
              toTransaction: j,
              dependencyType: 'resource',
              conflictRisk: 'high'
            });
          }
        }
      }
    }
    
    return dependencies;
  }

  private createErrorResult(error: unknown, executionTime: number): BatchSimulationResult {
    const errorMessage = error instanceof Error ? error.message : 'Batch simulation failed';
    
    return {
      success: false,
      gasUsed: 0,
      gasUnitPrice: 100,
      totalGasCost: 0,
      totalGasCostAPT: 0,
      vmStatus: errorMessage,
      executionTime,
      individualResults: [],
      dependencies: [],
    };
  }
}

export const batchTransactionSimulator = new BatchTransactionSimulator();