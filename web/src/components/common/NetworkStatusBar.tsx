'use client';

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAptosClient } from '@/hooks/useAptosClient';
import { Wifi, WifiOff, Activity, Clock, TrendingUp, AlertCircle } from 'lucide-react';

interface NetworkStatus {
  network: 'devnet' | 'testnet' | 'mainnet';
  connectionStatus: 'connected' | 'connecting' | 'disconnected';
  blockHeight: number;
  gasPrice: number;
  congestion: 'low' | 'medium' | 'high';
  responseTime: number;
  lastUpdated: Date;
}

export function NetworkStatusBar() {
  const { client, currentNetwork } = useAptosClient();
  const [status, setStatus] = useState<NetworkStatus>({
    network: 'testnet',
    connectionStatus: 'connecting',
    blockHeight: 0,
    gasPrice: 0,
    congestion: 'low',
    responseTime: 0,
    lastUpdated: new Date(),
  });
  
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateNetworkStatus = async () => {
      const startTime = performance.now();
      
      try {
        
        setStatus(prev => ({ ...prev, connectionStatus: 'connecting' }));
        
        // Get ledger info for block height
        const ledgerInfo = await client.getLedgerInfo();
        
        // Estimate gas price
        let gasPrice = 100; // Default gas price
        try {
          const gasEstimate = await fetch(`${client.config.fullnode}/estimate_gas_price`);
          if (gasEstimate.ok) {
            const gasData = await gasEstimate.json();
            gasPrice = gasData.gas_estimate || gasPrice;
          }
        } catch {
          // Use default gas price if estimation fails
        }
        
        const responseTime = performance.now() - startTime;
        
        // Determine congestion based on response time
        const congestion: 'low' | 'medium' | 'high' = 
          responseTime < 1000 ? 'low' :
          responseTime < 3000 ? 'medium' : 'high';

        setStatus({
          network: currentNetwork as 'devnet' | 'testnet' | 'mainnet',
          connectionStatus: 'connected',
          blockHeight: parseInt(ledgerInfo.ledger_version),
          gasPrice,
          congestion,
          responseTime: Math.round(responseTime),
          lastUpdated: new Date(),
        });
      } catch (error) {
        console.error('Failed to update network status:', error);
        setStatus(prev => ({
          ...prev,
          connectionStatus: 'disconnected',
          lastUpdated: new Date(),
        }));
      }
    };

    // Initial update
    updateNetworkStatus();
    
    // Update every 30 seconds
    const interval = setInterval(updateNetworkStatus, 30000);
    
    return () => clearInterval(interval);
  }, [client, currentNetwork]);

  const getStatusColor = () => {
    switch (status.connectionStatus) {
      case 'connected':
        return 'bg-green-500';
      case 'connecting':
        return 'bg-yellow-500 animate-pulse';
      case 'disconnected':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCongestionColor = () => {
    switch (status.congestion) {
      case 'low':
        return 'text-green-600 bg-green-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'high':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatNumber = (num: number): string => {
    return num.toLocaleString();
  };

  const formatGasPrice = (price: number): string => {
    return `${price} octas`;
  };

  return (
    <Card className={`transition-all duration-200 ${isExpanded ? 'p-4' : 'p-2'}`}>
      <div className="flex items-center justify-between">
        {/* Compact Status */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
            <span className="text-sm font-medium capitalize">{status.network}</span>
          </div>
          
          {status.connectionStatus === 'connected' && (
            <>
              <div className="flex items-center gap-1 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                #{formatNumber(status.blockHeight)}
              </div>
              
              <Badge className={`text-xs ${getCongestionColor()}`}>
                {status.congestion} congestion
              </Badge>
            </>
          )}
          
          {status.connectionStatus === 'disconnected' && (
            <div className="flex items-center gap-1 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" />
              Disconnected
            </div>
          )}
        </div>

        {/* Expand/Collapse Button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Less' : 'More'}
        </Button>
      </div>

      {/* Expanded Details */}
      {isExpanded && status.connectionStatus === 'connected' && (
        <div className="mt-4 space-y-4 border-t pt-4">
          {/* Network Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Wifi className="h-4 w-4" />
                Status
              </div>
              <div className="font-medium capitalize">
                {status.connectionStatus}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Activity className="h-4 w-4" />
                Block Height
              </div>
              <div className="font-medium">
                #{formatNumber(status.blockHeight)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <TrendingUp className="h-4 w-4" />
                Gas Price
              </div>
              <div className="font-medium">
                {formatGasPrice(status.gasPrice)}
              </div>
            </div>
            
            <div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="h-4 w-4" />
                Response Time
              </div>
              <div className="font-medium">
                {status.responseTime}ms
              </div>
            </div>
          </div>

          {/* Congestion Status */}
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium text-sm">Network Congestion</h4>
                <p className="text-xs text-gray-600">
                  Based on response time and current gas prices
                </p>
              </div>
              <Badge className={getCongestionColor()}>
                {status.congestion.toUpperCase()}
              </Badge>
            </div>
            
            {status.congestion === 'high' && (
              <div className="mt-2 text-xs text-orange-600">
                ⚠️ High network congestion detected. Transactions may take longer to process.
              </div>
            )}
            
            {status.congestion === 'medium' && (
              <div className="mt-2 text-xs text-yellow-600">
                ⚡ Moderate network activity. Normal processing times expected.
              </div>
            )}
            
            {status.congestion === 'low' && (
              <div className="mt-2 text-xs text-green-600">
                ✅ Low network congestion. Fast transaction processing.
              </div>
            )}
          </div>

          {/* Last Updated */}
          <div className="text-xs text-gray-500 text-right">
            Last updated: {status.lastUpdated.toLocaleTimeString()}
          </div>
        </div>
      )}

      {/* Disconnected State */}
      {isExpanded && status.connectionStatus === 'disconnected' && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2 text-red-800 mb-2">
            <WifiOff className="h-4 w-4" />
            <span className="font-medium">Connection Lost</span>
          </div>
          <p className="text-sm text-red-600">
            Unable to connect to the {status.network} network. 
            Please check your internet connection and try again.
          </p>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2"
            onClick={() => window.location.reload()}
          >
            Retry Connection
          </Button>
        </div>
      )}
    </Card>
  );
}