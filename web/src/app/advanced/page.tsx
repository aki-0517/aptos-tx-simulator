'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ClientOnly } from '@/components/common/ClientOnly';
import { WalletConnection } from '@/components/common/WalletConnection';
import { BatchTransactionBuilder } from '@/components/simulation/BatchTransactionBuilder';
import { SponsoredTransactionBuilder } from '@/components/simulation/SponsoredTransactionBuilder';
import { StateForkManager } from '@/components/advanced/StateForkManager';
import { VMExecutionVisualization } from '@/components/advanced/VMExecutionVisualization';
import { GasOptimizer } from '@/components/advanced/GasOptimizer';
import { 
  ArrowLeft, 
  Layers, 
  UserCheck, 
  GitBranch, 
  Activity,
  Zap,
  Database,
  BarChart3
} from 'lucide-react';
import Link from 'next/link';
import { useSimulation } from '@/hooks/useSimulation';

export default function AdvancedPage() {
  const [activeFeature, setActiveFeature] = useState('batch');
  const [vmAnalysisResult, setVmAnalysisResult] = useState<any>(null);
  const { getLatestResult, transactionData } = useSimulation();

  const features = [
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <Link href="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Main
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Advanced Features</h1>
            <p className="text-muted-foreground">
              Professional transaction simulation tools for complex scenarios
            </p>
          </div>
        </div>
        <Badge variant="secondary" className="text-sm">
          v1.0-preview
        </Badge>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Sidebar */}
        <div className="xl:col-span-3 space-y-6">
          <ClientOnly fallback={<Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>}>
            <WalletConnection />
          </ClientOnly>

          {/* Feature Navigation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Features</CardTitle>
              <CardDescription>
                Select a feature to explore
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {features.map((feature) => {
                const Icon = feature.icon;
                return (
                  <Button
                    key={feature.id}
                    variant={activeFeature === feature.id ? "default" : "ghost"}
                    className="w-full justify-start h-auto p-3"
                    onClick={() => setActiveFeature(feature.id)}
                  >
                    <div className="flex items-start gap-3">
                      <Icon className="h-5 w-5 mt-0.5 flex-shrink-0" />
                      <div className="text-left">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{feature.name}</span>
                          <Badge 
                            variant={feature.status === 'stable' ? 'default' : 'secondary'} 
                            className="text-xs"
                          >
                            {feature.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Button>
                );
              })}
            </CardContent>
          </Card>

        </div>

        {/* Main Content */}
        <div className="xl:col-span-9">
          <ClientOnly fallback={<Card><CardContent className="p-8 text-center">Loading...</CardContent></Card>}>
            {activeFeature === 'batch' && (
              <div className="space-y-6">
                <FeatureHeader
                  title="Batch Transaction Builder"
                  description="Create and simulate multiple transactions with automatic dependency analysis and optimization"
                  icon={Layers}
                />
                <BatchTransactionBuilder onResults={setVmAnalysisResult} />
              </div>
            )}

            {activeFeature === 'sponsored' && (
              <div className="space-y-6">
                <FeatureHeader
                  title="Sponsored Transaction Builder"
                  description="Create transactions where a sponsor pays the gas fees, enabling gasless user experiences"
                  icon={UserCheck}
                />
                <SponsoredTransactionBuilder onResults={setVmAnalysisResult} />
              </div>
            )}

            {activeFeature === 'state-fork' && (
              <div className="space-y-6">
                <FeatureHeader
                  title="State Fork Management"
                  description="Create, modify, and manage blockchain state forks for 'what-if' scenario testing"
                  icon={GitBranch}
                />
                <StateForkManager />
              </div>
            )}

            {activeFeature === 'vm-visualization' && (
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

            {activeFeature === 'gas-optimizer' && (
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
                    // Here we would apply the optimizations to the transaction
                  }}
                />
              </div>
            )}
          </ClientOnly>
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