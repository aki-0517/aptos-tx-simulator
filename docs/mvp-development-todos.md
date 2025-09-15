# Aptosトランザクションシミュレーター - MVP開発TODO

## 概要

このドキュメントは、MVPの開発を進めるための詳細なTODOリストと実装ガイドです。タスクは優先度と依存関係に基づいて整理されており、効率的な開発進行を可能にします。

## 開発フェーズ構成

### フェーズ1: プロジェクト基盤構築 (週1-2)
### フェーズ2: コア機能実装 (週3-5) 
### フェーズ3: UI/UX完成 (週6-7)
### フェーズ4: テスト・デプロイ (週8)

---

## フェーズ1: プロジェクト基盤構築 (週1-2)

### 1.1 プロジェクト初期化

#### TODO-001: Next.jsプロジェクトセットアップ
- **優先度**: 高
- **工数**: 0.5日
- **担当**: Lead Developer
- **依存関係**: なし

**タスク詳細:**
```bash
# プロジェクト作成
npx create-next-app@latest aptos-tx-simulator --typescript --tailwind --eslint --app --src-dir

# 基本パッケージインストール
npm install @aptos-labs/ts-sdk @aptos-labs/wallet-adapter-react
npm install zustand @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install lucide-react next-themes

# 開発用パッケージ
npm install -D @types/node
```

**完了条件:**
- [x] Next.js 15プロジェクトが起動する
- [x] TypeScript設定が正しく動作する
- [x] Tailwind CSSが適用される

#### TODO-002: プロジェクト構造設定
- **優先度**: 高
- **工数**: 0.5日
- **担当**: Lead Developer
- **依存関係**: TODO-001

**タスク詳細:**
```
src/
├── app/
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   └── simulator/
│       └── page.tsx
├── components/
│   ├── ui/           # shadcn/ui components
│   ├── wallet/       # ウォレット関連
│   ├── simulator/    # シミュレーション関連
│   └── layout/       # レイアウト関連
├── lib/
│   ├── aptos.ts      # Aptos SDK設定
│   ├── utils.ts      # ユーティリティ
│   └── types.ts      # 型定義
├── hooks/
│   ├── useAptos.ts
│   ├── useWallet.ts
│   └── useSimulation.ts
└── stores/
    ├── walletStore.ts
    └── simulationStore.ts
```

**完了条件:**
- [x] ディレクトリ構造が作成される
- [x] 基本的なファイルが配置される
- [x] importパスが正しく設定される

#### TODO-003: 開発環境設定
- **優先度**: 高
- **工数**: 1日
- **担当**: Lead Developer
- **依存関係**: TODO-002

**タスク詳細:**
- ESLint・Prettierルール設定
- VS Code設定ファイル作成
- Git設定（.gitignore、コミットフック）
- 環境変数設定（.env.example）

**設定ファイル例:**
```json
// .vscode/settings.json
{
  "typescript.preferences.importModuleSpecifier": "relative",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "editor.formatOnSave": true
}
```

**完了条件:**
- [x] リンター・フォーマッターが動作する
- [x] VS Code設定が適用される
- [x] Git設定が完了する

### 1.2 shadcn/ui セットアップ

#### TODO-004: UI コンポーネント基盤構築
- **優先度**: 高  
- **工数**: 1日
- **担当**: Frontend Developer
- **依存関係**: TODO-003

**タスク詳細:**
```bash
# shadcn/ui初期化
npx shadcn-ui@latest init

# 必要なコンポーネント追加
npx shadcn-ui@latest add button
npx shadcn-ui@latest add input
npx shadcn-ui@latest add card
npx shadcn-ui@latest add select
npx shadcn-ui@latest add textarea
npx shadcn-ui@latest add alert
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add tabs
npx shadcn-ui@latest add form
npx shadcn-ui@latest add toast
```

**完了条件:**
- [x] shadcn/uiが正しく設定される
- [x] 基本コンポーネントが利用可能
- [x] テーマ設定が適用される

### 1.3 Aptos SDK統合基盤

#### TODO-005: Aptos SDK基本設定
- **優先度**: 高
- **工数**: 1日
- **担当**: Blockchain Developer
- **依存関係**: TODO-004

**実装内容:**
```typescript
// lib/aptos.ts
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

export const NETWORKS = {
  DEVNET: 'https://fullnode.devnet.aptoslabs.com/v1',
  TESTNET: 'https://fullnode.testnet.aptoslabs.com/v1',
} as const;

export function createAptosClient(network: keyof typeof NETWORKS) {
  const config = new AptosConfig({
    network: network === 'DEVNET' ? Network.DEVNET : Network.TESTNET,
  });
  return new Aptos(config);
}
```

**完了条件:**
- [x] Aptos クライアントが初期化される
- [x] ネットワーク切り替えが動作する
- [x] 基本的なクエリが実行できる

#### TODO-006: ウォレット統合基盤
- **優先度**: 高
- **工数**: 1.5日
- **担当**: Blockchain Developer  
- **依存関係**: TODO-005

**実装内容:**
```typescript
// providers/WalletProvider.tsx
import { AptosWalletAdapterProvider } from '@aptos-labs/wallet-adapter-react';
import { Network } from '@aptos-labs/ts-sdk';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{
        network: Network.DEVNET,
      }}
      onError={(error) => {
        console.error('Wallet error:', error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

**完了条件:**
- [x] Petraウォレット接続が動作する
- [x] アカウント情報が取得できる
- [x] ネットワーク状態が確認できる

---

## フェーズ2: コア機能実装 (週3-5)

### 2.1 シミュレーションエンジン

#### TODO-007: 基本シミュレーション実装
- **優先度**: 最高
- **工数**: 3日
- **担当**: Blockchain Developer
- **依存関係**: TODO-006

**実装内容:**
```typescript
// lib/simulator.ts
export class AptosSimulator {
  constructor(private aptos: Aptos) {}

  async simulateTransaction(params: SimulationParams): Promise<SimulationResult> {
    try {
      const transaction = await this.buildTransaction(params);
      const [result] = await this.aptos.transaction.simulate.simple({
        signerPublicKey: params.signerPublicKey,
        transaction,
      });

      return {
        success: result.success,
        gasUsed: parseInt(result.gas_used),
        gasUnitPrice: parseInt(result.gas_unit_price || '100'),
        vmStatus: result.vm_status,
        events: result.events || [],
        changes: result.changes || [],
        totalCostOctas: parseInt(result.gas_used) * parseInt(result.gas_unit_price || '100'),
      };
    } catch (error) {
      throw new SimulationError(error.message);
    }
  }
}
```

**完了条件:**
- [x] 基本的なentry function呼び出しがシミュレートできる
- [x] ガス使用量が正確に計算される
- [x] エラーが適切にハンドリングされる

#### TODO-008: ガス推定機能
- **優先度**: 最高
- **工数**: 2日
- **担当**: Blockchain Developer
- **依存関係**: TODO-007

**実装内容:**
```typescript
// lib/gas-estimator.ts
export class GasEstimator {
  calculateTotalCost(gasUsed: number, gasUnitPrice: number): GasCost {
    const totalOctas = gasUsed * gasUnitPrice;
    const totalAPT = totalOctas / 100_000_000;
    
    return {
      gasUsed,
      gasUnitPrice,
      totalOctas,
      totalAPT,
      usdEstimate: totalAPT * this.getAPTPrice(), // 実装は簡略化
    };
  }

  suggestOptimalGasPrice(networkCondition: NetworkCondition): number {
    // ネットワーク状況に基づく最適ガス価格提案
    return 100; // MVP版は固定値
  }
}
```

**完了条件:**
- [x] ガス使用量がoctas/APT両方で表示される
- [x] USD換算が概算で表示される
- [x] 最適ガス価格が提案される

#### TODO-009: エラー分析機能
- **優先度**: 高
- **工数**: 2日
- **担当**: Blockchain Developer
- **依存関係**: TODO-008

**実装内容:**
```typescript
// lib/error-analyzer.ts
export class ErrorAnalyzer {
  analyzeVMError(vmStatus: string): ErrorAnalysis {
    const commonErrors = {
      'INSUFFICIENT_BALANCE': {
        type: 'balance',
        severity: 'error',
        message: '残高が不足しています',
        suggestion: 'アカウントに十分なAPTがあることを確認してください',
      },
      'OUT_OF_GAS': {
        type: 'gas',
        severity: 'error', 
        message: 'ガス制限を超過しました',
        suggestion: 'maxGasAmountを増やしてください',
      },
      // その他のエラーパターン
    };

    return this.matchErrorPattern(vmStatus, commonErrors);
  }
}
```

**完了条件:**
- [x] 主要なVMエラーが分類される
- [x] わかりやすいエラーメッセージが生成される
- [x] 解決提案が表示される

### 2.2 状態管理実装

#### TODO-010: Zustand ストア実装
- **優先度**: 高
- **工数**: 1.5日
- **担当**: Frontend Developer
- **依存関係**: TODO-006

**実装内容:**
```typescript
// stores/simulationStore.ts
interface SimulationState {
  isSimulating: boolean;
  result: SimulationResult | null;
  error: string | null;
  history: SimulationResult[];
  
  setSimulating: (loading: boolean) => void;
  setResult: (result: SimulationResult) => void;
  setError: (error: string) => void;
  addToHistory: (result: SimulationResult) => void;
  clearSimulation: () => void;
}

export const useSimulationStore = create<SimulationState>((set, get) => ({
  // 実装詳細
}));
```

**完了条件:**
- [x] シミュレーション状態が管理される
- [x] 結果履歴が保存される
- [x] エラー状態が適切に処理される

#### TODO-011: ウォレット状態管理
- **優先度**: 高
- **工数**: 1日
- **担当**: Frontend Developer
- **依存関係**: TODO-010

**実装内容:**
```typescript
// stores/walletStore.ts
interface WalletState {
  isConnected: boolean;
  address: string | null;
  balance: number | null;
  network: string;
  
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
}
```

**完了条件:**
- [x] ウォレット接続状態が管理される
- [x] アカウント残高が取得される
- [x] ネットワーク切り替えが動作する

---

## フェーズ3: UI/UX完成 (週6-7)

### 3.1 メインUIコンポーネント

#### TODO-012: トランザクションビルダー
- **優先度**: 最高
- **工数**: 3日
- **担当**: Frontend Developer
- **依存関係**: TODO-011

**実装コンポーネント:**
```typescript
// components/simulator/TransactionBuilder.tsx
export function TransactionBuilder() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>トランザクション構築</CardTitle>
      </CardHeader>
      <CardContent>
        <FunctionSelector />
        <ArgumentsInput />
        <GasSettings />
        <SimulateButton />
      </CardContent>
    </Card>
  );
}
```

**機能詳細:**
- 関数選択ドロップダウン
- 引数入力フォーム（型検証付き）
- ガス設定（上級者向け）
- シミュレーション実行ボタン

**完了条件:**
- [x] 直感的な関数選択UI
- [x] 型安全な引数入力
- [x] リアルタイムバリデーション

#### TODO-013: 結果表示コンポーネント
- **優先度**: 最高
- **工数**: 2日
- **担当**: Frontend Developer
- **依存関係**: TODO-012

**実装コンポーネント:**
```typescript
// components/simulator/SimulationResult.tsx
export function SimulationResult({ result }: { result: SimulationResult }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          シミュレーション結果
          <Badge variant={result.success ? "success" : "destructive"}>
            {result.success ? "成功" : "失敗"}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <GasUsageDisplay gas={result.gasUsed} />
        <CostBreakdown cost={result.totalCostOctas} />
        <EventsList events={result.events} />
        {!result.success && <ErrorDetails error={result.vmStatus} />}
      </CardContent>
    </Card>
  );
}
```

**完了条件:**
- [x] 成功/失敗が明確に表示される
- [x] ガス使用量が詳細表示される
- [x] エラー時に原因と解決策が表示される

#### TODO-014: ウォレット接続UI
- **優先度**: 高
- **工数**: 1.5日
- **担当**: Frontend Developer
- **依存関係**: TODO-011

**実装内容:**
- ウォレット接続ボタン
- アカウント情報表示
- ネットワーク状態インジケーター
- 残高表示

**完了条件:**
- [x] ワンクリックでウォレット接続
- [x] 接続状態が視覚的に分かる
- [x] アカウント情報が整理されて表示

### 3.2 レイアウト・ナビゲーション

#### TODO-015: メインレイアウト実装
- **優先度**: 中
- **工数**: 1日
- **担当**: Frontend Developer
- **依存関係**: TODO-014

**実装内容:**
```typescript
// components/layout/MainLayout.tsx
export function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto py-6">
        {children}
      </main>
      <Footer />
    </div>
  );
}
```

**完了条件:**
- [x] レスポンシブレイアウト
- [x] 一貫したデザインシステム
- [x] アクセシビリティ対応

#### TODO-016: ナビゲーション実装
- **優先度**: 中
- **工数**: 1日
- **担当**: Frontend Developer
- **依存関係**: TODO-015

**実装内容:**
- ヘッダーナビゲーション
- ページ間遷移
- アクティブ状態表示

**完了条件:**
- [x] 直感的なナビゲーション
- [x] 現在位置が分かる
- [x] モバイル対応

---

## フェーズ4: テスト・デプロイ (週8)

### 4.1 テスト実装

#### TODO-017: 単体テスト実装
- **優先度**: 高
- **工数**: 2日
- **担当**: Lead Developer
- **依存関係**: TODO-016

**テスト範囲:**
```typescript
// __tests__/simulator.test.ts
describe('AptosSimulator', () => {
  test('basic coin transfer simulation', async () => {
    // テスト実装
  });
  
  test('gas estimation accuracy', async () => {
    // テスト実装
  });
  
  test('error handling', async () => {
    // テスト実装
  });
});
```

**完了条件:**
- [x] コア機能の単体テスト > 80%カバレッジ
- [x] エラーケースのテスト
- [x] CI/CDでの自動実行

#### TODO-018: 統合テスト実装
- **優先度**: 中
- **工数**: 1.5日
- **担当**: QA Engineer
- **依存関係**: TODO-017

**テスト内容:**
- ウォレット接続フロー
- エンドツーエンドシミュレーション
- ネットワーク切り替え

**完了条件:**
- [x] 主要ユーザーフローが正常動作
- [x] 異常系テストが通過
- [x] パフォーマンステスト実施

### 4.2 デプロイメント

#### TODO-019: Vercelデプロイ設定
- **優先度**: 高
- **工数**: 0.5日
- **担当**: DevOps Engineer
- **依存関係**: TODO-018

**設定内容:**
```json
// vercel.json
{
  "framework": "nextjs",
  "buildCommand": "npm run build",
  "outputDirectory": ".next",
  "installCommand": "npm install",
  "env": {
    "NEXT_PUBLIC_APTOS_NETWORK": "devnet"
  }
}
```

**完了条件:**
- [x] 自動デプロイが設定される
- [x] 環境変数が正しく設定される
- [x] カスタムドメイン設定

#### TODO-020: CI/CDパイプライン
- **優先度**: 中
- **工数**: 1日
- **担当**: DevOps Engineer
- **依存関係**: TODO-019

**実装内容:**
```yaml
# .github/workflows/ci.yml
name: CI/CD
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Node.js
        uses: actions/setup-node@v3
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test
      - name: Build
        run: npm run build
```

**完了条件:**
- [x] 自動テスト実行
- [x] 自動デプロイ
- [x] ブランチ保護設定

---

## 開発支援TODO

### ドキュメント関連

#### TODO-021: README作成
- **優先度**: 中
- **工数**: 0.5日
- **担当**: Lead Developer

**内容:**
- プロジェクト概要
- インストール手順
- 使用方法
- 開発者向けガイド

#### TODO-022: API ドキュメント
- **優先度**: 低
- **工数**: 1日
- **担当**: Technical Writer

**内容:**
- 関数・クラスの詳細説明
- 使用例
- トラブルシューティング

### 品質保証

#### TODO-023: コードレビュー体制
- **優先度**: 中
- **工数**: 0.5日
- **担当**: Lead Developer

**実装内容:**
- プルリクエストテンプレート
- レビューチェックリスト
- コーディング規約

#### TODO-024: パフォーマンス最適化
- **優先度**: 低
- **工数**: 1日
- **担当**: Performance Engineer

**実装内容:**
- バンドルサイズ最適化
- 遅延読み込み実装
- キャッシュ戦略

---

## 緊急時対応TODO

### セキュリティ関連

#### TODO-025: セキュリティ監査
- **優先度**: 高
- **工数**: 1日
- **担当**: Security Engineer

**チェック項目:**
- XSS脆弱性
- 入力検証
- 依存関係の脆弱性

### バックアップ計画

#### TODO-026: 障害対応手順
- **優先度**: 中
- **工数**: 0.5日
- **担当**: DevOps Engineer

**実装内容:**
- ロールバック手順
- 障害時連絡先
- 復旧手順書

---

## 進捗管理

### 完了基準チェックリスト

各TODOの完了時に以下を確認：
- [ ] 機能要件を満たしている
- [ ] テストが通過している
- [ ] コードレビューが完了している
- [ ] ドキュメントが更新されている

### リスク管理

**高リスク項目:**
- TODO-007: シミュレーション実装（技術的難易度）
- TODO-006: ウォレット統合（外部依存）
- TODO-019: デプロイ設定（インフラ）

**リスク軽減策:**
- 早期プロトタイプ作成
- 外部依存の代替案準備
- 段階的デプロイ実施

このTODOリストに従って開発を進めることで、8週間でのMVP完成を目指します。