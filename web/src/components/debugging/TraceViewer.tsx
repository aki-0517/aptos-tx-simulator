'use client';

import React, { useState, useMemo } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { VMExecutionTrace, VMInstruction } from '@/types';
import { vmTraceAnalyzer } from '@/lib/vm-trace';

interface TraceViewerProps {
  trace: VMExecutionTrace;
}

export function TraceViewer({ trace }: TraceViewerProps) {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [filterOpcode, setFilterOpcode] = useState<string>('');
  const [showOnlyGasConsumers, setShowOnlyGasConsumers] = useState(false);

  const analysis = useMemo(() => vmTraceAnalyzer.analyzeExecutionPattern(trace), [trace]);
  const timeline = useMemo(() => vmTraceAnalyzer.getExecutionTimeline(trace), [trace]);

  const filteredInstructions = useMemo(() => {
    let instructions = trace.instructions;
    
    if (filterOpcode) {
      instructions = instructions.filter(instr => 
        instr.opcode.toLowerCase().includes(filterOpcode.toLowerCase())
      );
    }
    
    if (showOnlyGasConsumers) {
      instructions = instructions.filter(instr => instr.gasConsumed > 0);
    }
    
    return instructions;
  }, [trace.instructions, filterOpcode, showOnlyGasConsumers]);

  const selectedInstruction = selectedStep < trace.instructions.length 
    ? trace.instructions[selectedStep] 
    : null;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Execution Summary</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-2xl font-bold text-blue-600">{analysis.totalInstructions}</div>
            <div className="text-sm text-gray-600">Total Instructions</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{analysis.stackDepthAnalysis.maxDepth}</div>
            <div className="text-sm text-gray-600">Max Stack Depth</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">{analysis.moduleUsage.length}</div>
            <div className="text-sm text-gray-600">Modules Loaded</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-orange-600">
              {analysis.stackDepthAnalysis.avgDepth.toFixed(1)}
            </div>
            <div className="text-sm text-gray-600">Avg Stack Depth</div>
          </div>
        </div>
      </Card>

      {/* Gas Hotspots */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Gas Hotspots</h3>
        <div className="space-y-2">
          {analysis.gasHotspots.slice(0, 5).map((hotspot, index) => (
            <div key={hotspot.instruction} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-mono text-sm font-medium">{hotspot.instruction}</span>
                <span className="ml-2 text-sm text-gray-600">({hotspot.count} times)</span>
              </div>
              <div className="text-right">
                <div className="font-semibold">{hotspot.gasUsed.toLocaleString()} gas</div>
                <div className="text-sm text-gray-600">
                  {(hotspot.gasUsed / analysis.gasHotspots.reduce((sum, h) => sum + h.gasUsed, 0) * 100).toFixed(1)}%
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Instruction Trace */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Instruction Trace</h3>
          <div className="flex items-center gap-4">
            <Input
              type="text"
              placeholder="Filter by opcode..."
              value={filterOpcode}
              onChange={(e) => setFilterOpcode(e.target.value)}
              className="w-48"
            />
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={showOnlyGasConsumers}
                onChange={(e) => setShowOnlyGasConsumers(e.target.checked)}
              />
              <span className="text-sm">Gas consumers only</span>
            </label>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Instruction List */}
          <div>
            <div className="max-h-96 overflow-y-auto border rounded-lg">
              {filteredInstructions.map((instruction, index) => (
                <div
                  key={index}
                  onClick={() => setSelectedStep(index)}
                  className={`p-3 border-b cursor-pointer hover:bg-gray-50 ${
                    selectedStep === index ? 'bg-blue-50 border-blue-200' : ''
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono text-sm font-medium">{instruction.opcode}</span>
                      <span className="ml-2 text-xs text-gray-500">#{instruction.timestamp}</span>
                    </div>
                    <div className="text-right">
                      {instruction.gasConsumed > 0 && (
                        <div className="text-sm font-medium text-red-600">
                          {instruction.gasConsumed} gas
                        </div>
                      )}
                    </div>
                  </div>
                  {instruction.operands.length > 0 && (
                    <div className="mt-1 text-xs text-gray-600">
                      Operands: {instruction.operands.join(', ')}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Instruction Details */}
          <div>
            {selectedInstruction ? (
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Instruction Details</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Opcode:</strong> <code className="bg-white px-2 py-1 rounded">{selectedInstruction.opcode}</code>
                    </div>
                    <div>
                      <strong>Gas Consumed:</strong> {selectedInstruction.gasConsumed}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {selectedInstruction.timestamp}
                    </div>
                    {selectedInstruction.operands.length > 0 && (
                      <div>
                        <strong>Operands:</strong>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(selectedInstruction.operands, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>

                {/* Stack State */}
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Stack State</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <strong>Before:</strong>
                      <pre className="mt-1 p-2 bg-white rounded text-xs max-h-32 overflow-y-auto">
                        {selectedInstruction.stackBefore.length > 0 
                          ? JSON.stringify(selectedInstruction.stackBefore, null, 2)
                          : 'Empty stack'
                        }
                      </pre>
                    </div>
                    <div>
                      <strong>After:</strong>
                      <pre className="mt-1 p-2 bg-white rounded text-xs max-h-32 overflow-y-auto">
                        {selectedInstruction.stackAfter.length > 0 
                          ? JSON.stringify(selectedInstruction.stackAfter, null, 2)
                          : 'Empty stack'
                        }
                      </pre>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center text-gray-500">
                Select an instruction to view details
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Timeline View */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Execution Timeline</h3>
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {timeline.map((event, index) => (
            <div key={index} className="flex items-center gap-4 p-2 hover:bg-gray-50 rounded">
              <div className="text-xs text-gray-500 w-12">
                #{event.timestamp}
              </div>
              <div className={`w-2 h-2 rounded-full ${
                event.event === 'instruction' ? 'bg-blue-500' :
                event.event === 'module_load' ? 'bg-green-500' :
                'bg-orange-500'
              }`} />
              <div className="flex-1 text-sm">
                <span className="font-medium">{event.event}</span>
                {event.event === 'instruction' && (
                  <span className="ml-2 text-gray-600">
                    {event.details.opcode}
                  </span>
                )}
                {event.event === 'module_load' && (
                  <span className="ml-2 text-gray-600">
                    {event.details.address}::{event.details.moduleName}
                  </span>
                )}
                {event.event === 'resource_access' && (
                  <span className="ml-2 text-gray-600">
                    {event.details.operation} {event.details.resourceType}
                  </span>
                )}
              </div>
              <div className="text-xs text-gray-500">
                {event.gasUsed > 0 && `${event.gasUsed} gas`}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Module Usage */}
      {analysis.moduleUsage.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Module Usage</h3>
          <div className="space-y-2">
            {analysis.moduleUsage.map((module, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <span className="font-mono text-sm">{module.module}</span>
                  <span className="ml-2 text-sm text-gray-600">({module.loadCount} loads)</span>
                </div>
                <div className="text-sm font-medium">{module.gasUsed} gas</div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}