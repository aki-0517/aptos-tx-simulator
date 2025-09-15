# Move VM実行可視化実装計画

## 概要
Move VM実行トレースの取得・可視化および詳細ガス分析の実装計画。

## 実装対象機能

### 1. Move VM実行トレース取得・可視化

**要件**: `docs/transaction-simulation-guide.md` 3.2, 4.1, 5.1, `docs/api-specification.md` 5.1

#### 実装内容

##### バックエンド処理
- **ファイル**: `web/src/lib/vm-trace.ts`
- **主要関数**: `getExecutionTrace()`, `parseVMTrace()`

```typescript
interface VMExecutionTrace {
  instructions: VMInstruction[];
  stackStates: StackState[];
  gasUsage: GasUsageStep[];
  moduleLoads: ModuleLoad[];
  resourceAccesses: ResourceAccess[];
}

interface VMInstruction {
  opcode: string;
  operands: any[];
  stackBefore: any[];
  stackAfter: any[];
  gasConsumed: number;
  timestamp: number;
}
```

##### フロントエンド可視化
- **ファイル**: `web/src/components/debugging/TraceViewer.tsx`
- **機能**:
  - 実行ステップのタイムライン表示
  - スタック状態の可視化
  - 命令単位でのガス消費グラフ
  - モジュール間の呼び出し関係図

#### 実装手順
1. Aptos SDK の tracing API を使用してVMトレースを取得
2. トレースデータのパース・構造化処理
3. React コンポーネントでのインタラクティブ表示
4. ステップ実行・ブレークポイント機能

### 2. 詳細ガスブレークダウン

**要件**: `docs/transaction-simulation-guide.md` 3.1, 4.1, `docs/api-specification.md` 6.1

#### ガス分類体系
```typescript
interface DetailedGasBreakdown {
  intrinsic: {
    signature_verification: number;
    transaction_size: number;
    prologue_execution: number;
  };
  execution: {
    bytecode_instruction: number;
    function_call_overhead: number;
    move_value_operations: number;
  };
  io: {
    storage_read: number;
    storage_write: number;
    event_emission: number;
  };
  storage: {
    state_item_creation: number;
    state_item_modification: number;
    state_item_deletion: number;
  };
}
```

#### 実装内容
- **ファイル**: `web/src/lib/gas-analyzer.ts`
- **主要関数**: `analyzeDetailedGas()`, `categorizeGasUsage()`

##### UI コンポーネント
- **ファイル**: `web/src/components/simulation/GasBreakdownViewer.tsx`
- **機能**:
  - 円グラフでのガス使用量可視化
  - カテゴリ別の詳細内訳表示
  - ガス効率の評価・改善提案

### 3. 状態変更の詳細分析

**要件**: `docs/transaction-simulation-guide.md` 5.2, `docs/api-specification.md` 5.3

#### 実装内容
- **ファイル**: `web/src/lib/state-analyzer.ts`

```typescript
interface StateChangeAnalysis {
  beforeState: AccountState;
  afterState: AccountState;
  coinStoreDiff: CoinStoreDiff;
  moduleDiff: ModuleDiff;
  resourceDiff: ResourceDiff[];
}

interface CoinStoreDiff {
  balanceChanges: Map<string, bigint>; // coin type -> amount change
  newCoinTypes: string[];
  removedCoinTypes: string[];
}

interface ResourceDiff {
  resourceType: string;
  action: 'created' | 'modified' | 'deleted';
  beforeValue?: any;
  afterValue?: any;
  fieldChanges?: Map<string, any>;
}
```

##### UI コンポーネント
- **ファイル**: `web/src/components/debugging/StateChangeViewer.tsx`
- **機能**:
  - Before/After状態の比較表示
  - 残高変更のサニーキー図
  - リソース変更のdiffビューア
  - イベントログの構造化表示

### 4. パフォーマンス計測・ベンチマーク

**要件**: `docs/transaction-simulation-guide.md` 6.1

#### 実装内容
- **ファイル**: `web/src/lib/performance-analyzer.ts`

```typescript
interface PerformanceBenchmark {
  transactionHash: string;
  iterations: number;
  measurements: {
    executionTime: number[];
    gasUsage: number[];
    memoryUsage: number[];
  };
  statistics: {
    mean: number;
    median: number;
    stdDev: number;
    percentiles: Map<number, number>;
  };
}
```

##### UI コンポーネント
- **ファイル**: `web/src/components/debugging/PerformanceViewer.tsx`
- **機能**:
  - 反復実行の結果グラフ
  - 統計データの表示
  - パフォーマンス回帰の検出

## 技術実装詳細

### Aptos SDK拡張

#### トレース取得APIの実装
```typescript
// web/src/lib/aptos-client.ts
export class ExtendedAptosClient extends AptosClient {
  async simulateWithTrace(
    transaction: AnyTransaction,
    options: SimulationOptions & { enableTrace: boolean }
  ): Promise<SimulationResult & { trace?: VMExecutionTrace }> {
    // Aptos JSON-RPC の simulate_transaction に trace オプションを追加
  }
}
```

### データ構造設計

#### トレースデータストレージ
```typescript
// web/src/stores/traceStore.ts
interface TraceStore {
  currentTrace: VMExecutionTrace | null;
  traceHistory: Map<string, VMExecutionTrace>;
  
  setTrace: (trace: VMExecutionTrace) => void;
  getTraceStep: (stepIndex: number) => VMInstruction;
  analyzeGasUsage: () => DetailedGasBreakdown;
}
```

### パフォーマンス最適化

#### 大量データの効率的表示
- 仮想化スクロール（react-window）
- 遅延ロード
- WebWorkerでの重い計算処理

#### メモ化・キャッシング
- トレース解析結果のキャッシュ
- ガス分析の結果キャッシュ

## テスト実装

### ユニットテスト
- **ファイル**: `web/src/lib/__tests__/vm-trace.test.ts`
- **カバレッジ**:
  - トレースデータパース
  - ガス分析ロジック
  - 状態変更解析

### 統合テスト
- **ファイル**: `web/src/components/__tests__/trace-viewer.test.tsx`
- **テスト内容**:
  - 可視化コンポーネントの描画
  - インタラクティブ操作
  - 大量データでのパフォーマンス

## 実装スケジュール

**Week 1-2**: VMトレース取得・基本可視化  
**Week 3**: 詳細ガスブレークダウン分析  
**Week 4**: 状態変更分析機能  
**Week 5**: パフォーマンス計測・最適化  
**Week 6**: テスト・バグ修正・UI改善

## 依存関係
- 複雑な可視化にはD3.js或いはVisx使用を検討
- 大量データ表示にはReact Windowを使用
- ガス分析計算の一部はWebWorkerで実行