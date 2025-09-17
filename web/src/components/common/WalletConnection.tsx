'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWallet } from '@/hooks/useWallet';
import { Wallet, AlertCircle } from 'lucide-react';

export function WalletConnection() {
  const { 
    isConnected, 
    isConnecting, 
    error, 
    connect
  } = useWallet();

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
                <Wallet className="h-4 w-4 mr-2 animate-pulse" />
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
        <CardTitle className="flex items-center gap-2">
          <Wallet className="h-5 w-5 text-green-500" />
          Wallet Connected
        </CardTitle>
        <CardDescription>
          Your wallet is connected and ready for transaction simulation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center text-sm text-muted-foreground">
          <p>ウォレットが接続されています</p>
          <p className="mt-1">ネットワーク切り替えと切断はヘッダーから行えます</p>
        </div>
      </CardContent>
    </Card>
  );
}