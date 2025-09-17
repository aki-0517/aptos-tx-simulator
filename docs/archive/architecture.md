# Aptosトランザクションシミュレーター - 技術アーキテクチャ

## 1. システム概要

### 1.1 アーキテクチャ図
```
┌─────────────────────────────────────┐
│           ユーザー                    │
└─────────────────┬───────────────────┘
                  │
         ┌─────────────────┐
         │  Next.js Web App │
         │   (TypeScript)   │
         └─────────┬───────┘
                   │
          ┌─────────────────┐
          │ Simulation Layer │
          │  (Client-side)   │
          └─────────┬───────┘
                    │
           ┌─────────────────┐
           │   Aptos SDK     │
           │  (TypeScript)   │
           └─────────┬───────┘
                     │
            ┌─────────────────┐
            │  Aptos Network  │
            │   (RPC Node)    │
            └─────────────────┘
```

### 1.2 コアコンポーネント

#### フロントエンド層
- **Webアプリケーション**: Next.js + TypeScript
- **状態管理**: Zustand + SWR
- **UIコンポーネント**: shadcn/ui + Tailwind CSS

#### シミュレーション層
- **Aptosクライアント**: TypeScript SDK統合
- **トランザクションシミュレーター**: クライアントサイド実行
- **ガス計算機**: 正確なガス推定エンジン

#### データ層
- **Aptos RPC**: リアルタイムブロックチェーンデータアクセス
- **ローカルストレージ**: ユーザー設定とセッション管理

## 2. コンポーネントアーキテクチャ

### 2.1 Next.jsアプリケーション構造
```
src/
├── app/                    # App Router
│   ├── globals.css
│   ├── layout.tsx
│   ├── page.tsx
│   ├── simulator/
│   │   ├── page.tsx
│   │   └── components/
│   └── debug/
│       ├── page.tsx
│       └── components/
├── components/
│   ├── ui/                 # shadcn/ui components
│   ├── simulation/
│   │   ├── TransactionBuilder.tsx
│   │   ├── SimulationRunner.tsx
│   │   └── ResultViewer.tsx
│   ├── debugging/
│   │   ├── TraceViewer.tsx
│   │   ├── StateInspector.tsx
│   │   └── ErrorAnalyzer.tsx
│   └── common/
│       ├── Header.tsx
│       ├── Footer.tsx
│       └── Navigation.tsx
├── hooks/
│   ├── useAptosClient.ts
│   ├── useSimulation.ts
│   └── useWallet.ts
├── lib/
│   ├── aptos.ts
│   ├── simulation.ts
│   └── utils.ts
├── stores/
│   ├── simulationStore.ts
│   └── userStore.ts
├── types/
│   ├── simulation.ts
│   ├── aptos.ts
│   └── index.ts
└── utils/
    ├── formatters.ts
    ├── validators.ts
    └── constants.ts
```

### 2.2 状態管理
- **Zustand**: メインの状態管理
- **SWR**: サーバー状態管理とキャッシング
- **ローカルストレージ**: 永続的なユーザー設定

### 2.3 主要フロントエンドコンポーネント
- **トランザクションビルダー**: フォームベースのトランザクション構築
- **シミュレーションランナー**: シミュレーションの実行と結果表示
- **デバッグビューアー**: ステップバイステップの実行分析
- **状態インスペクター**: リソースとアカウント状態の視覚化

## 3. データフロー

### 3.1 シミュレーションリクエストフロー
```
1. ユーザーがトランザクション送信 → Next.jsフロントエンド
2. フロントエンドで入力検証 → クライアントサイドバリデーション
3. Aptos SDKでシミュレーション実行 → ローカル処理
4. Aptos RPCノードから状態取得 → ネットワーク通信
5. Move VM実行 → クライアントサイド
6. 結果をユーザーに表示 → リアルタイム更新
```

### 3.2 状態管理フロー
```
1. ユーザー操作 → Zustandストア更新
2. シミュレーション状態 → ローカル状態管理
3. Aptos RPCクエリ → SWRキャッシング
4. 結果表示 → リアクティブUI更新
```

## 4. 技術スタック

### 4.1 フロントエンドスタック
- **フレームワーク**: Next.js 15+ (App Router) + TypeScript
- **スタイリング**: Tailwind CSS + shadcn/ui
- **状態管理**: Zustand + SWR
- **テスト**: Vitest + React Testing Library
- **デプロイ**: Vercel

### 4.2 ブロックチェーン統合
- **SDK**: Aptos TypeScript SDK
- **ウォレット**: Aptos Wallet Adapter
- **ネットワーク**: Aptos Mainnet/Testnet/Devnet

### 4.3 開発ツール
- **バンドラー**: Next.js内蔵（Turbopack）
- **リンター**: ESLint + Prettier
- **型チェック**: TypeScript strict mode
- **CI/CD**: GitHub Actions

## 7. 開発ワークフロー

### 7.1 ローカル開発
```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# テストの実行
npm run test

# 型チェック
npm run type-check

# リンターの実行
npm run lint
```

### 7.2 テスト戦略
- **単体テスト**: 個別コンポーネントのテスト
- **統合テスト**: Aptos SDK統合のテスト
- **E2Eテスト**: Playwrightでのユーザーワークフローテスト
- **パフォーマンステスト**: Lighthouseでの性能検証

## 8. エラーハンドリング・回復性

### 8.1 エラー分類
- **ユーザーエラー**: 無効な入力検証
- **ネットワークエラー**: Aptos RPC接続障害
- **シミュレーションエラー**: Move VM実行失敗
- **ウォレットエラー**: ウォレット接続問題

### 8.2 リトライメカニズム
- **指数バックオフ**: 一時的障害に対する再試行
- **フォールバック**: RPCエンドポイントの切り替え
- **グレースフルデグラデーション**: 機能縮退による継続
- **ユーザーフィードバック**: わかりやすいエラーメッセージ

### 8.3 監視・アラート
- **エラー率監視**: リアルタイムエラートラッキング
- **パフォーマンス監視**: レスポンス時間追跡
- **ユーザビリティ監視**: Core Web Vitals
- **ビジネスメトリクス**: シミュレーション成功率