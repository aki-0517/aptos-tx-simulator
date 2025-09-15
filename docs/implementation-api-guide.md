# 実装用Aptos API統合ガイド

## 概要
未実装機能の実装に必要なAptos APIの詳細リファレンス。既存のAPI文書から実装必須の情報を統合。

## 1. トランザクション種別実装用API

### Script トランザクション

#### POST /transactions/simulate（スクリプト用）
```typescript
interface ScriptPayload {
  type: "script_payload";
  code: {
    bytecode: string; // Move bytecode (hex)
  };
  type_arguments: string[];
  arguments: string[];
}

// 実装例
const simulateScript = async (
  scriptCode: string,
  typeArgs: string[],
  args: any[]
) => {
  const payload: ScriptPayload = {
    type: "script_payload",
    code: { bytecode: scriptCode },
    type_arguments: typeArgs,
    arguments: args.map(arg => encodeArgument(arg))
  };
  
  return await aptosClient.transaction.simulate.simple({
    sender: senderAddress,
    data: payload
  });
};
```

### バッチトランザクション

#### POST /transactions/batch
```typescript
interface BatchRequest {
  transactions: RawTransaction[];
  sequential: boolean; // 順次実行か並列実行か
}

// 実装例
const simulateBatch = async (
  transactions: Transaction[],
  sequential = true
) => {
  const results = [];
  
  if (sequential) {
    // 順次シミュレーション（状態変更を考慮）
    for (const tx of transactions) {
      const result = await aptosClient.transaction.simulate.simple(tx);
      results.push(result);
    }
  } else {
    // 並列シミュレーション
    const promises = transactions.map(tx => 
      aptosClient.transaction.simulate.simple(tx)
    );
    results.push(...await Promise.all(promises));
  }
  
  return results;
};
```

### スポンサードトランザクション

#### Multi-signature 構造
```typescript
interface SponsoredTransaction {
  sender: string;
  sponsor: string; // fee payer
  payload: TransactionPayload;
  fee_payer_auth: {
    type: "multi_agent_signature";
    sender: AccountAuthenticator;
    fee_payer_address: string;
    fee_payer: AccountAuthenticator;
  };
}

// ガス比較実装
const compareSponsoredGas = async (
  transaction: Transaction,
  sponsorAddress: string
) => {
  // 通常トランザクション
  const normalResult = await simulateTransaction(transaction);
  
  // スポンサードトランザクション
  const sponsoredTx = {
    ...transaction,
    fee_payer_address: sponsorAddress
  };
  const sponsoredResult = await simulateTransaction(sponsoredTx);
  
  return {
    normal: {
      gasUsed: normalResult.gas_used,
      sender: transaction.sender
    },
    sponsored: {
      gasUsed: sponsoredResult.gas_used,
      sender: transaction.sender,
      sponsor: sponsorAddress
    }
  };
};
```

## 2. VM実行トレース取得用API

### 拡張シミュレーション

#### POST /transactions/simulate（トレース付き）
```typescript
interface SimulationOptions {
  enable_trace: boolean;
  estimate_gas_unit_price: boolean;
  estimate_max_gas_amount: boolean;
  estimate_prioritized_gas_unit_price: boolean;
}

// トレース取得実装
const simulateWithTrace = async (transaction: Transaction) => {
  const response = await fetch(`${API_BASE}/transactions/simulate`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Aptos-Simulate-Enable-Trace': 'true' // カスタムヘッダー
    },
    body: JSON.stringify({
      ...transaction,
      // トレース有効化
      simulation_options: {
        enable_trace: true,
        estimate_gas_unit_price: true,
        estimate_max_gas_amount: true
      }
    })
  });
  
  const result = await response.json();
  
  return {
    simulation: result,
    trace: result.trace || null,
    gas_breakdown: parseGasBreakdown(result.trace)
  };
};
```

### VM実行ステップ解析

```typescript
interface VMTrace {
  execution_steps: ExecutionStep[];
  gas_usage_steps: GasStep[];
  state_access_log: StateAccess[];
}

interface ExecutionStep {
  step_index: number;
  instruction: {
    opcode: string;
    operands: any[];
  };
  stack_before: StackItem[];
  stack_after: StackItem[];
  locals: LocalVariable[];
  gas_consumed: number;
}

// 実装関数
const parseVMTrace = (trace: any): VMTrace => {
  return {
    execution_steps: trace.execution_gas_events?.map(parseExecutionStep) || [],
    gas_usage_steps: trace.gas_events?.map(parseGasStep) || [],
    state_access_log: trace.state_access_log || []
  };
};
```

## 3. 詳細ガス分析用API

### ガス内訳取得

```typescript
interface DetailedGasInfo {
  intrinsic_gas: {
    signature_verification: number;
    transaction_size: number;
    base_cost: number;
  };
  execution_gas: {
    instruction_execution: number;
    function_calls: number;
    move_operations: number;
  };
  storage_gas: {
    read_operations: number;
    write_operations: number;
    create_operations: number;
  };
  io_gas: {
    event_emission: number;
    serialization: number;
  };
}

// ガス分析実装
const analyzeDetailedGas = async (
  simulationResult: SimulationResult
): Promise<DetailedGasInfo> => {
  const trace = simulationResult.trace;
  const gasEvents = trace?.gas_events || [];
  
  return {
    intrinsic_gas: calculateIntrinsicGas(simulationResult),
    execution_gas: calculateExecutionGas(gasEvents),
    storage_gas: calculateStorageGas(simulationResult.changes),
    io_gas: calculateIOGas(simulationResult.events)
  };
};
```

## 4. ネットワーク状態監視用API

### ネットワーク統計

#### GET /network/statistics
```typescript
interface NetworkStatistics {
  current_epoch: number;
  current_round: number;
  current_timestamp: number;
  current_version: number;
  average_block_time: number;
  transactions_per_second: number;
  gas_price_percentiles: {
    p50: number;
    p75: number;
    p95: number;
    p99: number;
  };
}

// 実装例
const getNetworkState = async (): Promise<NetworkState> => {
  const [ledgerInfo, gasEstimate] = await Promise.all([
    fetch(`${API_BASE}/`).then(r => r.json()),
    fetch(`${API_BASE}/estimate_gas_price`).then(r => r.json())
  ]);
  
  return {
    blockHeight: ledgerInfo.ledger_version,
    timestamp: ledgerInfo.ledger_timestamp,
    gasPrice: gasEstimate.gas_estimate,
    congestionLevel: calculateCongestion(gasEstimate)
  };
};
```

### ガス価格推定

#### GET /estimate_gas_price
```typescript
interface GasPriceEstimate {
  gas_estimate: number;
  deprioritized_gas_estimate?: number;
  prioritized_gas_estimate?: number;
}

// 動的ガス価格実装
const getDynamicGasPrice = async (priority: 'slow' | 'standard' | 'fast') => {
  const estimate = await fetch(`${API_BASE}/estimate_gas_price`)
    .then(r => r.json()) as GasPriceEstimate;
  
  switch (priority) {
    case 'slow':
      return estimate.deprioritized_gas_estimate || estimate.gas_estimate * 0.8;
    case 'standard':
      return estimate.gas_estimate;
    case 'fast':
      return estimate.prioritized_gas_estimate || estimate.gas_estimate * 1.5;
  }
};
```

## 5. 状態フォーク用API

### 状態スナップショット

#### GET /accounts/{address}?ledger_version={version}
```typescript
// 特定バージョンでの状態取得
const getStateAtVersion = async (
  address: string,
  version: number
): Promise<AccountState> => {
  const response = await fetch(
    `${API_BASE}/accounts/${address}?ledger_version=${version}`
  );
  return await response.json();
};

// フォーク作成実装
const createStateFork = async (
  baseVersion: number,
  modifications: StateModification[]
): Promise<StateFork> => {
  // ベース状態の取得
  const baseState = await getStateAtVersion(address, baseVersion);
  
  // 変更を適用した状態を計算
  const modifiedState = applyModifications(baseState, modifications);
  
  return {
    id: generateForkId(),
    baseVersion,
    baseState,
    modifications,
    currentState: modifiedState,
    createdAt: new Date()
  };
};
```

### View関数でのフォーク状態確認

#### POST /view（フォーク状態）
```typescript
// フォーク状態でのView関数実行
const viewOnFork = async (
  fork: StateFork,
  functionCall: ViewRequest
) => {
  // フォーク状態を反映したリクエスト
  const response = await fetch(`${API_BASE}/view`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ...functionCall,
      ledger_version: fork.baseVersion,
      // カスタムヘッダーで状態オーバーライドを指定
      state_overrides: fork.modifications
    })
  });
  
  return await response.json();
};
```

## 6. エラーハンドリング拡張

### 実装固有エラー

```typescript
enum SimulatorError {
  SCRIPT_COMPILATION_FAILED = 'script_compilation_failed',
  BATCH_DEPENDENCY_VIOLATION = 'batch_dependency_violation',
  SPONSORED_TX_INVALID_SPONSOR = 'sponsored_tx_invalid_sponsor',
  FORK_STATE_INCONSISTENT = 'fork_state_inconsistent',
  TRACE_GENERATION_FAILED = 'trace_generation_failed'
}

// エラー処理実装
const handleSimulationError = (error: any, context: string) => {
  if (error.vm_status?.includes('SCRIPT_HASH_NOT_FOUND')) {
    throw new SimulatorError('無効なスクリプトコードです');
  }
  
  if (error.vm_status?.includes('INSUFFICIENT_BALANCE')) {
    throw new SimulatorError('残高不足です');
  }
  
  // コンテキスト別のエラー処理
  switch (context) {
    case 'batch':
      return handleBatchError(error);
    case 'sponsored':
      return handleSponsoredError(error);
    case 'fork':
      return handleForkError(error);
    default:
      return handleGenericError(error);
  }
};
```

## 7. パフォーマンス最適化

### 並列API呼び出し

```typescript
// 効率的な並列データ取得
const getComprehensiveData = async (address: string) => {
  const [account, resources, modules, transactions] = await Promise.all([
    fetch(`${API_BASE}/accounts/${address}`),
    fetch(`${API_BASE}/accounts/${address}/resources`),
    fetch(`${API_BASE}/accounts/${address}/modules`),
    fetch(`${API_BASE}/accounts/${address}/transactions?limit=10`)
  ].map(p => p.then(r => r.json())));
  
  return { account, resources, modules, transactions };
};
```

### キャッシング戦略

```typescript
class APICache {
  private cache = new Map<string, { data: any; expiry: number }>();
  
  async get<T>(key: string, fetcher: () => Promise<T>, ttl = 60000): Promise<T> {
    const cached = this.cache.get(key);
    
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    
    const data = await fetcher();
    this.cache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
    
    return data;
  }
}
```

## 8. WebSocket接続（リアルタイム更新）

### 実装例

```typescript
class AptosWebSocketClient {
  private ws: WebSocket;
  
  constructor(network: 'devnet' | 'testnet' | 'mainnet') {
    const wsUrl = `wss://api.${network}.aptoslabs.com/v1/stream`;
    this.ws = new WebSocket(wsUrl);
  }
  
  subscribeToTransactions(callback: (tx: Transaction) => void) {
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      stream: 'transactions'
    }));
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'transaction') {
        callback(data.transaction);
      }
    };
  }
  
  subscribeToGasPriceUpdates(callback: (price: number) => void) {
    // ガス価格変更の監視実装
    this.ws.send(JSON.stringify({
      type: 'subscribe',
      stream: 'gas_price_estimates'
    }));
  }
}
```

## 9. SDK統合ポイント

### Aptos TypeScript SDK連携

```typescript
import { Aptos, AptosConfig, Network } from '@aptos-labs/ts-sdk';

// 拡張クライアントクラス
export class ExtendedAptosClient extends Aptos {
  constructor(network: Network) {
    super(new AptosConfig({ network }));
  }
  
  // トレース付きシミュレーション
  async simulateWithTrace(transaction: AnyRawTransaction) {
    return await this.transaction.simulate.simple({
      transaction,
      options: {
        estimateGasUnitPrice: true,
        estimateMaxGasAmount: true,
        enableTrace: true
      }
    });
  }
  
  // バッチシミュレーション
  async simulateBatch(transactions: AnyRawTransaction[]) {
    // 実装詳細
  }
}
```

この統合ガイドに基づいて、各機能の実装を進めることができます。