'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { useAptosClient } from '@/hooks/useAptosClient';
import { formatAddress, formatAPT } from '@/lib/utils';
import { Wallet, LogOut, RefreshCw, ExternalLink, AlertCircle } from 'lucide-react';

export function WalletConnection() {
  const { 
    isConnected, 
    isConnecting, 
    wallet, 
    error, 
    connect, 
    disconnect, 
    refreshBalance,
    currentNetwork 
  } = useWallet();
  
  const { availableNetworks, switchNetwork, getAccountExplorerUrl } = useAptosClient();

  if (!isConnected) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Connect Wallet
          </CardTitle>
          <CardDescription>
            Connect to Petra wallet to simulate transactions
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
              </div>
            </div>
          )}
          
          <Button 
            onClick={connect} 
            disabled={isConnecting}
            className="w-full"
            size="lg"
          >
            {isConnecting ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Wallet className="h-4 w-4 mr-2" />
                Connect to Petra Wallet
              </>
            )}
          </Button>
          
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Petra wallet extension must be installed
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-green-500" />
            Connected
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={disconnect}
          >
            <LogOut className="h-4 w-4 mr-1" />
            Disconnect
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Account Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Address</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.open(getAccountExplorerUrl(wallet!.account.address), '_blank')}
            >
              <ExternalLink className="h-3 w-3" />
            </Button>
          </div>
          <p className="font-mono text-sm bg-muted p-2 rounded">
            {formatAddress(wallet!.account.address)}
          </p>
        </div>

        {/* Balance */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Balance</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshBalance}
            >
              <RefreshCw className="h-3 w-3" />
            </Button>
          </div>
          <p className="text-lg font-bold">
            {wallet?.balance !== undefined ? formatAPT(wallet.balance * 100000000) : 'Loading...'}
          </p>
        </div>

        {/* Network */}
        <div className="space-y-2">
          <span className="text-sm font-medium">Network</span>
          <div className="flex gap-2">
            {availableNetworks.filter(net => net !== 'mainnet').map((network) => (
              <Button
                key={network}
                variant={currentNetwork === network ? "default" : "outline"}
                size="sm"
                onClick={() => switchNetwork(network)}
                className="capitalize"
              >
                {network === 'devnet' ? 'Devnet' : network === 'testnet' ? 'Testnet' : network}
              </Button>
            ))}
          </div>
        </div>

        {/* Connection Status */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Status</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Connected</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}