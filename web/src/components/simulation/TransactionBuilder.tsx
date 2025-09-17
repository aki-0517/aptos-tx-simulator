'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useSimulation } from '@/hooks/useSimulation';
import { useWallet } from '@/hooks/useWallet';
import { formatAddress, parseTransactionArguments, validateMoveFunction, validateAddress } from '@/lib/utils';

interface TransactionBuilderProps {
  onSimulationRun?: () => void;
}

export function TransactionBuilder({ onSimulationRun }: TransactionBuilderProps) {
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
    onSimulationRun?.();
  };

  const setAptTransferExample = () => {
    const func = '0x1::coin::transfer';
    const typeText = '0x1::aptos_coin::AptosCoin';
    const currentSender = transactionData.sender || address || '';
    
    if (!transactionData.sender && address) {
      updateTransactionField('sender', address);
    }

    const clean = currentSender.startsWith('0x') ? currentSender.slice(2) : currentSender;
    const paddedRecipient = clean ? `0x${clean.padStart(64, '0')}` : '';
    const amountOctas = '1000';
    const argsText = paddedRecipient ? `${paddedRecipient}, ${amountOctas}` : '';

    setFunctionName(func);
    setArgumentsText(argsText);
    setTypeArgumentsText(typeText);

    const parsedArgs = argsText
      ? argsText.split(',').map(arg => arg.trim()).filter(Boolean)
      : [];
    const functionArgs = parseTransactionArguments(parsedArgs);
    updateTransactionField('payload', {
      function: func,
      function_arguments: functionArgs,
      type_arguments: [typeText],
    } as any);
  };

  return (
    <div className="space-y-4">
      {/* Sender Address */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Sender Address
        </label>
        <div className="flex gap-2">
          <Input
            placeholder="0x..."
            value={transactionData.sender || ''}
            onChange={(e) => handleSenderChange(e.target.value)}
            className="vscode-font text-sm bg-input border-border"
          />
          {isConnected && address && (
            <Button
              onClick={fillWalletAddress}
              variant="outline"
              size="sm"
              className="text-xs"
            >
              Use Wallet
            </Button>
          )}
        </div>
        {validationErrors.sender && (
          <p className="text-xs text-destructive">{validationErrors.sender}</p>
        )}
      </div>

      {/* Function */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Function
        </label>
        <Input
          placeholder="0x1::coin::transfer"
          value={functionName}
          onChange={(e) => handleFunctionChange(e.target.value)}
          className="vscode-font text-sm bg-input border-border"
        />
        {validationErrors.function && (
          <p className="text-xs text-destructive">{validationErrors.function}</p>
        )}
        <p className="text-xs text-muted-foreground">
          Enter the Move function in address::module::function format
        </p>
      </div>

      {/* Arguments */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Arguments
        </label>
        <Textarea
          placeholder="0x123, 1000, string:hello"
          value={argumentsText}
          onChange={(e) => handleArgumentsChange(e.target.value)}
          className="vscode-font text-sm bg-input border-border min-h-[80px]"
          rows={3}
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated values. Use prefixes: string:, u64:, bool:, address:
        </p>
        {validationErrors.arguments && (
          <p className="text-xs text-destructive">{validationErrors.arguments}</p>
        )}
      </div>

      {/* Type Arguments */}
      <div className="space-y-2">
        <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
          Type Arguments (Optional)
        </label>
        <Input
          placeholder="0x1::aptos_coin::AptosCoin"
          value={typeArgumentsText}
          onChange={(e) => handleTypeArgumentsChange(e.target.value)}
          className="vscode-font text-sm bg-input border-border"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated type arguments for generic functions
        </p>
        {validationErrors.typeArguments && (
          <p className="text-xs text-destructive">{validationErrors.typeArguments}</p>
        )}
      </div>

      {/* Gas Settings */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Max Gas Amount
          </label>
          <Input
            type="number"
            placeholder="10000"
            value={transactionData.maxGasAmount || ''}
            onChange={(e) => handleGasChange('maxGasAmount', e.target.value)}
            className="vscode-font text-sm bg-input border-border"
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
            Gas Unit Price
          </label>
          <Input
            type="number"
            placeholder="100"
            value={transactionData.gasUnitPrice || ''}
            onChange={(e) => handleGasChange('gasUnitPrice', e.target.value)}
            className="vscode-font text-sm bg-input border-border"
          />
        </div>
      </div>

      {/* Example Functions */}
      <div className="pt-4 border-t border-border">
        <div className="text-xs text-muted-foreground uppercase tracking-wide font-medium mb-2">
          Quick Examples
        </div>
        <Button
          onClick={setAptTransferExample}
          variant="outline"
          size="sm"
          className="text-xs"
        >
          Set APT Transfer Example
        </Button>
      </div>

      {/* Simulate Button */}
      <div className="pt-4 border-t border-border">
        <Button
          onClick={handleSimulate}
          disabled={!isValid || isSimulating}
          className="w-full"
          size="sm"
        >
          {isSimulating ? 'Simulating...' : 'Simulate Transaction'}
        </Button>
        
        {!isConnected && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Connect wallet to simulate transactions
          </p>
        )}
        
        {Object.keys(validationErrors).length > 0 && (
          <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded">
            <p className="text-xs text-destructive font-medium mb-1">Validation Errors:</p>
            <ul className="text-xs text-destructive space-y-1">
              {Object.entries(validationErrors).map(([field, error]) => (
                <li key={field}>• {error}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}