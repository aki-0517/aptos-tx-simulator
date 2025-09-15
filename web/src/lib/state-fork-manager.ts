import { aptosClient } from './aptos-client';

export interface StateFork {
  id: string;
  name: string;
  description: string;
  baseBlockHeight: number;
  createdAt: Date;
  modifications: StateModification[];
  metadata: {
    network: 'devnet' | 'testnet' | 'mainnet';
    creator: string;
    tags: string[];
  };
}

export interface StateModification {
  id: string;
  address: string;
  resourceType: string;
  action: 'create' | 'modify' | 'delete';
  beforeValue?: any;
  afterValue?: any;
  timestamp: Date;
}

export interface WhatIfScenario {
  id: string;
  name: string;
  baseFork: StateFork;
  variants: ScenarioVariant[];
  comparisonResults?: ComparisonResult;
}

export interface ScenarioVariant {
  id: string;
  name: string;
  modifications: StateModification[];
  transactions: any[];
  results?: any;
}

export interface ComparisonResult {
  gasUsageComparison: Map<string, number>;
  outcomeComparison: OutcomeComparison[];
  riskAssessment: RiskAssessment;
  recommendations: string[];
}

export interface OutcomeComparison {
  variantId: string;
  success: boolean;
  gasUsed: number;
  changes: any[];
  events: any[];
}

export interface RiskAssessment {
  level: 'low' | 'medium' | 'high';
  factors: string[];
  suggestions: string[];
}

export class StateForkManager {
  private static instance: StateForkManager;
  private forks: Map<string, StateFork> = new Map();
  private scenarios: Map<string, WhatIfScenario> = new Map();

  private constructor() {
    this.loadFromStorage();
  }

  static getInstance(): StateForkManager {
    if (!StateForkManager.instance) {
      StateForkManager.instance = new StateForkManager();
    }
    return StateForkManager.instance;
  }

  async createFork(
    name: string,
    description: string,
    baseAddress?: string
  ): Promise<StateFork> {
    const client = aptosClient.getCurrentClient();
    const network = aptosClient.getCurrentNetwork();
    
    // Get current ledger info
    const ledgerInfo = await client.getLedgerInfo();
    const baseBlockHeight = parseInt(ledgerInfo.ledger_version);

    const fork: StateFork = {
      id: this.generateId(),
      name,
      description,
      baseBlockHeight,
      createdAt: new Date(),
      modifications: [],
      metadata: {
        network: network.name as any,
        creator: baseAddress || 'anonymous',
        tags: [],
      },
    };

    this.forks.set(fork.id, fork);
    this.saveToStorage();
    
    return fork;
  }

  async cloneFork(forkId: string, newName: string): Promise<StateFork> {
    const originalFork = this.forks.get(forkId);
    if (!originalFork) {
      throw new Error(`Fork ${forkId} not found`);
    }

    const clonedFork: StateFork = {
      ...originalFork,
      id: this.generateId(),
      name: newName,
      createdAt: new Date(),
      modifications: [...originalFork.modifications], // Deep copy modifications
    };

    this.forks.set(clonedFork.id, clonedFork);
    this.saveToStorage();
    
    return clonedFork;
  }

  async deleteFork(forkId: string): Promise<void> {
    this.forks.delete(forkId);
    
    // Also delete any scenarios using this fork
    for (const [scenarioId, scenario] of this.scenarios.entries()) {
      if (scenario.baseFork.id === forkId) {
        this.scenarios.delete(scenarioId);
      }
    }
    
    this.saveToStorage();
  }

  async listForks(): Promise<StateFork[]> {
    return Array.from(this.forks.values()).sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  async getForkById(forkId: string): Promise<StateFork | null> {
    return this.forks.get(forkId) || null;
  }

  async addModification(
    forkId: string,
    modification: Omit<StateModification, 'id' | 'timestamp'>
  ): Promise<StateFork> {
    const fork = this.forks.get(forkId);
    if (!fork) {
      throw new Error(`Fork ${forkId} not found`);
    }

    const newModification: StateModification = {
      ...modification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    fork.modifications.push(newModification);
    this.forks.set(forkId, fork);
    this.saveToStorage();
    
    return fork;
  }

  async removeModification(forkId: string, modificationId: string): Promise<StateFork> {
    const fork = this.forks.get(forkId);
    if (!fork) {
      throw new Error(`Fork ${forkId} not found`);
    }

    fork.modifications = fork.modifications.filter(mod => mod.id !== modificationId);
    this.forks.set(forkId, fork);
    this.saveToStorage();
    
    return fork;
  }

  async createAccountWithBalance(
    forkId: string,
    address: string,
    balance: number
  ): Promise<StateFork> {
    return await this.addModification(forkId, {
      address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      action: 'create',
      afterValue: {
        coin: {
          value: balance.toString(),
        },
        frozen: false,
      },
    });
  }

  async modifyAccountBalance(
    forkId: string,
    address: string,
    newBalance: number
  ): Promise<StateFork> {
    // In a real implementation, we would fetch the current balance first
    const beforeValue = { coin: { value: '0' }, frozen: false }; // Mock

    return await this.addModification(forkId, {
      address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      action: 'modify',
      beforeValue,
      afterValue: {
        coin: {
          value: newBalance.toString(),
        },
        frozen: false,
      },
    });
  }

  async createScenario(
    name: string,
    baseForkId: string,
    variants: Omit<ScenarioVariant, 'id'>[]
  ): Promise<WhatIfScenario> {
    const baseFork = this.forks.get(baseForkId);
    if (!baseFork) {
      throw new Error(`Base fork ${baseForkId} not found`);
    }

    const scenario: WhatIfScenario = {
      id: this.generateId(),
      name,
      baseFork,
      variants: variants.map(variant => ({
        ...variant,
        id: this.generateId(),
      })),
    };

    this.scenarios.set(scenario.id, scenario);
    this.saveToStorage();
    
    return scenario;
  }

  async runScenarioComparison(scenarioId: string): Promise<ComparisonResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario ${scenarioId} not found`);
    }

    const gasUsageComparison = new Map<string, number>();
    const outcomeComparison: OutcomeComparison[] = [];

    // Mock simulation results for each variant
    for (const variant of scenario.variants) {
      // In a real implementation, this would run actual simulations
      const mockGasUsed = Math.floor(Math.random() * 2000) + 500;
      const mockSuccess = Math.random() > 0.1; // 90% success rate

      gasUsageComparison.set(variant.id, mockGasUsed);
      outcomeComparison.push({
        variantId: variant.id,
        success: mockSuccess,
        gasUsed: mockGasUsed,
        changes: [], // Mock changes
        events: [], // Mock events
      });
    }

    // Risk assessment
    const riskAssessment: RiskAssessment = this.assessRisk(scenario, outcomeComparison);

    // Generate recommendations
    const recommendations = this.generateRecommendations(outcomeComparison, gasUsageComparison);

    const comparisonResult: ComparisonResult = {
      gasUsageComparison,
      outcomeComparison,
      riskAssessment,
      recommendations,
    };

    // Update scenario with results
    scenario.comparisonResults = comparisonResult;
    this.scenarios.set(scenarioId, scenario);
    this.saveToStorage();

    return comparisonResult;
  }

  async getScenarios(): Promise<WhatIfScenario[]> {
    return Array.from(this.scenarios.values());
  }

  async deleteScenario(scenarioId: string): Promise<void> {
    this.scenarios.delete(scenarioId);
    this.saveToStorage();
  }

  private assessRisk(scenario: WhatIfScenario, outcomes: OutcomeComparison[]): RiskAssessment {
    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check success rates
    const successRate = outcomes.filter(o => o.success).length / outcomes.length;
    if (successRate < 0.8) {
      factors.push('Low success rate across variants');
      riskLevel = 'high';
    } else if (successRate < 0.95) {
      factors.push('Some variants may fail');
      riskLevel = 'medium';
    }

    // Check gas usage variance
    const gasValues = outcomes.map(o => o.gasUsed);
    const avgGas = gasValues.reduce((sum, val) => sum + val, 0) / gasValues.length;
    const maxVariance = Math.max(...gasValues.map(val => Math.abs(val - avgGas)));
    
    if (maxVariance > avgGas * 0.5) {
      factors.push('High gas usage variance between variants');
      riskLevel = riskLevel === 'low' ? 'medium' : 'high';
    }

    // Check number of modifications
    const totalModifications = scenario.variants.reduce(
      (sum, variant) => sum + variant.modifications.length, 0
    );
    if (totalModifications > 10) {
      factors.push('Large number of state modifications');
      riskLevel = riskLevel === 'low' ? 'medium' : riskLevel;
    }

    const suggestions: string[] = [];
    if (riskLevel === 'high') {
      suggestions.push('Consider testing with smaller modifications first');
      suggestions.push('Review failed variants for potential issues');
    }
    if (riskLevel === 'medium') {
      suggestions.push('Monitor gas usage carefully');
      suggestions.push('Have fallback strategies ready');
    }

    return {
      level: riskLevel,
      factors,
      suggestions,
    };
  }

  private generateRecommendations(
    outcomes: OutcomeComparison[],
    gasUsage: Map<string, number>
  ): string[] {
    const recommendations: string[] = [];

    // Find best performing variant
    const successfulOutcomes = outcomes.filter(o => o.success);
    if (successfulOutcomes.length > 0) {
      const bestVariant = successfulOutcomes.reduce((best, current) =>
        current.gasUsed < best.gasUsed ? current : best
      );
      recommendations.push(`Variant ${bestVariant.variantId} shows best gas efficiency`);
    }

    // Check for failed variants
    const failedOutcomes = outcomes.filter(o => !o.success);
    if (failedOutcomes.length > 0) {
      recommendations.push(`Review ${failedOutcomes.length} failed variants for issues`);
    }

    // Gas usage recommendations
    const gasValues = Array.from(gasUsage.values());
    const avgGas = gasValues.reduce((sum, val) => sum + val, 0) / gasValues.length;
    if (avgGas > 1500) {
      recommendations.push('Consider optimizing for lower gas usage');
    }

    return recommendations;
  }

  private generateId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  private saveToStorage(): void {
    try {
      const data = {
        forks: Array.from(this.forks.entries()),
        scenarios: Array.from(this.scenarios.entries()),
      };
      localStorage.setItem('aptos-simulator-forks', JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save forks to storage:', error);
    }
  }

  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem('aptos-simulator-forks');
      if (stored) {
        const data = JSON.parse(stored);
        
        // Restore forks
        if (data.forks) {
          this.forks = new Map(data.forks.map(([id, fork]: [string, any]) => [
            id,
            {
              ...fork,
              createdAt: new Date(fork.createdAt),
              modifications: fork.modifications.map((mod: any) => ({
                ...mod,
                timestamp: new Date(mod.timestamp),
              })),
            },
          ]));
        }
        
        // Restore scenarios
        if (data.scenarios) {
          this.scenarios = new Map(data.scenarios);
        }
      }
    } catch (error) {
      console.error('Failed to load forks from storage:', error);
    }
  }

  // Cleanup method
  destroy(): void {
    this.forks.clear();
    this.scenarios.clear();
  }
}

export const stateForkManager = StateForkManager.getInstance();