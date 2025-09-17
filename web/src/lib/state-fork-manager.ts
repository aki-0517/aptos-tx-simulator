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

class StateForkManager {
  private forks: Map<string, StateFork> = new Map();
  private scenarios: Map<string, WhatIfScenario> = new Map();
  private readonly STORAGE_KEY = 'aptos-simulator-state-forks';
  private readonly SCENARIOS_KEY = 'aptos-simulator-scenarios';

  constructor() {
    this.loadFromStorage();
  }

  async createFork(
    name: string,
    description: string,
    baseBlockHeight?: number
  ): Promise<StateFork> {
    const currentNetwork = aptosClient.getCurrentNetwork();
    
    // Get current block height if not provided
    const blockHeight = baseBlockHeight || await this.getCurrentBlockHeight();
    
    const fork: StateFork = {
      id: this.generateId(),
      name,
      description,
      baseBlockHeight: blockHeight,
      createdAt: new Date(),
      modifications: [],
      metadata: {
        network: currentNetwork as 'devnet' | 'testnet' | 'mainnet',
        creator: 'user',
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
      throw new Error(`Fork with ID ${forkId} not found`);
    }

    const clonedFork: StateFork = {
      id: this.generateId(),
      name: newName,
      description: `Clone of ${originalFork.name}`,
      baseBlockHeight: originalFork.baseBlockHeight,
      createdAt: new Date(),
      modifications: [...originalFork.modifications],
      metadata: {
        ...originalFork.metadata,
        creator: 'user',
      },
    };

    this.forks.set(clonedFork.id, clonedFork);
    this.saveToStorage();
    
    return clonedFork;
  }

  async deleteFork(forkId: string): Promise<void> {
    if (!this.forks.has(forkId)) {
      throw new Error(`Fork with ID ${forkId} not found`);
    }

    this.forks.delete(forkId);
    this.saveToStorage();
  }

  async listForks(): Promise<StateFork[]> {
    const currentNetwork = aptosClient.getCurrentNetwork();
    return Array.from(this.forks.values())
      .filter(fork => fork.metadata.network === currentNetwork)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getForkById(forkId: string): Promise<StateFork> {
    const fork = this.forks.get(forkId);
    if (!fork) {
      throw new Error(`Fork with ID ${forkId} not found`);
    }
    return fork;
  }

  async addModification(forkId: string, modification: Omit<StateModification, 'id' | 'timestamp'>): Promise<StateFork> {
    const fork = this.forks.get(forkId);
    if (!fork) {
      throw new Error(`Fork with ID ${forkId} not found`);
    }

    const fullModification: StateModification = {
      ...modification,
      id: this.generateId(),
      timestamp: new Date(),
    };

    fork.modifications.push(fullModification);
    this.forks.set(forkId, fork);
    this.saveToStorage();
    
    return fork;
  }

  // What-if scenario management
  async createScenario(name: string, baseFork: StateFork): Promise<WhatIfScenario> {
    const scenario: WhatIfScenario = {
      id: this.generateId(),
      name,
      baseFork,
      variants: [],
    };

    this.scenarios.set(scenario.id, scenario);
    this.saveToStorage();
    
    return scenario;
  }

  async addScenarioVariant(
    scenarioId: string, 
    variantName: string,
    modifications: StateModification[],
    transactions: any[]
  ): Promise<WhatIfScenario> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }

    const variant: ScenarioVariant = {
      id: this.generateId(),
      name: variantName,
      modifications,
      transactions,
    };

    scenario.variants.push(variant);
    this.scenarios.set(scenarioId, scenario);
    this.saveToStorage();
    
    return scenario;
  }

  async compareScenarioOutcomes(scenarioId: string): Promise<ComparisonResult> {
    const scenario = this.scenarios.get(scenarioId);
    if (!scenario) {
      throw new Error(`Scenario with ID ${scenarioId} not found`);
    }

    const gasUsageComparison = new Map<string, number>();
    const outcomeComparison: OutcomeComparison[] = [];
    
    // Simulate each variant and collect results
    for (const variant of scenario.variants) {
      // This would integrate with the transaction simulator
      // For now, we'll create mock comparison data
      gasUsageComparison.set(variant.name, Math.floor(Math.random() * 10000));
      
      outcomeComparison.push({
        variantId: variant.id,
        success: Math.random() > 0.3,
        gasUsed: Math.floor(Math.random() * 10000),
        changes: variant.modifications,
        events: [],
      });
    }

    const riskAssessment: RiskAssessment = {
      level: 'medium',
      factors: ['State modification complexity', 'Transaction interdependencies'],
      suggestions: ['Test on smaller amounts first', 'Verify account balances'],
    };

    const recommendations = [
      'Variant with lowest gas usage appears most efficient',
      'Consider testing edge cases with insufficient balances',
      'Monitor for potential state conflicts between transactions',
    ];

    const result: ComparisonResult = {
      gasUsageComparison,
      outcomeComparison,
      riskAssessment,
      recommendations,
    };

    // Store result in scenario
    scenario.comparisonResults = result;
    this.scenarios.set(scenarioId, scenario);
    this.saveToStorage();

    return result;
  }

  // Helper methods for common modifications
  async createAccountWithBalance(
    forkId: string,
    address: string,
    balance: number
  ): Promise<StateFork> {
    return this.addModification(forkId, {
      address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      action: 'create',
      afterValue: {
        coin: { value: balance.toString() },
        deposit_events: { counter: '0', guid: { id: { addr: address, creation_num: '2' } } },
        frozen: false,
        withdraw_events: { counter: '0', guid: { id: { addr: address, creation_num: '3' } } },
      },
    });
  }

  async modifyAccountBalance(
    forkId: string,
    address: string,
    newBalance: number
  ): Promise<StateFork> {
    // Get current balance for before value
    let beforeValue;
    try {
      const currentBalance = await aptosClient.getAccountBalance(address);
      beforeValue = { coin: { value: currentBalance.toString() } };
    } catch (error) {
      beforeValue = { coin: { value: '0' } };
    }

    return this.addModification(forkId, {
      address,
      resourceType: '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>',
      action: 'modify',
      beforeValue,
      afterValue: {
        coin: { value: newBalance.toString() },
        deposit_events: { counter: '0', guid: { id: { addr: address, creation_num: '2' } } },
        frozen: false,
        withdraw_events: { counter: '0', guid: { id: { addr: address, creation_num: '3' } } },
      },
    });
  }

  async removeModification(forkId: string, modificationIndex: number): Promise<StateFork> {
    const fork = this.forks.get(forkId);
    if (!fork) {
      throw new Error(`Fork with ID ${forkId} not found`);
    }

    if (modificationIndex < 0 || modificationIndex >= fork.modifications.length) {
      throw new Error(`Invalid modification index ${modificationIndex}`);
    }

    fork.modifications.splice(modificationIndex, 1);
    this.forks.set(forkId, fork);
    this.saveToStorage();
    
    return fork;
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async getCurrentBlockHeight(): Promise<number> {
    try {
      const ledgerInfo = await aptosClient.getCurrentClient().getLedgerInfo();
      return parseInt(ledgerInfo.ledger_version);
    } catch (error) {
      console.warn('Failed to get current block height:', error);
      throw new Error('Unable to get current block height. Please check network connection.');
    }
  }

  private loadFromStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      // Load forks
      const storedForks = localStorage.getItem(this.STORAGE_KEY);
      if (storedForks) {
        const data = JSON.parse(storedForks);
        this.forks = new Map(
          data.map((fork: any) => [
            fork.id, 
            {
              ...fork,
              createdAt: new Date(fork.createdAt),
              modifications: fork.modifications.map((mod: any) => ({
                ...mod,
                timestamp: new Date(mod.timestamp),
              })),
            }
          ])
        );
      }

      // Load scenarios
      const storedScenarios = localStorage.getItem(this.SCENARIOS_KEY);
      if (storedScenarios) {
        const data = JSON.parse(storedScenarios);
        this.scenarios = new Map(
          data.map((scenario: any) => [scenario.id, scenario])
        );
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  private saveToStorage(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const forksData = Array.from(this.forks.values());
      const scenariosData = Array.from(this.scenarios.values());
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(forksData));
      localStorage.setItem(this.SCENARIOS_KEY, JSON.stringify(scenariosData));
    } catch (error) {
      console.error('Failed to save to storage:', error);
    }
  }
}

export const stateForkManager = new StateForkManager();