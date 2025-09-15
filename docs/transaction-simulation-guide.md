# Aptosトランザクションシミュレーションガイド

## 概要

このドキュメントは、Aptosブロックチェーンでのトランザクションシミュレーション機能の包括的なガイドです。Tenderlyのような高度なシミュレーション機能をAptosで実現する方法を説明します。

## 1. シミュレーション機能の概要

### 1.1 シミュレーションとは

トランザクションシミュレーションは、実際にブロックチェーンにトランザクションを送信せずに、その実行結果を予測する機能です。

**主要な利点:**
- ガス使用量の事前確認
- トランザクション失敗の事前検出
- 状態変更の予測
- コスト最適化

### 1.2 Aptosでのシミュレーション機能

```typescript
// TypeScript SDKでの基本シミュレーション
const [simulationResult] = await aptos.transaction.simulate.simple({
  signerPublicKey: alice.publicKey,
  transaction,
});

console.log(`ガス使用量: ${simulationResult.gas_used}`);
console.log(`実行結果: ${simulationResult.success ? "成功" : "失敗"}`);
```

## 2. CLI でのローカルシミュレーション

### 2.1 基本的なシミュレーション

```bash
# ローカルシミュレーション（測定なし）
aptos move run --function-id 0x1::aptos_account::transfer \
  --args address:0x123 u64:1000000 \
  --local

# ベンチマークの実行
aptos move run --function-id 0x1::aptos_account::transfer \
  --args address:0x123 u64:1000000 \
  --benchmark

# ガスプロファイリング
aptos move run --function-id 0x1::aptos_account::transfer \
  --args address:0x123 u64:1000000 \
  --profile-gas
```

### 2.2 過去トランザクションの再生

```bash
# 過去のトランザクションを再生してシミュレーション
aptos move replay --network mainnet \
  --txn-id 0x123... \
  --profile-gas
```

### 2.3 Move パッケージの公開シミュレーション

```bash
# パッケージ公開のシミュレーション
aptos move publish --local --profile-gas
```

## 3. 詳細ガスプロファイリング

### 3.1 ガスプロファイラーの出力

ガスプロファイリングを実行すると、以下の詳細情報が得られます：

#### Flamegraphs
- **実行＆IO**: ガス単位での処理コスト
- **ストレージ**: APT単位でのストレージコスト

#### コスト内訳テーブル
- **内在コスト (Intrinsic Cost)**: 基本実行コスト
- **依存関係 (Dependencies)**: モジュールロードコスト
- **実行コスト (Execution)**: Move命令実行コスト
- **状態読み込み (State Reads)**: ストレージ読み込みコスト
- **レジャー書き込み (Ledger Writes)**: ストレージ書き込みコスト

### 3.2 実行トレースの詳細

```typescript
// 実行トレースの例
interface ExecutionTrace {
  stepNumber: number;
  instruction: string;
  location: {
    module: string;
    function: string;
    pc: number; // プログラムカウンター
  };
  gasRemaining: number;
  stackBefore: any[];
  stackAfter: any[];
}
```

#### 主要なMove命令
- `create_ty`: 型の作成
- `call`: 関数呼び出し
- `move_loc`, `copy_loc`: ローカル変数操作
- `load`, `exists_generic`: リソース操作
- `pack`, `move_to_generic`: データ構造操作

## 4. TypeScript SDKでの高度なシミュレーション

### 4.1 複雑なトランザクションのシミュレーション

```typescript
class AptosTransactionSimulator {
  constructor(private aptos: Aptos) {}

  async simulateWithDetails(transaction: any) {
    try {
      const [result] = await this.aptos.transaction.simulate.simple({
        signerPublicKey: transaction.signerPublicKey,
        transaction: transaction.rawTransaction,
      });

      return {
        success: result.success,
        gasUsed: parseInt(result.gas_used),
        gasUnitPrice: parseInt(result.gas_unit_price),
        vmStatus: result.vm_status,
        events: result.events,
        changes: result.changes,
        totalCost: this.calculateTotalCost(result),
        breakdown: this.analyzeGasBreakdown(result),
      };
    } catch (error) {
      throw new Error(`シミュレーション失敗: ${error.message}`);
    }
  }

  private calculateTotalCost(result: any): number {
    const gasUsed = parseInt(result.gas_used);
    const gasUnitPrice = parseInt(result.gas_unit_price);
    return gasUsed * gasUnitPrice;
  }

  private analyzeGasBreakdown(result: any) {
    const totalGas = parseInt(result.gas_used);
    
    // ガス内訳の推定（実際の値は詳細プロファイリングで取得）
    return {
      intrinsic: Math.floor(totalGas * 0.1),    // 内在コスト
      execution: Math.floor(totalGas * 0.6),    // 実行コスト
      io: Math.floor(totalGas * 0.2),           // I/Oコスト
      storage: Math.floor(totalGas * 0.1),      // ストレージコスト
    };
  }
}
```

### 4.2 バッチシミュレーション

```typescript
async simulateBatch(transactions: Transaction[]): Promise<SimulationResult[]> {
  const results = await Promise.all(
    transactions.map(async (tx, index) => {
      try {
        const result = await this.simulateWithDetails(tx);
        return { index, ...result };
      } catch (error) {
        return {
          index,
          success: false,
          error: error.message,
        };
      }
    })
  );

  return results;
}
```

### 4.3 スポンサートランザクションのシミュレーション

```typescript
async simulateSponsoredTransaction(
  transaction: any,
  sponsor: any
): Promise<SponsoredSimulationResult> {
  // 基本シミュレーション（feePayerなし）
  const basicResult = await this.aptos.transaction.simulate.simple({
    signerPublicKey: transaction.signerPublicKey,
    transaction: transaction.rawTransaction,
  });

  // スポンサー付きシミュレーション
  transaction.rawTransaction.feePayerAddress = sponsor.accountAddress;
  const sponsoredResult = await this.aptos.transaction.simulate.simple({
    signerPublicKey: transaction.signerPublicKey,
    feePayerPublicKey: sponsor.publicKey,
    transaction: transaction.rawTransaction,
  });

  return {
    basic: basicResult[0],
    sponsored: sponsoredResult[0],
    gasSavings: parseInt(basicResult[0].gas_used) - parseInt(sponsoredResult[0].gas_used),
  };
}
```

## 5. デバッグ機能

### 5.1 エラー分析

```typescript
class TransactionDebugger {
  analyzeFailure(simulationResult: any): DebugInfo {
    if (simulationResult.success) {
      return { status: 'success', issues: [] };
    }

    const issues: DebugIssue[] = [];
    const vmStatus = simulationResult.vm_status;

    // VM エラーの分析
    if (vmStatus.includes('INSUFFICIENT_BALANCE')) {
      issues.push({
        type: 'balance',
        severity: 'error',
        message: '残高不足です',
        suggestion: 'アカウントに十分な残高があることを確認してください',
      });
    }

    if (vmStatus.includes('OUT_OF_GAS')) {
      issues.push({
        type: 'gas',
        severity: 'error',
        message: 'ガス制限を超過しました',
        suggestion: 'maxGasAmountを増やしてください',
      });
    }

    if (vmStatus.includes('SEQUENCE_NUMBER')) {
      issues.push({
        type: 'sequence',
        severity: 'error',
        message: 'シーケンス番号が正しくありません',
        suggestion: '最新のシーケンス番号を取得して再試行してください',
      });
    }

    return { status: 'failed', issues };
  }
}
```

### 5.2 状態変更の分析

```typescript
interface StateChange {
  type: 'write_resource' | 'write_module' | 'delete_resource';
  address: string;
  resourceType?: string;
  before?: any;
  after?: any;
}

class StateAnalyzer {
  analyzeChanges(changes: any[]): StateChangeAnalysis {
    const analysis: StateChangeAnalysis = {
      resourceChanges: [],
      moduleChanges: [],
      balanceChanges: [],
      newResources: [],
    };

    changes.forEach(change => {
      switch (change.type) {
        case 'write_resource':
          analysis.resourceChanges.push({
            address: change.address,
            resourceType: change.data.resource,
            before: change.data.data_before,
            after: change.data.data,
          });
          break;

        case 'write_module':
          analysis.moduleChanges.push({
            address: change.address,
            moduleName: change.data.data.name,
          });
          break;

        case 'delete_resource':
          analysis.resourceChanges.push({
            address: change.address,
            resourceType: change.data.resource,
            deleted: true,
          });
          break;
      }
    });

    return analysis;
  }

  detectBalanceChanges(changes: StateChange[]): BalanceChange[] {
    return changes
      .filter(change => 
        change.resourceType?.includes('CoinStore') &&
        change.resourceType?.includes('AptosCoin')
      )
      .map(change => ({
        address: change.address,
        before: this.extractBalance(change.before),
        after: this.extractBalance(change.after),
        delta: this.calculateDelta(change.before, change.after),
      }));
  }

  private extractBalance(coinStore: any): number {
    return coinStore?.coin?.value ? parseInt(coinStore.coin.value) : 0;
  }

  private calculateDelta(before: any, after: any): number {
    const beforeBalance = this.extractBalance(before);
    const afterBalance = this.extractBalance(after);
    return afterBalance - beforeBalance;
  }
}
```

## 6. パフォーマンス測定

### 6.1 ベンチマーキング

```typescript
class PerformanceBenchmark {
  async benchmarkTransaction(
    transaction: any,
    iterations: number = 10
  ): Promise<BenchmarkResult> {
    const times: number[] = [];
    let totalGas = 0;

    for (let i = 0; i < iterations; i++) {
      const startTime = performance.now();
      
      const result = await this.aptos.transaction.simulate.simple({
        signerPublicKey: transaction.signerPublicKey,
        transaction: transaction.rawTransaction,
      });

      const endTime = performance.now();
      times.push(endTime - startTime);
      totalGas += parseInt(result[0].gas_used);
    }

    return {
      averageTime: times.reduce((a, b) => a + b, 0) / times.length,
      minTime: Math.min(...times),
      maxTime: Math.max(...times),
      averageGas: totalGas / iterations,
      iterations,
    };
  }
}
```

### 6.2 ガス最適化の提案

```typescript
class GasOptimizer {
  analyzeOptimizationOpportunities(
    simulationResult: any
  ): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];
    const gasUsed = parseInt(simulationResult.gas_used);

    // 高ガス使用量の警告
    if (gasUsed > 10000) {
      suggestions.push({
        type: 'high_gas_usage',
        severity: 'warning',
        message: 'ガス使用量が高いです',
        currentValue: gasUsed,
        suggestion: '関数の複雑さを減らすか、複数の小さなトランザクションに分割することを検討してください',
      });
    }

    // ガス価格の最適化
    const gasPrice = parseInt(simulationResult.gas_unit_price);
    if (gasPrice > 100) {
      suggestions.push({
        type: 'gas_price',
        severity: 'info',
        message: 'ガス価格が標準より高いです',
        currentValue: gasPrice,
        suggestion: 'ガス価格を下げて手数料を節約できます（処理時間が長くなる可能性があります）',
      });
    }

    return suggestions;
  }

  suggestGasLimit(simulationResult: any): number {
    const gasUsed = parseInt(simulationResult.gas_used);
    // 20%のバッファを追加
    return Math.ceil(gasUsed * 1.2);
  }
}
```

## 7. 実装例: 統合シミュレーターコンポーネント

```typescript
interface TransactionSimulatorProps {
  transaction: Transaction;
  onSimulationComplete?: (result: SimulationResult) => void;
}

function TransactionSimulator({ 
  transaction, 
  onSimulationComplete 
}: TransactionSimulatorProps) {
  const [isSimulating, setIsSimulating] = useState(false);
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const simulator = new AptosTransactionSimulator(aptos);
  const debugger = new TransactionDebugger();
  const optimizer = new GasOptimizer();

  const runSimulation = async () => {
    setIsSimulating(true);
    setError(null);

    try {
      // シミュレーション実行
      const simulationResult = await simulator.simulateWithDetails(transaction);
      
      // デバッグ情報の生成
      const debugInfo = debugger.analyzeFailure(simulationResult);
      
      // 最適化提案の生成
      const optimizations = optimizer.analyzeOptimizationOpportunities(simulationResult);

      const enrichedResult = {
        ...simulationResult,
        debugInfo,
        optimizations,
        suggestedGasLimit: optimizer.suggestGasLimit(simulationResult),
      };

      setResult(enrichedResult);
      onSimulationComplete?.(enrichedResult);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="transaction-simulator">
      <button 
        onClick={runSimulation} 
        disabled={isSimulating}
        className="simulate-button"
      >
        {isSimulating ? 'シミュレーション実行中...' : 'シミュレーション実行'}
      </button>

      {error && (
        <div className="error-message">
          エラー: {error}
        </div>
      )}

      {result && (
        <SimulationResults result={result} />
      )}
    </div>
  );
}
```

## 8. Unit Testing でのシミュレーション

### 8.1 Move Unit Tests

```move
#[test]
fun test_transfer_simulation() {
    let sender = @0x123;
    let recipient = @0x456;
    let amount = 1000000;
    
    // テスト用のアカウント設定
    let sender_account = create_test_account(sender);
    let recipient_account = create_test_account(recipient);
    
    // 初期残高設定
    coin::register<AptosCoin>(&sender_account);
    coin::register<AptosCoin>(&recipient_account);
    coin::deposit(sender, coin::mint<AptosCoin>(10000000));
    
    // 転送のシミュレーション
    coin::transfer<AptosCoin>(&sender_account, recipient, amount);
    
    // 結果の検証
    assert!(coin::balance<AptosCoin>(sender) == 9000000, 1);
    assert!(coin::balance<AptosCoin>(recipient) == 1000000, 2);
}

#[test]
#[expected_failure(abort_code = 65542)]
fun test_insufficient_balance() {
    let sender = @0x123;
    let recipient = @0x456;
    let amount = 10000000; // 残高より多い金額
    
    let sender_account = create_test_account(sender);
    coin::register<AptosCoin>(&sender_account);
    coin::deposit(sender, coin::mint<AptosCoin>(1000000));
    
    // 残高不足でのトランザクション（失敗するはず）
    coin::transfer<AptosCoin>(&sender_account, recipient, amount);
}
```

## 9. ベストプラクティス

### 9.1 シミュレーション前のチェック

```typescript
const preSimulationChecks = async (transaction: any): Promise<PreCheckResult> => {
  const checks: PreCheck[] = [];

  // アカウント存在確認
  try {
    await aptos.getAccountInfo({ accountAddress: transaction.sender });
    checks.push({ type: 'account_exists', passed: true });
  } catch {
    checks.push({ 
      type: 'account_exists', 
      passed: false, 
      message: '送信者アカウントが存在しません' 
    });
  }

  // 残高確認
  const balance = await aptos.getAccountAPTAmount({ 
    accountAddress: transaction.sender 
  });
  const estimatedCost = transaction.maxGasAmount * transaction.gasUnitPrice;
  
  checks.push({
    type: 'sufficient_balance',
    passed: balance >= estimatedCost,
    message: balance < estimatedCost ? '残高が不足している可能性があります' : undefined,
  });

  return { checks, allPassed: checks.every(c => c.passed) };
};
```

### 9.2 エラーメッセージの改善

```typescript
const getFriendlyErrorMessage = (vmStatus: string): string => {
  const errorMap: Record<string, string> = {
    'INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE': 'ガス料金に対して残高が不足しています',
    'OUT_OF_GAS': 'ガス制限を超過しました。maxGasAmountを増やしてください',
    'SEQUENCE_NUMBER_TOO_OLD': 'シーケンス番号が古すぎます',
    'SEQUENCE_NUMBER_TOO_NEW': 'シーケンス番号が新しすぎます',
    'INVALID_SIGNATURE': '署名が無効です',
    'TRANSACTION_EXPIRED': 'トランザクションの有効期限が切れています',
  };

  for (const [code, message] of Object.entries(errorMap)) {
    if (vmStatus.includes(code)) {
      return message;
    }
  }

  return `VM エラー: ${vmStatus}`;
};
```

## 10. 参考リソース

- **Aptos CLI Documentation**: Move契約のローカルシミュレーション
- **TypeScript SDK**: トランザクションシミュレーション機能
- **Move Unit Testing**: テスト駆動開発
- **Gas Profiling**: 詳細なガス分析
- **Aptos Explorer**: 実際のトランザクション例

このガイドを活用して、Tenderlyのような包括的なトランザクションシミュレーション機能をAptosで実現してください。