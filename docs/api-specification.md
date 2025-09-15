# Aptosトランザクションシミュレーター - 実装仕様書

## 1. 実装概要

### 1.1 基本情報
- **アーキテクチャ**: クライアントサイドアプリケーション
- **フレームワーク**: Next.js 15+ (App Router)
- **言語**: TypeScript
- **ブロックチェーン**: Aptos SDK統合

### 1.2 コアライブラリ
```json
{
  "dependencies": {
    "@aptos-labs/ts-sdk": "latest",
    "@aptos-labs/wallet-adapter-react": "latest",
    "next": "15.x",
    "react": "18.x",
    "typescript": "5.x",
    "zustand": "latest",
    "swr": "latest",
    "tailwindcss": "latest",
    "@radix-ui/react-*": "latest",
    "zod": "latest"
  }
}
```

### 1.3 プロジェクト構造
```
src/
├── app/                    # Next.js App Router
├── components/             # Reactコンポーネント
├── hooks/                  # カスタムフック
├── lib/                    # ユーティリティライブラリ
├── stores/                 # Zustand状態管理
├── types/                  # TypeScript型定義
└── utils/                  # ヘルパー関数
```

## 2. 認証・ウォレット統合

### 2.1 ウォレット接続
```typescript
import { useWallet } from '@aptos-labs/wallet-adapter-react';

export function WalletConnection() {
  const { connect, disconnect, account, connected } = useWallet();
  
  return (
    <div>
      {connected ? (
        <button onClick={disconnect}>
          切断: {account?.address}
        </button>
      ) : (
        <button onClick={() => connect()}>
          ウォレット接続
        </button>
      )}
    </div>
  );
}
```

### 2.2 ウォレット状態管理
```typescript
import { create } from 'zustand';

interface WalletState {
  isConnected: boolean;
  address: string | null;
  setWallet: (address: string) => void;
  clearWallet: () => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  isConnected: false,
  address: null,
  setWallet: (address) => set({ isConnected: true, address }),
  clearWallet: () => set({ isConnected: false, address: null }),
}));
```

## 3. Core Simulation Endpoints

### 3.1 Simulate Transaction

#### Request
```http
POST /simulation/transaction
Content-Type: application/json
Authorization: Bearer <token>
```

```json
{
  "transaction": {
    "sender": "0x123...abc",
    "sequenceNumber": 5,
    "maxGasAmount": "10000",
    "gasUnitPrice": "100",
    "expirationTimestampSecs": "1704067200",
    "payload": {
      "type": "entry_function_payload",
      "function": "0x1::coin::transfer",
      "typeArguments": ["0x1::aptos_coin::AptosCoin"],
      "arguments": ["0x456...def", "1000000"]
    }
  },
  "options": {
    "includeTrace": true,
    "includeEvents": true,
    "includeChanges": true,
    "forkFrom": "latest" // or specific block height
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_123456789",
    "result": {
      "success": true,
      "vmStatus": "Executed successfully",
      "gasUsed": "873",
      "gasUnitPrice": "100",
      "events": [...],
      "changes": [...],
      "trace": [...]
    },
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

### 3.2 Batch Simulation

#### Request
```http
POST /simulation/batch
```

```json
{
  "transactions": [
    {
      "id": "tx1",
      "transaction": {...}
    },
    {
      "id": "tx2", 
      "transaction": {...}
    }
  ],
  "options": {
    "sequential": true, // execute in order
    "stopOnFailure": false
  }
}
```

### 3.3 Get Simulation Result

#### Request
```http
GET /simulation/{simulationId}
```

#### Response
```json
{
  "success": true,
  "data": {
    "simulationId": "sim_123456789",
    "status": "completed", // pending, running, completed, failed
    "result": {...},
    "createdAt": "2024-01-01T00:00:00Z",
    "completedAt": "2024-01-01T00:00:01Z"
  }
}
```

## 4. State Management Endpoints

### 4.1 Create State Fork

#### Request
```http
POST /state/fork
```

```json
{
  "blockHeight": 12345, // optional, defaults to latest
  "network": "mainnet", // mainnet, testnet, devnet
  "name": "my-test-fork",
  "description": "Testing DEX transactions"
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "forkId": "fork_123456789",
    "blockHeight": 12345,
    "network": "mainnet",
    "createdAt": "2024-01-01T00:00:00Z"
  }
}
```

### 4.2 Modify Account State

#### Request
```http
PATCH /state/fork/{forkId}/account/{address}
```

```json
{
  "balance": "1000000000000", // in octas
  "resources": {
    "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>": {
      "coin": {
        "value": "1000000000000"
      }
    }
  }
}
```

### 4.3 Get Account State

#### Request
```http
GET /state/fork/{forkId}/account/{address}
```

#### Response
```json
{
  "success": true,
  "data": {
    "address": "0x123...abc",
    "sequenceNumber": "5",
    "authenticationKey": "0x123...abc",
    "resources": {...},
    "modules": {...}
  }
}
```

## 5. Debugging Endpoints

### 5.1 Get Execution Trace

#### Request
```http
GET /simulation/{simulationId}/trace
```

#### Response
```json
{
  "success": true,
  "data": {
    "trace": [
      {
        "stepNumber": 1,
        "instruction": "call_function",
        "location": {
          "module": "0x1::coin",
          "function": "transfer",
          "pc": 0
        },
        "stackBefore": [...],
        "stackAfter": [...],
        "localsAfter": [...],
        "gasRemaining": 9127
      }
    ]
  }
}
```

### 5.2 Get Transaction Events

#### Request
```http
GET /simulation/{simulationId}/events
```

#### Response
```json
{
  "success": true,
  "data": {
    "events": [
      {
        "sequenceNumber": "0",
        "type": "0x1::coin::WithdrawEvent",
        "data": {
          "amount": "1000000"
        }
      }
    ]
  }
}
```

### 5.3 Get State Changes

#### Request
```http
GET /simulation/{simulationId}/changes
```

#### Response
```json
{
  "success": true,
  "data": {
    "changes": [
      {
        "type": "write_resource",
        "address": "0x123...abc",
        "resourceType": "0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>",
        "before": {...},
        "after": {...}
      }
    ]
  }
}
```

## 6. Gas Estimation Endpoints

### 6.1 Estimate Gas

#### Request
```http
POST /gas/estimate
```

```json
{
  "transaction": {...},
  "options": {
    "includeBreakdown": true
  }
}
```

#### Response
```json
{
  "success": true,
  "data": {
    "gasEstimate": {
      "gasUsed": "873",
      "gasUnitPrice": "100",
      "totalCost": "87300",
      "breakdown": {
        "intrinsic": "200",
        "execution": "673"
      }
    }
  }
}
```

## 7. WebSocket API

### 7.1 Connection
```javascript
const ws = new WebSocket('wss://api.aptos-simulator.com/v1/ws');
```

### 7.2 Subscribe to Simulation Updates
```json
{
  "type": "subscribe",
  "channel": "simulation",
  "simulationId": "sim_123456789"
}
```

### 7.3 Real-time Updates
```json
{
  "type": "simulation_update",
  "simulationId": "sim_123456789",
  "status": "running",
  "progress": 45,
  "data": {...}
}
```

## 8. GraphQL API

### 8.1 Endpoint
```
POST /graphql
```

### 8.2 Schema Example
```graphql
type Query {
  simulation(id: ID!): Simulation
  simulations(filter: SimulationFilter): [Simulation!]!
  account(address: String!, forkId: String): Account
}

type Mutation {
  simulateTransaction(input: TransactionInput!): SimulationResult!
  createFork(input: ForkInput!): Fork!
}

type Subscription {
  simulationUpdates(simulationId: ID!): SimulationUpdate!
}
```

### 8.3 Example Query
```graphql
query GetSimulation($id: ID!) {
  simulation(id: $id) {
    id
    status
    result {
      success
      gasUsed
      events {
        type
        data
      }
    }
  }
}
```

## 9. Rate Limiting

### 9.1 Limits
- **Free Tier**: 100 requests/hour
- **Pro Tier**: 1,000 requests/hour
- **Enterprise**: Custom limits

### 9.2 Headers
```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1609459200
```

## 10. Error Codes

| Code | Description |
|------|-------------|
| `INVALID_TRANSACTION` | Transaction format is invalid |
| `SIMULATION_FAILED` | Simulation execution failed |
| `INSUFFICIENT_BALANCE` | Account has insufficient balance |
| `MODULE_NOT_FOUND` | Referenced module not found |
| `FUNCTION_NOT_FOUND` | Referenced function not found |
| `GAS_LIMIT_EXCEEDED` | Transaction exceeded gas limit |
| `FORK_NOT_FOUND` | State fork not found |
| `RATE_LIMIT_EXCEEDED` | API rate limit exceeded |
| `AUTHENTICATION_FAILED` | Invalid or missing authentication |
| `INTERNAL_ERROR` | Unexpected server error |

## 11. SDK Examples

### 11.1 TypeScript SDK
```typescript
import { AptosSimulator } from '@aptos-simulator/sdk';

const simulator = new AptosSimulator({
  apiKey: 'your-api-key',
  baseUrl: 'https://api.aptos-simulator.com/v1'
});

const result = await simulator.simulateTransaction({
  sender: '0x123...abc',
  payload: {
    type: 'entry_function_payload',
    function: '0x1::coin::transfer',
    typeArguments: ['0x1::aptos_coin::AptosCoin'],
    arguments: ['0x456...def', '1000000']
  }
});
```

### 11.2 Python SDK
```python
from aptos_simulator import AptosSimulator

simulator = AptosSimulator(
    api_key='your-api-key',
    base_url='https://api.aptos-simulator.com/v1'
)

result = simulator.simulate_transaction({
    'sender': '0x123...abc',
    'payload': {
        'type': 'entry_function_payload',
        'function': '0x1::coin::transfer',
        'type_arguments': ['0x1::aptos_coin::AptosCoin'],
        'arguments': ['0x456...def', '1000000']
    }
})
```

## 12. Webhook Integration

### 12.1 Configuration
```http
POST /webhooks
```

```json
{
  "url": "https://your-app.com/webhooks/simulation",
  "events": ["simulation.completed", "simulation.failed"],
  "secret": "webhook-secret"
}
```

### 12.2 Webhook Payload
```json
{
  "event": "simulation.completed",
  "simulationId": "sim_123456789",
  "timestamp": "2024-01-01T00:00:00Z",
  "data": {...}
}
```