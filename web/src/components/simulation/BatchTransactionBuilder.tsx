'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Play, ArrowRight, Shuffle, FileText, AlertCircle } from 'lucide-react';
import { TransactionData } from '@/types/aptos';
import { EntryFunction } from '@aptos-labs/ts-sdk';
import { batchTransactionSimulator } from '@/lib/batch-simulator';
import { useSimulationStore } from '@/stores/simulationStore';

interface BatchTransactionBuilderProps {
  onResults?: (results: any) => void;
  onSimulationRun?: () => void;
}

export function BatchTransactionBuilder({ onResults, onSimulationRun }: BatchTransactionBuilderProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [executeSequentially, setExecuteSequentially] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const { setResult, setStatus, addToHistory } = useSimulationStore();

  const addTransaction = () => {
    const newTransaction = {
      type: 'entry_function',
      sender: '',
      payload: {
        function: '',
        function_arguments: [],
        type_arguments: [],
      },
      maxGasAmount: 100000,
      gasUnitPrice: 100,
    };
    setTransactions([...transactions, newTransaction]);
  };

  const removeTransaction = (index: number) => {
    setTransactions(transactions.filter((_, i) => i !== index));
  };

  const updateTransaction = (index: number, updates: any) => {
    const updated = [...transactions];
    updated[index] = { ...updated[index], ...updates };
    setTransactions(updated);
  };

  const simulateBatch = async () => {
    if (transactions.length === 0) return;

    setIsSimulating(true);
    setStatus('simulating');
    onSimulationRun?.();
    try {
      const batchData = {
        type: 'batch' as const,
        transactions,
        executeSequentially,
      };

      const result = await batchTransactionSimulator.simulateBatch(batchData);
      
      // Transform batch result to match SimulationResult format
      const simulationResult = {
        ...result, // Spread the result as it extends SimulationResult
        timestamp: Date.now(),
        // Add batch-specific data
        batchData: {
          type: 'batch',
          individualResults: result.individualResults || [],
          dependencies: result.dependencies || [],
          executeSequentially
        }
      };
      
      setResult(simulationResult);
      setStatus('success');
      addToHistory(simulationResult);
      onResults?.(result);
    } catch (error: any) {
      console.error('Batch simulation failed:', error);
      
      // Create a detailed error result
      const errorResult = {
        success: false,
        gasUsed: 0,
        gasUnitPrice: 100,
        totalGasCost: 0,
        totalGasCostAPT: 0,
        vmStatus: 'FAILED',
        executionTime: 0,
        timestamp: Date.now(),
        error: {
          message: error.message || 'Batch simulation failed',
          details: error.details || 'An unexpected error occurred during batch simulation',
          suggestion: error.suggestion || 'Please check your transaction data and try again',
          transactionIndex: error.transactionIndex,
          code: error.code || 'BATCH_SIMULATION_ERROR'
        },
        batchData: {
          type: 'batch',
          individualResults: transactions.map(() => ({
            success: false,
            gasUsed: 0,
            vmStatus: 'FAILED',
            error: {
              message: error.message || 'Transaction failed',
              details: error.details || 'Unable to simulate this transaction'
            }
          })),
          dependencies: [],
          executeSequentially
        }
      };
      
      setResult(errorResult);
      setStatus('error');
      onResults?.(errorResult);
    } finally {
      setIsSimulating(false);
    }
  };;

  const optimizeOrder = () => {
    // Simple optimization: sort by estimated gas usage
    const sorted = [...transactions].sort((a, b) => {
      const gasA = a.maxGasAmount || 100000;
      const gasB = b.maxGasAmount || 100000;
      return gasA - gasB;
    });
    setTransactions(sorted);
  };

  const loadExample = () => {
    const exampleTransactions = [
      {
        type: 'entry_function',
        sender: '0xddab2c9c082b121333038b86b2aff5e917b12901bc1ce7ea49b4fc579504f0d0',
        payload: {
          function: '0x1::coin::transfer',
          function_arguments: ['0x3', '100000000'],
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
        },
        maxGasAmount: 50000,
        gasUnitPrice: 100,
      },
      {
        type: 'entry_function',
        sender: '0xddab2c9c082b121333038b86b2aff5e917b12901bc1ce7ea49b4fc579504f0d0',
        payload: {
          function: '0x1::coin::transfer',
          function_arguments: ['0x4', '1000'],
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
        },
        maxGasAmount: 30000,
        gasUnitPrice: 100,
      },
      {
        type: 'entry_function',
        sender: '0xddab2c9c082b121333038b86b2aff5e917b12901bc1ce7ea49b4fc579504f0d0',
        payload: {
          function: '0x1::coin::transfer',
          function_arguments: ['0x5', '500'],
          type_arguments: ['0x1::aptos_coin::AptosCoin'],
        },
        maxGasAmount: 40000,
        gasUnitPrice: 100,
      }
    ];
    setTransactions(exampleTransactions);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shuffle className="h-5 w-5" />
            Batch Transaction Builder
          </CardTitle>
          <CardDescription>
            Create and simulate multiple transactions in batch
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Execution Mode */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Execution Mode</label>
            <Select 
              value={executeSequentially ? 'sequential' : 'parallel'} 
              onValueChange={(value) => setExecuteSequentially(value === 'sequential')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sequential">Sequential (Safer)</SelectItem>
                <SelectItem value="parallel">Parallel (Faster)</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {executeSequentially 
                ? 'Transactions execute in order, each one seeing changes from previous'
                : 'Transactions execute simultaneously for better performance'
              }
            </p>
          </div>

          {/* Transaction List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Transactions ({transactions.length})</h3>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={loadExample}>
                  <FileText className="h-4 w-4 mr-1" />
                  Load Example
                </Button>
                <Button variant="outline" size="sm" onClick={optimizeOrder} disabled={transactions.length < 2}>
                  <Shuffle className="h-4 w-4 mr-1" />
                  Optimize Order
                </Button>
                <Button variant="outline" size="sm" onClick={addTransaction}>
                  <Plus className="h-4 w-4 mr-1" />
                  Add Transaction
                </Button>
              </div>
            </div>

            {transactions.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No transactions added yet. Click "Add Transaction" to get started.
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx, index) => (
                  <TransactionCard
                    key={index}
                    transaction={tx}
                    index={index}
                    onUpdate={(updates) => updateTransaction(index, updates)}
                    onRemove={() => removeTransaction(index)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Simulate Button */}
          {transactions.length > 0 && (
            <Button onClick={simulateBatch} disabled={isSimulating} className="w-full" size="lg">
              {isSimulating ? (
                <>Simulating {transactions.length} transactions...</>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Simulate Batch ({transactions.length} transactions)
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>

    </div>
  );
}

interface TransactionCardProps {
  transaction: any;
  index: number;
  onUpdate: (updates: any) => void;
  onRemove: () => void;
}

function TransactionCard({ transaction, index, onUpdate, onRemove }: TransactionCardProps) {
  const updatePayload = (field: string, value: any) => {
    const payload = transaction.payload as any;
    onUpdate({
      payload: { ...payload, [field]: value }
    });
  };

  return (
    <Card className="relative">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">#{index + 1}</Badge>
            <span className="text-sm font-medium">Transaction {index + 1}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <label className="text-xs font-medium">Sender</label>
            <Input
              placeholder="0x..."
              value={transaction.sender}
              onChange={(e) => onUpdate({ sender: e.target.value })}
              className="text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Max Gas</label>
            <Input
              type="number"
              value={transaction.maxGasAmount || ''}
              onChange={(e) => onUpdate({ maxGasAmount: parseInt(e.target.value) || 0 })}
              className="text-sm"
            />
          </div>
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Function</label>
          <Input
            placeholder="0x1::coin::transfer"
            value={(transaction.payload as any)?.function || ''}
            onChange={(e) => updatePayload('function', e.target.value)}
            className="text-sm"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-medium">Arguments (comma-separated)</label>
          <Input
            placeholder="arg1, arg2, arg3"
            value={(transaction.payload as any)?.function_arguments?.join(', ') || ''}
            onChange={(e) => {
              const args = e.target.value.split(',').map(arg => arg.trim()).filter(Boolean);
              updatePayload('function_arguments', args);
            }}
            className="text-sm"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-medium">Type Arguments (comma-separated)</label>
          <Input
            placeholder="0x2::aptos_coin::AptosCoin, ..."
            value={(transaction.payload as any)?.type_arguments?.join(', ') || ''}
            onChange={(e) => {
              const targs = e.target.value.split(',').map(arg => arg.trim()).filter(Boolean);
              updatePayload('type_arguments', targs);
            }}
            className="text-sm"
          />
        </div>
      </CardContent>
    </Card>
  );
}