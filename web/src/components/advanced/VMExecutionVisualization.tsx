'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Activity, 
  Zap, 
  Database, 
  GitBranch,
  BarChart3,
  TrendingUp,
  CheckCircle,
  Clock,
  Cpu
} from 'lucide-react';
import { VMExecutionTrace, VMInstruction, GasUsageStep, ResourceAccess } from '@/types/simulation';

interface VMExecutionVisualizationProps {
  simulationResult: any;
  onAnalysisComplete?: (analysis: any) => void;
}

export function VMExecutionVisualization({ simulationResult, onAnalysisComplete }: VMExecutionVisualizationProps) {
  const [selectedInstruction, setSelectedInstruction] = useState<number | null>(null);

  // Use actual trace from simulation result if available
  const trace = simulationResult?.trace;

  if (!trace) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>VM execution trace not available for this transaction</p>
        <p className="text-sm mt-2">Trace data is only available when simulation includes detailed execution information</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VM Execution Overview
          </CardTitle>
          <CardDescription>
            Detailed analysis of Move VM execution for this transaction
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trace.execution_summary.total_instructions}
              </div>
              <div className="text-sm text-muted-foreground">Instructions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trace.execution_summary.total_function_calls}
              </div>
              <div className="text-sm text-muted-foreground">Function Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {trace.resource_accesses.length}
              </div>
              <div className="text-sm text-muted-foreground">Resource Accesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(trace.execution_summary.total_execution_time_ns / 1000000).toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">Execution Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="gas">Gas Analysis</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <InstructionTrace 
                instructions={trace.instructions}
                selectedInstruction={selectedInstruction}
                onSelectInstruction={setSelectedInstruction}
              />
            </TabsContent>

            <TabsContent value="gas" className="space-y-4">
              <GasUsageVisualization gasUsage={trace.gas_usage_steps} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ResourceAccessVisualization 
                resourceAccesses={trace.resource_accesses}
                functionCalls={trace.function_calls}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

// Instruction trace component
interface InstructionTraceProps {
  instructions: VMInstruction[];
  selectedInstruction: number | null;
  onSelectInstruction: (index: number | null) => void;
}

function InstructionTrace({ instructions, selectedInstruction, onSelectInstruction }: InstructionTraceProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: Math.min(50, instructions.length) });

  const visibleInstructions = instructions.slice(visibleRange.start, visibleRange.end);

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">VM Instructions ({instructions.length})</h3>
        <Badge variant="outline">
          Showing {visibleRange.start + 1}-{Math.min(visibleRange.end, instructions.length)} of {instructions.length}
        </Badge>
      </div>

      <div className="space-y-2 max-h-96 overflow-auto">
        {visibleInstructions.map((instruction, index) => {
          const actualIndex = visibleRange.start + index;
          const isSelected = selectedInstruction === actualIndex;
          
          return (
            <div
              key={actualIndex}
              className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                isSelected ? 'bg-accent border-accent-foreground' : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectInstruction(actualIndex)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs">
                    #{instruction.instruction_index}
                  </Badge>
                  <span className="font-mono font-medium text-blue-600">
                    {instruction.opcode}
                  </span>
                  {instruction.operands.length > 0 && (
                    <span className="text-sm text-muted-foreground">
                      {JSON.stringify(instruction.operands).substring(0, 30)}...
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="h-3 w-3 mr-1" />
                    {instruction.gas_consumed.toLocaleString()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    <Clock className="h-3 w-3 mr-1" />
                    {(instruction.execution_time_ns / 1000).toFixed(1)}μs
                  </Badge>
                </div>
              </div>

              {isSelected && (
                <div className="mt-3 pt-3 border-t grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h4 className="font-medium mb-2">Stack Before</h4>
                    <div className="space-y-1 max-h-24 overflow-auto">
                      {instruction.stack_before.length > 0 ? (
                        instruction.stack_before.map((item, i) => (
                          <div key={i} className="bg-muted/50 p-1 rounded font-mono text-xs">
                            {item.type}: {JSON.stringify(item.value)}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">Empty</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <h4 className="font-medium mb-2">Stack After</h4>
                    <div className="space-y-1 max-h-24 overflow-auto">
                      {instruction.stack_after.length > 0 ? (
                        instruction.stack_after.map((item, i) => (
                          <div key={i} className="bg-muted/50 p-1 rounded font-mono text-xs">
                            {item.type}: {JSON.stringify(item.value)}
                          </div>
                        ))
                      ) : (
                        <div className="text-muted-foreground">Empty</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Gas usage visualization component
interface GasUsageVisualizationProps {
  gasUsage: GasUsageStep[];
}

function GasUsageVisualization({ gasUsage }: GasUsageVisualizationProps) {
  const maxGas = Math.max(...gasUsage.map(step => step.gas_consumed));

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Gas Consumption Analysis</h3>
      
      <div className="space-y-3">
        {gasUsage.map((step, index) => (
          <div key={index} className="p-3 border rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Step {step.instruction_index}</Badge>
                <Badge className="text-white bg-blue-600">
                  Instruction
                </Badge>
              </div>
              <span className="font-mono">{step.gas_consumed.toLocaleString()} gas</span>
            </div>
            <div className="space-y-1">
              <div 
                className="h-2 rounded-full bg-blue-600"
                style={{ width: `${(step.gas_consumed / maxGas) * 100}%` }}
              />
              <div className="text-xs text-muted-foreground">
                Cumulative: {step.cumulative_gas.toLocaleString()} | Remaining: {step.gas_remaining.toLocaleString()}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Resource access visualization component
interface ResourceAccessVisualizationProps {
  resourceAccesses: ResourceAccess[];
  functionCalls: any[];
}

function ResourceAccessVisualization({ resourceAccesses, functionCalls }: ResourceAccessVisualizationProps) {
  return (
    <div className="space-y-6">
      {/* Resource Accesses */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Resource Accesses ({resourceAccesses.length})
        </h3>
        <div className="space-y-2">
          {resourceAccesses.map((access, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge variant={access.operation === 'read' ? 'secondary' : 'default'}>
                      {access.operation.toUpperCase()}
                    </Badge>
                    <span className="font-mono text-sm text-muted-foreground">
                      {access.resource_type}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {access.address}
                  </div>
                </div>
                <Badge variant="outline">
                  {access.gas_cost.toLocaleString()} gas
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Function Calls */}
      <div>
        <h3 className="text-lg font-semibold mb-3">
          Function Calls ({functionCalls.length})
        </h3>
        <div className="space-y-2">
          {functionCalls.map((call, index) => (
            <div key={index} className="p-3 border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-mono text-sm">
                    {call.module_id}::{call.function_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Call depth: {call.call_depth} | Instructions: {call.entry_instruction}-{call.exit_instruction}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={call.success ? 'default' : 'destructive'}>
                    {call.success ? 'Success' : 'Failed'}
                  </Badge>
                  <Badge variant="outline">
                    {call.gas_consumed.toLocaleString()} gas
                  </Badge>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}