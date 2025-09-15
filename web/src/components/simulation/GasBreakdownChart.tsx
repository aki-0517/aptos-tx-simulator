'use client';

import React from 'react';
import { Card } from '@/components/ui/card';
import { DetailedGasBreakdown } from '@/types';
import { gasAnalyzer } from '@/lib/gas-analyzer';

interface GasBreakdownChartProps {
  gasBreakdown: DetailedGasBreakdown;
  totalGas: number;
}

export function GasBreakdownChart({ gasBreakdown, totalGas }: GasBreakdownChartProps) {
  const distribution = gasAnalyzer.getGasDistribution(gasBreakdown);
  const efficiency = gasAnalyzer.calculateGasEfficiency(gasBreakdown);

  const categories = [
    {
      name: 'Intrinsic',
      value: distribution.intrinsic,
      color: 'bg-blue-500',
      details: gasBreakdown.intrinsic,
    },
    {
      name: 'Execution',
      value: distribution.execution,
      color: 'bg-green-500',
      details: gasBreakdown.execution,
    },
    {
      name: 'I/O',
      value: distribution.io,
      color: 'bg-yellow-500',
      details: gasBreakdown.io,
    },
    {
      name: 'Storage',
      value: distribution.storage,
      color: 'bg-red-500',
      details: gasBreakdown.storage,
    },
  ];

  const formatGasAmount = (amount: number): string => {
    if (amount === 0) return '0';
    return amount.toLocaleString();
  };

  const formatPercentage = (percentage: number): string => {
    return percentage.toFixed(1) + '%';
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Detailed Gas Breakdown</h3>
      
      {/* Summary */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-600">Total Gas Used</div>
            <div className="text-xl font-bold">{formatGasAmount(totalGas)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-600">Efficiency Rating</div>
            <div className={`text-xl font-bold ${
              efficiency.efficiency === 'high' ? 'text-green-600' :
              efficiency.efficiency === 'medium' ? 'text-yellow-600' :
              'text-red-600'
            }`}>
              {efficiency.efficiency.toUpperCase()}
            </div>
          </div>
        </div>
      </div>

      {/* Visual breakdown */}
      <div className="mb-6">
        <div className="flex h-8 rounded-lg overflow-hidden">
          {categories.map((cat) => (
            cat.value > 0 && (
              <div
                key={cat.name}
                className={cat.color}
                style={{ width: `${cat.value}%` }}
                title={`${cat.name}: ${formatPercentage(cat.value)}`}
              />
            )
          ))}
        </div>
        <div className="flex justify-between text-xs text-gray-600 mt-2">
          {categories.map((cat) => (
            cat.value > 0 && (
              <span key={cat.name} className="flex items-center">
                <div className={`w-3 h-3 ${cat.color} rounded mr-1`} />
                {cat.name}: {formatPercentage(cat.value)}
              </span>
            )
          ))}
        </div>
      </div>

      {/* Detailed breakdown */}
      <div className="space-y-4">
        {categories.map((category) => (
          <div key={category.name} className="border rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h4 className="font-medium flex items-center">
                <div className={`w-4 h-4 ${category.color} rounded mr-2`} />
                {category.name}
              </h4>
              <div className="text-right">
                <div className="font-medium">
                  {formatGasAmount(Object.values(category.details).reduce((sum, val) => sum + val, 0))}
                </div>
                <div className="text-sm text-gray-600">
                  {formatPercentage(category.value)}
                </div>
              </div>
            </div>
            
            <div className="space-y-2">
              {Object.entries(category.details).map(([key, value]) => (
                value > 0 && (
                  <div key={key} className="flex justify-between text-sm">
                    <span className="text-gray-600 capitalize">
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="font-medium">{formatGasAmount(value)}</span>
                  </div>
                )
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Recommendations */}
      {efficiency.recommendations.length > 0 && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">Optimization Recommendations</h4>
          <ul className="space-y-1">
            {efficiency.recommendations.map((rec, index) => (
              <li key={index} className="text-sm text-blue-700 flex items-start">
                <span className="mr-2">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
          {efficiency.optimizationPotential > 0 && (
            <div className="mt-3 text-sm text-blue-600">
              <strong>Optimization Potential:</strong> ~{efficiency.optimizationPotential}% gas reduction possible
            </div>
          )}
        </div>
      )}
    </Card>
  );
}