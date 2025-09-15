'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimulation } from '@/hooks/useSimulation';
import { formatAPT, formatGas, formatNumber } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, Copy, ExternalLink, BarChart3, Activity, GitBranch } from 'lucide-react';
import { useAptosClient } from '@/hooks/useAptosClient';
import { GasBreakdownChart } from './GasBreakdownChart';
import { TraceViewer } from '../debugging/TraceViewer';
import { StateChangeViewer } from '../debugging/StateChangeViewer';

export function SimulationResults() {
  const { result, status, isSimulating, isSuccess, isError, hasResult } = useSimulation();
  const { getExplorerUrl } = useAptosClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'gas' | 'trace' | 'state'>('overview');

  if (isSimulating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Simulating...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-pulse text-muted-foreground">
              Running transaction simulation
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasResult) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="text-muted-foreground text-center">
            <p className="text-lg mb-2">Ready to display results</p>
            <p className="text-sm">Create a transaction in the left form and run the simulation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const tabs = [
    { 
      key: 'overview', 
      label: 'Overview', 
      icon: CheckCircle,
      available: true 
    },
    { 
      key: 'gas', 
      label: 'Gas Analysis', 
      icon: BarChart3,
      available: !!result?.gasBreakdown 
    },
    { 
      key: 'trace', 
      label: 'Execution Trace', 
      icon: Activity,
      available: !!result?.trace 
    },
    { 
      key: 'state', 
      label: 'State Changes', 
      icon: GitBranch,
      available: !!(result?.changes?.length || result?.events?.length) 
    },
  ];

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Simulation Successful
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Simulation Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            Execution time: {result?.executionTime.toFixed(2)}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">VM Status</p>
              <p className="text-lg font-mono">{result?.vmStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Result</p>
              <p className={`text-lg font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? 'Success' : 'Failed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tab Navigation */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex space-x-1 border-b">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  disabled={!tab.available}
                  className={`flex items-center gap-2 px-4 py-2 rounded-t-lg text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                      : tab.available
                      ? 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                  {!tab.available && <span className="text-xs">(N/A)</span>}
                </button>
              );
            })}
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'gas' && renderGasTab()}
          {activeTab === 'trace' && renderTraceTab()}
          {activeTab === 'state' && renderStateTab()}
        </CardContent>
      </Card>
    </div>
  );

  function renderOverviewTab() {
    return (
      <div className="space-y-6">
        {/* Gas Information Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Gas Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Gas Used</p>
                <p className="text-2xl font-bold">{formatGas(result?.gasUsed || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gas Unit Price</p>
                <p className="text-2xl font-bold">{formatGas(result?.gasUnitPrice || 0)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Gas Cost</p>
                <p className="text-2xl font-bold">{formatNumber(result?.totalGasCost || 0)} octas</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">APT Cost</p>
                <p className="text-2xl font-bold text-primary">{formatAPT(result?.totalGasCost || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Error Details */}
        {result?.error && (
          <Card className="border-destructive">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <AlertTriangle className="h-5 w-5" />
                Error Details
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium">Error Code</p>
                  <p className="font-mono text-sm bg-muted p-2 rounded">{result.error.code}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Message</p>
                  <p className="text-sm bg-muted p-2 rounded">{result.error.message}</p>
                </div>
                {result.error.suggestion && (
                  <div>
                    <p className="text-sm font-medium">Suggestion</p>
                    <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                      {result.error.suggestion}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  const data = JSON.stringify(result, null, 2);
                  navigator.clipboard.writeText(data);
                }}
              >
                <Copy className="h-4 w-4 mr-2" />
                Copy Results
              </Button>
              <Button
                variant="outline"
                onClick={() => window.open(getExplorerUrl(), '_blank')}
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                View on Explorer
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderGasTab() {
    if (!result?.gasBreakdown) {
      return (
        <div className="text-center py-8 text-gray-500">
          Detailed gas analysis not available for this transaction
        </div>
      );
    }

    return (
      <GasBreakdownChart 
        gasBreakdown={result.gasBreakdown}
        totalGas={result.gasUsed}
      />
    );
  }

  function renderTraceTab() {
    if (!result?.trace) {
      return (
        <div className="text-center py-8 text-gray-500">
          Execution trace not available for this transaction
        </div>
      );
    }

    return <TraceViewer trace={result.trace} />;
  }

  function renderStateTab() {
    return (
      <StateChangeViewer
        changes={result?.changes || []}
        events={result?.events || []}
        stateAnalysis={result?.stateAnalysis}
      />
    );
  }
}