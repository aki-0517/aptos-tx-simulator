import { aptosClient } from './aptos-client';

export interface NetworkState {
  currentGasPrice: number;
  networkCongestion: 'low' | 'medium' | 'high';
  averageBlockTime: number;
  queuedTransactions: number;
  gasUsageStatistics: {
    p25: number;
    p50: number;
    p75: number;
    p95: number;
  };
  timestamp: Date;
}

export interface GasTrend {
  timestamp: Date;
  gasPrice: number;
  blockHeight: number;
  transactionCount: number;
}

export class NetworkMonitor {
  private static instance: NetworkMonitor;
  private currentState: NetworkState | null = null;
  private listeners: Set<(state: NetworkState) => void> = new Set();
  private updateInterval: NodeJS.Timeout | null = null;
  private gasTrends: GasTrend[] = [];

  private constructor() {}

  static getInstance(): NetworkMonitor {
    if (!NetworkMonitor.instance) {
      NetworkMonitor.instance = new NetworkMonitor();
    }
    return NetworkMonitor.instance;
  }

  async getCurrentNetworkState(): Promise<NetworkState> {
    if (this.currentState && this.isStateRecent(this.currentState)) {
      return this.currentState;
    }

    const state = await this.fetchNetworkState();
    this.currentState = state;
    this.notifyListeners(state);
    return state;
  }

  async predictOptimalGasPrice(priority: 'fast' | 'standard' | 'slow'): Promise<number> {
    const state = await this.getCurrentNetworkState();
    const basePrice = state.currentGasPrice;

    // Adjust based on network congestion
    const congestionMultiplier = {
      low: 1.0,
      medium: 1.2,
      high: 1.5,
    }[state.networkCongestion];

    // Adjust based on priority
    const priorityMultiplier = {
      slow: 0.8,
      standard: 1.0,
      fast: 1.3,
    }[priority];

    // Use percentile data for more accurate pricing
    let targetPrice = basePrice;
    switch (priority) {
      case 'slow':
        targetPrice = Math.max(state.gasUsageStatistics.p25, basePrice * 0.8);
        break;
      case 'standard':
        targetPrice = state.gasUsageStatistics.p50;
        break;
      case 'fast':
        targetPrice = state.gasUsageStatistics.p75;
        break;
    }

    return Math.ceil(targetPrice * congestionMultiplier * priorityMultiplier);
  }

  async getHistoricalGasTrends(hours: number): Promise<GasTrend[]> {
    const cutoffTime = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.gasTrends.filter(trend => trend.timestamp >= cutoffTime);
  }

  subscribeToUpdates(callback: (state: NetworkState) => void): () => void {
    this.listeners.add(callback);
    
    // Start monitoring if this is the first listener
    if (this.listeners.size === 1) {
      this.startMonitoring();
    }

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
      if (this.listeners.size === 0) {
        this.stopMonitoring();
      }
    };
  }

  private async fetchNetworkState(): Promise<NetworkState> {
    const client = aptosClient.getCurrentClient();
    
    try {
      // Get current gas price from Aptos API
      let currentGasPrice = 100; // Default fallback
      try {
        const gasEstimateResponse = await fetch(`${client.config.fullnode}/estimate_gas_price`);
        if (gasEstimateResponse.ok) {
          const gasData = await gasEstimateResponse.json();
          // Aptos API returns: { deprioritized_gas_estimate, gas_estimate, prioritized_gas_estimate }
          currentGasPrice = gasData.gas_estimate || gasData.prioritized_gas_estimate || currentGasPrice;
        }
      } catch (error) {
        console.warn('Failed to fetch gas price from API:', error);
        throw new Error('Unable to fetch real-time gas price data. Please check network connection.');
      }

      // Get ledger info for block time analysis
      const ledgerInfo = await client.getLedgerInfo();
      const currentBlockHeight = parseInt(ledgerInfo.ledger_version);

      // Calculate network congestion based on recent trends
      const networkCongestion = this.calculateNetworkCongestion(currentGasPrice);

      // Estimate average block time (Aptos target is ~4 seconds)
      const averageBlockTime = 4000; // milliseconds

      // Get queued transactions from mempool (if available)
      let queuedTransactions = 0;
      try {
        // Note: Aptos doesn't expose mempool size directly, so we estimate based on gas price
        queuedTransactions = this.estimateQueuedTransactionsFromGasPrice(currentGasPrice);
      } catch (error) {
        console.warn('Unable to estimate queued transactions:', error);
      }

      // Calculate gas usage percentiles from recent trends
      const gasUsageStatistics = this.calculateGasPercentiles(currentGasPrice);

      // Store trend data
      this.gasTrends.push({
        timestamp: new Date(),
        gasPrice: currentGasPrice,
        blockHeight: currentBlockHeight,
        transactionCount: queuedTransactions,
      });

      // Keep only last 24 hours of data
      const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.gasTrends = this.gasTrends.filter(trend => trend.timestamp >= twentyFourHoursAgo);

      return {
        currentGasPrice,
        networkCongestion,
        averageBlockTime,
        queuedTransactions,
        gasUsageStatistics,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('Failed to fetch network state:', error);
      
      // Return default state on error
      return {
        currentGasPrice: 100,
        networkCongestion: 'medium',
        averageBlockTime: 4000,
        queuedTransactions: 0,
        gasUsageStatistics: {
          p25: 80,
          p50: 100,
          p75: 120,
          p95: 200,
        },
        timestamp: new Date(),
      };
    }
  }

  private calculateNetworkCongestion(currentGasPrice: number): 'low' | 'medium' | 'high' {
    // Base gas price thresholds (these would be dynamically calculated in production)
    const lowThreshold = 80;
    const highThreshold = 150;

    if (currentGasPrice <= lowThreshold) {
      return 'low';
    } else if (currentGasPrice <= highThreshold) {
      return 'medium';
    } else {
      return 'high';
    }
  }

  private estimateQueuedTransactionsFromGasPrice(gasPrice: number): number {
    // Estimate queue size based on gas price deviation from minimum
    // Higher gas prices typically indicate more network congestion
    const minGasPrice = 100; // Aptos minimum gas price
    const deviation = gasPrice - minGasPrice;
    
    // Simple heuristic: more deviation = more congestion = more queued transactions
    if (deviation <= 0) return 0;
    if (deviation <= 50) return Math.floor(deviation * 2);
    if (deviation <= 100) return Math.floor(deviation * 3);
    return Math.floor(deviation * 4);
  }

  private calculateGasPercentiles(currentPrice: number): NetworkState['gasUsageStatistics'] {
    // Calculate percentiles based on current price and historical trends
    // These are estimates based on typical gas price distributions
    return {
      p25: Math.floor(currentPrice * 0.8),
      p50: currentPrice,
      p75: Math.floor(currentPrice * 1.2),
      p95: Math.floor(currentPrice * 1.8),
    };
  }

  private isStateRecent(state: NetworkState): boolean {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    return state.timestamp >= fiveMinutesAgo;
  }

  private startMonitoring(): void {
    if (this.updateInterval) {
      return; // Already monitoring
    }

    // Update every 30 seconds
    this.updateInterval = setInterval(async () => {
      try {
        const state = await this.fetchNetworkState();
        this.currentState = state;
        this.notifyListeners(state);
      } catch (error) {
        console.error('Failed to update network state:', error);
      }
    }, 30000);

    // Initial update
    this.fetchNetworkState().then(state => {
      this.currentState = state;
      this.notifyListeners(state);
    });
  }

  private stopMonitoring(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  private notifyListeners(state: NetworkState): void {
    this.listeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in network state listener:', error);
      }
    });
  }

  // Cleanup method
  destroy(): void {
    this.stopMonitoring();
    this.listeners.clear();
    this.currentState = null;
    this.gasTrends = [];
  }
}

export const networkMonitor = NetworkMonitor.getInstance();