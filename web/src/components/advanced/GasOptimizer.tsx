'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Zap, 
  TrendingUp, 
  Target, 
  Settings,
  CheckCircle,
  AlertCircle,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Lightbulb
} from 'lucide-react';
import { TransactionData } from '@/types/aptos';
import { SimulationResult } from '@/types/simulation';

interface GasOptimizerProps {
  transactionData: Partial<TransactionData>;
  simulationResult?: SimulationResult;
  onOptimize?: (optimizations: GasOptimization[]) => void;
}

export function GasOptimizer({ transactionData, simulationResult, onOptimize }: GasOptimizerProps) {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizations, setOptimizations] = useState<GasOptimization[]>([]);
  const [selectedOptimizations, setSelectedOptimizations] = useState<Set<string>>(new Set());

  const runOptimization = async () => {
    if (!simulationResult) return;

    setIsOptimizing(true);
    try {
      // Simulate gas optimization analysis
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const optimizationSuggestions = await generateOptimizations(transactionData, simulationResult);
      setOptimizations(optimizationSuggestions);
    } catch (error) {
      console.error('Gas optimization failed:', error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const applyOptimizations = () => {
    const selectedOpts = optimizations.filter(opt => selectedOptimizations.has(opt.id));
    onOptimize?.(selectedOpts);
  };

  const toggleOptimization = (id: string) => {
    const newSelected = new Set(selectedOptimizations);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedOptimizations(newSelected);
  };

  const totalPotentialSavings = Array.from(selectedOptimizations)
    .reduce((total, id) => {
      const opt = optimizations.find(o => o.id === id);
      return total + (opt?.gasSavings || 0);
    }, 0);

  const savingsPercent = simulationResult 
    ? Math.round((totalPotentialSavings / simulationResult.gasUsed) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Gas Optimization Engine
          </CardTitle>
          <CardDescription>
            AI-powered analysis to reduce transaction gas costs and improve efficiency
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Current Gas Stats */}
            {simulationResult && (
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
                <div className="text-center">
                  <div className="text-2xl font-bold">{simulationResult.gasUsed.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Current Gas Used</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{totalPotentialSavings.toLocaleString()}</div>
                  <div className="text-sm text-muted-foreground">Potential Savings</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{savingsPercent}%</div>
                  <div className="text-sm text-muted-foreground">Efficiency Gain</div>
                </div>
              </div>
            )}

            {/* Optimization Controls */}
            <div className="flex justify-between items-center">
              <div>
                <Button onClick={runOptimization} disabled={isOptimizing || !simulationResult}>
                  {isOptimizing ? (
                    <>
                      <Settings className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Target className="h-4 w-4 mr-2" />
                      Analyze Gas Optimizations
                    </>
                  )}
                </Button>
              </div>
              {optimizations.length > 0 && (
                <Button onClick={applyOptimizations} disabled={selectedOptimizations.size === 0}>
                  Apply Selected ({selectedOptimizations.size})
                </Button>
              )}
            </div>

            {/* Optimization Progress */}
            {isOptimizing && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Analyzing transaction patterns...</span>
                  <span>75%</span>
                </div>
                <Progress value={75} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Optimization Results */}
      {optimizations.length > 0 && (
        <Card>
          <CardContent className="p-6">
            <Tabs defaultValue="optimizations" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="optimizations">Optimizations</TabsTrigger>
                <TabsTrigger value="analysis">Gas Analysis</TabsTrigger>
                <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
              </TabsList>

              <TabsContent value="optimizations" className="space-y-4">
                <OptimizationsList
                  optimizations={optimizations}
                  selectedOptimizations={selectedOptimizations}
                  onToggleOptimization={toggleOptimization}
                />
              </TabsContent>

              <TabsContent value="analysis" className="space-y-4">
                <GasAnalysisBreakdown simulationResult={simulationResult} />
              </TabsContent>

              <TabsContent value="recommendations" className="space-y-4">
                <OptimizationRecommendations optimizations={optimizations} />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

interface OptimizationsListProps {
  optimizations: GasOptimization[];
  selectedOptimizations: Set<string>;
  onToggleOptimization: (id: string) => void;
}

function OptimizationsList({ 
  optimizations, 
  selectedOptimizations, 
  onToggleOptimization 
}: OptimizationsListProps) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">Available Optimizations ({optimizations.length})</h4>
      {optimizations.map((optimization) => (
        <OptimizationCard
          key={optimization.id}
          optimization={optimization}
          isSelected={selectedOptimizations.has(optimization.id)}
          onToggle={() => onToggleOptimization(optimization.id)}
        />
      ))}
    </div>
  );
}

interface OptimizationCardProps {
  optimization: GasOptimization;
  isSelected: boolean;
  onToggle: () => void;
}

function OptimizationCard({ optimization, isSelected, onToggle }: OptimizationCardProps) {
  const getImpactColor = (impact: 'low' | 'medium' | 'high') => {
    switch (impact) {
      case 'high': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-blue-500';
    }
  };

  const getComplexityColor = (complexity: 'low' | 'medium' | 'high') => {
    switch (complexity) {
      case 'low': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'high': return 'text-red-600';
    }
  };

  return (
    <Card 
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
      }`}
      onClick={onToggle}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={isSelected}
                onChange={onToggle}
                className="rounded border-gray-300"
                onClick={(e) => e.stopPropagation()}
              />
              <h5 className="font-medium">{optimization.title}</h5>
              <Badge className={`text-white ${getImpactColor(optimization.impact)}`}>
                {optimization.impact} impact
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {optimization.description}
            </p>
            <div className="flex items-center gap-4 text-xs">
              <div className="flex items-center gap-1">
                <ArrowDown className="h-3 w-3 text-green-600" />
                <span className="font-medium text-green-600">
                  -{optimization.gasSavings.toLocaleString()} gas
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                <span className={getComplexityColor(optimization.complexity)}>
                  {optimization.complexity} complexity
                </span>
              </div>
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>{optimization.category}</span>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              -{Math.round((optimization.gasSavings / 100000) * 100) / 100}%
            </div>
            <div className="text-xs text-muted-foreground">savings</div>
          </div>
        </div>

        {isSelected && optimization.implementation && (
          <div className="mt-3 pt-3 border-t">
            <h6 className="text-xs font-medium mb-1">Implementation Details</h6>
            <p className="text-xs text-muted-foreground">{optimization.implementation}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function GasAnalysisBreakdown({ simulationResult }: { simulationResult?: SimulationResult }) {
  if (!simulationResult) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No simulation result available for analysis
      </div>
    );
  }

  const gasBreakdown = [
    { category: 'Transaction Intrinsic', amount: 21000, percent: 35 },
    { category: 'Function Execution', amount: 45000, percent: 45 },
    { category: 'Storage Operations', amount: 15000, percent: 15 },
    { category: 'Event Emission', amount: 5000, percent: 5 },
  ];

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Gas Usage Breakdown
      </h4>
      
      <div className="space-y-3">
        {gasBreakdown.map((item, index) => (
          <div key={index} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span>{item.category}</span>
              <span className="font-mono">{item.amount.toLocaleString()} gas ({item.percent}%)</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className="h-2 rounded-full bg-primary"
                style={{ width: `${item.percent}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <Alert>
        <TrendingUp className="h-4 w-4" />
        <AlertDescription>
          Function execution consumes 45% of gas. Consider optimizing Move code for better efficiency.
        </AlertDescription>
      </Alert>
    </div>
  );
}

function OptimizationRecommendations({ optimizations }: { optimizations: GasOptimization[] }) {
  const highImpactOptimizations = optimizations.filter(opt => opt.impact === 'high');
  const lowComplexityOptimizations = optimizations.filter(opt => opt.complexity === 'low');

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Lightbulb className="h-4 w-4" />
          Quick Wins (Low Complexity, High Impact)
        </h4>
        {lowComplexityOptimizations.slice(0, 3).map((opt) => (
          <Alert key={opt.id}>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>{opt.title}</strong>: {opt.description} 
              <span className="text-green-600 font-medium"> (-{opt.gasSavings} gas)</span>
            </AlertDescription>
          </Alert>
        ))}
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium">General Recommendations</h4>
        <div className="space-y-2">
          <div className="flex items-start gap-2 text-sm">
            <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
            <span>Apply low-complexity optimizations first for immediate gains</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
            <span>Test high-impact changes in a development environment</span>
          </div>
          <div className="flex items-start gap-2 text-sm">
            <AlertCircle className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <span>Monitor gas usage patterns after applying optimizations</span>
          </div>
        </div>
      </div>

      {highImpactOptimizations.length > 0 && (
        <div className="p-4 bg-green-50 dark:bg-green-950/10 rounded-lg border">
          <h5 className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
            Potential Savings Summary
          </h5>
          <div className="text-2xl font-bold text-green-600">
            -{highImpactOptimizations.reduce((sum, opt) => sum + opt.gasSavings, 0).toLocaleString()} gas
          </div>
          <p className="text-sm text-green-700 dark:text-green-300">
            Available through {highImpactOptimizations.length} high-impact optimizations
          </p>
        </div>
      )}
    </div>
  );
}

// Helper function to generate optimizations based on transaction analysis
async function generateOptimizations(
  transactionData: Partial<TransactionData>, 
  simulationResult: SimulationResult
): Promise<GasOptimization[]> {
  const optimizations: GasOptimization[] = [];

  // Gas unit price optimization
  if ((transactionData.gasUnitPrice || 100) > 150) {
    optimizations.push({
      id: 'gas-price-opt',
      title: 'Reduce Gas Unit Price',
      description: 'Lower the gas unit price while maintaining reasonable transaction speed',
      category: 'pricing',
      impact: 'medium',
      complexity: 'low',
      gasSavings: Math.floor((transactionData.gasUnitPrice || 100) * 0.3 * simulationResult.gasUsed / 100),
      implementation: 'Set gasUnitPrice to 120-130 for optimal cost-speed balance'
    });
  }

  // Function argument optimization
  const payload = transactionData.payload as any;
  if (payload?.function_arguments && payload.function_arguments.length > 5) {
    optimizations.push({
      id: 'arg-optimization',
      title: 'Optimize Function Arguments',
      description: 'Reduce the number of function arguments by using struct parameters',
      category: 'structure',
      impact: 'high',
      complexity: 'medium',
      gasSavings: 15000,
      implementation: 'Group related arguments into a single struct parameter'
    });
  }

  // Storage operation optimization
  if (simulationResult.changes && simulationResult.changes.length > 3) {
    optimizations.push({
      id: 'storage-opt',
      title: 'Batch Storage Operations',
      description: 'Combine multiple storage writes into fewer operations',
      category: 'storage',
      impact: 'high',
      complexity: 'high',
      gasSavings: 25000,
      implementation: 'Refactor code to batch resource modifications'
    });
  }

  // Max gas amount optimization
  if ((transactionData.maxGasAmount || 100000) > simulationResult.gasUsed * 1.5) {
    optimizations.push({
      id: 'max-gas-opt',
      title: 'Optimize Max Gas Amount',
      description: 'Set max gas closer to actual usage to avoid over-allocation',
      category: 'allocation',
      impact: 'low',
      complexity: 'low',
      gasSavings: 5000,
      implementation: `Set maxGasAmount to ${Math.ceil(simulationResult.gasUsed * 1.2)}`
    });
  }

  // Event emission optimization
  if (simulationResult.events && simulationResult.events.length > 5) {
    optimizations.push({
      id: 'event-opt',
      title: 'Optimize Event Emissions',
      description: 'Reduce unnecessary event emissions or combine related events',
      category: 'events',
      impact: 'medium',
      complexity: 'medium',
      gasSavings: 12000,
      implementation: 'Review events and eliminate non-essential emissions'
    });
  }

  return optimizations;
}

// Types for gas optimization
export interface GasOptimization {
  id: string;
  title: string;
  description: string;
  category: 'pricing' | 'structure' | 'storage' | 'allocation' | 'events';
  impact: 'low' | 'medium' | 'high';
  complexity: 'low' | 'medium' | 'high';
  gasSavings: number;
  implementation?: string;
}