'use client';

import React, { useState } from 'react';
import { TransactionBuilder } from '@/components/simulation/TransactionBuilder';
import { SimulationResults } from '@/components/simulation/SimulationResults';
import { ClientOnly } from '@/components/common/ClientOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
  GitBranch
} from 'lucide-react';

export default function HomePage() {
  const { history, clearHistory, getLatestResult, transactionData } = useSimulation();
  const [activeTab, setActiveTab] = useState("create");
  const [transactionMode, setTransactionMode] = useState("basic");
  const [vmAnalysisResult, setVmAnalysisResult] = useState<any>(null);

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
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Aptos Transaction Simulator
        </h1>
        <p className="text-xl text-muted-foreground mb-6">
          Simulate Aptos blockchain transactions before execution to preview<br />
          gas usage and detect potential errors in advance.
        </p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Transaction Mode */}
        <div className="xl:col-span-3 space-y-6">
          {/* Transaction Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Transaction Mode</CardTitle>
              <CardDescription>
                Select the type of transaction to simulate
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {transactionModes.map((mode) => {
                const Icon = mode.icon;
                return (
                  <Button
                    key={mode.id}
                    variant={transactionMode === mode.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setTransactionMode(mode.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{mode.name}</span>
                          <Badge 
                            variant={mode.status === 'stable' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {mode.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {mode.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>
          
          {/* Simulation History */}
          {history.length > 0 && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">History</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearHistory}
                  >
                    Clear
                  </Button>
                </div>
                <CardDescription>
                  Recent simulation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {history.slice(0, 5).map((result, index) => (
                    <div
                      key={index}
                      className="p-2 bg-muted/50 rounded text-sm"
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                          {result.success ? 'Success' : 'Failed'}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {result.gasUsed} gas
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground font-mono">
                        {result.vmStatus}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content Tabs */}
        <div className="xl:col-span-9">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="create">Create Transaction</TabsTrigger>
              <TabsTrigger value="results">Simulation Results</TabsTrigger>
            </TabsList>
            
            <TabsContent value="create">
              <ClientOnly fallback={<Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>}>
                {transactionMode === 'basic' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="Basic Transaction Builder"
                      description="Create and simulate simple transactions on the Aptos blockchain"
                      icon={Code}
                    />
                    <TransactionBuilder onSimulationRun={() => setActiveTab("results")} />
                  </div>
                )}

                {transactionMode === 'batch' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="Batch Transaction Builder"
                      description="Create and simulate multiple transactions with automatic dependency analysis and optimization"
                      icon={Layers}
                    />
                    <BatchTransactionBuilder onResults={setVmAnalysisResult} />
                  </div>
                )}

                {transactionMode === 'sponsored' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="Sponsored Transaction Builder"
                      description="Create transactions where a sponsor pays the gas fees, enabling gasless user experiences"
                      icon={UserCheck}
                    />
                    <SponsoredTransactionBuilder onResults={setVmAnalysisResult} />
                  </div>
                )}

                {transactionMode === 'state-fork' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="State Fork Management"
                      description="Create, modify, and manage blockchain state forks for 'what-if' scenario testing"
                      icon={GitBranch}
                    />
                    <StateForkManager />
                  </div>
                )}

                {transactionMode === 'vm-visualization' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="VM Execution Visualization"
                      description="Detailed Move VM instruction-level analysis with gas usage patterns and execution traces"
                      icon={Activity}
                    />
                    <VMExecutionVisualization 
                      simulationResult={getLatestResult() || vmAnalysisResult}
                      onAnalysisComplete={setVmAnalysisResult}
                    />
                  </div>
                )}

                {transactionMode === 'gas-optimizer' && (
                  <div className="space-y-6">
                    <FeatureHeader
                      title="Gas Optimizer"
                      description="AI-powered analysis to identify and apply gas optimization opportunities"
                      icon={Zap}
                    />
                    <GasOptimizer
                      transactionData={transactionData}
                      simulationResult={getLatestResult() || vmAnalysisResult}
                      onOptimize={(optimizations) => {
                        console.log('Applying optimizations:', optimizations);
                      }}
                    />
                  </div>
                )}
              </ClientOnly>
            </TabsContent>
            
            <TabsContent value="results">
              <ClientOnly fallback={<Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>}>
                <SimulationResults />
              </ClientOnly>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

interface FeatureHeaderProps {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
}

function FeatureHeader({ title, description, icon: Icon }: FeatureHeaderProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Icon className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
    </Card>
  );
}