import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { WalletConnection } from '@/types';
import { aptosClient } from '@/lib/aptos-client';

interface WalletStore {
  // Connection state
  connection: WalletConnection;
  
  // Network
  currentNetwork: string;
  
  // Actions
  connect: () => Promise<void>;
  disconnect: () => void;
  switchNetwork: (network: string) => void;
  updateBalance: () => Promise<void>;
  
  // State setters
  setConnection: (connection: WalletConnection) => void;
  setConnecting: (isConnecting: boolean) => void;
  setError: (error: string | null) => void;
}

export const useWalletStore = create<WalletStore>()(
  devtools(
    persist(
      (set, get) => ({
        // Initial state
        connection: {
          isConnected: false,
          isConnecting: false,
        },
        currentNetwork: 'testnet',
        
        // Actions
        connect: async () => {
          const { setConnection, setConnecting } = get();
          
          try {
            setConnecting(true);
            
            // Check if Petra wallet is available
            if (typeof window === 'undefined' || !window.aptos) {
              throw new Error('Petra wallet not found. Please install Petra wallet extension.');
            }
            
            // Connect to Petra
            const response = await window.aptos.connect();
            
            if (response) {
              const account = await window.aptos.account();
              const network = await window.aptos.network();

              // Network normalize and switch client/network state
              const normalized = (network?.name || '').toLowerCase();
              const targetNetwork = ['devnet', 'testnet', 'mainnet'].includes(normalized) ? normalized : 'testnet';
              try {
                aptosClient.switchNetwork(targetNetwork);
                set({ currentNetwork: targetNetwork });
              } catch (e) {
                console.warn('Failed to switch Aptos client network:', e);
              }

              // Get balance on the correct network
              let balance = 0;
              try {
                balance = await aptosClient.getAccountBalance(account.address);
              } catch (error) {
                console.warn('Failed to fetch balance:', error);
              }

              setConnection({
                isConnected: true,
                isConnecting: false,
                wallet: {
                  name: 'Petra',
                  account: {
                    address: account.address,
                    publicKey: account.publicKey,
                  },
                  network: targetNetwork,
                  balance,
                },
              });
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
            setConnection({
              isConnected: false,
              isConnecting: false,
              error: errorMessage,
            });
          }
        },
        
        disconnect: () => {
          if (typeof window !== 'undefined' && window.aptos) {
            window.aptos.disconnect?.();
          }
          
          set({
            connection: {
              isConnected: false,
              isConnecting: false,
            },
          });
        },
        
        switchNetwork: (network: string) => {
          aptosClient.switchNetwork(network);
          set({ currentNetwork: network });
          
          // Update balance for new network
          get().updateBalance();
        },
        
        updateBalance: async () => {
          const { connection } = get();
          
          if (!connection.isConnected || !connection.wallet) {
            return;
          }
          
          try {
            const balance = await aptosClient.getAccountBalance(connection.wallet.account.address);
            
            set((state) => ({
              connection: {
                ...state.connection,
                wallet: state.connection.wallet ? {
                  ...state.connection.wallet,
                  balance,
                } : undefined,
              },
            }));
          } catch (error) {
            console.error('Failed to update balance:', error);
          }
        },
        
        // State setters
        setConnection: (connection) => set({ connection }),
        
        setConnecting: (isConnecting) =>
          set((state) => ({
            connection: { ...state.connection, isConnecting },
          })),
        
        setError: (error) =>
          set((state) => ({
            connection: { ...state.connection, error: error || undefined },
          })),
      }),
      {
        name: 'wallet-store',
        partialize: (state) => ({
          currentNetwork: state.currentNetwork,
        }),
      }
    ),
    {
      name: 'wallet-store',
    }
  )
);

// Global declaration for Petra wallet
declare global {
  interface Window {
    aptos?: {
      connect(): Promise<{ address: string; publicKey: string }>;
      disconnect?(): Promise<void>;
      account(): Promise<{ address: string; publicKey: string }>;
      network(): Promise<{ name: string; chainId: string }>;
      signAndSubmitTransaction(transaction: any): Promise<any>;
    };
  }
}