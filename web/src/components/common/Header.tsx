'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress } from '@/lib/utils';
import { Wallet, Github, ExternalLink } from 'lucide-react';

export function Header() {
  const { isConnected, wallet, connect, disconnect } = useWallet();

  return (
    <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 flex items-center justify-between h-16">
        {/* Logo & Title */}
        <div className="flex items-center space-x-4">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-primary-foreground font-bold">A</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">Aptos Simulator</h1>
              <p className="text-xs text-muted-foreground">MVP</p>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
          <Link 
            href="/" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Simulator
          </Link>
          <Link 
            href="/docs" 
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Documentation
          </Link>
          <a
            href="https://github.com/your-repo/aptos-tx-simulator"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1"
          >
            <Github className="h-4 w-4" />
            GitHub
          </a>
        </nav>

        {/* Wallet Connection */}
        <div className="flex items-center space-x-2">
          {isConnected && wallet ? (
            <div className="flex items-center space-x-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium">
                  {formatAddress(wallet.account.address)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {wallet.balance?.toFixed(4)} APT
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={disconnect}
              >
                Disconnect
              </Button>
            </div>
          ) : (
            <Button
              onClick={connect}
              size="sm"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}