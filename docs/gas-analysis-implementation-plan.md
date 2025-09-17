# Gas Analysis Tab実装計画

## 概要
SimulationResultsのGas Analysisタブを有効化し、詳細なガス分析機能を実装する計画。現在、`result?.gasBreakdown`が存在しないため無効化されている。

## 現状分析

### 無効化されている理由
```typescript
// SimulationResults.tsx
{
  key: 'gas', 
  label: 'Gas Analysis', 
  icon: BarChart3,
  available: !!result?.gasBreakdown  // gasBreakdownが存在しない
}
```

### 既存コンポーネント
- `GasBreakdownChart.tsx` - ガス分析可視化コンポーネント（実装済み）
- `gas-analyzer.ts` - ガス分析ロジック（実装済み）

## Aptos Gas Analysis API仕様

### 1. Transaction Simulation API Response
`/v1/transactions/simulate` エンドポイントのレスポンス:

```typescript
interface SimulationResponse {
  version: string;
  hash: string;
  gas_used: string;           // 実際に使用されたガス
  success: boolean;
  vm_status: string;          // 実行ステータス
  changes: StateChange[];     // 状態変更
  events: Event[];           // イベント
}
```

### 2. Gas Profiling (Aptos CLI)
Aptos CLIの`--profile-gas`オプションにより取得可能:

```typescript
interface GasProfilingReport {
  flamegraphs: {
    execution_io: FlameGraph;   // 実行・I/Oコスト
    storage: FlameGraph;        // ストレージコスト  
  };
  cost_breakdown: {
    intrinsic: IntrinsicCosts;
    execution: ExecutionCosts;
    io: IOCosts;
    storage: StorageCosts;
  };
  execution_trace: ExecutionStep[];
}
```

## 実装計画

### Phase 1: 基本ガス分析データ生成

#### 1.1 Simulation結果からのガス分析
**ファイル**: `web/src/lib/gas-breakdown-generator.ts`

```typescript
interface DetailedGasBreakdown {
  intrinsic: {
    signature_verification: number;
    transaction_size: number;
    prologue_execution: number;
    epilogue_execution: number;
  };
  execution: {
    bytecode_instruction: number;
    function_call_overhead: number;
    move_value_operations: number;
    type_checking: number;
  };
  io: {
    storage_read: number;
    storage_write: number;
    event_emission: number;
    resource_access: number;
  };
  storage: {
    state_item_creation: number;
    state_item_modification: number;
    state_item_deletion: number;
    storage_refund: number;
  };
}

class GasBreakdownGenerator {
  /**
   * Simulation結果からガス分析データを生成
   */
  generateFromSimulation(result: SimulationResult): DetailedGasBreakdown {
    const totalGas = result.gasUsed || 0;
    
    // Aptos Gas Model に基づく推定分析
    return {
      intrinsic: this.estimateIntrinsicCosts(result),
      execution: this.estimateExecutionCosts(result),
      io: this.estimateIOCosts(result),
      storage: this.estimateStorageCosts(result)
    };
  }

  private estimateIntrinsicCosts(result: SimulationResult): IntrinsicCosts {
    // 基本的なトランザクション処理コスト
    const baseCost = 100; // Aptosの基本コスト
    const sizeCost = this.calculateTransactionSizeCost(result);
    
    return {
      signature_verification: 300, // Ed25519署名検証の固定コスト
      transaction_size: sizeCost,
      prologue_execution: baseCost,
      epilogue_execution: baseCost / 2
    };
  }

  private estimateExecutionCosts(result: SimulationResult): ExecutionCosts {
    const totalGas = result.gasUsed || 0;
    // 実行コストは総ガスの40-60%を占める
    const executionPortion = totalGas * 0.5;
    
    return {
      bytecode_instruction: executionPortion * 0.6,
      function_call_overhead: executionPortion * 0.2,
      move_value_operations: executionPortion * 0.15,
      type_checking: executionPortion * 0.05
    };
  }

  private estimateIOCosts(result: SimulationResult): IOCosts {
    const changes = result.changes || [];
    const events = result.events || [];
    
    return {
      storage_read: changes.length * 300,      // 読み取りコスト
      storage_write: changes.length * 500,     // 書き込みコスト
      event_emission: events.length * 200,     // イベント発行コスト
      resource_access: changes.length * 100    // リソースアクセスコスト
    };
  }

  private estimateStorageCosts(result: SimulationResult): StorageCosts {
    const changes = result.changes || [];
    let creation = 0, modification = 0, deletion = 0;
    
    changes.forEach(change => {
      switch (change.type) {
        case 'write_resource':
          if (change.data === null) deletion++;
          else if (change.state_key_hash) modification++;
          else creation++;
          break;
      }
    });
    
    return {
      state_item_creation: creation * 1000,
      state_item_modification: modification * 300,
      state_item_deletion: deletion * 100,
      storage_refund: deletion * 50  // 削除による返金
    };
  }
}
```

#### 1.2 Simulator修正
**ファイル**: `web/src/lib/simulator.ts`

```typescript
// simulateTransaction関数を修正してgasBreakdownを含める
export async function simulateTransaction(transactionData: TransactionData): Promise<SimulationResult> {
  try {
    const response = await aptosClient.simulateTransaction(transaction, {
      estimate_gas_unit_price: true,
      estimate_max_gas_amount: true
    });
    
    const gasBreakdownGenerator = new GasBreakdownGenerator();
    const gasBreakdown = gasBreakdownGenerator.generateFromSimulation(response);
    
    return {
      success: response.success,
      gasUsed: parseInt(response.gas_used),
      gasUnitPrice: transactionData.gasUnitPrice,
      totalGasCost: parseInt(response.gas_used) * transactionData.gasUnitPrice,
      vmStatus: response.vm_status,
      changes: response.changes,
      events: response.events,
      executionTime: Date.now() - startTime,
      gasBreakdown,  // 追加
      // ... その他のフィールド
    };
  } catch (error) {
    // エラーハンドリング
  }
}
```

### Phase 2: Gas Analysis UI強化

#### 2.1 GasBreakdownChart強化
**ファイル**: `web/src/components/simulation/GasBreakdownChart.tsx`

既存コンポーネントを拡張:

```typescript
export function GasBreakdownChart({ gasBreakdown, totalGas }: GasBreakdownChartProps) {
  return (
    <div className="space-y-6">
      {/* 既存の円グラフ */}
      <GasDistributionPieChart gasBreakdown={gasBreakdown} />
      
      {/* 新規: 詳細カテゴリ分析 */}
      <GasCategoryBreakdown gasBreakdown={gasBreakdown} />
      
      {/* 新規: ガス効率性評価 */}
      <GasEfficiencyAnalysis gasBreakdown={gasBreakdown} totalGas={totalGas} />
      
      {/* 新規: 最適化提案 */}
      <GasOptimizationSuggestions gasBreakdown={gasBreakdown} />
    </div>
  );
}

function GasCategoryBreakdown({ gasBreakdown }: { gasBreakdown: DetailedGasBreakdown }) {
  const categories = [
    {
      name: 'Intrinsic Costs',
      items: gasBreakdown.intrinsic,
      color: 'blue',
      description: 'トランザクション基本処理コスト'
    },
    {
      name: 'Execution Costs', 
      items: gasBreakdown.execution,
      color: 'green',
      description: 'Moveバイトコード実行コスト'
    },
    {
      name: 'I/O Costs',
      items: gasBreakdown.io, 
      color: 'yellow',
      description: 'ストレージ・イベント処理コスト'
    },
    {
      name: 'Storage Costs',
      items: gasBreakdown.storage,
      color: 'red', 
      description: 'ストレージ操作コスト'
    }
  ];

  return (
    <div className="space-y-4">
      <h4 className="font-semibold">詳細ガス分析</h4>
      {categories.map(category => (
        <Card key={category.name} className="p-4">
          <h5 className={`font-medium text-${category.color}-600`}>
            {category.name}
          </h5>
          <p className="text-sm text-muted-foreground mb-3">
            {category.description}
          </p>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(category.items).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                <span className="font-mono">{value.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </Card>
      ))}
    </div>
  );
}
```

#### 2.2 ガス効率性評価
**ファイル**: `web/src/lib/gas-efficiency-analyzer.ts`

```typescript
interface GasEfficiencyMetrics {
  overall_efficiency: number;      // 0-100点
  category_efficiency: {
    intrinsic: number;
    execution: number; 
    io: number;
    storage: number;
  };
  optimization_potential: number;  // 最適化可能性(%)
  recommendations: OptimizationRecommendation[];
}

interface OptimizationRecommendation {
  category: 'intrinsic' | 'execution' | 'io' | 'storage';
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  estimated_savings: number;
  implementation_difficulty: 'easy' | 'medium' | 'hard';
}

class GasEfficiencyAnalyzer {
  analyzeEfficiency(gasBreakdown: DetailedGasBreakdown, totalGas: number): GasEfficiencyMetrics {
    const categoryEfficiency = this.calculateCategoryEfficiency(gasBreakdown, totalGas);
    const overallEfficiency = this.calculateOverallEfficiency(categoryEfficiency);
    
    return {
      overall_efficiency: overallEfficiency,
      category_efficiency: categoryEfficiency,
      optimization_potential: this.calculateOptimizationPotential(gasBreakdown),
      recommendations: this.generateRecommendations(gasBreakdown, categoryEfficiency)
    };
  }

  private calculateCategoryEfficiency(
    gasBreakdown: DetailedGasBreakdown, 
    totalGas: number
  ): GasEfficiencyMetrics['category_efficiency'] {
    // Aptosネットワークのベンチマークと比較
    const benchmarks = {
      intrinsic: 0.15,  // 総ガスの15%が理想
      execution: 0.50,  // 総ガスの50%が理想
      io: 0.25,         // 総ガスの25%が理想
      storage: 0.10     // 総ガスの10%が理想
    };

    const actual = {
      intrinsic: this.sumCategory(gasBreakdown.intrinsic) / totalGas,
      execution: this.sumCategory(gasBreakdown.execution) / totalGas,
      io: this.sumCategory(gasBreakdown.io) / totalGas,
      storage: this.sumCategory(gasBreakdown.storage) / totalGas
    };

    return {
      intrinsic: Math.max(0, 100 - Math.abs(actual.intrinsic - benchmarks.intrinsic) * 100),
      execution: Math.max(0, 100 - Math.abs(actual.execution - benchmarks.execution) * 100),
      io: Math.max(0, 100 - Math.abs(actual.io - benchmarks.io) * 100),
      storage: Math.max(0, 100 - Math.abs(actual.storage - benchmarks.storage) * 100)
    };
  }

  private generateRecommendations(
    gasBreakdown: DetailedGasBreakdown,
    efficiency: GasEfficiencyMetrics['category_efficiency']
  ): OptimizationRecommendation[] {
    const recommendations: OptimizationRecommendation[] = [];

    // 実行効率が低い場合
    if (efficiency.execution < 70) {
      recommendations.push({
        category: 'execution',
        priority: 'high',
        title: 'バイトコード最適化',
        description: 'Move関数の複雑度を下げることでガス効率を改善できます',
        estimated_savings: this.sumCategory(gasBreakdown.execution) * 0.2,
        implementation_difficulty: 'medium'
      });
    }

    // I/O効率が低い場合
    if (efficiency.io < 60) {
      recommendations.push({
        category: 'io',
        priority: 'medium', 
        title: 'ストレージアクセス最適化',
        description: 'バッチ処理でストレージアクセスを減らせます',
        estimated_savings: this.sumCategory(gasBreakdown.io) * 0.3,
        implementation_difficulty: 'easy'
      });
    }

    return recommendations;
  }
}
```

### Phase 3: 高度なガス分析機能

#### 3.1 ガストレンド分析
**ファイル**: `web/src/lib/gas-trend-analyzer.ts`

```typescript
interface GasTrendAnalysis {
  historical_average: number;
  current_vs_average: number;     // +/-% 差分
  network_congestion_impact: number;
  optimal_gas_price_suggestion: number;
  cost_prediction: {
    fast: { price: number; time: string };
    standard: { price: number; time: string };
    slow: { price: number; time: string };
  };
}

class GasTrendAnalyzer {
  async analyzeCurrentTrends(transactionType: string): Promise<GasTrendAnalysis> {
    // Aptos network state APIを使用
    const networkState = await this.fetchNetworkState();
    const historicalData = await this.fetchHistoricalGasData(transactionType);
    
    return {
      historical_average: this.calculateHistoricalAverage(historicalData),
      current_vs_average: this.calculateDifference(networkState.current_gas_price, historicalData),
      network_congestion_impact: this.assessCongestionImpact(networkState),
      optimal_gas_price_suggestion: this.suggestOptimalGasPrice(networkState),
      cost_prediction: this.predictCosts(networkState)
    };
  }
}
```

### Phase 4: 統合とテスト

#### 4.1 SimulationResults修正
**ファイル**: `web/src/components/simulation/SimulationResults.tsx`

```typescript
function renderGasTab() {
  if (!result?.gasBreakdown) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        Generating detailed gas analysis...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <GasBreakdownChart 
        gasBreakdown={result.gasBreakdown}
        totalGas={result.gasUsed}
      />
      <GasEfficiencyDashboard 
        gasBreakdown={result.gasBreakdown}
        totalGas={result.gasUsed}
      />
      <GasTrendAnalysis 
        transactionType={result.type || 'entry_function'}
      />
    </div>
  );
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
  gasBreakdown?: DetailedGasBreakdown;
  gasEfficiency?: GasEfficiencyMetrics;
  gasTrend?: GasTrendAnalysis;
}
```

## 実装スケジュール

### Week 1: Phase 1 - 基本ガス分析
- [ ] `GasBreakdownGenerator`実装
- [ ] `simulator.ts`修正
- [ ] 基本的なガス分析データ生成

### Week 2: Phase 2 - UI強化
- [ ] `GasBreakdownChart`拡張
- [ ] ガス効率性評価UI
- [ ] 最適化提案表示

### Week 3: Phase 3 - 高度分析
- [ ] ガストレンド分析
- [ ] ネットワーク状態統合
- [ ] コスト予測機能

### Week 4: Phase 4 - 統合・テスト
- [ ] 全機能統合
- [ ] エラーハンドリング
- [ ] ユニット・統合テスト

## 技術要件

### 依存関係
- Aptos SDK (`@aptos-labs/ts-sdk`)
- Chart.js または Recharts (グラフ表示)
- date-fns (日時処理)

### パフォーマンス要件
- ガス分析生成: <500ms
- UI描画: <200ms
- メモリ使用量: <50MB

### エラーハンドリング
- API呼び出し失敗時のフォールバック
- 不完全なデータでの部分表示
- ユーザーフレンドリーなエラーメッセージ