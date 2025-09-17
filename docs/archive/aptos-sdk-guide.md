# Aptos TypeScript SDK ガイド

## 概要

このドキュメントは、トランザクションシミュレーターアプリで使用するAptos TypeScript SDKの包括的なガイドです。

## 1. インストールとセットアップ

### インストール

```bash
npm i @aptos-labs/ts-sdk
```

### 基本セットアップ

```typescript
import { Account, Aptos, AptosConfig, Network } from "@aptos-labs/ts-sdk";

// ネットワーク設定
const config = new AptosConfig({ network: Network.DEVNET });
const aptos = new Aptos(config);
```

### ネットワーク設定

```typescript
// サポートされているネットワーク
Network.MAINNET   // メインネット
Network.TESTNET   // テストネット  
Network.DEVNET    // デベネット

// カスタムフルノード
const config = new AptosConfig({
  fullnode: "http://localhost:8080/v1"
});
```

## 2. アカウント管理

### アカウント生成

```typescript
// デフォルト（Legacy Ed25519）
const account = Account.generate();

// 単一送信者 Secp256k1
const account = Account.generate({ 
  scheme: SigningSchemeInput.Secp256k1Ecdsa 
});

// 単一送信者 Ed25519
const account = Account.generate({
  scheme: SigningSchemeInput.Ed25519,
  legacy: false,
});
```

### プライベートキーからの復元

```typescript
const privateKey = new Ed25519PrivateKey(privateKeyBytes);
const account = Account.fromPrivateKey({ privateKey });
```

### アカウント資金調達（Devnet）

```typescript
await aptos.fundAccount({
  accountAddress: account.accountAddress,
  amount: 100_000_000, // 1 APT = 100,000,000 octas
});
```

## 3. トランザクション操作

### トランザクション構築

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: {
    function: "0x1::aptos_account::transfer",
    functionArguments: [bob.accountAddress, 100],
  },
  options: {
    maxGasAmount: 200000,    // 最大ガス量
    gasUnitPrice: 100,       // ガス単価
    expireTimestamp: new Date(Date.now() + 10 * 60 * 1000), // 10分後に期限切れ
  }
});
```

### トランザクション署名

```typescript
const senderAuthenticator = aptos.transaction.sign({
  signer: alice,
  transaction,
});
```

### トランザクション送信

```typescript
const pendingTransaction = await aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator,
});

// 完了まで待機
const executedTransaction = await aptos.waitForTransaction({
  transactionHash: pendingTransaction.hash,
});
```

## 4. トランザクションシミュレーション

### 基本シミュレーション

```typescript
const [simulationResult] = await aptos.transaction.simulate.simple({
  signerPublicKey: alice.publicKey,
  transaction,
});

console.log(`推定ガス使用量: ${simulationResult.gas_used}`);
console.log(`トランザクション: ${simulationResult.success ? "成功" : "失敗"}`);
```

### スポンサートランザクションのシミュレーション

```typescript
// デフォルトでfeePayerAddress = 0x0でガス料金支払いをスキップ
const [userTransactionResponse] = await aptos.transaction.simulate.simple({
  signerPublicKey: sender.publicKey,
  transaction,
});

// 特定のfee payerでシミュレーション
transaction.feePayerAddress = feePayer.accountAddress;
const [userTransactionResponse] = await aptos.transaction.simulate.simple({
  signerPublicKey: sender.publicKey,
  feePayerPublicKey: feePayer.publicKey,
  transaction,
});
```

## 5. ガス推定

### ガス計算

```typescript
const gasUsed = parseInt(simulationResult.gas_used);
const gasUnitPrice = parseInt(simulationResult.gas_unit_price);
const totalCost = gasUsed * gasUnitPrice; // octas単位

// APTに変換
const costInAPT = totalCost / 100_000_000;
```

### ガス設定オプション

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  data: { /* ... */ },
  options: {
    maxGasAmount: 200000,    // 最大ガス量
    gasUnitPrice: 100,       // ガス単価
    expireTimestamp: new Date(Date.now() + 10 * 60 * 1000), // 有効期限
  }
});
```

## 6. データ取得

### アカウント情報

```typescript
// アカウント基本情報
const accountInfo = await aptos.getAccountInfo({ 
  accountAddress: "0x123" 
});

// APT残高
const balance = await aptos.getAccountAPTAmount({ 
  accountAddress: "0x123" 
});

// モジュール情報
const modules = await aptos.getAccountModules({ 
  accountAddress: "0x123" 
});
```

### ビュー関数

```typescript
const chainId = (await aptos.view({ 
  payload: { function: "0x1::chain_id::get" }
}))[0];
```

### Indexer API クエリ

```typescript
const result = await aptos.queryIndexer({
  query: {
    query: `
      query MyQuery {
        ledger_infos {
          chain_id
        }
      }
    `
  }
});
```

## 7. エラーハンドリング

### 一般的なエラー

- **`INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE`**: アカウント残高不足
- **認証キーエラー**: プライベートキーとアドレスの不一致
- **シーケンス番号エラー**: 古いまたは重複したシーケンス番号

### エラー処理例

```typescript
try {
  const executedTransaction = await aptos.waitForTransaction({
    transactionHash: pendingTransaction.hash,
  });
  
  if (!executedTransaction.success) {
    console.error(`トランザクション失敗: ${executedTransaction.vm_status}`);
  }
} catch (error) {
  console.error("トランザクションエラー:", error);
}
```

## 8. 高度な機能

### バッチトランザクション

```typescript
const results = await aptos.transaction.batch.forSingleAccount({
  sender: sender,
  data: transactions,
});
```

### スポンサートランザクション

```typescript
const transaction = await aptos.transaction.build.simple({
  sender: alice.accountAddress,
  withFeePayer: true,
  data: { /* ... */ },
});

const senderAuth = aptos.transaction.sign({ signer: alice, transaction });
const feePayerAuth = aptos.transaction.signAsFeePayer({ 
  signer: bob, 
  transaction 
});

await aptos.transaction.submit.simple({
  transaction,
  senderAuthenticator: senderAuth,
  feePayerAuthenticator: feePayerAuth,
});
```

## 9. 参考リソース

- **GitHub Repository**: https://github.com/aptos-labs/aptos-ts-sdk
- **SDK Reference**: https://aptos-labs.github.io/aptos-ts-sdk/
- **Examples**: https://github.com/aptos-labs/aptos-ts-sdk/tree/main/examples
- **REST API Explorer**: https://fullnode.devnet.aptoslabs.com/v1/spec#/

## 10. ベストプラクティス

### セキュリティ

- 秘密鍵をクライアントサイドで保存しない
- トランザクション送信前に必ずシミュレーションを実行
- 適切なガス制限を設定

### パフォーマンス

- 複数のクエリをバッチ処理で最適化
- 適切なキャッシング戦略を実装
- ネットワーク遅延を考慮したタイムアウト設定