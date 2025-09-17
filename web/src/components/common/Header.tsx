'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { useAptosClient } from '@/hooks/useAptosClient';
import { formatAddress } from '@/lib/utils';
import { Wallet, Github, ExternalLink, LogOut } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function Header() {
  const { isConnected, wallet, connect, disconnect, currentNetwork } = useWallet();
  const { availableNetworks, switchNetwork, getAccountExplorerUrl } = useAptosClient();

  return (
    <header className="border-b border-border bg-background h-12 flex items-center justify-between px-4">
      <div className="flex items-center justify-between w-full">
        {/* Logo & Title */}
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2">
            <span className="font-medium text-sm">Aptos Transaction Simulator</span>
          </Link>
        </div>

        {/* Menu Items */}
        <nav className="hidden md:flex items-center space-x-4">
          <span className="text-xs text-muted-foreground">File</span>
          <span className="text-xs text-muted-foreground">Edit</span>
          <span className="text-xs text-muted-foreground">View</span>
          <span className="text-xs text-muted-foreground">Help</span>
        </nav>

        {/* Right side - Wallet Info */}
        <div className="flex items-center space-x-3">
          {isConnected && wallet ? (
            <div className="flex items-center space-x-2">
              <Select value={currentNetwork} onValueChange={switchNetwork}>
                <SelectTrigger className="w-[100px] h-7 text-xs bg-input border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border">
                  {availableNetworks.filter(net => net !== 'mainnet').map((network) => (
                    <SelectItem key={network} value={network} className="text-xs">
                      {network === 'devnet' ? 'Devnet' : network === 'testnet' ? 'Testnet' : network}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <span className="text-xs text-muted-foreground hidden sm:inline">
                {formatAddress(wallet.account.address)}
              </span>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
                className="h-7 px-2 text-xs"
              >
                <LogOut className="h-3 w-3" />
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              size="sm"
              className="h-7 px-3 text-xs"
            >
              <Wallet className="h-3 w-3 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}