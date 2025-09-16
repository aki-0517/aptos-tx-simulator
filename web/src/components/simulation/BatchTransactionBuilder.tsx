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

interface BatchTransactionBuilderProps {
  onResults?: (results: any) => void;
}

export function BatchTransactionBuilder({ onResults }: BatchTransactionBuilderProps) {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [executeSequentially, setExecuteSequentially] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [results, setResults] = useState<any>(null);

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
    try {
      const batchData = {
        type: 'batch' as const,
        transactions,
        executeSequentially,
      };

      const result = await batchTransactionSimulator.simulateBatch(batchData);
      setResults(result);
      onResults?.(result);
    } catch (error: any) {
      console.error('Batch simulation failed:', error);
      
      // Create a detailed error result
      const errorResult = {
        success: false,
        error: {
          message: error.message || 'Batch simulation failed',
          details: error.details || 'An unexpected error occurred during batch simulation',
          suggestion: error.suggestion || 'Please check your transaction data and try again',
          transactionIndex: error.transactionIndex,
          code: error.code || 'BATCH_SIMULATION_ERROR'
        },
        gasUsed: 0,
        totalGasCostAPT: 0,
        executionTime: 0,
        individualResults: transactions.map((tx, index) => ({
          success: false,
          gasUsed: 0,
          vmStatus: 'FAILED',
          error: {
            message: error.message || 'Transaction failed',
            details: error.details || 'Unable to simulate this transaction'
          }
        })),
        dependencies: []
      };
      
      setResults(errorResult);
      onResults?.(errorResult);
    } finally {
      setIsSimulating(false);
    }
  };

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

      {/* Results */}
      {results && <BatchResultsDisplay results={results} />}
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

interface BatchResultsDisplayProps {
  results: any;
}

function BatchResultsDisplay({ results }: BatchResultsDisplayProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant={results.success ? "default" : "destructive"}>
            {results.success ? 'Success' : 'Failed'}
          </Badge>
          Batch Simulation Results
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="individual">Individual Results</TabsTrigger>
            <TabsTrigger value="dependencies">Dependencies</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* Error Display */}
            {!results.success && results.error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-2">
                    <div className="font-medium">Batch Simulation Failed</div>
                    <div className="text-sm">
                      <strong>Error:</strong> {results.error.message || 'Unknown error occurred'}
                    </div>
                    {results.error.details && (
                      <div className="text-sm">
                        <strong>Details:</strong> {results.error.details}
                      </div>
                    )}
                    {results.error.suggestion && (
                      <div className="text-sm">
                        <strong>Suggestion:</strong> {results.error.suggestion}
                      </div>
                    )}
                    {results.error.transactionIndex !== undefined && (
                      <div className="text-sm">
                        <strong>Failed Transaction:</strong> #{results.error.transactionIndex + 1}
                      </div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Total Gas Used</h4>
                <p className="text-2xl font-bold">{results.gasUsed?.toLocaleString() || '0'}</p>
                <p className="text-sm text-muted-foreground">
                  {(results.totalGasCostAPT || 0).toFixed(6)} APT
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Execution Time</h4>
                <p className="text-2xl font-bold">{results.executionTime || '0'}ms</p>
                {results.parallelExecutionSavings && (
                  <p className="text-sm text-green-600">
                    ~{results.parallelExecutionSavings} gas saved from parallelization
                  </p>
                )}
              </div>
            </div>

            {/* Summary Statistics */}
            {results.individualResults && (
              <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {results.individualResults.filter((r: any) => r.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Successful</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">
                    {results.individualResults.filter((r: any) => !r.success).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Failed</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold">
                    {results.individualResults.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="individual" className="space-y-3">
            {results.individualResults?.map((result: any, index: number) => (
              <div key={index} className="p-3 border rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Transaction #{index + 1}</span>
                  <Badge variant={result.success ? "default" : "destructive"}>
                    {result.success ? 'Success' : 'Failed'}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  Gas: {result.gasUsed || 0} | Status: {result.vmStatus || 'Unknown'}
                </div>
                
                {/* Error Details for Failed Transactions */}
                {!result.success && result.error && (
                  <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800 rounded">
                    <div className="text-sm">
                      <div className="font-medium text-red-800 dark:text-red-200 mb-1">
                        Error Details:
                      </div>
                      <div className="text-red-700 dark:text-red-300">
                        {result.error.message || result.error}
                      </div>
                      {result.error.suggestion && (
                        <div className="mt-1 text-xs text-red-600 dark:text-red-400">
                          <strong>Suggestion:</strong> {result.error.suggestion}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </TabsContent>

          <TabsContent value="dependencies" className="space-y-3">
            {results.dependencies?.length > 0 ? (
              results.dependencies.map((dep: any, index: number) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex items-center gap-2">
                    <span>Transaction #{dep.fromTransaction + 1}</span>
                    <ArrowRight className="h-4 w-4" />
                    <span>Transaction #{dep.toTransaction + 1}</span>
                    <Badge variant="outline">{dep.dependencyType}</Badge>
                    <Badge variant={dep.conflictRisk === 'high' ? 'destructive' : 'secondary'}>
                      {dep.conflictRisk} risk
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-muted-foreground">
                No dependencies detected between transactions
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}