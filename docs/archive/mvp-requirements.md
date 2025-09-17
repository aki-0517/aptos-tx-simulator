# Aptosトランザクションシミュレーター - MVP要件定義

## 概要

このドキュメントは、Aptosトランザクションシミュレーターの最小実行可能プロダクト（MVP）の要件を定義します。フル機能版の基盤となる核心機能に焦点を当て、迅速な市場投入と早期フィードバック収集を目指します。

## 1. MVP目標

### 1.1 ビジネス目標
- **市場検証**: Aptosエコシステムでのトランザクションシミュレーションニーズの確認
- **早期フィードバック**: 開発者コミュニティからの実用性評価
- **技術基盤確立**: フル機能版への発展可能な堅牢なアーキテクチャ構築
- **競争優位性**: Aptos初の包括的シミュレーションツールとしてのポジション確立

### 1.2 ユーザー目標
- **基本シミュレーション**: トランザクション実行前の結果予測
- **ガス推定**: 正確な手数料計算
- **エラー予防**: 失敗要因の事前特定
- **開発効率化**: dApp開発での試行錯誤時間短縮

## 2. MVP機能範囲

### 2.1 含まれる機能（MVP v1.0）

#### 2.1.1 コアシミュレーション
- **基本トランザクションシミュレーション**
  - Entry function呼び出しのシミュレーション
  - Script function実行のシミュレーション
  - 基本的なコイン転送シミュレーション

- **ガス推定**
  - 正確なガス使用量計算
  - 手数料予測（octas → APT変換）
  - ガス価格最適化提案

- **基本エラーハンドリング**
  - VM実行エラーの表示
  - 残高不足エラーの検出
  - シーケンス番号エラーの特定

#### 2.1.2 ユーザーインターフェース
- **トランザクションビルダー**
  - 関数選択UI
  - 引数入力フォーム
  - 型引数指定機能

- **結果表示**
  - シミュレーション成功/失敗ステータス
  - ガス使用量とコスト表示
  - 基本的なエラーメッセージ表示

- **ウォレット連携**
  - Petraウォレット接続
  - アカウント情報表示
  - 基本的なネットワーク切り替え

#### 2.1.3 ネットワーク対応
- **Aptos Devnet**: 開発・テスト用
- **Aptos Testnet**: ステージング環境
- **基本的なRPC接続**: 標準的なクエリ機能

### 2.2 除外される機能（将来版に延期）

#### 2.2.1 高度な分析機能
- Move VM詳細トレース
- 複雑なデバッグ機能
- パフォーマンス最適化提案
- セキュリティ分析

#### 2.2.2 複雑なトランザクション
- マルチシグトランザクション
- スポンサードトランザクション
- バッチトランザクション

#### 2.2.3 高度なUI機能
- 3D可視化
- 詳細ダッシュボード
- カスタムレポート生成

## 3. MVP技術要件

### 3.1 機能要件

#### FR-MVP-001: 基本シミュレーション
- **概要**: Aptosトランザクションの基本シミュレーション実行
- **詳細**: 
  - Entry function呼び出しの事前実行
  - 実行結果（成功/失敗）の表示
  - 基本的なガス計算
- **受け入れ基準**: 
  - 標準的なコイン転送が正しくシミュレートできる
  - カスタムMove関数が実行できる
  - 実行時間 < 3秒

#### FR-MVP-002: ガス推定
- **概要**: 正確なガス使用量と手数料の計算
- **詳細**:
  - ガス使用量の詳細表示
  - octas単位からAPT単位への変換
  - 現在のガス価格での手数料計算
- **受け入れ基準**:
  - 実際の実行結果との誤差 < 5%
  - 計算時間 < 1秒

#### FR-MVP-003: エラー検出
- **概要**: 一般的なトランザクションエラーの事前検出
- **詳細**:
  - 残高不足の検出
  - 無効な関数呼び出しの検出
  - 型不一致エラーの検出
- **受け入れ基準**:
  - 主要エラーの90%以上を事前検出
  - わかりやすいエラーメッセージ表示

#### FR-MVP-004: ウォレット統合
- **概要**: Aptosウォレットとの基本連携
- **詳細**:
  - Petraウォレット接続
  - アカウント残高表示
  - ネットワーク状態確認
- **受け入れ基準**:
  - Petraウォレットと正常に接続
  - アカウント情報が正確に表示

### 3.2 非機能要件

#### NFR-MVP-001: パフォーマンス
- シミュレーション実行時間 < 3秒
- アプリケーション読み込み時間 < 2秒
- 同時ユーザー数: 100人

#### NFR-MVP-002: 可用性
- アップタイム: 95%以上
- ブラウザ対応: Chrome, Firefox, Safari最新版

#### NFR-MVP-003: セキュリティ
- 秘密鍵の一切の保存・送信なし
- HTTPS通信必須
- 基本的な入力検証

## 4. MVP技術スタック

### 4.1 フロントエンド
- **Framework**: Next.js 15 (App Router)
- **言語**: TypeScript 5.x
- **UI Library**: shadcn/ui + Tailwind CSS
- **状態管理**: Zustand
- **ウォレット**: @aptos-labs/wallet-adapter-react

### 4.2 ブロックチェーン統合
- **SDK**: @aptos-labs/ts-sdk (最新版)
- **ネットワーク**: Devnet, Testnet
- **RPC**: 公式Aptos RPCエンドポイント

### 4.3 開発・デプロイ
- **開発環境**: Node.js 20+
- **パッケージマネージャー**: npm
- **デプロイ**: Vercel
- **CI/CD**: GitHub Actions

## 5. MVP ユーザーストーリー

### 5.1 優先度: 高

#### US-MVP-001: 基本シミュレーション
```
As a Aptos developer
I want to simulate a transaction before sending it
So that I can verify it will succeed and estimate gas costs

Given I have a transaction to execute
When I input the transaction details
Then I can see the simulation result and gas estimate
```

#### US-MVP-002: エラー予防
```
As a dApp user
I want to see potential errors before signing a transaction
So that I can avoid failed transactions and lost gas fees

Given I'm about to execute a transaction
When the simulation detects an issue
Then I receive a clear error message with suggestions
```

#### US-MVP-003: ガス最適化
```
As a cost-conscious user
I want to see the exact gas cost of my transaction
So that I can decide whether to proceed or optimize

Given I have prepared a transaction
When I run simulation
Then I see the exact gas cost in both gas units and APT
```

### 5.2 優先度: 中

#### US-MVP-004: ネットワーク切り替え
```
As a developer
I want to test on different networks
So that I can verify my dApp works across environments

Given I'm using the simulator
When I switch between Devnet and Testnet
Then my simulations run correctly on the selected network
```

## 6. MVP成功指標

### 6.1 技術指標
- **機能性**: 全MVP機能が正常動作
- **精度**: シミュレーション精度 > 95%
- **パフォーマンス**: レスポンス時間 < 3秒
- **安定性**: エラー率 < 1%

### 6.2 ユーザー指標
- **初期ユーザー**: 3ヶ月で100人のアクティブユーザー
- **使用頻度**: ユーザーあたり週5回の利用
- **満足度**: フィードバックスコア > 4.0/5.0
- **採用率**: 5つ以上のAptosプロジェクトでの利用

### 6.3 ビジネス指標
- **市場検証**: Aptosコミュニティからの肯定的反応
- **競合優位**: 類似ツールに対する機能・UX優位性
- **成長可能性**: フル機能版への拡張パス確立

## 7. MVP開発制約

### 7.1 技術制約
- **Single-page Application**: バックエンドサーバーなし
- **Client-side Only**: 全処理をブラウザ内で実行
- **Aptos SDK依存**: 公式SDKの機能制限内
- **Network Dependency**: Aptos RPCノードの可用性に依存

### 7.2 リソース制約
- **開発期間**: 8週間以内
- **予算**: 最小限（主にデプロイ・ドメイン費用）
- **開発者**: 1-2名体制
- **ユーザーサポート**: コミュニティベース

### 7.3 機能制約
- **基本機能のみ**: 高度な分析機能は除外
- **限定ウォレット**: Petra対応優先
- **英語UI**: 国際化は後回し
- **デスクトップ優先**: モバイル最適化は最小限

## 8. MVPリスク分析

### 8.1 技術リスク
- **中**: Aptos SDK API変更によるBreaking changes
- **低**: ウォレット統合の技術的問題
- **中**: RPCレート制限による性能問題

### 8.2 市場リスク
- **低**: Aptosエコシステムの成長鈍化
- **中**: 競合ツールの早期出現
- **低**: ユーザーニーズの想定違い

### 8.3 リスク対策
- **API変更対策**: 定期的なSDK更新とテスト
- **競合対策**: 独自性の高い機能に集中
- **ユーザーニーズ**: 早期フィードバック収集

## 9. MVP後の発展計画

### 9.1 フェーズ2機能（v1.1）
- Mainnet対応
- 複数ウォレット対応
- 履歴保存機能
- 基本的な分析機能

### 9.2 フェーズ3機能（v2.0）
- 高度な分析機能
- マルチシグ対応
- デバッグ機能
- パフォーマンス最適化

### 9.3 長期ビジョン
- Aptos開発者の標準ツール化
- エンタープライズ機能追加
- 他ブロックチェーンへの展開検討

## 10. MVP開発開始準備

### 10.1 即座に開始可能なタスク
- Next.jsプロジェクト初期化
- 基本UI コンポーネント作成
- Aptos SDK統合
- Petraウォレット接続実装

### 10.2 依存関係のあるタスク
- Vercelデプロイメント設定
- CI/CDパイプライン構築
- ユーザーテスト環境準備

このMVP要件定義により、明確な目標と制約の下で効率的な開発を進め、市場投入までの時間を最小化できます。