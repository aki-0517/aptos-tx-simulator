# Aptos REST API リファレンス

## 概要

このドキュメントは、トランザクションシミュレーターアプリで使用するAptos REST APIの包括的なリファレンスです。

## 1. ネットワークエンドポイント

### 基本URL

- **Mainnet**: https://api.mainnet.aptoslabs.com/v1
- **Testnet**: https://api.testnet.aptoslabs.com/v1
- **Devnet**: https://api.devnet.aptoslabs.com/v1
- **Localnet**: http://127.0.0.1:8080

### APIスペック

- **Mainnet**: https://api.mainnet.aptoslabs.com/v1/spec#/
- **Testnet**: https://api.testnet.aptoslabs.com/v1/spec#/
- **Devnet**: https://api.devnet.aptoslabs.com/v1/spec#/

## 2. トランザクション関連API

### 主要エンドポイント

#### GET /transactions
コミット済みトランザクション一覧取得

```http
GET /transactions?start={version}&limit={limit}
```

#### POST /transactions
トランザクション送信

```http
POST /transactions
Content-Type: application/json

{
  "sender": "0x123...",
  "sequence_number": "1",
  "max_gas_amount": "10000",
  "gas_unit_price": "100",
  "expiration_timestamp_secs": "1704067200",
  "payload": { ... },
  "signature": { ... }
}
```

#### POST /transactions/simulate
トランザクションシミュレーション

```http
POST /transactions/simulate
Content-Type: application/json

{
  "sender": "0x123...",
  "sequence_number": "1",
  "max_gas_amount": "10000",
  "gas_unit_price": "100",
  "expiration_timestamp_secs": "1704067200",
  "payload": { ... }
}
```

#### GET /transactions/by_hash/{txn_hash}
ハッシュによるトランザクション検索

```http
GET /transactions/by_hash/0x123...
```

#### GET /transactions/wait_by_hash/{txn_hash}
トランザクション完了待機

```http
GET /transactions/wait_by_hash/0x123...?timeout={seconds}
```

### トランザクション構築の5ステップ

1. **Build** - 送信者、関数、引数を指定
2. **Simulate** (オプション) - ガス推定とエラーチェック
3. **Sign** - 秘密鍵による署名
4. **Submit** - ネットワークへ送信
5. **Wait** - 実行完了まで待機

## 3. アカウント関連API

### アカウント基本情報

#### GET /accounts/{address}
アカウント基本情報取得

```http
GET /accounts/0x123...
```

レスポンス例:
```json
{
  "sequence_number": "1",
  "authentication_key": "0x123..."
}
```

### リソース管理

#### GET /accounts/{address}/resources
アカウントリソース一覧

```http
GET /accounts/0x123.../resources
```

#### GET /accounts/{address}/resource/{resource_type}
特定リソース取得

```http
GET /accounts/0x123.../resource/0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>
```

### モジュール管理

#### GET /accounts/{address}/modules
アカウントモジュール一覧

```http
GET /accounts/0x123.../modules
```

#### GET /accounts/{address}/module/{module_name}
特定モジュール取得

```http
GET /accounts/0x123.../module/MyModule
```

## 4. ガス推定とシミュレーション

### シミュレーションレスポンス

```json
{
  "version": "123456",
  "hash": "0x123...",
  "state_change_hash": "0x456...",
  "event_root_hash": "0x789...",
  "state_checkpoint_hash": null,
  "gas_used": "873",
  "success": true,
  "vm_status": "Executed successfully",
  "accumulator_root_hash": "0xabc...",
  "changes": [...],
  "events": [...],
  "timestamp": "1704067200123456"
}
```

### ガス計算

```typescript
// ガス料金計算
const gasUsed = parseInt(response.gas_used);
const gasUnitPrice = parseInt(transaction.gas_unit_price);
const totalCostOctas = gasUsed * gasUnitPrice;
const totalCostAPT = totalCostOctas / 100_000_000;
```

### ガスパラメータ

- `max_gas_amount`: 最大ガス使用量
- `gas_unit_price`: ガス単価（octas単位）
- `expiration_timestamp_secs`: 有効期限

## 5. View関数

### POST /view
状態変更なしでMove関数実行

```http
POST /view
Content-Type: application/json

{
  "function": "0x1::chain_id::get",
  "type_arguments": [],
  "arguments": []
}
```

レスポンス例:
```json
["4"]
```

## 6. イベント関連API

### GET /accounts/{address}/events/{creation_number}
アカウントイベント取得

```http
GET /accounts/0x123.../events/0
```

### GET /accounts/{address}/events/{event_handle}/{field_name}
ハンドル別イベント取得

```http
GET /accounts/0x123.../events/withdraw_events/withdraw_events
```

## 7. エラーハンドリング

### HTTPステータスコード

- **200**: 成功
- **400**: 不正なリクエスト
- **404**: リソースが見つからない
- **410**: データが剪定済み
- **500**: 内部サーバーエラー

### VM エラーコード

- **INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE**: ガス料金不足
- **OUT_OF_GAS**: ガス制限超過
- **SEQUENCE_NUMBER_TOO_OLD**: 古いシーケンス番号
- **SEQUENCE_NUMBER_TOO_NEW**: 新しすぎるシーケンス番号
- **INVALID_SIGNATURE**: 無効な署名
- **TRANSACTION_EXPIRED**: トランザクション期限切れ

### エラー処理例

```typescript
try {
  const response = await fetch('/transactions/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(transaction)
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (!result.success) {
    console.error(`VM Error: ${result.vm_status}`);
  }
} catch (error) {
  console.error('API Error:', error);
}
```

## 8. 認証・署名

### 署名方式

- **Ed25519**: 標準的な楕円曲線デジタル署名
- **MultiKey**: 複数鍵による署名
- **Keyless**: OAuth 2.0による認証

### TransactionSignature構造

```json
{
  "type": "ed25519_signature",
  "public_key": "0x123...",
  "signature": "0x456..."
}
```

## 9. レート制限

### 制限方式

- **計算単位（Compute Units）ベース**: リクエストの複雑さに応じた制限
- **IPアドレス毎の制限**: 匿名アクセスの制限
- **APIキーアクセス**: より高い制限値

### 高レート制限の取得

- [Geomi](https://geomi.dev/)でアカウント登録
- APIキー使用で制限緩和

### ヘッダー

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## 10. Faucet API（テストネット/Devnet）

### Devnet Faucet

```http
POST https://faucet.devnet.aptoslabs.com/mint?amount={amount}&address={address}
```

例:
```http
POST https://faucet.devnet.aptoslabs.com/mint?amount=100000000&address=0x123...
```

## 11. バッチトランザクション

### POST /transactions/batch
複数トランザクションの同時送信

```http
POST /transactions/batch
Content-Type: application/json

[
  { /* transaction 1 */ },
  { /* transaction 2 */ },
  { /* transaction 3 */ }
]
```

## 12. データプルーニング

### プルーニングの種類

- **状態プルーニング**: 古い状態バージョン削除
- **イベント・トランザクションプルーニング**: 履歴データ削除

### 410エラーハンドリング

```typescript
if (response.status === 410) {
  console.warn('データが剪定されています。より新しいバージョンを使用してください。');
}
```

## 13. Indexer API

### GraphQL エンドポイント

- **Mainnet**: https://indexer.mainnet.aptoslabs.com/v1/graphql
- **Testnet**: https://indexer.testnet.aptoslabs.com/v1/graphql
- **Devnet**: https://indexer.devnet.aptoslabs.com/v1/graphql

### GraphQL クエリ例

```graphql
query GetAccount($address: String!) {
  account_transactions(
    where: {account_address: {_eq: $address}}
    limit: 10
    order_by: {transaction_version: desc}
  ) {
    transaction_version
    transaction_timestamp
  }
}
```

## 14. ベストプラクティス

### パフォーマンス

- 適切なページネーション実装
- 不要なデータ取得の回避
- キャッシング戦略の実装

### セキュリティ

- HTTPS通信の使用
- APIキーの適切な管理
- レート制限の遵守

### 信頼性

- 適切なエラーハンドリング
- リトライメカニズムの実装
- タイムアウト設定