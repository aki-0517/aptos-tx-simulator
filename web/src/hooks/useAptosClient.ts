import { useCallback, useEffect, useState } from 'react';
import { aptosClient, NETWORK_CONFIGS } from '@/lib/aptos-client';
import { useWalletStore } from '@/stores/walletStore';

export function useAptosClient() {
  const { currentNetwork, switchNetwork } = useWalletStore();
  const [isLoading, setIsLoading] = useState(false);

  const client = aptosClient.getCurrentClient();
  const networkConfig = aptosClient.getNetworkConfig();

  const handleNetworkSwitch = useCallback(async (network: string) => {
    try {
      setIsLoading(true);
      switchNetwork(network);
    } catch (error) {
      console.error('Failed to switch network:', error);
    } finally {
      setIsLoading(false);
    }
  }, [switchNetwork]);

  const getAccountBalance = useCallback(async (address: string) => {
    try {
      return await aptosClient.getAccountBalance(address);
    } catch (error) {
      console.error('Failed to get account balance:', error);
      return 0;
    }
  }, []);

  const getAccountInfo = useCallback(async (address: string) => {
    try {
      return await aptosClient.getAccountInfo(address);
    } catch (error) {
      console.error('Failed to get account info:', error);
      throw error;
    }
  }, []);

  const getCurrentGasPrice = useCallback(async () => {
    try {
      return await aptosClient.getCurrentGasPrice();
    } catch (error) {
      console.error('Failed to get gas price:', error);
      return 100; // Default gas price
    }
  }, []);

  return {
    client,
    currentNetwork,
    networkConfig,
    availableNetworks: Object.keys(NETWORK_CONFIGS),
    isLoading,
    switchNetwork: handleNetworkSwitch,
    getAccountBalance,
    getAccountInfo,
    getCurrentGasPrice,
    getExplorerUrl: aptosClient.getExplorerUrl.bind(aptosClient),
    getAccountExplorerUrl: aptosClient.getAccountExplorerUrl.bind(aptosClient),
  };
}