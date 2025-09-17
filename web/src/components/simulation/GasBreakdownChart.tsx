'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DetailedGasBreakdown } from '@/types/simulation';
import { BarChart3, Zap, Clock, Database, Cpu } from 'lucide-react';

interface GasBreakdownChartProps {
  gasBreakdown: DetailedGasBreakdown;
  totalGas: number;
}

export function GasBreakdownChart({ gasBreakdown, totalGas }: GasBreakdownChartProps) {
  // Calculate category totals
  const intrinsicTotal = Object.values(gasBreakdown.intrinsic).reduce((sum, val) => sum + val, 0);
  const executionTotal = Object.values(gasBreakdown.execution).reduce((sum, val) => sum + val, 0);
  const ioTotal = Object.values(gasBreakdown.io).reduce((sum, val) => sum + val, 0);
  const storageTotal = Object.values(gasBreakdown.storage).reduce((sum, val) => sum + val, 0);

  const categories = [
    {
      name: 'Intrinsic',
      total: intrinsicTotal,
      percentage: (intrinsicTotal / totalGas) * 100,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
      icon: Clock,
      details: gasBreakdown.intrinsic,
      description: 'Basic transaction processing costs'
    },
    {
      name: 'Execution',
      total: executionTotal,
      percentage: (executionTotal / totalGas) * 100,
      color: 'bg-green-500',
      textColor: 'text-green-600',
      icon: Cpu,
      details: gasBreakdown.execution,
      description: 'Move bytecode execution costs'
    },
    {
      name: 'I/O',
      total: ioTotal,
      percentage: (ioTotal / totalGas) * 100,
      color: 'bg-yellow-500',
      textColor: 'text-yellow-600',
      icon: Zap,
      details: gasBreakdown.io,
      description: 'Storage and event processing costs'
    },
    {
      name: 'Storage',
      total: storageTotal,
      percentage: (storageTotal / totalGas) * 100,
      color: 'bg-red-500',
      textColor: 'text-red-600',
      icon: Database,
      details: gasBreakdown.storage,
      description: 'Storage operation costs'
    },
  ].filter(cat => cat.total > 0);

  const formatGasAmount = (amount: number): string => {
    return amount.toLocaleString();
  };

  const formatPercentage = (percentage: number): string => {
    return percentage.toFixed(1) + '%';
  };

  // Calculate efficiency score
  const getEfficiencyScore = (): { score: number; rating: string; color: string } => {
    const executionRatio = executionTotal / totalGas;
    const intrinsicRatio = intrinsicTotal / totalGas;
    
    // Good efficiency: High execution ratio, reasonable intrinsic costs
    let score = 0;
    if (executionRatio > 0.4 && executionRatio < 0.7) score += 40; // Good execution balance
    if (intrinsicRatio < 0.2) score += 30; // Low overhead
    if (ioTotal < totalGas * 0.3) score += 20; // Reasonable I/O
    if (storageTotal < totalGas * 0.15) score += 10; // Reasonable storage

    let rating = 'Poor';
    let color = 'text-red-600';
    if (score >= 70) { rating = 'Excellent'; color = 'text-green-600'; }
    else if (score >= 50) { rating = 'Good'; color = 'text-blue-600'; }
    else if (score >= 30) { rating = 'Fair'; color = 'text-yellow-600'; }

    return { score, rating, color };
  };

  const efficiency = getEfficiencyScore();

  return (
    <div className="space-y-6">
      {/* Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Gas Analysis Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{formatGasAmount(totalGas)}</div>
              <div className="text-sm text-muted-foreground">Total Gas Used</div>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${efficiency.color}`}>
                {efficiency.rating}
              </div>
              <div className="text-sm text-muted-foreground">Efficiency Rating</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {efficiency.score}/100
              </div>
              <div className="text-sm text-muted-foreground">Efficiency Score</div>
            </div>
          </div>

          {/* Visual breakdown bar */}
          <div className="mb-4">
            <div className="flex h-6 rounded-lg overflow-hidden border">
              {categories.map((cat) => (
                <div
                  key={cat.name}
                  className={cat.color}
                  style={{ width: `${cat.percentage}%` }}
                  title={`${cat.name}: ${formatPercentage(cat.percentage)}`}
                />
              ))}
            </div>
            <div className="flex flex-wrap gap-4 mt-3">
              {categories.map((cat) => (
                <div key={cat.name} className="flex items-center gap-2">
                  <div className={`w-3 h-3 ${cat.color} rounded`} />
                  <span className="text-sm">
                    {cat.name}: {formatPercentage(cat.percentage)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <Card key={category.name}>
              <CardHeader>
                <CardTitle className={`flex items-center gap-2 ${category.textColor}`}>
                  <Icon className="h-5 w-5" />
                  {category.name} Costs
                </CardTitle>
                <p className="text-sm text-muted-foreground">{category.description}</p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total</span>
                    <div className="text-right">
                      <div className="font-bold">{formatGasAmount(category.total)}</div>
                      <div className="text-sm text-muted-foreground">
                        {formatPercentage(category.percentage)}
                      </div>
                    </div>
                  </div>
                  
                  {/* Detailed breakdown */}
                  <div className="space-y-2 pt-2 border-t">
                    {Object.entries(category.details).map(([key, value]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-muted-foreground capitalize">
                          {key.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono">
                          {formatGasAmount(value)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Efficiency recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Optimization Recommendations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {executionTotal / totalGas > 0.7 && (
              <div className="p-3 bg-yellow-50 dark:bg-yellow-950/10 border border-yellow-200 dark:border-yellow-800 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">High Execution Cost</Badge>
                </div>
                <p className="text-sm mt-1">
                  Execution costs are {formatPercentage((executionTotal / totalGas) * 100)} of total gas. 
                  Consider optimizing Move function complexity.
                </p>
              </div>
            )}
            
            {ioTotal / totalGas > 0.4 && (
              <div className="p-3 bg-orange-50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-800 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">High I/O Cost</Badge>
                </div>
                <p className="text-sm mt-1">
                  I/O costs are {formatPercentage((ioTotal / totalGas) * 100)} of total gas. 
                  Consider batching storage operations and reducing event emissions.
                </p>
              </div>
            )}

            {storageTotal / totalGas > 0.2 && (
              <div className="p-3 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">High Storage Cost</Badge>
                </div>
                <p className="text-sm mt-1">
                  Storage costs are {formatPercentage((storageTotal / totalGas) * 100)} of total gas. 
                  Consider minimizing state changes and deletions.
                </p>
              </div>
            )}

            {efficiency.score >= 70 && (
              <div className="p-3 bg-green-50 dark:bg-green-950/10 border border-green-200 dark:border-green-800 rounded">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Well Optimized</Badge>
                </div>
                <p className="text-sm mt-1">
                  Your transaction has excellent gas efficiency with a score of {efficiency.score}/100. 
                  Gas usage is well distributed across categories.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}