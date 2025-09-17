# Execution Trace Tab実装計画

## 概要
SimulationResultsのExecution Traceタブを有効化し、VM実行トレース機能を実装する計画。現在、`result?.trace`が存在しないため無効化されている。

## 現状分析

### 無効化されている理由
```typescript
// SimulationResults.tsx
{
  key: 'trace', 
  label: 'Execution Trace', 
  icon: Activity,
  available: !!result?.trace  // traceが存在しない
}
```

### 既存コンポーネント
- `TraceViewer.tsx` - 実行トレース可視化コンポーネント（実装済み）
- `vm-trace.ts` - VM トレース分析ロジック（実装済み）
- `vm-execution-tracer.ts` - VM 実行トレーサー（実装済み）

## Aptos Execution Trace API仕様

### 1. Gas Profiler Integration
Aptos CLIの`--profile-gas`オプションによる詳細トレース:

```typescript
interface GasProfilingTrace {
  execution_trace: ExecutionStep[];
  cost_breakdown: CostBreakdown;
  flamegraphs: {
    execution_io: FlameGraphData;
    storage: FlameGraphData;
  };
}

interface ExecutionStep {
  instruction: string;
  gas_cost: number;
  cumulative_gas: number;
  stack_before: any[];
  stack_after: any[];
  locals: Record<string, any>;
  call_depth: number;
  timestamp: number;
}
```

### 2. Transaction Simulation Extended Response
拡張された simulation response (カスタム実装):

```typescript
interface ExtendedSimulationResponse {
  // 標準レスポンス
  gas_used: string;
  success: boolean;
  vm_status: string;
  changes: StateChange[];
  events: Event[];
  
  // 拡張トレース情報（カスタム実装）
  execution_trace?: {
    instructions: VMInstruction[];
    function_calls: FunctionCall[];
    resource_accesses: ResourceAccess[];
    gas_usage_steps: GasUsageStep[];
  };
}
```

### 3. Move VM Instruction Set
Move VMの命令セットとトレース情報:

```typescript
interface VMInstruction {
  opcode: string;                    // Move VM opcode (LdU64, Call, etc.)
  operands: any[];                   // 命令のオペランド
  stack_before: StackValue[];        // 実行前スタック状態
  stack_after: StackValue[];         // 実行後スタック状態
  gas_consumed: number;              // この命令で消費されたガス
  execution_time_ns: number;         // 実行時間（ナノ秒）
  instruction_index: number;         // 命令番号
  call_depth: number;                // 関数呼び出し深度
}

interface FunctionCall {
  module_id: string;                 // 0x1::coin
  function_name: string;             // transfer
  type_arguments: string[];          // [0x1::aptos_coin::AptosCoin]
  arguments: any[];                  // 関数引数
  call_depth: number;                // 呼び出し深度
  entry_instruction: number;         // 開始命令番号
  exit_instruction: number;          // 終了命令番号
  gas_consumed: number;              // 関数全体で消費されたガス
  success: boolean;                  // 関数実行成功/失敗
  return_values: any[];              // 戻り値
}

interface ResourceAccess {
  resource_type: string;             // 0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
  address: string;                   // アクセス対象アドレス
  operation: 'read' | 'write' | 'create' | 'delete';
  before_value?: any;                // 変更前の値
  after_value?: any;                 // 変更後の値
  gas_cost: number;                  // アクセスコスト
  instruction_index: number;         // アクセスが発生した命令番号
}
```

## 実装計画

### Phase 1: トレースデータ生成・収集

#### 1.1 Simulation拡張によるトレース取得
**ファイル**: `web/src/lib/trace-simulator.ts`

```typescript
interface VMExecutionTrace {
  instructions: VMInstruction[];
  function_calls: FunctionCall[];
  resource_accesses: ResourceAccess[];
  gas_usage_steps: GasUsageStep[];
  execution_summary: {
    total_instructions: number;
    total_function_calls: number;
    max_call_depth: number;
    total_execution_time_ns: number;
  };
}

class TraceSimulator {
  /**
   * 通常のシミュレーションにトレース機能を追加
   */
  async simulateWithTrace(transactionData: TransactionData): Promise<{
    simulation: SimulationResult;
    trace: VMExecutionTrace;
  }> {
    try {
      // 1. 通常のシミュレーション実行
      const simulation = await this.executeSimulation(transactionData);
      
      // 2. トランザクションの詳細分析によるトレース生成
      const trace = await this.generateTraceFromSimulation(simulation, transactionData);
      
      return { simulation, trace };
    } catch (error) {
      throw new Error(`Trace simulation failed: ${error.message}`);
    }
  }

  private async generateTraceFromSimulation(
    simulation: SimulationResult,
    transactionData: TransactionData
  ): Promise<VMExecutionTrace> {
    // シミュレーション結果からトレースを再構築
    const instructions = await this.reconstructInstructions(simulation, transactionData);
    const functionCalls = await this.extractFunctionCalls(simulation, transactionData);
    const resourceAccesses = this.extractResourceAccesses(simulation);
    const gasUsageSteps = this.calculateGasUsageSteps(instructions);
    
    return {
      instructions,
      function_calls: functionCalls,
      resource_accesses: resourceAccesses,
      gas_usage_steps: gasUsageSteps,
      execution_summary: this.generateExecutionSummary(instructions, functionCalls)
    };
  }

  private async reconstructInstructions(
    simulation: SimulationResult,
    transactionData: TransactionData
  ): Promise<VMInstruction[]> {
    const instructions: VMInstruction[] = [];
    
    // Entry function の基本的な実行フローを再構築
    const payload = transactionData.payload as any;
    
    // 1. トランザクション開始処理
    instructions.push(this.createInstruction('TxnPrologue', [], 300));
    
    // 2. 関数呼び出し準備
    instructions.push(this.createInstruction('LdAddr', [payload.function], 50));
    
    // 3. 引数ロード
    payload.function_arguments?.forEach((arg: any, index: number) => {
      instructions.push(this.createInstruction('LdConst', [arg], 25));
    });
    
    // 4. 関数呼び出し
    const callGas = Math.floor((simulation.gasUsed || 0) * 0.7); // 実行の70%
    instructions.push(this.createInstruction('Call', [payload.function], callGas));
    
    // 5. ストレージ操作（変更がある場合）
    simulation.changes?.forEach((change, index) => {
      instructions.push(this.createInstruction('WriteResource', [change], 200));
    });
    
    // 6. イベント発行（イベントがある場合）
    simulation.events?.forEach((event, index) => {
      instructions.push(this.createInstruction('EmitEvent', [event], 100));
    });
    
    // 7. トランザクション終了処理
    instructions.push(this.createInstruction('TxnEpilogue', [], 150));
    
    return instructions;
  }

  private createInstruction(
    opcode: string, 
    operands: any[], 
    gasConsumed: number,
    stackBefore: any[] = [],
    stackAfter: any[] = []
  ): VMInstruction {
    return {
      opcode,
      operands,
      stack_before: stackBefore,
      stack_after: stackAfter,
      gas_consumed: gasConsumed,
      execution_time_ns: gasConsumed * 1000, // 概算の実行時間
      instruction_index: 0, // 後で設定
      call_depth: 0 // 後で設定
    };
  }

  private extractFunctionCalls(
    simulation: SimulationResult,
    transactionData: TransactionData
  ): FunctionCall[] {
    const calls: FunctionCall[] = [];
    const payload = transactionData.payload as any;
    
    if (payload.function) {
      // メイン関数呼び出し
      calls.push({
        module_id: this.extractModuleId(payload.function),
        function_name: this.extractFunctionName(payload.function),
        type_arguments: payload.type_arguments || [],
        arguments: payload.function_arguments || [],
        call_depth: 0,
        entry_instruction: 3, // LdAddr後
        exit_instruction: 10, // 概算
        gas_consumed: Math.floor((simulation.gasUsed || 0) * 0.8),
        success: simulation.success,
        return_values: []
      });
    }
    
    return calls;
  }

  private extractResourceAccesses(simulation: SimulationResult): ResourceAccess[] {
    const accesses: ResourceAccess[] = [];
    
    simulation.changes?.forEach((change, index) => {
      accesses.push({
        resource_type: this.inferResourceType(change),
        address: change.address || '',
        operation: this.determineOperation(change),
        before_value: null, // シミュレーションでは取得不可
        after_value: change.data,
        gas_cost: 200, // 概算
        instruction_index: index + 5 // WriteResource命令のindex
      });
    });
    
    return accesses;
  }
}
```

#### 1.2 Mock トレースデータ生成（開発用）
**ファイル**: `web/src/lib/mock-trace-generator.ts`

```typescript
class MockTraceGenerator {
  /**
   * 開発・テスト用のモックトレースデータ生成
   */
  generateMockTrace(simulation: SimulationResult): VMExecutionTrace {
    const instructions = this.generateMockInstructions(simulation);
    const functionCalls = this.generateMockFunctionCalls(simulation);
    const resourceAccesses = this.generateMockResourceAccesses(simulation);
    
    return {
      instructions,
      function_calls: functionCalls,
      resource_accesses: resourceAccesses,
      gas_usage_steps: this.generateGasUsageSteps(instructions),
      execution_summary: {
        total_instructions: instructions.length,
        total_function_calls: functionCalls.length,
        max_call_depth: Math.max(...functionCalls.map(f => f.call_depth)),
        total_execution_time_ns: instructions.reduce((sum, i) => sum + i.execution_time_ns, 0)
      }
    };
  }

  private generateMockInstructions(simulation: SimulationResult): VMInstruction[] {
    const totalGas = simulation.gasUsed || 1000;
    const instructionCount = Math.floor(totalGas / 50); // 平均50ガス/命令
    
    const opcodes = [
      'LdU64', 'LdAddr', 'LdByteArray', 'LdStr',
      'CopyLoc', 'MoveLoc', 'StLoc',
      'Call', 'CallGeneric', 'Ret',
      'BrTrue', 'BrFalse', 'Branch',
      'ReadRef', 'WriteRef', 'FreezeRef',
      'MutBorrowLoc', 'ImmBorrowLoc',
      'MutBorrowField', 'ImmBorrowField',
      'Pack', 'Unpack', 'Exists',
      'MoveFrom', 'MoveTo'
    ];

    return Array.from({ length: instructionCount }, (_, index) => ({
      opcode: opcodes[index % opcodes.length],
      operands: this.generateMockOperands(),
      stack_before: this.generateMockStack(index),
      stack_after: this.generateMockStack(index + 1),
      gas_consumed: Math.floor(totalGas / instructionCount) + Math.random() * 20,
      execution_time_ns: (Math.floor(totalGas / instructionCount) + Math.random() * 20) * 1000,
      instruction_index: index,
      call_depth: Math.floor(Math.random() * 3)
    }));
  }
}
```

### Phase 2: TraceViewer UI強化

#### 2.1 TraceViewer拡張
**ファイル**: `web/src/components/debugging/TraceViewer.tsx`

既存コンポーネントを大幅拡張:

```typescript
export function TraceViewer({ trace }: TraceViewerProps) {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'instructions' | 'functions' | 'resources'>('instructions');
  const [filterOptions, setFilterOptions] = useState({
    opcode: '',
    minGas: 0,
    onlyErrors: false,
    callDepth: -1
  });

  return (
    <div className="space-y-6">
      {/* 実行サマリー */}
      <ExecutionSummaryCard summary={trace.execution_summary} />
      
      {/* フィルター・制御パネル */}
      <TraceControlPanel 
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        filterOptions={filterOptions}
        onFilterChange={setFilterOptions}
      />
      
      {/* メインビューワー */}
      {viewMode === 'instructions' && (
        <InstructionTraceView 
          instructions={trace.instructions}
          selectedStep={selectedStep}
          onStepSelect={setSelectedStep}
          filterOptions={filterOptions}
        />
      )}
      
      {viewMode === 'functions' && (
        <FunctionCallTraceView 
          functionCalls={trace.function_calls}
          instructions={trace.instructions}
        />
      )}
      
      {viewMode === 'resources' && (
        <ResourceAccessTraceView 
          resourceAccesses={trace.resource_accesses}
          instructions={trace.instructions}
        />
      )}
      
      {/* 詳細パネル */}
      <InstructionDetailsPanel 
        instruction={trace.instructions[selectedStep]}
        context={trace}
      />
    </div>
  );
}

function ExecutionSummaryCard({ summary }: { summary: VMExecutionTrace['execution_summary'] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">実行サマリー</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {summary.total_instructions.toLocaleString()}
          </div>
          <div className="text-sm text-muted-foreground">総命令数</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {summary.total_function_calls}
          </div>
          <div className="text-sm text-muted-foreground">関数呼び出し</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-yellow-600">
            {summary.max_call_depth}
          </div>
          <div className="text-sm text-muted-foreground">最大呼び出し深度</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {(summary.total_execution_time_ns / 1_000_000).toFixed(2)}ms
          </div>
          <div className="text-sm text-muted-foreground">総実行時間</div>
        </div>
      </div>
    </Card>
  );
}

function InstructionTraceView({ 
  instructions, 
  selectedStep, 
  onStepSelect, 
  filterOptions 
}: {
  instructions: VMInstruction[];
  selectedStep: number;
  onStepSelect: (step: number) => void;
  filterOptions: any;
}) {
  const filteredInstructions = useMemo(() => {
    return instructions.filter(instruction => {
      if (filterOptions.opcode && !instruction.opcode.toLowerCase().includes(filterOptions.opcode.toLowerCase())) {
        return false;
      }
      if (instruction.gas_consumed < filterOptions.minGas) {
        return false;
      }
      if (filterOptions.callDepth >= 0 && instruction.call_depth !== filterOptions.callDepth) {
        return false;
      }
      return true;
    });
  }, [instructions, filterOptions]);

  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4">命令トレース ({filteredInstructions.length}件)</h4>
      
      {/* 仮想化された命令リスト */}
      <div className="h-96 overflow-auto border rounded">
        <VirtualizedInstructionList 
          instructions={filteredInstructions}
          selectedIndex={selectedStep}
          onSelect={onStepSelect}
        />
      </div>
    </Card>
  );
}

function VirtualizedInstructionList({ 
  instructions, 
  selectedIndex, 
  onSelect 
}: {
  instructions: VMInstruction[];
  selectedIndex: number;
  onSelect: (index: number) => void;
}) {
  const getInstructionColor = (opcode: string): string => {
    if (opcode.startsWith('Ld')) return 'text-blue-600';
    if (opcode.includes('Call')) return 'text-green-600';
    if (opcode.includes('Ref')) return 'text-yellow-600';
    if (opcode.includes('Move')) return 'text-red-600';
    return 'text-gray-600';
  };

  return (
    <div className="space-y-1">
      {instructions.map((instruction, index) => (
        <div
          key={index}
          className={`p-2 text-sm cursor-pointer hover:bg-muted/50 ${
            index === selectedIndex ? 'bg-accent' : ''
          }`}
          onClick={() => onSelect(index)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <span className="text-xs text-muted-foreground w-12">
                #{instruction.instruction_index}
              </span>
              <span className="text-xs text-muted-foreground">
                {'  '.repeat(instruction.call_depth)}
              </span>
              <span className={`font-mono font-medium ${getInstructionColor(instruction.opcode)}`}>
                {instruction.opcode}
              </span>
              <span className="text-xs text-muted-foreground truncate max-w-48">
                {instruction.operands.length > 0 && JSON.stringify(instruction.operands).substring(0, 40)}
              </span>
            </div>
            <div className="flex items-center space-x-2 text-xs">
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
  );
}
```

#### 2.2 関数呼び出しトレース
**ファイル**: `web/src/components/debugging/FunctionCallTraceView.tsx`

```typescript
function FunctionCallTraceView({ 
  functionCalls, 
  instructions 
}: {
  functionCalls: FunctionCall[];
  instructions: VMInstruction[];
}) {
  return (
    <Card className="p-4">
      <h4 className="font-semibold mb-4">関数呼び出しトレース</h4>
      
      <div className="space-y-3">
        {functionCalls.map((call, index) => (
          <FunctionCallCard 
            key={index} 
            call={call} 
            instructions={instructions}
          />
        ))}
      </div>
    </Card>
  );
}

function FunctionCallCard({ 
  call, 
  instructions 
}: {
  call: FunctionCall;
  instructions: VMInstruction[];
}) {
  const [expanded, setExpanded] = useState(false);
  
  const relatedInstructions = instructions.slice(
    call.entry_instruction,
    call.exit_instruction + 1
  );

  return (
    <Card className="border-l-4 border-l-blue-500">
      <CardContent className="p-4">
        <div 
          className="flex items-center justify-between cursor-pointer"
          onClick={() => setExpanded(!expanded)}
        >
          <div>
            <h5 className="font-medium">
              {'  '.repeat(call.call_depth)}{call.module_id}::{call.function_name}
            </h5>
            <p className="text-sm text-muted-foreground">
              深度: {call.call_depth} | ガス: {call.gas_consumed.toLocaleString()}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Badge variant={call.success ? 'default' : 'destructive'}>
              {call.success ? 'Success' : 'Failed'}
            </Badge>
            <ChevronDown className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </div>
        </div>
        
        {expanded && (
          <div className="mt-4 space-y-3">
            {/* 型引数 */}
            {call.type_arguments.length > 0 && (
              <div>
                <h6 className="text-sm font-medium">型引数:</h6>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  {call.type_arguments.join(', ')}
                </div>
              </div>
            )}
            
            {/* 関数引数 */}
            {call.arguments.length > 0 && (
              <div>
                <h6 className="text-sm font-medium">引数:</h6>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  {JSON.stringify(call.arguments, null, 2)}
                </div>
              </div>
            )}
            
            {/* 戻り値 */}
            {call.return_values.length > 0 && (
              <div>
                <h6 className="text-sm font-medium">戻り値:</h6>
                <div className="text-xs font-mono bg-muted p-2 rounded">
                  {JSON.stringify(call.return_values, null, 2)}
                </div>
              </div>
            )}
            
            {/* 関連命令 */}
            <div>
              <h6 className="text-sm font-medium">関連命令 ({relatedInstructions.length}件):</h6>
              <div className="max-h-32 overflow-auto">
                <VirtualizedInstructionList 
                  instructions={relatedInstructions}
                  selectedIndex={-1}
                  onSelect={() => {}}
                />
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

### Phase 3: 高度なトレース分析

#### 3.1 実行パフォーマンス分析
**ファイル**: `web/src/lib/trace-performance-analyzer.ts`

```typescript
interface PerformanceAnalysis {
  hotspots: Hotspot[];                    // パフォーマンスホットスポット
  gas_efficiency: GasEfficiencyAnalysis; // ガス効率分析
  execution_patterns: ExecutionPattern[]; // 実行パターン
  optimization_suggestions: OptimizationSuggestion[];
}

interface Hotspot {
  function_name: string;
  instruction_range: [number, number];
  gas_consumed: number;
  gas_percentage: number;
  execution_time_ns: number;
  time_percentage: number;
  call_count: number;
  optimization_potential: 'high' | 'medium' | 'low';
}

class TracePerformanceAnalyzer {
  analyzePerformance(trace: VMExecutionTrace): PerformanceAnalysis {
    const hotspots = this.identifyHotspots(trace);
    const gasEfficiency = this.analyzeGasEfficiency(trace);
    const executionPatterns = this.identifyExecutionPatterns(trace);
    const optimizationSuggestions = this.generateOptimizationSuggestions(hotspots, gasEfficiency);

    return {
      hotspots,
      gas_efficiency: gasEfficiency,
      execution_patterns: executionPatterns,
      optimization_suggestions: optimizationSuggestions
    };
  }

  private identifyHotspots(trace: VMExecutionTrace): Hotspot[] {
    const totalGas = trace.instructions.reduce((sum, i) => sum + i.gas_consumed, 0);
    const totalTime = trace.execution_summary.total_execution_time_ns;
    
    // 関数ごとのリソース消費を集計
    const functionStats = trace.function_calls.map(call => ({
      function_name: `${call.module_id}::${call.function_name}`,
      instruction_range: [call.entry_instruction, call.exit_instruction] as [number, number],
      gas_consumed: call.gas_consumed,
      gas_percentage: (call.gas_consumed / totalGas) * 100,
      execution_time_ns: this.calculateFunctionExecutionTime(call, trace.instructions),
      time_percentage: (this.calculateFunctionExecutionTime(call, trace.instructions) / totalTime) * 100,
      call_count: 1, // TODO: 重複呼び出しを考慮
      optimization_potential: this.assessOptimizationPotential(call)
    }));

    return functionStats
      .filter(stat => stat.gas_percentage > 5) // 5%以上のガス消費
      .sort((a, b) => b.gas_consumed - a.gas_consumed);
  }

  private analyzeGasEfficiency(trace: VMExecutionTrace): GasEfficiencyAnalysis {
    const instructions = trace.instructions;
    
    return {
      instructions_per_gas: instructions.length / instructions.reduce((sum, i) => sum + i.gas_consumed, 0),
      average_gas_per_instruction: instructions.reduce((sum, i) => sum + i.gas_consumed, 0) / instructions.length,
      gas_distribution_by_opcode: this.calculateGasDistributionByOpcode(instructions),
      inefficient_patterns: this.detectInefficientPatterns(instructions)
    };
  }
}
```

#### 3.2 トレースデバッガー
**ファイル**: `web/src/components/debugging/TraceDebugger.tsx`

```typescript
function TraceDebugger({ trace }: { trace: VMExecutionTrace }) {
  const [debugState, setDebugState] = useState({
    currentStep: 0,
    breakpoints: new Set<number>(),
    isPlaying: false,
    playSpeed: 1000 // ms
  });

  const [callStack, setCallStack] = useState<FunctionCall[]>([]);
  const [resourceState, setResourceState] = useState<Map<string, any>>(new Map());

  return (
    <div className="space-y-4">
      {/* デバッガー制御パネル */}
      <DebugControlPanel 
        debugState={debugState}
        onStateChange={setDebugState}
        totalSteps={trace.instructions.length}
      />
      
      <div className="grid grid-cols-3 gap-4">
        {/* メイン実行ビュー */}
        <div className="col-span-2">
          <Card className="p-4">
            <h4 className="font-semibold mb-4">実行ステップ</h4>
            <InstructionDebugView 
              instructions={trace.instructions}
              currentStep={debugState.currentStep}
              breakpoints={debugState.breakpoints}
              onBreakpointToggle={(step) => {
                const newBreakpoints = new Set(debugState.breakpoints);
                if (newBreakpoints.has(step)) {
                  newBreakpoints.delete(step);
                } else {
                  newBreakpoints.add(step);
                }
                setDebugState({...debugState, breakpoints: newBreakpoints});
              }}
            />
          </Card>
        </div>
        
        {/* サイドパネル */}
        <div className="space-y-4">
          {/* コールスタック */}
          <Card className="p-4">
            <h5 className="font-medium mb-2">コールスタック</h5>
            <CallStackView callStack={callStack} />
          </Card>
          
          {/* 変数・リソース状態 */}
          <Card className="p-4">
            <h5 className="font-medium mb-2">リソース状態</h5>
            <ResourceStateView resourceState={resourceState} />
          </Card>
        </div>
      </div>
    </div>
  );
}

function DebugControlPanel({ 
  debugState, 
  onStateChange, 
  totalSteps 
}: {
  debugState: any;
  onStateChange: (state: any) => void;
  totalSteps: number;
}) {
  const stepForward = () => {
    if (debugState.currentStep < totalSteps - 1) {
      onStateChange({
        ...debugState,
        currentStep: debugState.currentStep + 1
      });
    }
  };

  const stepBackward = () => {
    if (debugState.currentStep > 0) {
      onStateChange({
        ...debugState,
        currentStep: debugState.currentStep - 1
      });
    }
  };

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={stepBackward}>
            <StepBack className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => onStateChange({...debugState, isPlaying: !debugState.isPlaying})}
          >
            {debugState.isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
          </Button>
          <Button variant="outline" size="sm" onClick={stepForward}>
            <StepForward className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center space-x-4">
          <span className="text-sm text-muted-foreground">
            ステップ: {debugState.currentStep + 1} / {totalSteps}
          </span>
          <Progress 
            value={(debugState.currentStep / totalSteps) * 100} 
            className="w-32"
          />
        </div>
      </div>
    </Card>
  );
}
```

### Phase 4: 統合とテスト

#### 4.1 Simulator統合
**ファイル**: `web/src/lib/simulator.ts`

```typescript
// simulateTransaction関数を修正してtraceを含める
export async function simulateTransaction(transactionData: TransactionData): Promise<SimulationResult> {
  try {
    const startTime = Date.now();
    
    // 通常のシミュレーション
    const response = await aptosClient.simulateTransaction(transaction);
    
    // トレース生成
    const traceSimulator = new TraceSimulator();
    const { trace } = await traceSimulator.simulateWithTrace(transactionData);
    
    return {
      success: response.success,
      gasUsed: parseInt(response.gas_used),
      gasUnitPrice: transactionData.gasUnitPrice,
      totalGasCost: parseInt(response.gas_used) * transactionData.gasUnitPrice,
      vmStatus: response.vm_status,
      changes: response.changes,
      events: response.events,
      executionTime: Date.now() - startTime,
      trace,  // 追加
      // ... その他のフィールド
    };
  } catch (error) {
    // エラーハンドリング
  }
}
```

#### 4.2 型定義更新
**ファイル**: `web/src/types/simulation.ts`

```typescript
export interface SimulationResult {
  // 既存フィールド
  success: boolean;
  gasUsed: number;
  gasUnitPrice: number;
  totalGasCost: number;
  vmStatus: string;
  changes?: any[];
  events?: any[];
  executionTime: number;
  
  // 新規追加
  trace?: VMExecutionTrace;
  traceAnalysis?: PerformanceAnalysis;
}

export interface VMExecutionTrace {
  instructions: VMInstruction[];
  function_calls: FunctionCall[];
  resource_accesses: ResourceAccess[];
  gas_usage_steps: GasUsageStep[];
  execution_summary: {
    total_instructions: number;
    total_function_calls: number;
    max_call_depth: number;
    total_execution_time_ns: number;
  };
}
```

## 実装スケジュール

### Week 1: Phase 1 - トレースデータ生成
- [ ] `TraceSimulator`実装
- [ ] `MockTraceGenerator`実装
- [ ] 基本的なトレースデータ生成

### Week 2: Phase 2 - UI強化
- [ ] `TraceViewer`拡張
- [ ] 命令・関数・リソースビュー実装
- [ ] フィルタリング・検索機能

### Week 3: Phase 3 - 高度分析
- [ ] パフォーマンス分析器
- [ ] トレースデバッガー
- [ ] ホットスポット検出

### Week 4: Phase 4 - 統合・テスト
- [ ] Simulator統合
- [ ] エラーハンドリング
- [ ] ユニット・統合テスト

## 技術要件

### 依存関係
- React Window (仮想化)
- D3.js (グラフ可視化)
- Monaco Editor (コードエディタ)

### パフォーマンス要件
- トレース生成: <1秒
- UI描画: <300ms
- 大量データ処理: 10,000命令まで

### 制限事項
- Aptos SDK の制約によりフルトレースは取得不可
- 推定・再構築によるトレース生成
- リアルタイムデバッグは非対応