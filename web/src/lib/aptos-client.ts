import { Aptos, AptosConfig, Network, Account, AccountAddress, SimpleTransaction, InputEntryFunctionData } from '@aptos-labs/ts-sdk';
import { NetworkConfig, AptosNetwork } from '@/types';

export const NETWORK_CONFIGS: Record<string, NetworkConfig> = {
  devnet: {
    name: 'Devnet',
    network: Network.DEVNET,
    rpcUrl: 'https://fullnode.devnet.aptoslabs.com',
    faucetUrl: 'https://faucet.devnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=devnet',
  },
  testnet: {
    name: 'Testnet', 
    network: Network.TESTNET,
    rpcUrl: 'https://fullnode.testnet.aptoslabs.com',
    faucetUrl: 'https://faucet.testnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=testnet',
  },
  mainnet: {
    name: 'Mainnet',
    network: Network.MAINNET,
    rpcUrl: 'https://fullnode.mainnet.aptoslabs.com',
    explorerUrl: 'https://explorer.aptoslabs.com/?network=mainnet',
  },
};

export class AptosClientManager {
  private clients: Map<string, Aptos> = new Map();
  private currentNetwork: string = 'devnet';

  constructor() {
    this.initializeClients();
  }

  private initializeClients() {
    Object.entries(NETWORK_CONFIGS).forEach(([key, config]) => {
      const aptosConfig = new AptosConfig({
        network: config.network,
        fullnode: config.rpcUrl,
        faucet: config.faucetUrl,
      });
      this.clients.set(key, new Aptos(aptosConfig));
    });
  }

  getCurrentClient(): Aptos {
    const client = this.clients.get(this.currentNetwork);
    if (!client) {
      throw new Error(`Client for network ${this.currentNetwork} not found`);
    }
    return client;
  }

  switchNetwork(network: string): void {
    if (!this.clients.has(network)) {
      throw new Error(`Network ${network} not supported`);
    }
    this.currentNetwork = network;
  }

  getCurrentNetwork(): string {
    return this.currentNetwork;
  }

  getNetworkConfig(network?: string): NetworkConfig {
    const targetNetwork = network || this.currentNetwork;
    const config = NETWORK_CONFIGS[targetNetwork];
    if (!config) {
      throw new Error(`Network config for ${targetNetwork} not found`);
    }
    return config;
  }

  async getAccountBalance(address: string): Promise<number> {
    const client = this.getCurrentClient();
    try {
      // Check if account exists first
      await client.getAccountInfo({
        accountAddress: address,
      });
      
      const resources = await client.getAccountResources({
        accountAddress: address,
      });
      
      const coinResource = resources.find(
        (resource) => resource.type === '0x1::coin::CoinStore<0x1::aptos_coin::AptosCoin>'
      );
      
      if (coinResource && coinResource.data) {
        const coinData = coinResource.data as any;
        return parseInt(coinData.coin.value) / 100000000; // Convert from octas to APT
      }
      
      return 0;
    } catch (error: any) {
      // Handle account not found errors silently
      if (error?.status === 404 || error?.message?.includes('Account not found')) {
        console.warn(`Account ${address} not found on ${this.currentNetwork}`);
        return 0;
      }
      
      // Handle JSON parsing errors
      if (error?.message?.includes('Unexpected end of JSON input')) {
        console.warn(`Failed to parse response for account ${address}`);
        return 0;
      }
      
      console.error('Error fetching account balance:', error);
      return 0;
    }
  }

  async getAccountInfo(address: string) {
    const client = this.getCurrentClient();
    try {
      const account = await client.getAccountInfo({
        accountAddress: address,
      });
      return account;
    } catch (error: any) {
      // Handle account not found errors
      if (error?.status === 404 || error?.message?.includes('Account not found')) {
        throw new Error(`Account ${address} does not exist on ${this.currentNetwork}`);
      }
      
      // Handle JSON parsing errors
      if (error?.message?.includes('Unexpected end of JSON input')) {
        throw new Error(`Failed to fetch account info for ${address} - network response error`);
      }
      
      // Handle network errors
      if (error?.message?.includes('Failed to fetch')) {
        throw new Error(`Network error when fetching account ${address}`);
      }
      
      console.error('Error fetching account info:', error);
      throw error;
    }
  }

  async getCurrentGasPrice(): Promise<number> {
    const client = this.getCurrentClient();
    try {
      const estimate = await client.getGasPriceEstimation();
      return estimate.gas_estimate;
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return 100; // Default gas price
    }
  }

  getExplorerUrl(txHash?: string): string {
    const config = this.getNetworkConfig();
    if (txHash) {
      return `${config.explorerUrl}/txn/${txHash}`;
    }
    return config.explorerUrl;
  }

  getAccountExplorerUrl(address: string): string {
    const config = this.getNetworkConfig();
    return `${config.explorerUrl}/account/${address}`;
  }
}

// Singleton instance
export const aptosClient = new AptosClientManager();