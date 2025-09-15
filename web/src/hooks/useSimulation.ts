import { useCallback, useEffect } from 'react';
import { useSimulationStore } from '@/stores/simulationStore';
import { TransactionData } from '@/types';
import { transactionSimulator } from '@/lib/simulator';

export function useSimulation() {
  const {
    transactionData,
    status,
    result,
    history,
    validationErrors,
    setTransactionData,
    updateTransactionField,
    setStatus,
    setResult,
    addToHistory,
    clearHistory,
    simulateTransaction,
    resetSimulation,
    setValidationErrors,
  } = useSimulationStore();

  const simulate = useCallback(async () => {
    await simulateTransaction();
  }, [simulateTransaction]);

  const validateTransaction = useCallback(async (data?: Partial<TransactionData>) => {
    const targetData = data || transactionData;
    
    try {
      const validation = await transactionSimulator.validateTransaction(targetData as TransactionData);
      setValidationErrors(validation.errors);
      return validation.valid;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Validation failed';
      setValidationErrors([errorMessage]);
      return false;
    }
  }, [transactionData, setValidationErrors]);

  const estimateGas = useCallback(async () => {
    try {
      if (!transactionData.sender || !transactionData.payload) {
        throw new Error('Transaction data incomplete');
      }

      const gasEstimation = await transactionSimulator.estimateGas(transactionData as TransactionData);
      return gasEstimation;
    } catch (error) {
      console.error('Gas estimation failed:', error);
      throw error;
    }
  }, [transactionData]);

  const updateFunction = useCallback((functionName: string) => {
    updateTransactionField('payload', {
      function: functionName,
      function_arguments: [],
      type_arguments: [],
    });
  }, [updateTransactionField]);

  const updateArguments = useCallback((args: any[]) => {
    const currentPayload = transactionData.payload as any;
    updateTransactionField('payload', {
      ...currentPayload,
      function_arguments: args,
    });
  }, [transactionData.payload, updateTransactionField]);

  const updateTypeArguments = useCallback((typeArgs: string[]) => {
    const currentPayload = transactionData.payload as any;
    updateTransactionField('payload', {
      ...currentPayload,
      type_arguments: typeArgs,
    });
  }, [transactionData.payload, updateTransactionField]);

  const reset = useCallback(() => {
    resetSimulation();
  }, [resetSimulation]);

  const clearSimulationHistory = useCallback(() => {
    clearHistory();
  }, [clearHistory]);

  // Auto-validation when transaction data changes
  useEffect(() => {
    if (transactionData.sender && transactionData.payload) {
      validateTransaction(transactionData);
    }
  }, [transactionData, validateTransaction]);

  return {
    // State
    transactionData,
    status: status.status,
    result,
    history,
    validationErrors,
    error: status.error,
    
    // Computed state
    isSimulating: status.status === 'simulating',
    isSuccess: status.status === 'success',
    isError: status.status === 'error',
    hasResult: !!result,
    isValid: validationErrors.length === 0,
    
    // Actions
    simulate,
    validateTransaction,
    estimateGas,
    reset,
    clearHistory: clearSimulationHistory,
    
    // Data updates
    setTransactionData,
    updateTransactionField,
    updateFunction,
    updateArguments,
    updateTypeArguments,
  };
}