export interface WalletInfo {
  name: string;
  icon: string;
  url: string;
}

export interface ConnectedWallet {
  name: string;
  account: {
    address: string;
    publicKey: string;
  };
  network: string;
  balance?: number;
}

export interface WalletConnection {
  isConnected: boolean;
  isConnecting: boolean;
  wallet?: ConnectedWallet;
  error?: string;
}

export interface AccountResource {
  type: string;
  data: any;
}

export interface AccountBalance {
  coin: {
    value: string;
  };
}

export interface WalletAdapter {
  name: string;
  icon: string;
  url: string;
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  account(): Promise<{address: string; publicKey: string}>;
  network(): Promise<string>;
  signAndSubmitTransaction(transaction: any): Promise<any>;
}