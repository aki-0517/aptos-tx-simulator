import { Aptos, Account, AccountAddress, SimpleTransaction, InputEntryFunctionData, TransactionPayloadEntryFunction, Ed25519PublicKey } from '@aptos-labs/ts-sdk';
import { aptosClient } from './aptos-client';
import { SimulationResult, SimulationError, GasEstimation, TransactionData } from '@/types';

export class TransactionSimulator {
  private aptos: Aptos;

  constructor() {
    this.aptos = aptosClient.getCurrentClient();
  }

  async simulateTransaction(transactionData: TransactionData): Promise<SimulationResult> {
    const startTime = performance.now();
    
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

        transaction = await this.aptos.transaction.build.simple({
          sender: transactionData.sender,
          data: inputData,
          options: {
            maxGasAmount: transactionData.maxGasAmount,
            gasUnitPrice: transactionData.gasUnitPrice,
          },
        });
      } else {
        throw new Error('Script transactions not implemented yet');
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

      const simulationResult = await this.aptos.transaction.simulate.simple({
        signerPublicKey,
        transaction,
      });

      const executionTime = performance.now() - startTime;

      // Process the simulation result
      if (simulationResult && simulationResult.length > 0) {
        const result = simulationResult[0];
        const gasUsed = parseInt(result.gas_used || '0');
        const gasUnitPrice = transactionData.gasUnitPrice || await aptosClient.getCurrentGasPrice();
        const totalGasCost = gasUsed * gasUnitPrice;
        const totalGasCostAPT = totalGasCost / 100000000; // Convert from octas to APT

        const success = result.success;
        
        return {
          success,
          gasUsed,
          gasUnitPrice,
          totalGasCost,
          totalGasCostAPT,
          vmStatus: result.vm_status || 'Unknown',
          changes: (result.changes || []).map((change: any) => ({
            address: change.address || '',
            data: change.data || {},
            type: change.type || 'write_resource',
          })),
          events: (result.events || []).map((event: any) => ({
            type: event.type || '',
            data: event.data || {},
          })),
          error: success ? undefined : this.parseVmError(result.vm_status || ''),
          executionTime,
        };
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
      const simulationResult = await this.simulateTransaction(transactionData);
      
      if (!simulationResult.success) {
        throw new Error('Cannot estimate gas for failing transaction');
      }

      const gasUsed = simulationResult.gasUsed;
      const gasUnitPrice = simulationResult.gasUnitPrice;
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