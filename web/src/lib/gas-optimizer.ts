import { networkMonitor, NetworkState } from './network-monitor';
import { TransactionData, SimulationResult } from '@/types';
import { transactionSimulator } from './simulator';

export interface GasOptimizationSuggestion {
  currentSettings: {
    gasPrice: number;
    maxGas: number;
  };
  optimizedSettings: {
    gasPrice: number;
    maxGas: number;
    estimatedSavings: number;
    confirmationTime: number;
  };
  rationale: string;
  confidence: number; // 0-100
  alternativeOptions: AlternativeOption[];
}

export interface AlternativeOption {
  label: string;
  gasPrice: number;
  maxGas: number;
  estimatedTime: number;
  savings: number;
  description: string;
}

export interface BatchOptimizationSuggestion {
  originalGasCost: number;
  optimizedGasCost: number;
  savings: number;
  recommendations: string[];
  reorderedTransactions?: TransactionData[];
}

export class GasOptimizer {
  private static instance: GasOptimizer;

  private constructor() {}

  static getInstance(): GasOptimizer {
    if (!GasOptimizer.instance) {
      GasOptimizer.instance = new GasOptimizer();
    }
    return GasOptimizer.instance;
  }

  async analyzeTransaction(transaction: TransactionData): Promise<GasOptimizationSuggestion> {
    const networkState = await networkMonitor.getCurrentNetworkState();
    
    // Get current transaction settings
    const currentGasPrice = transaction.gasUnitPrice || networkState.currentGasPrice;
    const currentMaxGas = transaction.maxGasAmount || 10000;

    // Simulate transaction to get actual gas usage
    let actualGasUsed = currentMaxGas;
    try {
      const simulationResult = await transactionSimulator.simulateTransaction(transaction);
      if (simulationResult.success) {
        actualGasUsed = simulationResult.gasUsed;
      }
    } catch {
      // Use fallback estimation
      actualGasUsed = Math.floor(currentMaxGas * 0.7);
    }

    // Calculate optimal settings
    const optimizedGasPrice = await this.calculateOptimalGasPrice(networkState, 'standard');
    const optimizedMaxGas = Math.ceil(actualGasUsed * 1.2); // 20% buffer

    // Calculate savings
    const currentCost = currentGasPrice * actualGasUsed;
    const optimizedCost = optimizedGasPrice * actualGasUsed;
    const savings = currentCost - optimizedCost;

    // Generate rationale
    const rationale = this.generateOptimizationRationale(
      networkState,
      currentGasPrice,
      optimizedGasPrice,
      currentMaxGas,
      optimizedMaxGas
    );

    // Calculate confidence based on network state and historical data
    const confidence = this.calculateConfidence(networkState, actualGasUsed);

    // Generate alternative options
    const alternativeOptions = await this.generateAlternativeOptions(
      networkState,
      actualGasUsed,
      optimizedGasPrice
    );

    return {
      currentSettings: {
        gasPrice: currentGasPrice,
        maxGas: currentMaxGas,
      },
      optimizedSettings: {
        gasPrice: optimizedGasPrice,
        maxGas: optimizedMaxGas,
        estimatedSavings: Math.max(0, savings),
        confirmationTime: this.estimateConfirmationTime(networkState, optimizedGasPrice),
      },
      rationale,
      confidence,
      alternativeOptions,
    };
  }

  async suggestBatchOptimization(transactions: TransactionData[]): Promise<BatchOptimizationSuggestion> {
    const networkState = await networkMonitor.getCurrentNetworkState();
    
    let originalGasCost = 0;
    const simulationResults: SimulationResult[] = [];

    // Simulate each transaction to get gas usage
    for (const tx of transactions) {
      try {
        const result = await transactionSimulator.simulateTransaction(tx);
        simulationResults.push(result);
        const gasPrice = tx.gasUnitPrice || networkState.currentGasPrice;
        originalGasCost += result.gasUsed * gasPrice;
      } catch {
        // Use fallback estimation
        const gasPrice = tx.gasUnitPrice || networkState.currentGasPrice;
        originalGasCost += 1000 * gasPrice;
      }
    }

    // Analyze batch optimization opportunities
    const recommendations: string[] = [];
    let optimizedGasCost = originalGasCost;
    let reorderedTransactions: TransactionData[] | undefined;

    // 1. Uniform gas price optimization
    const optimalGasPrice = await this.calculateOptimalGasPrice(networkState, 'standard');
    const totalGasUsed = simulationResults.reduce((sum, result) => sum + result.gasUsed, 0);
    const uniformCost = totalGasUsed * optimalGasPrice;
    
    if (uniformCost < optimizedGasCost) {
      optimizedGasCost = uniformCost;
      recommendations.push(`Use uniform gas price of ${optimalGasPrice} octas for all transactions`);
    }

    // 2. Transaction reordering for dependency optimization
    if (transactions.length > 1) {
      const dependencyAnalysis = this.analyzeTransactionDependencies(transactions);
      if (dependencyAnalysis.canOptimize) {
        reorderedTransactions = dependencyAnalysis.optimizedOrder;
        recommendations.push('Reorder transactions to optimize state access patterns');
        optimizedGasCost *= 0.95; // Assume 5% savings from reordering
      }
    }

    // 3. Max gas amount optimization
    const totalMaxGas = transactions.reduce((sum, tx) => sum + (tx.maxGasAmount || 10000), 0);
    const actualTotalGas = Math.ceil(totalGasUsed * 1.15); // 15% buffer for batch
    if (actualTotalGas < totalMaxGas) {
      recommendations.push(`Reduce total max gas from ${totalMaxGas} to ${actualTotalGas}`);
    }

    // 4. Timing optimization
    if (networkState.networkCongestion === 'high') {
      recommendations.push('Consider delaying non-urgent transactions until network congestion decreases');
      recommendations.push('Prioritize only critical transactions during high congestion periods');
    }

    const savings = originalGasCost - optimizedGasCost;

    return {
      originalGasCost,
      optimizedGasCost,
      savings: Math.max(0, savings),
      recommendations,
      reorderedTransactions,
    };
  }

  private async calculateOptimalGasPrice(
    networkState: NetworkState, 
    priority: 'fast' | 'standard' | 'slow'
  ): Promise<number> {
    return await networkMonitor.predictOptimalGasPrice(priority);
  }

  private generateOptimizationRationale(
    networkState: NetworkState,
    currentGasPrice: number,
    optimizedGasPrice: number,
    currentMaxGas: number,
    optimizedMaxGas: number
  ): string {
    const rationales: string[] = [];

    // Gas price analysis
    if (optimizedGasPrice < currentGasPrice) {
      const savings = ((currentGasPrice - optimizedGasPrice) / currentGasPrice * 100).toFixed(1);
      rationales.push(`Reduced gas price by ${savings}% based on current network conditions (${networkState.networkCongestion} congestion)`);
    } else if (optimizedGasPrice > currentGasPrice) {
      const increase = ((optimizedGasPrice - currentGasPrice) / currentGasPrice * 100).toFixed(1);
      rationales.push(`Increased gas price by ${increase}% to ensure faster confirmation during ${networkState.networkCongestion} congestion`);
    }

    // Max gas analysis
    if (optimizedMaxGas < currentMaxGas) {
      const reduction = ((currentMaxGas - optimizedMaxGas) / currentMaxGas * 100).toFixed(1);
      rationales.push(`Reduced max gas limit by ${reduction}% based on estimated actual usage`);
    }

    // Network-specific advice
    switch (networkState.networkCongestion) {
      case 'low':
        rationales.push('Low network congestion allows for lower gas prices without significant delay');
        break;
      case 'medium':
        rationales.push('Moderate congestion - balanced approach between cost and speed');
        break;
      case 'high':
        rationales.push('High congestion requires higher gas prices for timely confirmation');
        break;
    }

    return rationales.join('. ');
  }

  private calculateConfidence(networkState: NetworkState, actualGasUsed: number): number {
    let confidence = 70; // Base confidence

    // Adjust based on network stability
    if (networkState.networkCongestion === 'low') {
      confidence += 15;
    } else if (networkState.networkCongestion === 'high') {
      confidence -= 10;
    }

    // Adjust based on gas usage predictability
    if (actualGasUsed < 1000) {
      confidence += 10; // Simple transactions are more predictable
    } else if (actualGasUsed > 5000) {
      confidence -= 5; // Complex transactions are less predictable
    }

    // Adjust based on historical data availability
    const historicalTrends = networkMonitor.getHistoricalGasTrends(2);
    if (historicalTrends.length > 0) {
      confidence += 10;
    }

    return Math.min(95, Math.max(30, confidence));
  }

  private async generateAlternativeOptions(
    networkState: NetworkState,
    actualGasUsed: number,
    standardGasPrice: number
  ): Promise<AlternativeOption[]> {
    const options: AlternativeOption[] = [];

    // Economy option
    const slowGasPrice = await networkMonitor.predictOptimalGasPrice('slow');
    options.push({
      label: 'Economy',
      gasPrice: slowGasPrice,
      maxGas: Math.ceil(actualGasUsed * 1.2),
      estimatedTime: this.estimateConfirmationTime(networkState, slowGasPrice),
      savings: (standardGasPrice - slowGasPrice) * actualGasUsed,
      description: 'Lower cost, slower confirmation',
    });

    // Fast option
    const fastGasPrice = await networkMonitor.predictOptimalGasPrice('fast');
    options.push({
      label: 'Fast',
      gasPrice: fastGasPrice,
      maxGas: Math.ceil(actualGasUsed * 1.15),
      estimatedTime: this.estimateConfirmationTime(networkState, fastGasPrice),
      savings: (standardGasPrice - fastGasPrice) * actualGasUsed,
      description: 'Higher cost, faster confirmation',
    });

    // Conservative option (higher max gas, same price)
    options.push({
      label: 'Conservative',
      gasPrice: standardGasPrice,
      maxGas: Math.ceil(actualGasUsed * 1.5),
      estimatedTime: this.estimateConfirmationTime(networkState, standardGasPrice),
      savings: 0,
      description: 'Same cost, higher success guarantee',
    });

    return options.filter(option => option.gasPrice !== standardGasPrice);
  }

  private estimateConfirmationTime(networkState: NetworkState, gasPrice: number): number {
    const baseTime = networkState.averageBlockTime;
    const congestionMultiplier = {
      low: 1.0,
      medium: 1.5,
      high: 2.5,
    }[networkState.networkCongestion];

    // Gas price affects confirmation time
    const gasPriceRatio = gasPrice / networkState.currentGasPrice;
    const gasPriceMultiplier = Math.max(0.5, Math.min(2.0, 2 - gasPriceRatio));

    return Math.ceil(baseTime * congestionMultiplier * gasPriceMultiplier);
  }

  private analyzeTransactionDependencies(transactions: TransactionData[]): {
    canOptimize: boolean;
    optimizedOrder: TransactionData[];
  } {
    // Simple heuristic: prioritize read-heavy transactions before write-heavy ones
    // In a real implementation, this would analyze actual dependencies
    
    const scored = transactions.map((tx, index) => ({
      tx,
      originalIndex: index,
      // Mock scoring based on function name complexity
      writeScore: this.estimateWriteComplexity(tx),
    }));

    // Sort by write complexity (reads first, then writes)
    scored.sort((a, b) => a.writeScore - b.writeScore);

    const canOptimize = scored.some((item, index) => item.originalIndex !== index);

    return {
      canOptimize,
      optimizedOrder: scored.map(item => item.tx),
    };
  }

  private estimateWriteComplexity(transaction: TransactionData): number {
    // Simple heuristic based on transaction type and payload
    if (transaction.type === 'script') {
      return 10; // Scripts tend to be more complex
    }

    const payload = transaction.payload as any;
    if (payload?.function) {
      const func = payload.function.toLowerCase();
      if (func.includes('transfer') || func.includes('mint') || func.includes('burn')) {
        return 8; // State-changing operations
      }
      if (func.includes('get') || func.includes('view') || func.includes('check')) {
        return 2; // Read operations
      }
    }

    return 5; // Default complexity
  }
}

export const gasOptimizer = GasOptimizer.getInstance();