'use client';

import React, { useState, useEffect } from 'react';
import { TransactionBuilder } from '@/components/simulation/TransactionBuilder';
import { SimulationResults } from '@/components/simulation/SimulationResults';
import { ClientOnly } from '@/components/common/ClientOnly';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useSimulation } from '@/hooks/useSimulation';
import { BatchTransactionBuilder } from '@/components/simulation/BatchTransactionBuilder';
import { SponsoredTransactionBuilder } from '@/components/simulation/SponsoredTransactionBuilder';
import { StateForkManager } from '@/components/advanced/StateForkManager';
import { VMExecutionVisualization } from '@/components/advanced/VMExecutionVisualization';
import { GasOptimizer } from '@/components/advanced/GasOptimizer';
import { 
  Activity, 
  Zap, 
  Code,
  Layers,
  UserCheck,
  GitBranch,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export default function HomePage() {
  const { history, clearHistory, getLatestResult, transactionData } = useSimulation();
  const [activeTab, setActiveTab] = useState("create");
  const [transactionMode, setTransactionMode] = useState("basic");
  const [vmAnalysisResult, setVmAnalysisResult] = useState<any>(null);
  const [isExplorerOpen, setIsExplorerOpen] = useState(true);

  // トランザクションモードが変更された際に、Simulation Resultsタブにいる場合は自動でTransaction Builderタブに戻る
  useEffect(() => {
    if (activeTab === 'results') {
      setActiveTab('create');
    }
  }, [transactionMode]);

  const transactionModes = [
    {
      id: 'basic',
      name: 'Basic Transaction',
      description: 'Simple single transaction simulation',
      icon: Code,
      status: 'stable'
    },
    {
      id: 'batch',
      name: 'Batch Transactions',
      description: 'Execute multiple transactions with dependency analysis',
      icon: Layers,
      status: 'stable'
    },
    {
      id: 'sponsored',
      name: 'Sponsored Transactions', 
      description: 'Create transactions where sponsors pay gas fees',
      icon: UserCheck,
      status: 'stable'
    },
    {
      id: 'state-fork',
      name: 'State Fork Management',
      description: 'Create and manage blockchain state forks for testing',
      icon: GitBranch,
      status: 'stable'
    },
    {
      id: 'vm-visualization',
      name: 'VM Execution Visualization',
      description: 'Detailed analysis of Move VM instruction execution',
      icon: Activity,
      status: 'beta'
    },
    {
      id: 'gas-optimizer',
      name: 'Gas Optimizer',
      description: 'AI-powered gas optimization with efficiency recommendations',
      icon: Zap,
      status: 'stable'
    }
  ];

  return (
    <div className="flex h-full bg-background">
      {/* Activity Bar */}
      <div className="activity-bar w-12 flex flex-col items-center py-2">
        <div className="flex flex-col gap-2">
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'basic' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('basic')}>
            <Code className="h-4 w-4" />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'batch' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('batch')}>
            <Layers className="h-4 w-4" />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'sponsored' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('sponsored')}>
            <UserCheck className="h-4 w-4" />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'state-fork' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('state-fork')}>
            <GitBranch className="h-4 w-4" />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'vm-visualization' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('vm-visualization')}>
            <Activity className="h-4 w-4" />
          </div>
          <div className={`w-8 h-8 flex items-center justify-center rounded cursor-pointer ${transactionMode === 'gas-optimizer' ? 'bg-accent' : 'hover:bg-muted'}`}
               onClick={() => setTransactionMode('gas-optimizer')}>
            <Zap className="h-4 w-4" />
          </div>
        </div>
        
        {/* Explorer Toggle Button */}
        <div className="mt-4">
          <button
            onClick={() => setIsExplorerOpen(!isExplorerOpen)}
            className="w-8 h-8 flex items-center justify-center rounded hover:bg-muted transition-colors"
            title={isExplorerOpen ? 'Hide Explorer' : 'Show Explorer'}
          >
            {isExplorerOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {/* Main Editor Area */}
      <div className="flex-1 flex flex-col">
        {/* Sidebar */}
        <div className="flex h-full">
          {isExplorerOpen && (
            <div className="editor-sidebar w-80 flex flex-col">
            {/* Sidebar Header */}
            <div className="border-b border-border px-4 py-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <span>EXPLORER</span>
              </div>
            </div>
            
            {/* Transaction Mode Selection */}
            <div className="flex-1">
              <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-medium border-b border-border">
                TRANSACTION MODES
              </div>
              <div className="px-2">
                {transactionModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <div
                      key={mode.id}
                      className={`flex items-center gap-2 px-2 py-1 text-sm cursor-pointer hover:bg-muted/50 rounded ${
                        transactionMode === mode.id ? 'bg-accent text-accent-foreground' : ''
                      }`}
                      onClick={() => setTransactionMode(mode.id)}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{mode.name}</span>
                          <Badge 
                            variant={mode.status === 'stable' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {mode.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            
            {/* Simulation History */}
            {history.length > 0 && (
              <div className="border-t border-border">
                <div className="px-4 py-2 text-xs text-muted-foreground uppercase tracking-wide font-medium flex items-center justify-between">
                  <span>HISTORY</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                    className="h-6 px-2 text-xs"
                  >
                    Clear
                  </Button>
                </div>
                <div className="px-2 max-h-48 overflow-y-auto">
                  {history.slice(0, 5).map((result, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between px-2 py-1 text-xs hover:bg-muted/50 rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${result.success ? 'bg-green-500' : 'bg-red-500'}`} />
                        <span className="vscode-font">{result.vmStatus}</span>
                      </div>
                      <span className="text-muted-foreground">{result.gasUsed}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            </div>
          )}

          {/* Main Editor Area */}
          <div className="flex-1 flex flex-col">
            {/* Tab Bar */}
            <div className="flex border-b border-border">
              <div
                className={`px-4 py-2 text-sm cursor-pointer border-r border-border ${
                  activeTab === 'create' ? 'tab-active' : 'tab-inactive'
                }`}
                onClick={() => setActiveTab('create')}
              >
                <div className="flex items-center gap-2">
                  <Code className="h-4 w-4" />
                  <span>Transaction Builder</span>
                </div>
              </div>
              <div
                className={`px-4 py-2 text-sm cursor-pointer border-r border-border ${
                  activeTab === 'results' ? 'tab-active' : 'tab-inactive'
                }`}
                onClick={() => setActiveTab('results')}
              >
                <div className="flex items-center gap-2">
                  <Activity className="h-4 w-4" />
                  <span>Simulation Results</span>
                </div>
              </div>
            </div>
            
            {/* Editor Content */}
            <div className="flex-1 editor-panel overflow-auto">
              {activeTab === 'create' && (
                <div className="p-6">
                  <ClientOnly fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
                    {transactionMode === 'basic' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Code className="h-5 w-5" />
                            Basic Transaction Builder
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Create and simulate simple transactions on the Aptos blockchain
                          </p>
                        </div>
                        <div className="vscode-card">
                          <TransactionBuilder onSimulationRun={() => setActiveTab("results")} />
                        </div>
                      </div>
                    )}

                    {transactionMode === 'batch' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Layers className="h-5 w-5" />
                            Batch Transaction Builder
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Create and simulate multiple transactions with automatic dependency analysis
                          </p>
                        </div>
                        <div className="vscode-card">
                          <BatchTransactionBuilder onResults={setVmAnalysisResult} />
                        </div>
                      </div>
                    )}

                    {transactionMode === 'sponsored' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <UserCheck className="h-5 w-5" />
                            Sponsored Transaction Builder
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Create transactions where a sponsor pays the gas fees
                          </p>
                        </div>
                        <div className="vscode-card">
                          <SponsoredTransactionBuilder onResults={setVmAnalysisResult} />
                        </div>
                      </div>
                    )}

                    {transactionMode === 'state-fork' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <GitBranch className="h-5 w-5" />
                            State Fork Management
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Create and manage blockchain state forks for testing
                          </p>
                        </div>
                        <div className="vscode-card">
                          <StateForkManager />
                        </div>
                      </div>
                    )}

                    {transactionMode === 'vm-visualization' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Activity className="h-5 w-5" />
                            VM Execution Visualization
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            Detailed Move VM instruction-level analysis
                          </p>
                        </div>
                        <div className="vscode-card">
                          <VMExecutionVisualization 
                            simulationResult={getLatestResult() || vmAnalysisResult}
                            onAnalysisComplete={setVmAnalysisResult}
                          />
                        </div>
                      </div>
                    )}

                    {transactionMode === 'gas-optimizer' && (
                      <div className="space-y-4">
                        <div className="border-b border-border pb-2">
                          <h2 className="text-lg font-semibold flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Gas Optimizer
                          </h2>
                          <p className="text-sm text-muted-foreground">
                            AI-powered gas optimization with efficiency recommendations
                          </p>
                        </div>
                        <div className="vscode-card">
                          <GasOptimizer
                            transactionData={transactionData}
                            simulationResult={getLatestResult() || vmAnalysisResult}
                            onOptimize={(optimizations) => {
                              console.log('Applying optimizations:', optimizations);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </ClientOnly>
                </div>
              )}
              
              {activeTab === 'results' && (
                <div className="p-6">
                  <ClientOnly fallback={<div className="p-8 text-center text-muted-foreground">Loading...</div>}>
                    <SimulationResults />
                  </ClientOnly>
                </div>
              )}
            </div>
          </div>
        </div>
        
        {/* Status Bar */}
        <div className="status-bar h-6 flex items-center justify-between px-4 text-xs">
          <div className="flex items-center gap-4">
            <span>Aptos Transaction Simulator</span>
            <span>Ready</span>
          </div>
          <div className="flex items-center gap-4">
            <span>TypeScript</span>
            <span>v1.0-preview</span>
          </div>
        </div>
      </div>
    </div>
  );
}