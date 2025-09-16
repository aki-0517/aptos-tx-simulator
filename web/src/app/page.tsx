'use client';

import React, { useState } from 'react';
import { TransactionBuilder } from '@/components/simulation/TransactionBuilder';
import { SimulationResults } from '@/components/simulation/SimulationResults';
import { WalletConnection } from '@/components/common/WalletConnection';
import { ClientOnly } from '@/components/common/ClientOnly';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useSimulation } from '@/hooks/useSimulation';
import { Activity, Zap, Shield, Code, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const { history, clearHistory } = useSimulation();
  const [activeTab, setActiveTab] = useState("create");

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
        <div className="flex justify-center gap-4">
          <Link href="/advanced">
            <Button variant="outline" size="lg">
              <Shield className="h-4 w-4 mr-2" />
              Advanced Features
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        {/* Left Sidebar - Wallet */}
        <div className="xl:col-span-3 space-y-6">
          <ClientOnly fallback={<Card><CardContent className="p-8 text-center">Loading wallet...</CardContent></Card>}>
            <WalletConnection />
          </ClientOnly>
          
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
                <TransactionBuilder onSimulationRun={() => setActiveTab("results")} />
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