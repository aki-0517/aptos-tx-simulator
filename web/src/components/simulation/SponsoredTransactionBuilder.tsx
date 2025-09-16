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

interface SponsoredTransactionBuilderProps {
  onResults?: (results: any) => void;
}

export function SponsoredTransactionBuilder({ onResults }: SponsoredTransactionBuilderProps) {
  const { address } = useWallet();
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
  const [results, setResults] = useState<any>(null);

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
    try {
      const sponsoredData = {
        type: 'sponsored',
        transaction,
        sponsor: sponsorAddress,
        sender: transaction.sender,
        maxGasAmount: transaction.maxGasAmount,
        gasUnitPrice: transaction.gasUnitPrice,
      };

      const result = await sponsoredTransactionSimulator.simulateSponsored(sponsoredData);
      setResults(result);
      onResults?.(result);
    } catch (error) {
      console.error('Sponsored simulation failed:', error);
    } finally {
      setIsSimulating(false);
    }
  };

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
    setTransaction({
      type: 'entry_function',
      sender: '0x1d8722f9c5393155f17851c9e39557cda785421e0db9c5ba4b2f674a7e35c6ef',
      payload: {
        function: '0x1::coin::transfer',
        function_arguments: ['0x2::aptos_coin::AptosCoin', '0x2c2b4121696d61c0a69b8c0c6c5e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8', '100000000'],
        type_arguments: [],
      },
      maxGasAmount: 50000,
      gasUnitPrice: 100,
    });
    setSponsorAddress('0x3c2b4121696d61c0a69b8c0c6c5e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8e8');
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

      {/* Results */}
      {results && <SponsoredResultsDisplay results={results} />}
    </div>
  );
}

interface SponsoredResultsDisplayProps {
  results: any;
}

function SponsoredResultsDisplay({ results }: SponsoredResultsDisplayProps) {
  const formatAPT = (octas: number) => (octas / 100000000).toFixed(6);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Badge variant={results.success ? "default" : "destructive"}>
            {results.success ? 'Success' : 'Failed'}
          </Badge>
          Sponsored Transaction Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Cost Analysis */}
        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <DollarSign className="h-4 w-4" />
              Sponsor Costs
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Gas Used:</span>
                <span>{results.gasUsed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Total Cost:</span>
                <span className="font-medium">{formatAPT(results.sponsorCost)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Sponsor Balance:</span>
                <span>{formatAPT(results.sponsorBalance)} APT</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <ArrowRight className="h-4 w-4" />
              Sender Savings
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm">Without Sponsorship:</span>
                <span>{formatAPT(results.costComparison.withoutSponsorship)} APT</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">With Sponsorship:</span>
                <span className="text-green-600 font-medium">{formatAPT(results.costComparison.withSponsorship)} APT</span>
              </div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-sm font-medium">Total Savings:</span>
                <span className="text-green-600 font-bold">{formatAPT(results.senderSavings)} APT</span>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Transaction Details</h4>
          <div className="p-3 bg-muted/50 rounded-lg space-y-2">
            <div className="flex justify-between text-sm">
              <span>Status:</span>
              <span>{results.vmStatus}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Execution Time:</span>
              <span>{results.executionTime}ms</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Gas Unit Price:</span>
              <span>{results.gasUnitPrice}</span>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {!results.success && results.error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <div className="font-medium">Sponsored Transaction Failed</div>
                <div className="text-sm">
                  <strong>Error:</strong> {results.error.message || 'Unknown error occurred'}
                </div>
                {results.error.details && (
                  <div className="text-sm">
                    <strong>Details:</strong> {results.error.details}
                  </div>
                )}
                {results.error.suggestion && (
                  <div className="text-sm">
                    <strong>Suggestion:</strong> {results.error.suggestion}
                  </div>
                )}
                {results.error.code && (
                  <div className="text-sm">
                    <strong>Error Code:</strong> {results.error.code}
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Events and Changes */}
        {results.success && (results.events?.length > 0 || results.changes?.length > 0) && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium">Transaction Effects</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {results.events?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">Events</h5>
                  <div className="space-y-1">
                    {results.events.slice(0, 3).map((event: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                        {event.type || 'Event'} #{index + 1}
                      </div>
                    ))}
                    {results.events.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {results.events.length - 3} more events
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {results.changes?.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-xs font-medium text-muted-foreground">State Changes</h5>
                  <div className="space-y-1">
                    {results.changes.slice(0, 3).map((change: any, index: number) => (
                      <div key={index} className="text-xs p-2 bg-muted/30 rounded">
                        {change.type || 'Change'} at {change.address?.slice(0, 8)}...
                      </div>
                    ))}
                    {results.changes.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        ... and {results.changes.length - 3} more changes
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}