# 状態フォーク機能実装計画

## 概要
状態フォーク作成・取得・変更機能および「what-if」分岐比較UIの実装計画。

## 実装対象機能

### 1. 状態フォーク作成・管理

**要件**: `docs/api-specification.md` 4.x, `docs/advanced-features-requirements.md` 3.1

#### 実装内容

##### 状態フォーク管理
- **ファイル**: `web/src/lib/state-fork-manager.ts`

```typescript
interface StateFork {
  id: string;
  name: string;
  description: string;
  baseBlockHeight: number;
  createdAt: Date;
  modifications: StateModification[];
  metadata: {
    network: 'devnet' | 'testnet' | 'mainnet';
    creator: string;
    tags: string[];
  };
}

interface StateModification {
  address: string;
  resourceType: string;
  action: 'create' | 'modify' | 'delete';
  beforeValue?: any;
  afterValue?: any;
  timestamp: Date;
}

class StateForkManager {
  async createFork(
    baseState: AccountState,
    name: string,
    description: string
  ): Promise<StateFork>;
  
  async cloneFork(forkId: string, newName: string): Promise<StateFork>;
  async deleteFork(forkId: string): Promise<void>;
  async listForks(): Promise<StateFork[]>;
  async getForkById(forkId: string): Promise<StateFork>;
}
```

##### 状態変更適用
- **ファイル**: `web/src/lib/state-modifier.ts`

```typescript
class StateModifier {
  async applyModification(
    fork: StateFork,
    modification: StateModification
  ): Promise<StateFork>;
  
  async revertModification(
    fork: StateFork,
    modificationId: string
  ): Promise<StateFork>;
  
  async createAccountWithBalance(
    fork: StateFork,
    address: string,
    balance: number
  ): Promise<StateFork>;
  
  async modifyResource(
    fork: StateFork,
    address: string,
    resourceType: string,
    newValue: any
  ): Promise<StateFork>;
}
```

### 2. What-if シナリオ分析

#### 実装内容
- **ファイル**: `web/src/lib/scenario-analyzer.ts`

```typescript
interface WhatIfScenario {
  id: string;
  name: string;
  baseFork: StateFork;
  variants: ScenarioVariant[];
  comparisonResults?: ComparisonResult;
}

interface ScenarioVariant {
  id: string;
  name: string;
  modifications: StateModification[];
  transactions: Transaction[];
  results?: SimulationResult;
}

interface ComparisonResult {
  gasUsageComparison: Map<string, number>;
  outcomeComparison: OutcomeComparison[];
  riskAssessment: RiskAssessment;
  recommendations: string[];
}

class ScenarioAnalyzer {
  async createScenario(
    name: string,
    baseFork: StateFork,
    variants: ScenarioVariant[]
  ): Promise<WhatIfScenario>;
  
  async runScenarioComparison(
    scenario: WhatIfScenario
  ): Promise<ComparisonResult>;
  
  async addVariant(
    scenarioId: string,
    variant: ScenarioVariant
  ): Promise<WhatIfScenario>;
}
```

### 3. フォーク上でのシミュレーション実行

#### 実装内容
- **ファイル**: `web/src/lib/fork-simulator.ts`

```typescript
class ForkSimulator {
  async simulateOnFork(
    fork: StateFork,
    transaction: Transaction
  ): Promise<ForkSimulationResult>;
  
  async batchSimulateOnFork(
    fork: StateFork,
    transactions: Transaction[]
  ): Promise<BatchForkSimulationResult>;
  
  async compareForkResults(
    baseFork: StateFork,
    modifiedFork: StateFork,
    transaction: Transaction
  ): Promise<ForkComparisonResult>;
}

interface ForkSimulationResult extends SimulationResult {
  forkId: string;
  forkModifications: StateModification[];
  additionalStateChanges: StateChange[];
}

interface ForkComparisonResult {
  baseResult: ForkSimulationResult;
  modifiedResult: ForkSimulationResult;
  differences: {
    gasUsage: number;
    outcomes: OutcomeDifference[];
    stateChanges: StateChangeDifference[];
  };
}
```

## UI実装

### 1. フォーク管理UI
- **ファイル**: `web/src/components/fork/ForkManager.tsx`

#### 機能
- フォーク一覧表示
- 新規フォーク作成
- フォークのクローン・削除
- フォーク詳細情報表示

### 2. 状態編集UI
- **ファイル**: `web/src/components/fork/StateEditor.tsx`

#### 機能
- アカウント残高の編集
- リソース値の変更
- 新規アカウント作成
- 変更履歴の表示・undo/redo

### 3. What-ifシナリオUI
- **ファイル**: `web/src/components/fork/ScenarioBuilder.tsx`

#### 機能
- シナリオの作成・管理
- バリアント追加・編集
- 比較結果の可視化
- リスク評価の表示

### 4. フォーク比較ビューア
- **ファイル**: `web/src/components/fork/ForkComparison.tsx`

#### 機能
- サイドバイサイド比較表示
- 差分のハイライト
- ガス使用量の比較グラフ
- 結果の統計分析

## データ永続化

### ローカルストレージ
```typescript
// web/src/stores/forkStore.ts
interface ForkStore {
  forks: Map<string, StateFork>;
  scenarios: Map<string, WhatIfScenario>;
  activeForksimulatorId: string | null;
  
  createFork: (fork: StateFork) => void;
  updateFork: (forkId: string, updates: Partial<StateFork>) => void;
  deleteFork: (forkId: string) => void;
  
  createScenario: (scenario: WhatIfScenario) => void;
  updateScenario: (scenarioId: string, updates: Partial<WhatIfScenario>) => void;
  
  setActiveFork: (forkId: string | null) => void;
}
```

### IndexedDB統合
```typescript
// web/src/lib/fork-storage.ts
class ForkStorage {
  async saveFork(fork: StateFork): Promise<void>;
  async loadFork(forkId: string): Promise<StateFork>;
  async loadAllForks(): Promise<StateFork[]>;
  async deleteFork(forkId: string): Promise<void>;
  
  async saveScenario(scenario: WhatIfScenario): Promise<void>;
  async loadScenario(scenarioId: string): Promise<WhatIfScenario>;
}
```

## 高度な機能

### 1. フォークのマージ機能
```typescript
interface ForkMerger {
  async analyzeMergeConflicts(
    sourceFork: StateFork,
    targetFork: StateFork
  ): Promise<MergeConflict[]>;
  
  async mergeForks(
    sourceFork: StateFork,
    targetFork: StateFork,
    resolutions: ConflictResolution[]
  ): Promise<StateFork>;
}
```

### 2. 自動最適化シナリオ生成
```typescript
interface AutoScenarioGenerator {
  async generateOptimizationScenarios(
    baseFork: StateFork,
    transaction: Transaction
  ): Promise<ScenarioVariant[]>;
  
  async suggestStateModifications(
    fork: StateFork,
    goal: OptimizationGoal
  ): Promise<StateModification[]>;
}
```

### 3. 履歴管理・タイムトラベル
```typescript
interface ForkHistory {
  async saveSnapshot(fork: StateFork): Promise<string>;
  async revertToSnapshot(forkId: string, snapshotId: string): Promise<StateFork>;
  async getHistory(forkId: string): Promise<ForkSnapshot[]>;
}
```

## テスト実装

### ユニットテスト
- **ファイル**: `web/src/lib/__tests__/state-fork.test.ts`
- **カバレッジ**:
  - フォーク作成・管理
  - 状態変更適用
  - シナリオ分析

### 統合テスト
- **ファイル**: `web/src/components/__tests__/fork-ui.test.tsx`
- **テスト内容**:
  - フォーク管理UI
  - 状態編集操作
  - シナリオ比較表示

## パフォーマンス最適化

### メモリ効率
- 大きな状態データの遅延ロード
- 不要なフォークデータのガベージコレクション
- 効率的な差分計算アルゴリズム

### 計算効率  
- WebWorkerでの重い比較処理
- 状態変更の増分計算
- キャッシュによる重複計算の回避

## セキュリティ考慮事項

### データ保護
- フォークデータの暗号化保存
- 機密情報のマスキング
- アクセス権限の管理

### 分離性
- フォーク間の完全分離
- サンドボックス実行環境
- 意図しない状態変更の防止

## 実装スケジュール

**Week 1**: 基本フォーク管理・状態変更  
**Week 2**: What-ifシナリオ・比較機能  
**Week 3**: UI実装・フォーク管理画面  
**Week 4**: シナリオビルダー・比較ビューア  
**Week 5**: 高度機能・履歴管理  
**Week 6**: テスト・最適化・セキュリティ

## 依存関係
- Immer（不変状態管理）
- IndexedDB（ローカルデータ永続化）
- React Flow（フォーク関係図の可視化）