# トランザクション種別実装計画

## 概要
現在未実装の3つのトランザクション種別のシミュレーション機能実装計画。

## 実装対象機能

### 1. Script トランザクションのシミュレーション

**現状**: `web/src/lib/simulator.ts`で例外処理のみ  
**要件**: `docs/mvp-requirements.md` 2.1.1

#### 実装内容
- **ファイル**: `web/src/lib/simulator.ts`
- **関数**: `simulateScriptTransaction()`
- **入力パラメータ**:
  - `scriptCode: string` (Move bytecode)
  - `typeArgs: string[]`
  - `functionArgs: any[]`
  - `senderAddress: string`

#### 実装手順
1. Aptos SDK の `aptos.transaction.simulate.script()` API を使用
2. Script bytecode の検証処理を追加
3. 型引数・関数引数の型安全性チェック
4. エラーハンドリング（無効なスクリプト、型不一致など）

#### UIコンポーネント
- **ファイル**: `web/src/components/simulation/ScriptSimulator.tsx`
- **機能**:
  - Script code入力エリア（syntax highlighting付き）
  - 型引数・関数引数の動的フォーム
  - バイトコードのバリデーション表示

### 2. バッチシミュレーション

**要件**: `docs/transaction-simulation-guide.md` 4.2, `docs/api-specification.md` 3.2

#### 実装内容
- **ファイル**: `web/src/lib/simulator.ts`
- **関数**: `simulateBatchTransactions()`
- **入力パラメータ**:
  - `transactions: Transaction[]`
  - `executeSequentially: boolean`

#### 実装手順
1. 複数トランザクションの順次/並列シミュレーション
2. 依存関係の解析（状態変更の影響範囲）
3. 全体のガス使用量計算
4. 部分失敗時の状態ロールバック処理

#### UIコンポーネント
- **ファイル**: `web/src/components/simulation/BatchSimulator.tsx`
- **機能**:
  - トランザクション追加/削除UI
  - 実行順序の可視化
  - 依存関係グラフ表示

### 3. スポンサード（fee payer）トランザクション

**要件**: `docs/transaction-simulation-guide.md` 4.3

#### 実装内容
- **ファイル**: `web/src/lib/simulator.ts`
- **関数**: `simulateSponsoredTransaction()`
- **入力パラメータ**:
  - `transaction: Transaction`
  - `sponsorAddress: string`
  - `senderAddress: string`

#### 実装手順
1. スポンサーアカウントの残高確認
2. 手数料分担の計算
3. 通常トランザクションとの比較分析
4. スポンサー条件の検証

#### UIコンポーネント
- **ファイル**: `web/src/components/simulation/SponsoredSimulator.tsx`
- **機能**:
  - スポンサーアドレス選択
  - コスト比較表示
  - スポンサー条件設定

## 共通実装事項

### エラーハンドリング強化
```typescript
enum TransactionError {
  INVALID_SCRIPT_CODE = 'invalid_script_code',
  TYPE_MISMATCH = 'type_mismatch',
  INSUFFICIENT_BALANCE = 'insufficient_balance',
  BATCH_DEPENDENCY_ERROR = 'batch_dependency_error'
}
```

### 型定義追加
```typescript
interface ScriptTransaction {
  type: 'script';
  code: string;
  typeArgs: string[];
  functionArgs: any[];
}

interface BatchTransaction {
  type: 'batch';
  transactions: Transaction[];
  executeSequentially: boolean;
}

interface SponsoredTransaction {
  type: 'sponsored';
  transaction: Transaction;
  sponsor: string;
  sender: string;
}
```

## テスト実装

### ユニットテスト
- **ファイル**: `web/src/lib/__tests__/transaction-types.test.ts`
- **カバレッジ**:
  - 各トランザクション種別の正常・異常パターン
  - エラーハンドリングの網羅
  - ガス計算の精度検証

### 統合テスト  
- **ファイル**: `web/src/components/__tests__/simulators.test.tsx`
- **テスト内容**:
  - UI操作フローのE2E
  - 各種入力パターンでの動作確認

## 実装スケジュール

**Week 1**: Script トランザクション実装  
**Week 2**: バッチシミュレーション実装  
**Week 3**: スポンサードトランザクション実装  
**Week 4**: テスト・バグ修正・UI改善