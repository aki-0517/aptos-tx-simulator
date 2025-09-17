'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useWallet } from '@/hooks/useWallet';
import { useAptosClient } from '@/hooks/useAptosClient';
import { Wallet, RefreshCw, TrendingUp, TrendingDown, DollarSign, Eye, EyeOff } from 'lucide-react';

interface CoinBalance {
  coinType: string;
  balance: string;
  symbol: string;
  name: string;
  decimals: number;
  usdValue?: number;
}

interface BalanceHistory {
  timestamp: Date;
  balance: string;
  change: number;
}

export function BalancePanel() {
  const { connected, account } = useWallet();
  const { getCurrentClient } = useAptosClient();
  const [balances, setBalances] = useState<CoinBalance[]>([]);
  const [history, setHistory] = useState<Map<string, BalanceHistory[]>>(new Map());
  const [loading, setLoading] = useState(false);
  const [showBalances, setShowBalances] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    if (connected && account) {
      fetchBalances();
      // Update every 30 seconds
      const interval = setInterval(fetchBalances, 30000);
      return () => clearInterval(interval);
    }
  }, [connected, account]);

  const fetchBalances = async () => {
    if (!account) return;
    
    setLoading(true);
    try {
      const client = getCurrentClient();
      
      // Get account resources
      const resources = await client.getAccountResources(account.address);
      
      const coinBalances: CoinBalance[] = [];
      
      // Find coin store resources
      for (const resource of resources) {
        if (resource.type.includes('::coin::CoinStore<')) {
          // Extract coin type from resource type
          const coinTypeMatch = resource.type.match(/::coin::CoinStore<(.+)>/);
          if (coinTypeMatch) {
            const coinType = coinTypeMatch[1];
            const balance = resource.data?.coin?.value || '0';
            
            // Get coin info (this would typically come from a coin registry)
            const coinInfo = await getCoinInfo(coinType);
            
            coinBalances.push({
              coinType,
              balance,
              symbol: coinInfo.symbol,
              name: coinInfo.name,
              decimals: coinInfo.decimals,
            });
          }
        }
      }

      // Update history
      const newHistory = new Map(history);
      coinBalances.forEach(coin => {
        const coinHistory = newHistory.get(coin.coinType) || [];
        const previousBalance = coinHistory.length > 0 ? coinHistory[coinHistory.length - 1].balance : '0';
        const change = parseFloat(coin.balance) - parseFloat(previousBalance);
        
        coinHistory.push({
          timestamp: new Date(),
          balance: coin.balance,
          change,
        });
        
        // Keep only last 24 entries (24 hours with 30s intervals = 2880, but we'll keep 24 for demo)
        if (coinHistory.length > 24) {
          coinHistory.shift();
        }
        
        newHistory.set(coin.coinType, coinHistory);
      });

      setBalances(coinBalances);
      setHistory(newHistory);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Failed to fetch balances:', error);
    } finally {
      setLoading(false);
    }
  };

  const getCoinInfo = async (coinType: string) => {
    // 実データのみを使用し、コイン情報を動的に取得
    try {
      // Aptos標準コインの情報を取得
      if (coinType === '0x1::aptos_coin::AptosCoin') {
        return {
          symbol: 'APT',
          name: 'Aptos Token',
          decimals: 8,
        };
      }
      
      // その他のコインについては、コインタイプから情報を推測
      const coinTypeParts = coinType.split('::');
      const coinName = coinTypeParts[coinTypeParts.length - 1] || 'Unknown';
      
      return {
        symbol: coinName.slice(0, 6).toUpperCase(),
        name: `${coinName} Token`,
        decimals: 8, // デフォルトは8桁
      };
    } catch (error) {
      console.warn('Failed to get coin info:', error);
      return {
        symbol: 'UNKNOWN',
        name: 'Unknown Token',
        decimals: 8,
      };
    }
  };

  const formatBalance = (balance: string, decimals: number): string => {
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    if (balanceNum === 0) return '0';
    if (balanceNum < 0.0001) return '< 0.0001';
    return balanceNum.toLocaleString(undefined, { maximumFractionDigits: 4 });
  };

  const formatUSDValue = (balance: string, decimals: number, usdPrice?: number): string => {
    if (!usdPrice) return 'N/A';
    const balanceNum = parseFloat(balance) / Math.pow(10, decimals);
    const usdValue = balanceNum * usdPrice;
    return `$${usdValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getBalanceChange = (coinType: string): { change: number; percentage: number } => {
    const coinHistory = history.get(coinType);
    if (!coinHistory || coinHistory.length < 2) {
      return { change: 0, percentage: 0 };
    }

    const current = parseFloat(coinHistory[coinHistory.length - 1].balance);
    const previous = parseFloat(coinHistory[coinHistory.length - 2].balance);
    const change = current - previous;
    const percentage = previous === 0 ? 0 : (change / previous) * 100;

    return { change, percentage };
  };

  if (!connected) {
    return (
      <Card className="p-6">
        <div className="flex flex-col items-center justify-center text-center">
          <Wallet className="h-12 w-12 text-gray-400 mb-3" />
          <h3 className="font-semibold text-gray-600 mb-2">Wallet Not Connected</h3>
          <p className="text-sm text-gray-500">
            Connect your wallet to view your token balances
          </p>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Wallet className="h-5 w-5" />
          <h3 className="font-semibold">Your Balances</h3>
          {lastUpdated && (
            <Badge variant="outline" className="text-xs">
              {lastUpdated.toLocaleTimeString()}
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowBalances(!showBalances)}
          >
            {showBalances ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={fetchBalances}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {loading && balances.length === 0 ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-pulse text-gray-500">Loading balances...</div>
        </div>
      ) : balances.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No token balances found</p>
          <p className="text-sm mt-1">Make sure your wallet has tokens on this network</p>
        </div>
      ) : (
        <div className="space-y-3">
          {balances.map((coin) => {
            const balanceChange = getBalanceChange(coin.coinType);
            const hasChange = balanceChange.change !== 0;

            return (
              <div
                key={coin.coinType}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-blue-600">
                      {coin.symbol.slice(0, 2)}
                    </span>
                  </div>
                  
                  <div>
                    <div className="font-medium">{coin.symbol}</div>
                    <div className="text-xs text-gray-600">{coin.name}</div>
                  </div>
                </div>

                <div className="text-right">
                  <div className="font-medium">
                    {showBalances 
                      ? formatBalance(coin.balance, coin.decimals)
                      : '****'
                    } {coin.symbol}
                  </div>
                  
                  <div className="flex items-center gap-2 text-xs">
                    {showBalances && coin.usdValue && (
                      <span className="text-gray-600">
                        {formatUSDValue(coin.balance, coin.decimals, coin.usdValue)}
                      </span>
                    )}
                    
                    {hasChange && (
                      <div className={`flex items-center gap-1 ${
                        balanceChange.change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {balanceChange.change > 0 ? (
                          <TrendingUp className="h-3 w-3" />
                        ) : (
                          <TrendingDown className="h-3 w-3" />
                        )}
                        <span>
                          {balanceChange.percentage > 0 ? '+' : ''}
                          {balanceChange.percentage.toFixed(2)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Account Info */}
      <div className="mt-4 pt-4 border-t">
        <div className="text-xs text-gray-600">
          <div className="flex items-center justify-between">
            <span>Account:</span>
            <code className="bg-gray-100 px-2 py-1 rounded text-xs">
              {account?.address.slice(0, 6)}...{account?.address.slice(-4)}
            </code>
          </div>
        </div>
      </div>
    </Card>
  );
}