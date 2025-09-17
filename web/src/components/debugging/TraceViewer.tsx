'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { VMExecutionTrace, VMInstruction } from '@/types/simulation';
import { Activity, Clock, Zap, Code, Filter, Search } from 'lucide-react';

interface TraceViewerProps {
  trace: VMExecutionTrace;
}

export function TraceViewer({ trace }: TraceViewerProps) {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [filterOpcode, setFilterOpcode] = useState<string>('');
  const [showOnlyGasConsumers, setShowOnlyGasConsumers] = useState(false);

  const filteredInstructions = useMemo(() => {
    let instructions = trace.instructions;
    
    if (filterOpcode) {
      instructions = instructions.filter(instr => 
        instr.opcode.toLowerCase().includes(filterOpcode.toLowerCase())
      );
    }
    
    if (showOnlyGasConsumers) {
      instructions = instructions.filter(instr => instr.gas_consumed > 0);
    }
    
    return instructions;
  }, [trace.instructions, filterOpcode, showOnlyGasConsumers]);

  const selectedInstruction = selectedStep < trace.instructions.length 
    ? trace.instructions[selectedStep] 
    : null;

  const totalGas = trace.instructions.reduce((sum, i) => sum + i.gas_consumed, 0);

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Execution Summary
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {trace.execution_summary.total_instructions}
              </div>
              <div className="text-sm text-muted-foreground">Total Instructions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {trace.execution_summary.total_function_calls}
              </div>
              <div className="text-sm text-muted-foreground">Function Calls</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {trace.execution_summary.max_call_depth}
              </div>
              <div className="text-sm text-muted-foreground">Max Call Depth</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {(trace.execution_summary.total_execution_time_ns / 1_000_000).toFixed(2)}ms
              </div>
              <div className="text-sm text-muted-foreground">Execution Time</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Function Calls Overview */}
      {trace.function_calls.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5" />
              Function Calls
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trace.function_calls.map((call, index) => (
                <div key={index} className="p-3 border rounded-md">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm">
                        {'  '.repeat(call.call_depth)}{call.module_id}::{call.function_name}
                      </span>
                      <Badge variant={call.success ? 'default' : 'destructive'}>
                        {call.success ? 'Success' : 'Failed'}
                      </Badge>
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {call.gas_consumed.toLocaleString()} gas
                    </span>
                  </div>
                  {call.type_arguments.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Types: {call.type_arguments.join(', ')}
                    </div>
                  )}
                  {call.arguments.length > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Args: {call.arguments.map(arg => JSON.stringify(arg)).join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Instruction Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filter by opcode..."
                  value={filterOpcode}
                  onChange={(e) => setFilterOpcode(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>
            <Button
              variant={showOnlyGasConsumers ? 'default' : 'outline'}
              onClick={() => setShowOnlyGasConsumers(!showOnlyGasConsumers)}
              className="flex items-center gap-2"
            >
              <Zap className="h-4 w-4" />
              Gas Consumers Only
            </Button>
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            Showing {filteredInstructions.length} of {trace.instructions.length} instructions
          </div>
        </CardContent>
      </Card>

      {/* Instructions List */}
      <Card>
        <CardHeader>
          <CardTitle>VM Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-1 max-h-96 overflow-auto">
            {filteredInstructions.map((instruction, index) => (
              <div
                key={index}
                className={`p-2 text-sm rounded cursor-pointer transition-colors ${
                  selectedStep === index ? 'bg-accent' : 'hover:bg-muted/50'
                }`}
                onClick={() => setSelectedStep(index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground w-8">
                      #{instruction.instruction_index}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {'  '.repeat(instruction.call_depth)}
                    </span>
                    <span className={`font-mono font-medium ${getOpcodeColor(instruction.opcode)}`}>
                      {instruction.opcode}
                    </span>
                    {instruction.operands.length > 0 && (
                      <span className="text-xs text-muted-foreground truncate max-w-48">
                        {JSON.stringify(instruction.operands).substring(0, 40)}...
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-orange-600 font-mono">
                      {instruction.gas_consumed} gas
                    </span>
                    <span className="text-purple-600 font-mono">
                      {(instruction.execution_time_ns / 1000).toFixed(1)}μs
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Instruction Details */}
      {selectedInstruction && (
        <Card>
          <CardHeader>
            <CardTitle>Instruction Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Instruction Info</h4>
                  <div className="space-y-1 text-sm">
                    <div><strong>Opcode:</strong> {selectedInstruction.opcode}</div>
                    <div><strong>Index:</strong> {selectedInstruction.instruction_index}</div>
                    <div><strong>Call Depth:</strong> {selectedInstruction.call_depth}</div>
                    <div><strong>Gas Consumed:</strong> {selectedInstruction.gas_consumed}</div>
                    <div><strong>Execution Time:</strong> {(selectedInstruction.execution_time_ns / 1000).toFixed(1)}μs</div>
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Operands</h4>
                  <div className="text-sm font-mono bg-muted p-2 rounded max-h-32 overflow-auto">
                    {selectedInstruction.operands.length > 0 
                      ? JSON.stringify(selectedInstruction.operands, null, 2)
                      : 'No operands'
                    }
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium mb-2">Stack Before</h4>
                  <div className="text-sm font-mono bg-muted p-2 rounded max-h-32 overflow-auto">
                    {selectedInstruction.stack_before.length > 0 
                      ? selectedInstruction.stack_before.map((item, i) => (
                          <div key={i}>[{i}] {item.type}: {JSON.stringify(item.value)}</div>
                        ))
                      : 'Empty stack'
                    }
                  </div>
                </div>
                <div>
                  <h4 className="font-medium mb-2">Stack After</h4>
                  <div className="text-sm font-mono bg-muted p-2 rounded max-h-32 overflow-auto">
                    {selectedInstruction.stack_after.length > 0 
                      ? selectedInstruction.stack_after.map((item, i) => (
                          <div key={i}>[{i}] {item.type}: {JSON.stringify(item.value)}</div>
                        ))
                      : 'Empty stack'
                    }
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resource Access Summary */}
      {trace.resource_accesses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Resource Access</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {trace.resource_accesses.map((access, index) => (
                <div key={index} className="p-2 border rounded-md text-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-medium">{access.operation.toUpperCase()}</span>
                      <span className="ml-2 text-muted-foreground">{access.resource_type}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {access.gas_cost} gas at instruction #{access.instruction_index}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Address: {access.address}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function getOpcodeColor(opcode: string): string {
  if (opcode.startsWith('Ld')) return 'text-blue-600';
  if (opcode.includes('Call')) return 'text-green-600';
  if (opcode.includes('Ref') || opcode.includes('Borrow')) return 'text-yellow-600';
  if (opcode.includes('Move') || opcode.includes('St')) return 'text-red-600';
  if (opcode.includes('Br')) return 'text-purple-600';
  return 'text-gray-600';
}