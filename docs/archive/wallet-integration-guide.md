# Aptosウォレット統合ガイド

## 概要

このドキュメントは、トランザクションシミュレーターアプリでのAptos Wallet統合に関する包括的なガイドです。

## 1. Wallet Adapter の基本セットアップ

### インストール

```bash
npm i @aptos-labs/wallet-adapter-react
npm i @aptos-labs/wallet-adapter-core
```

### React Provider の設定

```tsx
import { AptosWalletAdapterProvider } from "@aptos-labs/wallet-adapter-react";
import { Network } from "@aptos-labs/ts-sdk";

function App() {
  return (
    <AptosWalletAdapterProvider
      autoConnect={true}
      dappConfig={{ 
        network: Network.MAINNET,
        aptosApiKeys: {
          mainnet: process.env.APTOS_API_KEY_MAINNET,
          testnet: process.env.APTOS_API_KEY_TESTNET,
        } 
      }}
      onError={(error) => {
        console.log("Wallet error", error);
      }}
    >
      {children}
    </AptosWalletAdapterProvider>
  );
}
```

### useWallet Hook の使用

```tsx
import { useWallet } from "@aptos-labs/wallet-adapter-react";

function WalletComponent() {
  const { 
    connect, 
    disconnect, 
    account, 
    connected,
    wallet,
    network,
    signAndSubmitTransaction,
    signMessage
  } = useWallet();

  return (
    <div>
      {connected ? (
        <div>
          <p>接続済み: {account?.address}</p>
          <button onClick={disconnect}>切断</button>
        </div>
      ) : (
        <button onClick={() => connect("Petra" as WalletName<"Petra">)}>
          ウォレット接続
        </button>
      )}
    </div>
  );
}
```

## 2. サポートされているウォレット

### Aptosネイティブウォレット

#### Petra Wallet
- Chromeエクステンション
- 最も人気のあるAptosウォレット
- フル機能サポート

```tsx
await connect("Petra" as WalletName<"Petra">);
```

#### Nightly Wallet
- ネットワーク変更対応
- クロスチェーン機能

```tsx
await connect("Nightly" as WalletName<"Nightly">);
```

#### AptosConnect
- ブラウザ内ウォレット
- ソーシャルログイン対応

### クロスチェーンウォレット

#### Solanaウォレット
- Phantom
- Solflare  
- Backpack
- OKX

#### EVMウォレット
- Metamask
- Phantom
- Coinbase
- OKX
- Exodus
- Backpack

### ウォレット一覧の取得

```tsx
const { wallets, notDetectedWallets } = useWallet();

// ウォレットのグループ化
const { 
  aptosConnectWallets, 
  availableWallets, 
  installableWallets 
} = groupAndSortWallets([...wallets, ...notDetectedWallets]);
```

## 3. ウォレット接続と管理

### 基本的な接続フロー

```tsx
function WalletConnection() {
  const { connect, disconnect, connected, account } = useWallet();

  const handleConnect = async () => {
    try {
      await connect("Petra" as WalletName<"Petra">);
      console.log("ウォレット接続成功");
    } catch (error) {
      console.error("ウォレット接続失敗:", error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      console.log("ウォレット切断成功");
    } catch (error) {
      console.error("ウォレット切断失敗:", error);
    }
  };

  return (
    <div>
      {connected ? (
        <div>
          <p>アドレス: {account?.address}</p>
          <p>公開鍵: {account?.publicKey}</p>
          <p>ANS名: {account?.ansName}</p>
          <button onClick={handleDisconnect}>切断</button>
        </div>
      ) : (
        <button onClick={handleConnect}>接続</button>
      )}
    </div>
  );
}
```

### 自動接続の設定

```tsx
<AptosWalletAdapterProvider
  autoConnect={true} // 自動接続を有効化
  // ...
>
```

### ネットワーク変更

```tsx
const { changeNetwork } = useWallet();

const switchToTestnet = async () => {
  try {
    await changeNetwork(Network.TESTNET);
    console.log("テストネットに切り替え成功");
  } catch (error) {
    console.error("ネットワーク切り替え失敗:", error);
  }
};
```

## 4. トランザクション署名と送信

### 基本的なトランザクション送信

```tsx
const { signAndSubmitTransaction } = useWallet();

const sendTransaction = async () => {
  try {
    const response = await signAndSubmitTransaction({
      sender: account.address,
      data: {
        function: "0x1::aptos_account::transfer",
        functionArguments: [recipientAddress, amount],
      },
    });

    // トランザクション完了まで待機
    await aptos.waitForTransaction({ 
      transactionHash: response.hash 
    });

    console.log("トランザクション成功:", response.hash);
  } catch (error) {
    console.error("トランザクション失敗:", error);
  }
};
```

### 複雑なトランザクション

```tsx
const complexTransaction = async () => {
  const transaction = {
    sender: account.address,
    data: {
      function: "0x1::coin::transfer",
      typeArguments: ["0x1::aptos_coin::AptosCoin"],
      functionArguments: [recipientAddress, amount],
    },
    options: {
      maxGasAmount: 1000,
      gasUnitPrice: 100,
    }
  };

  try {
    const response = await signAndSubmitTransaction(transaction);
    return response;
  } catch (error) {
    throw new Error(`トランザクション失敗: ${error.message}`);
  }
};
```

### メッセージ署名

```tsx
const { signMessage } = useWallet();

const signCustomMessage = async () => {
  const message = "カスタムメッセージ";
  const nonce = Math.random().toString();

  try {
    const response = await signMessage({ 
      message, 
      nonce 
    });
    
    console.log("署名:", response.signature);
    console.log("フルメッセージ:", response.fullMessage);
  } catch (error) {
    console.error("メッセージ署名失敗:", error);
  }
};

// 署名の検証
const { signMessageAndVerify } = useWallet();

const verifyMessage = async () => {
  try {
    const isVerified = await signMessageAndVerify({ 
      message, 
      nonce 
    });
    console.log("署名検証結果:", isVerified);
  } catch (error) {
    console.error("署名検証失敗:", error);
  }
};
```

## 5. Keylessアカウント（OAuth統合）

### サポートされているプロバイダー

#### Google OAuth
- **環境**: Devnet, Testnet, Mainnet対応
- **設定**: Google Developer Consoleでclient_id取得

```tsx
// Google OAuth設定例
const googleClientId = process.env.GOOGLE_CLIENT_ID;
```

#### Apple OAuth
- **環境**: Devnet, Testnet, Mainnet対応
- **設定**: Apple Developer Programでclient_id取得

#### Auth0 (Federated)
- **環境**: Devnet, Testnet, Mainnet対応
- **特徴**: 他のIDプロバイダーとの連携

#### AWS Cognito (Federated)  
- **環境**: Devnet, Testnet, Mainnet対応
- **特徴**: AWSエコシステムとの統合

### Keylessアカウントの実装

```tsx
import { KeylessAccount } from "@aptos-labs/ts-sdk";

const createKeylessAccount = async () => {
  try {
    // 1. Ephemeral Key Pairの生成
    const ephemeralKeyPair = EphemeralKeyPair.generate();
    
    // 2. OIDCフローでJWT取得（実装は使用するプロバイダーに依存）
    const jwt = await getJWTFromOIDCProvider();
    
    // 3. KeylessAccountの生成
    const keylessAccount = await aptos.deriveKeylessAccount({
      jwt,
      ephemeralKeyPair,
    });
    
    console.log("Keylessアカウント作成成功:", keylessAccount.accountAddress);
    return keylessAccount;
  } catch (error) {
    console.error("Keylessアカウント作成失敗:", error);
  }
};
```

## 6. セキュリティベストプラクティス

### アクセス制御

```tsx
// 適切なsignerの検証
const verifyOwnership = (expectedOwner: string, actualSigner: string) => {
  if (expectedOwner !== actualSigner) {
    throw new Error("所有者不一致");
  }
};
```

### 入力検証

```tsx
const validateTransactionInput = (amount: number, recipient: string) => {
  // 金額の検証
  if (amount <= 0 || amount > MAX_TRANSFER_AMOUNT) {
    throw new Error("無効な金額");
  }
  
  // アドレスの検証
  if (!isValidAptosAddress(recipient)) {
    throw new Error("無効なアドレス");
  }
};
```

### プライベートキー管理

- クライアントサイドでプライベートキーを保存しない
- ウォレットによる安全な鍵管理に依存
- セッション管理での適切なクリーンアップ

## 7. エラーハンドリング

### 一般的なエラー

```tsx
const handleWalletError = (error: any) => {
  switch (error.code) {
    case 'INSUFFICIENT_BALANCE_FOR_TRANSACTION_FEE':
      return "ガス料金不足です";
    case 'USER_REJECTED_REQUEST':
      return "ユーザーがトランザクションを拒否しました";
    case 'WALLET_NOT_CONNECTED':
      return "ウォレットが接続されていません";
    case 'NETWORK_MISMATCH':
      return "ネットワークが一致しません";
    default:
      return `予期しないエラー: ${error.message}`;
  }
};
```

### エラーハンドリングの実装

```tsx
const robustTransactionSend = async (transaction: any) => {
  try {
    // トランザクション送信前の検証
    if (!connected) {
      throw new Error("ウォレットが接続されていません");
    }
    
    if (network !== expectedNetwork) {
      throw new Error("ネットワークが一致しません");
    }
    
    // トランザクション送信
    const response = await signAndSubmitTransaction(transaction);
    return response;
    
  } catch (error) {
    const friendlyMessage = handleWalletError(error);
    console.error("トランザクションエラー:", friendlyMessage);
    throw new Error(friendlyMessage);
  }
};
```

## 8. 高度な機能

### カスタムウォレット選択UI

```tsx
function WalletSelector() {
  const { wallets, connect } = useWallet();
  
  return (
    <div className="wallet-selector">
      {wallets.map((wallet) => (
        <button
          key={wallet.name}
          onClick={() => connect(wallet.name)}
          className="wallet-option"
        >
          <img src={wallet.icon} alt={wallet.name} />
          <span>{wallet.name}</span>
          {!wallet.readyState && (
            <span className="install-badge">インストールが必要</span>
          )}
        </button>
      ))}
    </div>
  );
}
```

### トランザクション進行状況の追跡

```tsx
const trackTransaction = async (transactionHash: string) => {
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<string>('pending');
  
  try {
    setStatus('confirming');
    const result = await aptos.waitForTransaction({ 
      transactionHash,
      options: {
        timeoutSecs: 30,
      }
    });
    
    setStatus(result.success ? 'success' : 'failed');
  } catch (error) {
    setStatus('timeout');
  } finally {
    setIsLoading(false);
  }
};
```

## 9. モバイル対応

### ディープリンクサポート

```tsx
const connectMobileWallet = async () => {
  if (isMobile()) {
    // モバイルウォレットアプリへのディープリンク
    const deepLink = `petra://dapp/connect?url=${encodeURIComponent(window.location.href)}`;
    window.location.href = deepLink;
  } else {
    // デスクトップでの通常接続
    await connect("Petra");
  }
};
```

## 10. テストとデバッグ

### テスト環境での設定

```tsx
// テスト用のモックウォレット
const mockWallet = {
  name: "Mock Wallet",
  connect: jest.fn(),
  disconnect: jest.fn(),
  signAndSubmitTransaction: jest.fn(),
};

// テスト用のProvider設定
<AptosWalletAdapterProvider
  dappConfig={{ network: Network.DEVNET }}
  autoConnect={false} // テスト時は無効化
>
  <TestComponent />
</AptosWalletAdapterProvider>
```

### デバッグのベストプラクティス

- ネットワーク設定の確認
- トランザクションペイロードの検証
- ガス設定の適切性チェック
- ウォレット状態の監視

## 11. 参考リソース

- **Wallet Adapter Demo**: https://aptos-labs.github.io/aptos-wallet-adapter/
- **GitHub Repository**: https://github.com/aptos-labs/aptos-wallet-adapter
- **AIP-62 Wallet Standard**: ウォレット標準仕様
- **Aptos Developer Documentation**: https://aptos.dev/

このガイドを参考に、安全で使いやすいウォレット統合を実装してください。