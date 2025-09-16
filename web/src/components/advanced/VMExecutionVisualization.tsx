'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  Zap, 
  Database, 
  GitBranch,
  Eye,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Cpu,
  FileText
} from 'lucide-react';
import { VMExecutionTrace, VMInstruction, GasUsageStep, ResourceAccess } from '@/types/simulation';
import { vmExecutionTracer, ExecutionPath, LoopInfo } from '@/lib/vm-execution-tracer';

interface VMExecutionVisualizationProps {
  simulationResult: any;
  onAnalysisComplete?: (analysis: any) => void;
}

export function VMExecutionVisualization({ simulationResult, onAnalysisComplete }: VMExecutionVisualizationProps) {
  const [trace, setTrace] = useState<VMExecutionTrace | null>(null);
  const [executionPath, setExecutionPath] = useState<ExecutionPath | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedInstruction, setSelectedInstruction] = useState<number | null>(null);
  const [analyzedResultId, setAnalyzedResultId] = useState<string | null>(null);

  const analyzeExecution = useCallback(async () => {
    if (!simulationResult) return;

    // 分析済みかどうかをチェック（gasUsedとvmStatusでユニークIDを作成）
    const resultId = `${simulationResult.gasUsed || 0}-${simulationResult.vmStatus || 'unknown'}`;
    if (analyzedResultId === resultId) {
      return; // 既に分析済み
    }

    const startTime = performance.now();
    setIsAnalyzing(true);
    
    try {
      // 非同期でバッチ処理を実行し、UIをブロックしないようにする
      const executionTrace = await new Promise<VMExecutionTrace>((resolve) => {
        setTimeout(async () => {
          const trace = await vmExecutionTracer.analyzeExecution(simulationResult);
          resolve(trace);
        }, 0);
      });

      // パス分析も非同期で実行
      const [path, dependencies] = await Promise.all([
        new Promise<ExecutionPath>((resolve) => {
          setTimeout(() => {
            resolve(vmExecutionTracer.analyzeExecutionPath(executionTrace));
          }, 0);
        }),
        new Promise<any[]>((resolve) => {
          setTimeout(() => {
            resolve(vmExecutionTracer.analyzeResourceDependencies(executionTrace));
          }, 0);
        })
      ]);
      
      setTrace(executionTrace);
      setExecutionPath(path);
      
      const analysis = {
        trace: executionTrace,
        path,
        dependencies,
        summary: {
          totalInstructions: executionTrace.instructions.length,
          totalGasUsed: executionTrace.gasUsage.reduce((sum, step) => sum + step.gasUsed, 0),
          resourceAccesses: executionTrace.resourceAccesses.length,
          moduleLoads: executionTrace.moduleLoads.length,
        }
      };
      
      onAnalysisComplete?.(analysis);
      
      // 分析完了IDを設定
      setAnalyzedResultId(resultId);
      
      // パフォーマンス監視
      const endTime = performance.now();
      console.log(`VM execution analysis completed in ${(endTime - startTime).toFixed(2)}ms`);
      
    } catch (error) {
      console.error('VM execution analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [simulationResult, onAnalysisComplete, analyzedResultId]);

  useEffect(() => {
    if (simulationResult && !isAnalyzing) {
      analyzeExecution();
    }
  }, [simulationResult, analyzeExecution, isAnalyzing]);

  const loadExampleTrace = async () => {
    setIsAnalyzing(true);
    setAnalyzedResultId(null); // 例のトレースを読み込む際は分析済みIDをリセット
    try {
      // Create a mock execution trace for demonstration
      const mockTrace: VMExecutionTrace = {
        instructions: [
          {
            opcode: 'Call',
            operands: ['0x1::coin::transfer'],
            gasConsumed: 5000,
            timestamp: Date.now(),
            stackBefore: [],
            stackAfter: ['0x1::coin::CoinStore'],
          },
          {
            opcode: 'MoveLoc',
            operands: [0],
            gasConsumed: 1000,
            timestamp: Date.now() + 1,
            stackBefore: ['0x1::coin::CoinStore'],
            stackAfter: ['0x1::coin::CoinStore', '0x1::coin::CoinStore'],
          },
          {
            opcode: 'Call',
            operands: ['0x1::coin::withdraw'],
            gasConsumed: 8000,
            timestamp: Date.now() + 2,
            stackBefore: ['0x1::coin::CoinStore', '0x1::coin::CoinStore'],
            stackAfter: ['0x1::coin::CoinStore', '0x1::coin::Coin'],
          },
          {
            opcode: 'Call',
            operands: ['0x1::coin::deposit'],
            gasConsumed: 6000,
            timestamp: Date.now() + 3,
            stackBefore: ['0x1::coin::CoinStore', '0x1::coin::Coin'],
            stackAfter: ['0x1::coin::CoinStore'],
          },
        ],
        gasUsage: [
          { step: 1, gasUsed: 5000, category: 'execution' },
          { step: 2, gasUsed: 6000, category: 'execution' },
          { step: 3, gasUsed: 14000, category: 'execution' },
          { step: 4, gasUsed: 20000, category: 'execution' },
        ],
        resourceAccesses: [
          {
            address: '0x1d8722f9c5393155f17851c9e39557cda785421e0db9c5ba4b2f674a7e35c6ef',
            resourceType: 'CoinStore',
            accessType: 'read',
            gasUsed: 2000,
          },
          {
            address: '0x2c2b4121696d61c0a69b8c0c6c5e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8',
            resourceType: 'CoinStore',
            accessType: 'write',
            gasUsed: 3000,
          },
        ],
        moduleLoads: [
          {
            moduleName: '0x1::coin',
            address: '0x1',
            gasUsed: 1000,
          },
        ],
        stackStates: [],
      };

      const mockPath: ExecutionPath = {
        totalInstructions: 4,
        branchPoints: [],
        criticalPath: [2, 3],
        loopDetection: [],
      };

      setTrace(mockTrace);
      setExecutionPath(mockPath);
      
      const analysis = {
        trace: mockTrace,
        path: mockPath,
        dependencies: [],
        summary: {
          totalInstructions: 4,
          totalGasUsed: 20000,
          resourceAccesses: 2,
          moduleLoads: 1,
        }
      };
      
      onAnalysisComplete?.(analysis);
    } catch (error) {
      console.error('Failed to load example trace:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (isAnalyzing) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="text-center space-y-4">
            <Activity className="h-8 w-8 mx-auto animate-spin" />
            <p>Analyzing VM execution trace...</p>
            <Progress value={66} className="w-full max-w-md mx-auto" />
            <p className="text-sm text-muted-foreground">
              This may take a moment for complex transactions
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!trace) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Eye className="h-8 w-8 mx-auto mb-4 text-muted-foreground" />
          <p className="text-muted-foreground">No execution trace available</p>
          <div className="flex gap-2 justify-center mt-4">
            <Button variant="outline" onClick={loadExampleTrace}>
              <FileText className="h-4 w-4 mr-1" />
              Load Example
            </Button>
            <Button variant="outline" onClick={analyzeExecution}>
              Analyze Execution
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            VM Execution Visualization
          </CardTitle>
          <CardDescription>
            Detailed analysis of Move VM execution with instruction-level visibility
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold">{trace.instructions.length}</div>
              <div className="text-sm text-muted-foreground">Instructions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {trace.gasUsage[trace.gasUsage.length - 1]?.gasUsed?.toLocaleString() || 0}
              </div>
              <div className="text-sm text-muted-foreground">Total Gas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{trace.resourceAccesses.length}</div>
              <div className="text-sm text-muted-foreground">Resource Accesses</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{trace.moduleLoads.length}</div>
              <div className="text-sm text-muted-foreground">Module Loads</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <Tabs defaultValue="instructions" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="instructions">Instructions</TabsTrigger>
              <TabsTrigger value="gas">Gas Analysis</TabsTrigger>
              <TabsTrigger value="resources">Resources</TabsTrigger>
              <TabsTrigger value="execution-path">Execution Path</TabsTrigger>
              <TabsTrigger value="performance">Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="instructions" className="space-y-4">
              <InstructionTrace 
                instructions={trace.instructions}
                stackStates={trace.stackStates}
                selectedInstruction={selectedInstruction}
                onSelectInstruction={setSelectedInstruction}
              />
            </TabsContent>

            <TabsContent value="gas" className="space-y-4">
              <GasUsageVisualization gasUsage={trace.gasUsage} />
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <ResourceAccessVisualization 
                resourceAccesses={trace.resourceAccesses}
                moduleLoads={trace.moduleLoads}
              />
            </TabsContent>

            <TabsContent value="execution-path" className="space-y-4">
              {executionPath && (
                <ExecutionPathVisualization 
                  path={executionPath}
                  instructions={trace.instructions}
                />
              )}
            </TabsContent>

            <TabsContent value="performance" className="space-y-4">
              <PerformanceAnalysis 
                trace={trace}
                executionPath={executionPath}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface InstructionTraceProps {
  instructions: VMInstruction[];
  stackStates: any[];
  selectedInstruction: number | null;
  onSelectInstruction: (index: number | null) => void;
}

function InstructionTrace({ 
  instructions, 
  stackStates, 
  selectedInstruction, 
  onSelectInstruction 
}: InstructionTraceProps) {
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 50 });
  const containerRef = useRef<HTMLDivElement>(null);
  const itemHeight = 60; // 各アイテムの高さ
  const containerHeight = 384; // max-h-96 = 384px
  const visibleCount = Math.ceil(containerHeight / itemHeight);

  // 仮想化されたリストの実装
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const start = Math.floor(scrollTop / itemHeight);
    const end = Math.min(start + visibleCount + 5, instructions.length); // バッファを追加
    
    setVisibleRange({ start, end });
  }, [instructions.length, visibleCount]);

  const visibleInstructions = instructions.slice(visibleRange.start, visibleRange.end);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-medium">
        Instruction Execution Trace ({instructions.length} instructions)
      </h4>
      <div 
        ref={containerRef}
        className="space-y-2 max-h-96 overflow-y-auto"
        onScroll={handleScroll}
      >
        {/* 仮想化のためのオフセット */}
        <div style={{ height: visibleRange.start * itemHeight }} />
        
        {visibleInstructions.map((instruction, index) => {
          const actualIndex = visibleRange.start + index;
          return (
            <Card
              key={actualIndex}
              className={`cursor-pointer transition-colors ${
                selectedInstruction === actualIndex ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
              }`}
              onClick={() => onSelectInstruction(selectedInstruction === actualIndex ? null : actualIndex)}
            >
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono text-xs">
                      {actualIndex.toString().padStart(3, '0')}
                    </Badge>
                    <span className="font-mono text-sm">{instruction.opcode}</span>
                    {instruction.operands.length > 0 && (
                      <span className="text-xs text-muted-foreground">
                        {instruction.operands.slice(0, 2).map(op => 
                          typeof op === 'string' ? op : JSON.stringify(op)
                        ).join(', ')}
                        {instruction.operands.length > 2 && '...'}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      {instruction.gasConsumed.toLocaleString()}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      <Clock className="h-3 w-3 mr-1" />
                      {new Date(instruction.timestamp).toLocaleTimeString()}
                    </Badge>
                  </div>
                </div>

                {selectedInstruction === actualIndex && stackStates[actualIndex] && (
                  <div className="mt-3 pt-3 border-t">
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <h5 className="font-medium mb-1">Stack Before</h5>
                        <div className="space-y-1">
                          {instruction.stackBefore.length > 0 ? (
                            instruction.stackBefore.map((item, i) => (
                              <div key={i} className="bg-muted/50 p-1 rounded font-mono">
                                {JSON.stringify(item)}
                              </div>
                            ))
                          ) : (
                            <div className="text-muted-foreground italic">Empty</div>
                          )}
                        </div>
                      </div>
                      <div>
                        <h5 className="font-medium mb-1">Stack After</h5>
                        <div className="space-y-1">
                          {instruction.stackAfter.length > 0 ? (
                            instruction.stackAfter.map((item, i) => (
                              <div key={i} className="bg-muted/50 p-1 rounded font-mono">
                                {JSON.stringify(item)}
                              </div>
                            ))
                          ) : (
                            <div className="text-muted-foreground italic">Empty</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
        
        {/* 仮想化のためのオフセット */}
        <div style={{ height: (instructions.length - visibleRange.end) * itemHeight }} />
      </div>
    </div>
  );
}

interface GasUsageVisualizationProps {
  gasUsage: GasUsageStep[];
}

function GasUsageVisualization({ gasUsage }: GasUsageVisualizationProps) {
  const maxGas = Math.max(...gasUsage.map(step => step.gasUsed));

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'intrinsic': return 'bg-blue-500';
      case 'execution': return 'bg-green-500';
      case 'io': return 'bg-yellow-500';
      case 'storage': return 'bg-purple-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="space-y-4">
      <h4 className="text-sm font-medium flex items-center gap-2">
        <BarChart3 className="h-4 w-4" />
        Gas Usage Breakdown
      </h4>
      <div className="space-y-3">
        {gasUsage.map((step, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <Badge variant="outline">Step {step.step}</Badge>
                <Badge className={`text-white ${getCategoryColor(step.category)}`}>
                  {step.category}
                </Badge>
              </div>
              <span className="font-mono">{step.gasUsed.toLocaleString()} gas</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div 
                className={`h-2 rounded-full ${getCategoryColor(step.category)}`}
                style={{ width: `${(step.gasUsed / maxGas) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ResourceAccessVisualizationProps {
  resourceAccesses: ResourceAccess[];
  moduleLoads: any[];
}

function ResourceAccessVisualization({ resourceAccesses, moduleLoads }: ResourceAccessVisualizationProps) {
  const getAccessTypeColor = (type: string) => {
    switch (type) {
      case 'read': return 'default';
      case 'write': return 'secondary';
      case 'create': return 'default';
      case 'delete': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Database className="h-4 w-4" />
          Resource Accesses ({resourceAccesses.length})
        </h4>
        <div className="space-y-2">
          {resourceAccesses.map((access, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant={getAccessTypeColor(access.accessType) as any}>
                        {access.accessType.toUpperCase()}
                      </Badge>
                      <span className="font-mono text-xs">
                        {access.address.slice(0, 8)}...
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {access.resourceType}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs font-mono">{access.gasUsed} gas</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <Cpu className="h-4 w-4" />
          Module Loads ({moduleLoads.length})
        </h4>
        <div className="space-y-2">
          {moduleLoads.map((load, index) => (
            <Card key={index}>
              <CardContent className="p-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <div className="font-mono text-sm">{load.moduleName}</div>
                    <div className="text-xs text-muted-foreground">
                      {load.address}
                    </div>
                  </div>
                  <div className="text-xs font-mono">{load.gasUsed} gas</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

interface ExecutionPathVisualizationProps {
  path: ExecutionPath;
  instructions: VMInstruction[];
}

function ExecutionPathVisualization({ path, instructions }: ExecutionPathVisualizationProps) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold">{path.totalInstructions}</div>
          <div className="text-sm text-muted-foreground">Total Instructions</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{path.branchPoints.length}</div>
          <div className="text-sm text-muted-foreground">Branch Points</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold">{path.loopDetection.length}</div>
          <div className="text-sm text-muted-foreground">Loops Detected</div>
        </div>
      </div>

      <div className="space-y-4">
        <h4 className="text-sm font-medium flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Critical Path (High Gas Instructions)
        </h4>
        <div className="space-y-2">
          {path.criticalPath.map((instructionIndex) => {
            const instruction = instructions[instructionIndex];
            return (
              <Card key={instructionIndex}>
                <CardContent className="p-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">#{instructionIndex}</Badge>
                      <span className="font-mono text-sm">{instruction.opcode}</span>
                    </div>
                    <Badge variant="secondary">
                      {instruction.gasConsumed.toLocaleString()} gas
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {path.loopDetection.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-medium flex items-center gap-2">
            <GitBranch className="h-4 w-4" />
            Loop Detection
          </h4>
          <div className="space-y-2">
            {path.loopDetection.map((loop, index) => (
              <Card key={index}>
                <CardContent className="p-3">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="outline">Loop {index + 1}</Badge>
                      <span className="text-sm">{loop.iterations} iterations</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Instructions {loop.startIndex} → {loop.endIndex}
                    </div>
                    <div className="text-xs font-mono bg-muted/50 p-2 rounded">
                      {loop.pattern}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface PerformanceAnalysisProps {
  trace: VMExecutionTrace;
  executionPath: ExecutionPath | null;
}

function PerformanceAnalysis({ trace, executionPath }: PerformanceAnalysisProps) {
  const totalGas = trace.gasUsage[trace.gasUsage.length - 1]?.gasUsed || 0;
  const avgGasPerInstruction = Math.round(totalGas / trace.instructions.length);
  const highGasInstructions = trace.instructions.filter(inst => inst.gasConsumed > avgGasPerInstruction * 2);
  
  const performanceScore = Math.max(0, Math.min(100, 
    100 - (highGasInstructions.length / trace.instructions.length) * 50 - 
    (executionPath?.loopDetection.length || 0) * 10
  ));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-4">
            <div className="text-center space-y-2">
              <div className="text-3xl font-bold">{Math.round(performanceScore)}%</div>
              <div className="text-sm text-muted-foreground">Performance Score</div>
              <div className="flex items-center justify-center gap-2">
                {performanceScore >= 80 ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : performanceScore >= 60 ? (
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )}
                <span className="text-xs">
                  {performanceScore >= 80 ? 'Excellent' : performanceScore >= 60 ? 'Good' : 'Needs Optimization'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <h5 className="text-sm font-medium">Performance Metrics</h5>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Avg Gas/Instruction:</span>
                  <span className="font-mono">{avgGasPerInstruction.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>High Gas Instructions:</span>
                  <span className="font-mono">{highGasInstructions.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resource Efficiency:</span>
                  <span className="font-mono">
                    {Math.round((trace.instructions.length / trace.resourceAccesses.length) * 10) / 10}x
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4">
          <h5 className="text-sm font-medium mb-3">Optimization Suggestions</h5>
          <div className="space-y-2">
            {highGasInstructions.length > trace.instructions.length * 0.2 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Consider optimizing high-gas instructions ({highGasInstructions.length} found)</span>
              </div>
            )}
            
            {(executionPath?.loopDetection.length || 0) > 0 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>Loops detected - verify loop bounds and consider unrolling for small iterations</span>
              </div>
            )}
            
            {trace.resourceAccesses.length > trace.instructions.length * 0.5 && (
              <div className="flex items-start gap-2 text-sm">
                <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                <span>High resource access ratio - consider batching operations</span>
              </div>
            )}
            
            {performanceScore >= 80 && (
              <div className="flex items-start gap-2 text-sm">
                <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                <span>Transaction is well-optimized with efficient gas usage</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}