export interface FunctionDefinition {
  module: string;
  functionName: string;
  parameters: ParameterDefinition[];
  description: string;
  category: 'defi' | 'nft' | 'governance' | 'utility' | 'custom';
  gasEstimate: number;
  examples: FunctionExample[];
}

export interface ParameterDefinition {
  name: string;
  type: string;
  description: string;
  required: boolean;
  defaultValue?: any;
  validation?: ValidationRule;
}

export interface ValidationRule {
  type: 'regex' | 'range' | 'enum';
  value: string | number[] | string[];
  message: string;
}

export interface FunctionExample {
  name: string;
  description: string;
  parameters: { [key: string]: any };
  expectedOutcome: string;
}

export class FunctionCatalog {
  private functions: FunctionDefinition[] = [];

  constructor() {
    this.loadBuiltinFunctions();
  }

  private loadBuiltinFunctions() {
    this.functions = [
      // Coin operations
      {
        module: '0x1::coin',
        functionName: 'transfer',
        description: 'Transfer coins from sender to recipient',
        category: 'utility',
        gasEstimate: 500,
        parameters: [
          {
            name: 'to',
            type: 'address',
            description: 'Recipient address',
            required: true,
            validation: {
              type: 'regex',
              value: '^0x[a-fA-F0-9]{1,64}$',
              message: 'Must be a valid Aptos address',
            },
          },
          {
            name: 'amount',
            type: 'u64',
            description: 'Amount to transfer in octas',
            required: true,
            validation: {
              type: 'range',
              value: [1, Number.MAX_SAFE_INTEGER],
              message: 'Amount must be positive',
            },
          },
        ],
        examples: [
          {
            name: 'Basic Transfer',
            description: 'Transfer 1 APT to another address',
            parameters: {
              to: '0x742d35cc6bf5c4532c9d4d8bb4a4eee57bb8e3b88e865e4f8c8b6c5b2a8e5c7d',
              amount: 100000000,
            },
            expectedOutcome: 'Transfers 1 APT to the specified address',
          },
        ],
      },
      // Token operations
      {
        module: '0x3::token',
        functionName: 'mint',
        description: 'Mint a new token',
        category: 'nft',
        gasEstimate: 1200,
        parameters: [
          {
            name: 'to',
            type: 'address',
            description: 'Address to mint token to',
            required: true,
          },
          {
            name: 'collection',
            type: 'String',
            description: 'Collection name',
            required: true,
          },
          {
            name: 'name',
            type: 'String',
            description: 'Token name',
            required: true,
          },
          {
            name: 'description',
            type: 'String',
            description: 'Token description',
            required: true,
          },
          {
            name: 'uri',
            type: 'String',
            description: 'Token metadata URI',
            required: true,
          },
        ],
        examples: [
          {
            name: 'Mint NFT',
            description: 'Mint a simple NFT',
            parameters: {
              to: '0x742d35cc6bf5c4532c9d4d8bb4a4eee57bb8e3b88e865e4f8c8b6c5b2a8e5c7d',
              collection: 'My Collection',
              name: 'Token #1',
              description: 'My first token',
              uri: 'https://example.com/token1.json',
            },
            expectedOutcome: 'Mints NFT to specified address',
          },
        ],
      },
      // Governance operations
      {
        module: '0x1::aptos_governance',
        functionName: 'vote',
        description: 'Vote on governance proposal',
        category: 'governance',
        gasEstimate: 800,
        parameters: [
          {
            name: 'proposal_id',
            type: 'u64',
            description: 'ID of the proposal to vote on',
            required: true,
          },
          {
            name: 'should_pass',
            type: 'bool',
            description: 'True for yes, false for no',
            required: true,
          },
        ],
        examples: [
          {
            name: 'Vote Yes',
            description: 'Vote yes on proposal',
            parameters: {
              proposal_id: 1,
              should_pass: true,
            },
            expectedOutcome: 'Casts yes vote on proposal #1',
          },
        ],
      },
      // Staking operations
      {
        module: '0x1::delegation_pool',
        functionName: 'add_stake',
        description: 'Add stake to delegation pool',
        category: 'defi',
        gasEstimate: 1000,
        parameters: [
          {
            name: 'pool_address',
            type: 'address',
            description: 'Address of the delegation pool',
            required: true,
          },
          {
            name: 'amount',
            type: 'u64',
            description: 'Amount to stake in octas',
            required: true,
          },
        ],
        examples: [
          {
            name: 'Stake APT',
            description: 'Stake 10 APT in delegation pool',
            parameters: {
              pool_address: '0x742d35cc6bf5c4532c9d4d8bb4a4eee57bb8e3b88e865e4f8c8b6c5b2a8e5c7d',
              amount: 1000000000,
            },
            expectedOutcome: 'Stakes 10 APT in the specified pool',
          },
        ],
      },
      // Account operations
      {
        module: '0x1::account',
        functionName: 'create_account',
        description: 'Create a new account',
        category: 'utility',
        gasEstimate: 600,
        parameters: [
          {
            name: 'auth_key',
            type: 'address',
            description: 'Authentication key for the new account',
            required: true,
          },
        ],
        examples: [
          {
            name: 'Create Account',
            description: 'Create new account with auth key',
            parameters: {
              auth_key: '0x742d35cc6bf5c4532c9d4d8bb4a4eee57bb8e3b88e865e4f8c8b6c5b2a8e5c7d',
            },
            expectedOutcome: 'Creates new account with specified auth key',
          },
        ],
      },
    ];
  }

  /**
   * Get all available functions
   */
  getAllFunctions(): FunctionDefinition[] {
    return [...this.functions];
  }

  /**
   * Search functions by query
   */
  searchFunctions(query: string): FunctionDefinition[] {
    const lowercaseQuery = query.toLowerCase();
    return this.functions.filter(
      func =>
        func.functionName.toLowerCase().includes(lowercaseQuery) ||
        func.module.toLowerCase().includes(lowercaseQuery) ||
        func.description.toLowerCase().includes(lowercaseQuery)
    );
  }

  /**
   * Get functions by category
   */
  getFunctionsByCategory(category: string): FunctionDefinition[] {
    return this.functions.filter(func => func.category === category);
  }

  /**
   * Get function by full name (module::function)
   */
  getFunctionByName(fullName: string): FunctionDefinition | null {
    const [module, functionName] = fullName.split('::');
    return this.functions.find(
      func => func.module === module && func.functionName === functionName
    ) || null;
  }

  /**
   * Get available categories
   */
  getCategories(): Array<{ name: string; label: string; count: number }> {
    const categories = new Map<string, number>();
    
    this.functions.forEach(func => {
      categories.set(func.category, (categories.get(func.category) || 0) + 1);
    });

    const categoryLabels: { [key: string]: string } = {
      defi: 'DeFi',
      nft: 'NFT',
      governance: 'Governance',
      utility: 'Utility',
      custom: 'Custom',
    };

    return Array.from(categories.entries()).map(([name, count]) => ({
      name,
      label: categoryLabels[name] || name,
      count,
    }));
  }

  /**
   * Add custom function
   */
  addCustomFunction(func: Omit<FunctionDefinition, 'category'>): void {
    this.functions.push({
      ...func,
      category: 'custom',
    });
  }

  /**
   * Remove custom function
   */
  removeCustomFunction(module: string, functionName: string): boolean {
    const index = this.functions.findIndex(
      func => func.module === module && func.functionName === functionName && func.category === 'custom'
    );
    
    if (index !== -1) {
      this.functions.splice(index, 1);
      return true;
    }
    
    return false;
  }

  /**
   * Load functions from network (if supported)
   */
  async loadAvailableFunctions(networkAddress?: string): Promise<FunctionDefinition[]> {
    // This would integrate with Aptos API to fetch available modules and functions
    // For now, return built-in functions
    console.log('Loading functions for network:', networkAddress);
    return this.getAllFunctions();
  }

  /**
   * Validate function parameters
   */
  validateParameters(
    func: FunctionDefinition,
    parameters: { [key: string]: any }
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    func.parameters.forEach(param => {
      const value = parameters[param.name];

      // Check required parameters
      if (param.required && (value === undefined || value === null || value === '')) {
        errors.push(`${param.name} is required`);
        return;
      }

      // Skip validation for empty optional parameters
      if (!param.required && (value === undefined || value === null || value === '')) {
        return;
      }

      // Validate parameter value
      if (param.validation) {
        const validationError = this.validateParameter(value, param.validation);
        if (validationError) {
          errors.push(`${param.name}: ${validationError}`);
        }
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  private validateParameter(value: any, rule: ValidationRule): string | null {
    switch (rule.type) {
      case 'regex':
        if (typeof value === 'string' && !new RegExp(rule.value as string).test(value)) {
          return rule.message;
        }
        break;
      
      case 'range':
        const [min, max] = rule.value as number[];
        const numValue = Number(value);
        if (isNaN(numValue) || numValue < min || numValue > max) {
          return rule.message;
        }
        break;
      
      case 'enum':
        const enumValues = rule.value as string[];
        if (!enumValues.includes(String(value))) {
          return rule.message;
        }
        break;
    }
    
    return null;
  }
}

export const functionCatalog = new FunctionCatalog();