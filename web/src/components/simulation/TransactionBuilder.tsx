'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSimulation } from '@/hooks/useSimulation';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress, parseTransactionArguments, validateMoveFunction, validateAddress } from '@/lib/utils';
import { TransactionPayloadEntryFunction } from '@aptos-labs/ts-sdk';

export function TransactionBuilder() {
  const { 
    transactionData, 
    isSimulating, 
    validationErrors, 
    isValid,
    simulate,
    updateTransactionField,
    updateFunction,
    updateArguments,
    updateTypeArguments 
  } = useSimulation();
  
  const { isConnected, address, currentNetwork } = useWallet();

  useEffect(() => {
    if (currentNetwork) {
      console.log('[Aptos] Current network:', currentNetwork);
    }
  }, [currentNetwork]);
  
  const [functionName, setFunctionName] = useState('');
  const [argumentsText, setArgumentsText] = useState('');
  const [typeArgumentsText, setTypeArgumentsText] = useState('');

  const handleFunctionChange = (func: string) => {
    setFunctionName(func);
    updateFunction(func);
  };

  const handleArgumentsChange = (argsText: string) => {
    setArgumentsText(argsText);
    try {
      const args = argsText.split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
      const parsedArgs = parseTransactionArguments(args);
      updateArguments(parsedArgs);
    } catch (error) {
      console.error('Failed to parse arguments:', error);
    }
  };

  const handleTypeArgumentsChange = (typeArgsText: string) => {
    setTypeArgumentsText(typeArgsText);
    const typeArgs = typeArgsText.split(',').map(arg => arg.trim()).filter(arg => arg.length > 0);
    updateTypeArguments(typeArgs);
  };

  const handleSenderChange = (sender: string) => {
    updateTransactionField('sender', sender);
  };

  const handleGasChange = (field: 'maxGasAmount' | 'gasUnitPrice', value: string) => {
    const numValue = parseInt(value) || 0;
    updateTransactionField(field, numValue);
  };

  const fillWalletAddress = () => {
    if (address) {
      handleSenderChange(address);
    }
  };

  const handleSimulate = async () => {
    if (!isValid) {
      return;
    }
    await simulate();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Transaction</CardTitle>
        <CardDescription>
          Enter the transaction details you want to simulate
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Sender Address */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Sender Address</label>
          <div className="flex space-x-2">
            <Input
              placeholder="0x..."
              value={transactionData.sender || ''}
              onChange={(e) => handleSenderChange(e.target.value)}
              className="flex-1"
            />
            {isConnected && (
              <Button 
                type="button" 
                variant="outline" 
                onClick={fillWalletAddress}
              >
                From Wallet
              </Button>
            )}
          </div>
          {transactionData.sender && !validateAddress(transactionData.sender) && (
            <p className="text-sm text-destructive">Invalid address format</p>
          )}
        </div>

        {/* Function */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Function</label>
          <Input
            placeholder="0x1::coin::transfer (example)"
            value={functionName}
            onChange={(e) => handleFunctionChange(e.target.value)}
          />
          {functionName && !validateMoveFunction(functionName) && (
            <p className="text-sm text-destructive">
              Please enter in address::module::function format
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Enter the Move function you want to call in address::module::function format
          </p>
        </div>

        {/* Arguments */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Arguments</label>
          <Textarea
            placeholder="arg1, arg2, arg3 (comma-separated)"
            value={argumentsText}
            onChange={(e) => handleArgumentsChange(e.target.value)}
            rows={3}
          />
          <p className="text-xs text-muted-foreground">
            Enter function arguments separated by commas (e.g., 100, 0x123..., true)
          </p>
        </div>

        {/* Type Arguments */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Type Arguments (Optional)</label>
          <Input
            placeholder="type1, type2 (comma-separated)"
            value={typeArgumentsText}
            onChange={(e) => handleTypeArgumentsChange(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            Enter type arguments for generic functions (e.g., 0x1::aptos_coin::AptosCoin)
          </p>
        </div>

        {/* Gas Settings */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Max Gas Amount</label>
            <Input
              type="number"
              value={transactionData.maxGasAmount || ''}
              onChange={(e) => handleGasChange('maxGasAmount', e.target.value)}
              placeholder="100000"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium">Gas Unit Price</label>
            <Input
              type="number"
              value={transactionData.gasUnitPrice || ''}
              onChange={(e) => handleGasChange('gasUnitPrice', e.target.value)}
              placeholder="100"
            />
          </div>
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-md">
            <h4 className="font-medium text-destructive mb-2">Errors:</h4>
            <ul className="list-disc list-inside space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index} className="text-sm text-destructive">
                  {error}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Simulate Button */}
        <Button
          onClick={handleSimulate}
          disabled={!isValid || isSimulating}
          className="w-full"
          size="lg"
        >
          {isSimulating ? 'Simulating...' : 'Run Simulation'}
        </Button>

        {/* Sample Functions */}
        <div className="border-t pt-4 space-y-2">
          <h4 className="text-sm font-medium">Common Function Examples:</h4>
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const func = '0x1::coin::transfer';
                const typeText = '0x1::aptos_coin::AptosCoin';
                // 送信者を優先: 入力済み -> 接続ウォレット
                const currentSender = transactionData.sender || address || '';
                if (!transactionData.sender && address) {
                  updateTransactionField('sender', address);
                }

                // 受取先は自己アドレスにゼロパディングして成功率を上げる
                const clean = currentSender.startsWith('0x') ? currentSender.slice(2) : currentSender;
                const paddedRecipient = clean ? `0x${clean.padStart(64, '0')}` : '';
                const amountOctas = '1000';
                const argsText = paddedRecipient ? `${paddedRecipient}, ${amountOctas}` : '';

                // UIのテキスト更新
                setFunctionName(func);
                setArgumentsText(argsText);
                setTypeArgumentsText(typeText);

                // ストアのpayloadを一括更新（競合回避）
                const parsedArgs = argsText
                  ? argsText.split(',').map(arg => arg.trim()).filter(Boolean)
                  : [];
                const functionArgs = parseTransactionArguments(parsedArgs);
                updateTransactionField('payload', {
                  function: func,
                  function_arguments: functionArgs,
                  type_arguments: [typeText],
                } as any);
              }}
              className="text-xs"
            >
              Set APT Transfer Example
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}