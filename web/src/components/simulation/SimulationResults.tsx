'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useSimulation } from '@/hooks/useSimulation';
import { formatAPT, formatGas, formatNumber } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, Copy, ExternalLink, BarChart3, Activity, GitBranch, Zap } from 'lucide-react';
import { useAptosClient } from '@/hooks/useAptosClient';
import { GasBreakdownChart } from './GasBreakdownChart';
import { TraceViewer } from '../debugging/TraceViewer';
import { StateChangeViewer } from '../debugging/StateChangeViewer';
import { VMExecutionVisualization } from '../advanced/VMExecutionVisualization';
import { GasOptimizer } from '../advanced/GasOptimizer';

export function SimulationResults() {
  const { result, status, isSimulating, isSuccess, isError, hasResult } = useSimulation();
  const { getExplorerUrl } = useAptosClient();
  const [activeTab, setActiveTab] = useState<'overview' | 'gas' | 'trace' | 'state' | 'vm-execution' | 'optimizer'>('overview');

  if (isSimulating) {
    return (
      <div className="bg-card border border-border rounded p-6">
        <div className="flex items-center gap-2 mb-4">
          <Clock className="h-5 w-5 animate-spin text-primary" />
          <h3 className="text-lg font-semibold">Simulating...</h3>
        </div>
        <div className="flex justify-center items-center p-8">
          <div className="animate-pulse text-muted-foreground">
            Running transaction simulation
          </div>
        </div>
      </div>
    );
  }

  if (!hasResult) {
    return (
      <div className="bg-muted/30 border border-border rounded p-8">
        <div className="text-muted-foreground text-center">
          <p className="text-lg mb-2">Ready to display results</p>
          <p className="text-sm">Create a transaction in the left form and run the simulation</p>
        </div>
      </div>
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
    { 
      key: 'vm-execution', 
      label: 'VM Execution', 
      icon: Activity,
      available: !!result 
    },
    // { 
    //   key: 'optimizer', 
    //   label: 'Gas Optimizer', 
    //   icon: Zap,
    //   available: !!result 
    // },
  ];

  return (
    <div className="space-y-4">
      {/* Status Section */}
      <div className="bg-card border border-border rounded p-4">
        <div className="flex items-center gap-2 mb-2">
          {isSuccess ? (
            <>
              <CheckCircle className="h-5 w-5 text-green-500" />
              <span className="font-semibold">Simulation Successful</span>
            </>
          ) : (
            <>
              <XCircle className="h-5 w-5 text-red-500" />
              <span className="font-semibold">Simulation Failed</span>
            </>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          Execution time: {result?.executionTime.toFixed(2)}ms
        </p>
        
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">VM Status</p>
            <p className="text-sm vscode-font">{result?.vmStatus}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Result</p>
            <p className={`text-sm font-semibold ${isSuccess ? 'text-green-400' : 'text-red-400'}`}>
              {isSuccess ? 'Success' : 'Failed'}
            </p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-card border border-border rounded">
        <div className="border-b border-border">
          <div className="flex space-x-1 px-2 py-1">
            {tabs.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  disabled={!tab.available}
                  className={`flex items-center gap-2 px-3 py-2 rounded text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-accent text-accent-foreground'
                      : tab.available
                      ? 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      : 'text-muted-foreground/50 cursor-not-allowed'
                  }`}
                >
                  <IconComponent className="h-4 w-4" />
                  {tab.label}
                  {!tab.available && <span className="text-xs">(N/A)</span>}
                </button>
              );
            })}
          </div>
        </div>
        <div className="p-4">
          {/* Tab Content */}
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'gas' && renderGasTab()}
          {activeTab === 'trace' && renderTraceTab()}
          {activeTab === 'state' && renderStateTab()}
          {activeTab === 'vm-execution' && renderVMExecutionTab()}
          {activeTab === 'optimizer' && renderOptimizerTab()}
        </div>
      </div>
    </div>
  );

  function renderOverviewTab() {
    // Check if this is a batch transaction result
    const isBatchResult = result && (result as any).batchData;
    // Check if this is a sponsored transaction result
    const isSponsoredResult = result && (result as any).sponsoredData;
    
    return (
      <div className="space-y-4">
        {/* Batch Summary (if batch result) */}
        {isBatchResult && (
          <div className="bg-card border border-border rounded p-4">
            <h4 className="font-semibold mb-3">Batch Transaction Summary</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {(result as any).batchData.individualResults.filter((r: any) => r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Successful</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-red-600">
                  {(result as any).batchData.individualResults.filter((r: any) => !r.success).length}
                </div>
                <div className="text-sm text-muted-foreground">Failed</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {(result as any).batchData.individualResults.length}
                </div>
                <div className="text-sm text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        )}

        {/* Sponsored Summary (if sponsored result) */}
        {isSponsoredResult && (
          <div className="bg-card border border-border rounded p-4">
            <h4 className="font-semibold mb-3">Sponsored Transaction Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-lg font-bold text-green-600">
                  {formatAPT((result as any).sponsoredData.senderSavings || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Sender Savings</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-blue-600">
                  {formatAPT((result as any).sponsoredData.sponsorCost || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Sponsor Cost</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold">
                  {formatAPT((result as any).sponsoredData.sponsorBalance || 0)}
                </div>
                <div className="text-sm text-muted-foreground">Sponsor Balance</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-purple-600">
                  {((result as any).sponsoredData.sponsorAddress || '').slice(0, 8)}...
                </div>
                <div className="text-sm text-muted-foreground">Sponsor</div>
              </div>
            </div>
            
            {/* Cost Comparison */}
            {(result as any).sponsoredData.costComparison && (
              <div className="mt-4 p-3 bg-muted/50 rounded">
                <h5 className="text-sm font-medium mb-2">Cost Comparison</h5>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Without Sponsorship:</span>
                    <span className="ml-2 font-medium">
                      {formatAPT((result as any).sponsoredData.costComparison.withoutSponsorship)}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">With Sponsorship:</span>
                    <span className="ml-2 font-medium text-green-600">
                      {formatAPT((result as any).sponsoredData.costComparison.withSponsorship)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Gas Information Summary */}
        <div className="bg-card border border-border rounded p-4">
          <h4 className="font-semibold mb-3">
            {isBatchResult ? 'Total Gas Summary' : isSponsoredResult ? 'Transaction Gas Summary' : 'Gas Summary'}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Gas Used</p>
              <p className="text-lg font-bold vscode-font">{formatGas(result?.gasUsed || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Gas Unit Price</p>
              <p className="text-lg font-bold vscode-font">{formatGas(result?.gasUnitPrice || 0)}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Total Gas Cost</p>
              <p className="text-lg font-bold vscode-font">{formatNumber(result?.totalGasCost || 0)} octas</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">APT Cost</p>
              <p className="text-lg font-bold text-primary vscode-font">{formatAPT(result?.totalGasCost || 0)}</p>
            </div>
          </div>
        </div>

        {/* Individual Transaction Results (if batch) */}
        {isBatchResult && (
          <div className="bg-card border border-border rounded p-4">
            <h4 className="font-semibold mb-3">Individual Transaction Results</h4>
            <div className="space-y-3">
              {(result as any).batchData.individualResults.map((txResult: any, index: number) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">Transaction #{index + 1}</span>
                    <div className={`px-2 py-1 rounded text-xs font-medium ${
                      txResult.success 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    }`}>
                      {txResult.success ? 'Success' : 'Failed'}
                    </div>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gas: {txResult.gasUsed || 0} | Status: {txResult.vmStatus || 'Unknown'}
                  </div>
                  {!txResult.success && txResult.error && (
                    <div className="mt-2 p-2 bg-red-50 dark:bg-red-950/10 border border-red-200 dark:border-red-800 rounded">
                      <div className="text-sm text-red-700 dark:text-red-300">
                        {txResult.error.message || txResult.error}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dependencies (if batch) */}
        {isBatchResult && (result as any).batchData.dependencies?.length > 0 && (
          <div className="bg-card border border-border rounded p-4">
            <h4 className="font-semibold mb-3">Transaction Dependencies</h4>
            <div className="space-y-2">
              {(result as any).batchData.dependencies.map((dep: any, index: number) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <span>Transaction #{dep.fromTransaction + 1}</span>
                  <span>→</span>
                  <span>Transaction #{dep.toTransaction + 1}</span>
                  <span className="px-2 py-1 bg-muted rounded text-xs">{dep.dependencyType}</span>
                  <span className={`px-2 py-1 rounded text-xs ${
                    dep.conflictRisk === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {dep.conflictRisk} risk
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Details */}
        {result?.error && (
          <div className="bg-destructive/10 border border-destructive/20 rounded p-4">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <h4 className="font-semibold text-destructive">Error Details</h4>
            </div>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Error Code</p>
                <p className="vscode-font text-sm bg-muted p-2 rounded">{result.error.code}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Message</p>
                <p className="text-sm bg-muted p-2 rounded">{result.error.message}</p>
              </div>
              {result.error.suggestion && (
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">Suggestion</p>
                  <p className="text-sm text-muted-foreground bg-primary/10 p-2 rounded">
                    {result.error.suggestion}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="bg-card border border-border rounded p-4">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const data = JSON.stringify(result, null, 2);
                navigator.clipboard.writeText(data);
              }}
              className="text-xs"
            >
              <Copy className="h-3 w-3 mr-2" />
              Copy Results
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.open(getExplorerUrl(), '_blank')}
              className="text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-2" />
              View on Explorer
            </Button>
          </div>
        </div>
      </div>
    );
  }

  function renderGasTab() {
    if (!result?.gasBreakdown) {
      return (
        <div className="text-center py-8 text-muted-foreground">
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
        <div className="text-center py-8 text-muted-foreground">
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

  function renderVMExecutionTab() {
    if (!result) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          VM execution visualization not available
        </div>
      );
    }

    return (
      <VMExecutionVisualization 
        simulationResult={result}
      />
    );
  }

  function renderOptimizerTab() {
    if (!result) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          Gas optimizer not available
        </div>
      );
    }

    return (
      <GasOptimizer 
        transactionData={{}}
        simulationResult={result}
      />
    );
  }
}