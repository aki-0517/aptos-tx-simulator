import { Aptos, Account, AccountAddress, SimpleTransaction, InputEntryFunctionData, TransactionPayloadEntryFunction, TransactionPayloadScript, Ed25519PublicKey, InputScriptData } from '@aptos-labs/ts-sdk';
import { aptosClient } from './aptos-client';
import { SimulationResult, SimulationError, GasEstimation, TransactionData, ScriptTransactionData, BatchTransactionData, SponsoredTransactionData, BatchSimulationResult, SponsoredSimulationResult, VMExecutionTrace, DetailedGasBreakdown, StateChangeAnalysis, SimulationConfig } from '@/types';
import { vmTraceAnalyzer } from './vm-trace';
import { gasAnalyzer } from './gas-analyzer';
import { gasBreakdownGenerator } from './gas-breakdown-generator';
import { traceSimulator } from './trace-simulator';

export class TransactionSimulator {
  constructor() {}

  async simulateTransaction(transactionData: TransactionData, config?: SimulationConfig): Promise<SimulationResult> {
    const startTime = performance.now();
    const aptos = aptosClient.getCurrentClient();
    
    try {
      // Create the transaction based on type
      let transaction: SimpleTransaction;
      
      if (transactionData.type === 'entry_function') {
        const entryPayload = transactionData.payload as any;
        const inputData: InputEntryFunctionData = {
          function: entryPayload.function,
          functionArguments: entryPayload.function_arguments || [],
          typeArguments: entryPayload.type_arguments || [],
        };

        transaction = await aptos.transaction.build.simple({
          sender: transactionData.sender,
          data: inputData,
          options: {
            maxGasAmount: transactionData.maxGasAmount,
            gasUnitPrice: transactionData.gasUnitPrice,
          },
        });
      } else if (transactionData.type === 'script') {
        return await this.simulateScriptTransaction(transactionData as any);
      } else if (transactionData.type === 'batch') {
        return await this.simulateBatchTransactions(transactionData as any);
      } else if (transactionData.type === 'sponsored') {
        return await this.simulateSponsoredTransaction(transactionData as any);
      } else {
        throw new Error(`Unsupported transaction type: ${transactionData.type}`);
      }

      // Simulate the transaction
      // ウォレット接続時は公開鍵を優先使用し、認証鍵不一致(INVALID_AUTH_KEY)を回避
      let signerPublicKey: any = Account.generate().publicKey;
      try {
        if (typeof window !== 'undefined' && (window as any).aptos) {
          const acc = await (window as any).aptos.account();
          if (acc?.publicKey) {
            const hex = typeof acc.publicKey === 'string' ? acc.publicKey : String(acc.publicKey);
            signerPublicKey = new Ed25519PublicKey(hex);
          }
        }
      } catch {
        // フォールバックはダミー鍵のまま
      }

      const simulationResult = await aptos.transaction.simulate.simple({
        signerPublicKey,
        transaction,
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
          estimatePrioritizedGasUnitPrice: true,
        },
      });

      const executionTime = performance.now() - startTime;

      // Process the simulation result
      if (simulationResult && simulationResult.length > 0) {
        const result = simulationResult[0];
        return await this.processSimulationResult(result, transactionData.gasUnitPrice, executionTime, transactionData);
      } else {
        throw new Error('No simulation result returned');
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;
      
      return {
        success: false,
        gasUsed: 0,
        gasUnitPrice: 0,
        totalGasCost: 0,
        totalGasCostAPT: 0,
        vmStatus: 'Simulation Error',
        error: this.parseError(error),
        executionTime,
      };
    }
  }

  async estimateGas(transactionData: TransactionData): Promise<GasEstimation> {
    try {
      const aptos = aptosClient.getCurrentClient();
      
      // Get real-time gas price estimation from Aptos network
      const gasPriceEstimation = await aptos.getGasPriceEstimation();
      console.log('Real-time gas price estimation:', gasPriceEstimation);
      
      // Run simulation to get gas usage
      const simulationResult = await this.simulateTransaction(transactionData);
      
      if (!simulationResult.success) {
        throw new Error('Cannot estimate gas for failing transaction');
      }

      const gasUsed = simulationResult.gasUsed;
      const gasUnitPrice = gasPriceEstimation.gas_estimate;
      const maxGasAmount = Math.ceil(gasUsed * 1.2); // Add 20% buffer
      const totalCost = gasUsed * gasUnitPrice;
      const totalCostAPT = totalCost / 100000000;

      // Determine efficiency
      let efficiency: 'low' | 'medium' | 'high' = 'medium';
      if (gasUsed < 500) efficiency = 'high';
      else if (gasUsed > 2000) efficiency = 'low';

      let recommendation: string | undefined;
      if (efficiency === 'low') {
        recommendation = 'This transaction uses a lot of gas. Consider optimizing the processing.';
      } else if (efficiency === 'high') {
        recommendation = 'This transaction is efficient!';
      }

      return {
        gasUsed,
        gasUnitPrice,
        maxGasAmount,
        totalCost,
        totalCostAPT,
        efficiency,
        recommendation,
      };
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private parseVmError(vmStatus: string): SimulationError {
    // Common VM error interpretations
    const errorMappings: Record<string, {message: string; suggestion?: string}> = {
      'INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE': {
        message: 'Insufficient balance for transaction fee',
        suggestion: 'Add APT to your account',
      },
      'SEQUENCE_NUMBER_TOO_OLD': {
        message: 'Sequence number is too old',
        suggestion: 'Please recreate the transaction',
      },
      'SEQUENCE_NUMBER_TOO_NEW': {
        message: 'Sequence number is too new',
        suggestion: 'Wait for previous transactions to complete',
      },
      'INVALID_SIGNATURE': {
        message: 'Invalid signature',
        suggestion: 'Sign with the correct private key',
      },
      'ACCOUNT_DOES_NOT_EXIST': {
        message: 'Account does not exist',
        suggestion: 'Please check the account address',
      },
    };

    const errorInfo = errorMappings[vmStatus] || {
      message: vmStatus || 'Unknown error',
      suggestion: 'Please check the transaction details',
    };

    return {
      code: vmStatus,
      message: errorInfo.message,
      suggestion: errorInfo.suggestion,
    };
  }

  private parseError(error: unknown): SimulationError {
    if (error instanceof Error) {
      return {
        code: 'SIMULATION_ERROR',
        message: error.message,
        suggestion: 'Please check the transaction input values',
      };
    }

    return {
      code: 'UNKNOWN_ERROR',
      message: 'An unknown error occurred',
      suggestion: 'Please try again later',
    };
  }

  // Script transaction simulation
  async simulateScriptTransaction(scriptData: ScriptTransactionData): Promise<SimulationResult> {
    const startTime = performance.now();
    const aptos = aptosClient.getCurrentClient();
    
    try {
      // Validate script bytecode
      if (!scriptData.code || !this.isValidBytecode(scriptData.code)) {
        throw new Error('Invalid script bytecode provided');
      }

      const scriptPayload: InputScriptData = {
        bytecode: scriptData.code,
        typeArguments: scriptData.typeArgs || [],
        functionArguments: scriptData.functionArgs || [],
      };

      const transaction = await aptos.transaction.build.simple({
        sender: scriptData.sender,
        data: scriptPayload,
        options: {
          maxGasAmount: scriptData.maxGasAmount,
          gasUnitPrice: scriptData.gasUnitPrice,
        },
      });

      // Get signer public key
      let signerPublicKey: any = Account.generate().publicKey;
      try {
        if (typeof window !== 'undefined' && (window as any).aptos) {
          const acc = await (window as any).aptos.account();
          if (acc?.publicKey) {
            const hex = typeof acc.publicKey === 'string' ? acc.publicKey : String(acc.publicKey);
            signerPublicKey = new Ed25519PublicKey(hex);
          }
        }
      } catch {
        // Use fallback dummy key
      }

      const simulationResult = await aptos.transaction.simulate.simple({
        signerPublicKey,
        transaction,
        options: {
          estimateGasUnitPrice: true,
          estimateMaxGasAmount: true,
          estimatePrioritizedGasUnitPrice: true,
        },
      });

      const executionTime = performance.now() - startTime;
      
      if (simulationResult && simulationResult.length > 0) {
        return await this.processSimulationResult(simulationResult[0], scriptData.gasUnitPrice, executionTime, scriptData);
      } else {
        throw new Error('No simulation result returned');
      }
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return this.createErrorResult(error, executionTime);
    }
  }

  // Batch transaction simulation
  async simulateBatchTransactions(batchData: BatchTransactionData): Promise<SimulationResult> {
    const startTime = performance.now();
    
    try {
      const results: SimulationResult[] = [];
      let totalGasUsed = 0;
      let totalCost = 0;

      if (batchData.executeSequentially) {
        // Sequential execution - consider state changes
        for (let i = 0; i < batchData.transactions.length; i++) {
          const tx = batchData.transactions[i];
          const result = await this.simulateTransaction(tx);
          results.push(result);
          
          if (result.success) {
            totalGasUsed += result.gasUsed;
            totalCost += result.totalGasCost;
          } else {
            // If a transaction fails, mark the batch as failed
            return {
              success: false,
              gasUsed: totalGasUsed,
              gasUnitPrice: result.gasUnitPrice,
              totalGasCost: totalCost,
              totalGasCostAPT: totalCost / 100000000,
              vmStatus: `Batch failed at transaction ${i + 1}: ${result.vmStatus}`,
              error: result.error,
              executionTime: performance.now() - startTime,
              changes: results.flatMap(r => r.changes || []),
              events: results.flatMap(r => r.events || []),
            };
          }
        }
      } else {
        // Parallel execution
        const promises = batchData.transactions.map(tx => this.simulateTransaction(tx));
        const parallelResults = await Promise.all(promises);
        results.push(...parallelResults);
        
        totalGasUsed = results.reduce((sum, r) => sum + r.gasUsed, 0);
        totalCost = results.reduce((sum, r) => sum + r.totalGasCost, 0);
      }

      const allSuccessful = results.every(r => r.success);
      const executionTime = performance.now() - startTime;

      return {
        success: allSuccessful,
        gasUsed: totalGasUsed,
        gasUnitPrice: results[0]?.gasUnitPrice || 0,
        totalGasCost: totalCost,
        totalGasCostAPT: totalCost / 100000000,
        vmStatus: allSuccessful ? 'Batch executed successfully' : 'Some transactions failed',
        changes: results.flatMap(r => r.changes || []),
        events: results.flatMap(r => r.events || []),
        executionTime,
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return this.createErrorResult(error, executionTime);
    }
  }

  // Sponsored transaction simulation
  async simulateSponsoredTransaction(sponsoredData: SponsoredTransactionData): Promise<SimulationResult> {
    const startTime = performance.now();
    
    try {
      // Simulate normal transaction
      const normalResult = await this.simulateTransaction(sponsoredData.transaction);
      
      // Simulate sponsored version (fee payer is different)
      const sponsoredTx = {
        ...sponsoredData.transaction,
        // Note: In real implementation, this would involve multi-signature
        // For simulation purposes, we estimate the cost difference
        maxGasAmount: sponsoredData.transaction.maxGasAmount,
        gasUnitPrice: sponsoredData.transaction.gasUnitPrice,
      };
      
      const sponsoredResult = await this.simulateTransaction(sponsoredTx);
      const executionTime = performance.now() - startTime;

      // Calculate cost comparison
      const senderSavings = normalResult.totalGasCost; // Sender pays 0 in sponsored tx
      const sponsorCost = sponsoredResult.totalGasCost; // Sponsor pays the full cost

      return {
        success: sponsoredResult.success,
        gasUsed: sponsoredResult.gasUsed,
        gasUnitPrice: sponsoredResult.gasUnitPrice,
        totalGasCost: sponsorCost, // From sponsor's perspective
        totalGasCostAPT: sponsorCost / 100000000,
        vmStatus: `Sponsored transaction - Sponsor pays ${(sponsorCost / 100000000).toFixed(6)} APT`,
        changes: sponsoredResult.changes,
        events: sponsoredResult.events,
        executionTime,
        // Additional sponsored transaction info could be added here
      };
    } catch (error) {
      const executionTime = performance.now() - startTime;
      return this.createErrorResult(error, executionTime);
    }
  }

  // Helper method to validate bytecode
  private isValidBytecode(code: string): boolean {
    // Basic validation - should be hex string
    const hexRegex = /^[0-9A-Fa-f]+$/;
    return hexRegex.test(code) && code.length > 0 && code.length % 2 === 0;
  }

  // Enhanced method to process simulation results with config
  private async processSimulationResultWithConfig(result: any, gasUnitPrice: number | undefined, executionTime: number, config?: SimulationConfig, transactionData?: TransactionData): Promise<SimulationResult> {
    const basicResult = await this.processSimulationResult(result, gasUnitPrice, executionTime, transactionData);
    
    // Add state analysis
    const stateAnalysis = await this.analyzeStateChanges(result);
    basicResult.stateAnalysis = stateAnalysis;

    return basicResult;
  }

  // Analyze detailed gas breakdown
  private async analyzeDetailedGas(simulationResult: any): Promise<DetailedGasBreakdown> {
    return gasAnalyzer.analyzeDetailedGas(simulationResult);
  }

  // Analyze state changes
  private async analyzeStateChanges(simulationResult: any): Promise<StateChangeAnalysis> {
    // Basic state change analysis - can be expanded
    const beforeState = {}; // Would need to fetch before state
    const afterState = {}; // Would need to calculate after state
    
    return {
      beforeState,
      afterState,
      coinStoreDiff: {
        balanceChanges: new Map(),
        newCoinTypes: [],
        removedCoinTypes: [],
      },
      resourceDiff: (simulationResult.changes || []).map((change: any) => ({
        resourceType: change.type || 'unknown',
        action: change.type === 'delete_resource' ? 'deleted' as const : 
                change.type === 'write_resource' ? 'modified' as const : 'created' as const,
        afterValue: change.data,
      })),
    };
  }

  // Helper method to process simulation results
  private async processSimulationResult(result: any, gasUnitPrice: number | undefined, executionTime: number, transactionData?: TransactionData): Promise<SimulationResult> {
    const gasUsed = parseInt(result.gas_used || '0');
    const effectiveGasPrice = gasUnitPrice || 100; // fallback gas price
    const totalGasCost = gasUsed * effectiveGasPrice;
    const totalGasCostAPT = totalGasCost / 100000000;
    const success = result.success;
    
    const simulationResult: SimulationResult = {
      success,
      gasUsed,
      gasUnitPrice: effectiveGasPrice,
      totalGasCost,
      totalGasCostAPT,
      vmStatus: result.vm_status || 'Unknown',
      changes: (result.changes || []).map((change: any) => ({
        address: change.address || '',
        data: change.data || {},
        type: change.type || 'write_resource',
        state_key_hash: change.state_key_hash || '',
      })),
      events: (result.events || []).map((event: any) => ({
        type: event.type || '',
        data: event.data || {},
        guid: event.guid || {},
        sequence_number: event.sequence_number || '0',
      })),
      error: success ? undefined : this.parseVmError(result.vm_status || ''),
      executionTime,
    };

    try {
      // Generate gas breakdown
      console.log('Generating gas breakdown for simulation result:', simulationResult);
      const gasBreakdown = gasBreakdownGenerator.generateFromSimulation(simulationResult);
      simulationResult.gasBreakdown = gasBreakdown;
      console.log('Gas breakdown generated:', gasBreakdown);

      // Generate execution trace if transaction data is available
      if (transactionData) {
        console.log('Generating execution trace for transaction data:', transactionData);
        const trace = await traceSimulator.simulateWithTrace(transactionData, simulationResult);
        simulationResult.trace = trace;
        console.log('Execution trace generated:', trace);
      }
    } catch (error) {
      console.error('Failed to generate extended analysis:', error);
      // Add error details for debugging
      if (error instanceof Error) {
        console.error('Error details:', error.message, error.stack);
      }
      // Continue without extended analysis
    }
    
    return simulationResult;
  }

  // Helper method to create error results
  private createErrorResult(error: unknown, executionTime: number): SimulationResult {
    return {
      success: false,
      gasUsed: 0,
      gasUnitPrice: 0,
      totalGasCost: 0,
      totalGasCostAPT: 0,
      vmStatus: 'Simulation Error',
      error: this.parseError(error),
      executionTime,
    };
  }

  // Validate transaction before simulation
  async validateTransaction(transactionData: TransactionData): Promise<{valid: boolean; errors: string[]}> {
    const errors: string[] = [];

    try {
      // Check if sender account exists
      await aptosClient.getAccountInfo(transactionData.sender);
    } catch (error: any) {
      if (error?.message?.includes('does not exist')) {
        errors.push('Sender account does not exist on the current network');
      } else if (error?.message?.includes('network response error')) {
        errors.push('Unable to verify sender account due to network issues');
      } else {
        errors.push('Failed to validate sender account');
      }
    }

    // Validate function format for entry functions
    if (transactionData.type === 'entry_function') {
      const payload = transactionData.payload as any;
      if (!payload?.function || !payload.function.includes('::')) {
        errors.push('Invalid function format. Please use address::module::function format');
      }
    }

    // Check gas parameters
    if (transactionData.maxGasAmount && transactionData.maxGasAmount < 100) {
      errors.push('Max gas amount is too small');
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}

export const transactionSimulator = new TransactionSimulator();