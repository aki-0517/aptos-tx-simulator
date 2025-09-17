'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, DollarSign, Play, AlertCircle, ArrowRight, FileText } from 'lucide-react';
import { TransactionData, SponsoredTransactionData } from '@/types/aptos';
import { sponsoredTransactionSimulator } from '@/lib/sponsored-simulator';
import { useWallet } from '@/hooks/useWallet';
import { useSimulationStore } from '@/stores/simulationStore';

interface SponsoredTransactionBuilderProps {
  onResults?: (results: any) => void;
  onSimulationRun?: () => void;
}

export function SponsoredTransactionBuilder({ onResults, onSimulationRun }: SponsoredTransactionBuilderProps) {
  const { address } = useWallet();
  const { setResult, setStatus, addToHistory } = useSimulationStore();
  const [sponsorAddress, setSponsorAddress] = useState('');
  const [transaction, setTransaction] = useState<any>({
    type: 'entry_function',
    sender: address || '',
    payload: {
      function: '',
      function_arguments: [],
      type_arguments: [],
    },
    maxGasAmount: 100000,
    gasUnitPrice: 100,
  });
  const [sponsorValidation, setSponsorValidation] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  // Update sender when wallet address changes
  useEffect(() => {
    if (address && !transaction.sender) {
      setTransaction((prev: any) => ({ ...prev, sender: address }));
    }
  }, [address, transaction.sender]);

  const validateSponsor = async () => {
    if (!sponsorAddress) return;

    try {
      const estimatedCost = (transaction.maxGasAmount || 100000) * (transaction.gasUnitPrice || 100);
      const validation = await sponsoredTransactionSimulator.validateSponsor(sponsorAddress, estimatedCost);
      setSponsorValidation(validation);
    } catch (error) {
      setSponsorValidation({
        valid: false,
        balance: 0,
        canAfford: false,
        errors: ['Failed to validate sponsor'],
      });
    }
  };

  const simulateSponsored = async () => {
    if (!sponsorAddress || !transaction.sender) return;

    setIsSimulating(true);
    setStatus('simulating');
    onSimulationRun?.();
    try {
      const sponsoredData = {
        type: 'sponsored' as const,
        transaction,
        sponsor: sponsorAddress, // 正しいプロパティ名
        sender: transaction.sender,
        maxGasAmount: transaction.maxGasAmount,
        gasUnitPrice: transaction.gasUnitPrice,
      };

      const result = await sponsoredTransactionSimulator.simulateSponsored(sponsoredData);
      
      // Transform sponsored result to match SimulationResult format
      const simulationResult = {
        ...result, // Spread the result as it extends SimulationResult
        timestamp: Date.now(),
        // Add sponsored-specific data
        sponsoredData: {
          type: 'sponsored',
          sponsorAddress,
          sponsorCost: result.sponsorCost || 0,
          senderSavings: result.senderSavings || 0,
          sponsorBalance: result.sponsorBalance || 0,
          costComparison: result.costComparison || {
            withSponsorship: 0,
            withoutSponsorship: 0
          }
        }
      };
      
      setResult(simulationResult);
      setStatus('success');
      addToHistory(simulationResult);
      onResults?.(result);
    } catch (error: any) {
      console.error('Sponsored simulation failed:', error);
      
      // Create error result
      const errorResult = {
        success: false,
        gasUsed: 0,
        gasUnitPrice: transaction.gasUnitPrice || 100,
        totalGasCost: 0,
        totalGasCostAPT: 0,
        vmStatus: 'FAILED',
        executionTime: 0,
        timestamp: Date.now(),
        error: {
          message: error.message || 'Sponsored simulation failed',
          details: error.details || 'An unexpected error occurred during sponsored simulation',
          code: error.code || 'SPONSORED_SIMULATION_ERROR'
        },
        sponsoredData: {
          type: 'sponsored',
          sponsorAddress,
          sponsorCost: 0,
          senderSavings: 0,
          sponsorBalance: 0,
          costComparison: {
            withSponsorship: 0,
            withoutSponsorship: 0
          }
        }
      };
      
      setResult(errorResult);
      setStatus('error');
      onResults?.(errorResult);
    } finally {
      setIsSimulating(false);
    }
  };;

  const updateTransaction = (updates: any) => {
    setTransaction((prev: any) => ({ ...prev, ...updates }));
    // Clear sponsor validation when transaction changes
    if (sponsorValidation) {
      setSponsorValidation(null);
    }
  };

  const updatePayload = (field: string, value: any) => {
    const payload = transaction.payload as any;
    updateTransaction({
      payload: { ...payload, [field]: value }
    });
  };

  const formatBalance = (balance: number) => (balance / 100000000).toFixed(6);

  const loadExample = () => {
    const senderAddr = '0xddab2c9c082b121333038b86b2aff5e917b12901bc1ce7ea49b4fc579504f0d0';
    const recipient = '0x' + '2'.repeat(64);
    const sponsor = '0x' + '3'.repeat(64);

    setTransaction({
      type: 'entry_function',
      sender: senderAddr,
      payload: {
        function: '0x1::coin::transfer',
        function_arguments: [recipient, '100000000'],
        type_arguments: ['0x1::aptos_coin::AptosCoin'],
      },
      maxGasAmount: 50000,
      gasUnitPrice: 100,
    });
    setSponsorAddress(sponsor);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Sponsored Transaction Builder
          </CardTitle>
          <CardDescription>
            Create a transaction where a sponsor pays the gas fees
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Transaction Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-medium">Transaction Details</h3>
              <Button variant="outline" size="sm" onClick={loadExample}>
                <FileText className="h-4 w-4 mr-1" />
                Load Example
              </Button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Sender Address</label>
                <Input
                  placeholder="0x..."
                  value={transaction.sender}
                  onChange={(e) => updateTransaction({ sender: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  The account that initiates the transaction
                </p>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Sponsor Address</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="0x..."
                    value={sponsorAddress}
                    onChange={(e) => setSponsorAddress(e.target.value)}
                  />
                  <Button variant="outline" onClick={validateSponsor} disabled={!sponsorAddress}>
                    Validate
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  The account that pays for gas fees
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Function</label>
              <Input
                placeholder="0x1::coin::transfer"
                value={(transaction.payload as any)?.function || ''}
                onChange={(e) => updatePayload('function', e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Arguments</label>
              <Textarea
                placeholder="arg1, arg2, arg3 (comma-separated)"
                value={(transaction.payload as any)?.function_arguments?.join(', ') || ''}
                onChange={(e) => {
                  const args = e.target.value.split(',').map(arg => arg.trim()).filter(Boolean);
                  updatePayload('function_arguments', args);
                }}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Max Gas Amount</label>
                <Input
                  type="number"
                  value={transaction.maxGasAmount || ''}
                  onChange={(e) => updateTransaction({ maxGasAmount: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Gas Unit Price</label>
                <Input
                  type="number"
                  value={transaction.gasUnitPrice || ''}
                  onChange={(e) => updateTransaction({ gasUnitPrice: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
          </div>

          {/* Sponsor Validation Results */}
          {sponsorValidation && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Sponsor Validation</h3>
              
              {sponsorValidation.valid ? (
                <Alert>
                  <UserCheck className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-2">
                      <div className="font-medium">Sponsor is valid</div>
                      <div className="text-sm">
                        Balance: {formatBalance(sponsorValidation.balance)} APT
                        {sponsorValidation.canAfford ? (
                          <Badge className="ml-2" variant="default">Can afford transaction</Badge>
                        ) : (
                          <Badge className="ml-2" variant="destructive">Insufficient balance</Badge>
                        )}
                      </div>
                    </div>
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="space-y-1">
                      <div className="font-medium">Sponsor validation failed</div>
                      {sponsorValidation.errors.map((error: string, index: number) => (
                        <div key={index} className="text-sm">• {error}</div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Cost Breakdown Preview */}
          {sponsorValidation?.valid && (
            <div className="p-4 bg-muted/50 rounded-lg">
              <h4 className="text-sm font-medium mb-3">Cost Breakdown</h4>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Estimated Gas Cost:</span>
                  <span>{formatBalance((transaction.maxGasAmount || 0) * (transaction.gasUnitPrice || 0))} APT</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sender Pays:</span>
                  <span className="text-green-600 font-medium">0 APT (Sponsored)</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Sponsor Pays:</span>
                  <span className="font-medium">{formatBalance((transaction.maxGasAmount || 0) * (transaction.gasUnitPrice || 0))} APT</span>
                </div>
              </div>
            </div>
          )}

          {/* Simulate Button */}
          <Button 
            onClick={simulateSponsored} 
            disabled={!sponsorAddress || !transaction.sender || isSimulating || (sponsorValidation && !sponsorValidation.valid)}
            className="w-full" 
            size="lg"
          >
            {isSimulating ? (
              'Simulating Sponsored Transaction...'
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Simulate Sponsored Transaction
              </>
            )}
          </Button>
        </CardContent>
      </Card>

    </div>
  );
}