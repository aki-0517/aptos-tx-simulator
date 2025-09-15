import { useEffect, useCallback } from 'react';
import { useWalletStore } from '@/stores/walletStore';

export function useWallet() {
  const {
    connection,
    currentNetwork,
    connect,
    disconnect,
    switchNetwork,
    updateBalance,
    setError,
  } = useWalletStore();

  // Auto-connect if previously connected
  useEffect(() => {
    const autoConnect = async () => {
      if (typeof window === 'undefined' || !window.aptos) {
        return;
      }

      try {
        // Check if already connected
        const isConnected = await window.aptos.account().then(() => true).catch(() => false);
        if (isConnected && !connection.isConnected) {
          await connect();
        }
      } catch (error) {
        // Silent fail for auto-connect
      }
    };

    autoConnect();
  }, [connect, connection.isConnected]);

  const handleConnect = useCallback(async () => {
    try {
      setError(null);
      await connect();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Connection failed';
      setError(errorMessage);
    }
  }, [connect, setError]);

  const handleDisconnect = useCallback(() => {
    try {
      disconnect();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  }, [disconnect]);

  const handleNetworkSwitch = useCallback(async (network: string) => {
    try {
      switchNetwork(network);
      // After switching, proactively refresh balance with the new network
      await updateBalance();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Network switch failed';
      setError(errorMessage);
    }
  }, [switchNetwork, updateBalance, setError]);

  const refreshBalance = useCallback(async () => {
    if (connection.isConnected) {
      await updateBalance();
    }
  }, [connection.isConnected, updateBalance]);

  return {
    // State
    isConnected: connection.isConnected,
    isConnecting: connection.isConnecting,
    wallet: connection.wallet,
    error: connection.error,
    currentNetwork,

    // Actions
    connect: handleConnect,
    disconnect: handleDisconnect,
    switchNetwork: handleNetworkSwitch,
    refreshBalance,

    // Utility
    account: connection.wallet?.account,
    balance: connection.wallet?.balance,
    address: connection.wallet?.account.address,
  };
}