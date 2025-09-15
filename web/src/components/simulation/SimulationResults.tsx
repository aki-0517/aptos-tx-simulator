'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useSimulation } from '@/hooks/useSimulation';
import { formatAPT, formatGas, formatNumber } from '@/lib/utils';
import { CheckCircle, XCircle, Clock, AlertTriangle, Copy, ExternalLink } from 'lucide-react';
import { useAptosClient } from '@/hooks/useAptosClient';

export function SimulationResults() {
  const { result, status, isSimulating, isSuccess, isError, hasResult } = useSimulation();
  const { getExplorerUrl } = useAptosClient();

  if (isSimulating) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 animate-spin" />
            Simulating...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center items-center p-8">
            <div className="animate-pulse text-muted-foreground">
              Running transaction simulation
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!hasResult) {
    return (
      <Card className="bg-muted/50">
        <CardContent className="flex flex-col items-center justify-center p-8">
          <div className="text-muted-foreground text-center">
            <p className="text-lg mb-2">Ready to display results</p>
            <p className="text-sm">Create a transaction in the left form and run the simulation</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {isSuccess ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Simulation Successful
              </>
            ) : (
              <>
                <XCircle className="h-5 w-5 text-red-500" />
                Simulation Failed
              </>
            )}
          </CardTitle>
          <CardDescription>
            Execution time: {result?.executionTime.toFixed(2)}ms
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm font-medium">VM Status</p>
              <p className="text-lg font-mono">{result?.vmStatus}</p>
            </div>
            <div>
              <p className="text-sm font-medium">Result</p>
              <p className={`text-lg font-semibold ${isSuccess ? 'text-green-600' : 'text-red-600'}`}>
                {isSuccess ? 'Success' : 'Failed'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Gas Information */}
      <Card>
        <CardHeader>
          <CardTitle>Gas Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Gas Used</p>
              <p className="text-2xl font-bold">{formatGas(result?.gasUsed || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gas Unit Price</p>
              <p className="text-2xl font-bold">{formatGas(result?.gasUnitPrice || 0)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Gas Cost</p>
              <p className="text-2xl font-bold">{formatNumber(result?.totalGasCost || 0)} octas</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">APT Cost</p>
              <p className="text-2xl font-bold text-primary">{formatAPT(result?.totalGasCost || 0)}</p>
            </div>
          </div>

          {/* Gas efficiency indicator */}
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Gas Efficiency</span>
              <span className="text-sm">
                {(result?.gasUsed || 0) < 500 ? (
                  <span className="text-green-600">Efficient</span>
                ) : (result?.gasUsed || 0) < 2000 ? (
                  <span className="text-yellow-600">Standard</span>
                ) : (
                  <span className="text-red-600">Inefficient</span>
                )}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      {result?.error && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Error Details
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div>
                <p className="text-sm font-medium">Error Code</p>
                <p className="font-mono text-sm bg-muted p-2 rounded">{result.error.code}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Message</p>
                <p className="text-sm bg-muted p-2 rounded">{result.error.message}</p>
              </div>
              {result.error.suggestion && (
                <div>
                  <p className="text-sm font-medium">Suggestion</p>
                  <p className="text-sm text-muted-foreground bg-blue-50 p-2 rounded">
                    {result.error.suggestion}
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* State Changes */}
      {result?.changes && result.changes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>State Changes</CardTitle>
            <CardDescription>
              State changes that would be made by this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.changes.map((change, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Type: {change.type}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigator.clipboard.writeText(change.address);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                  <p className="font-mono text-xs text-muted-foreground">
                    {change.address}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Events */}
      {result?.events && result.events.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Events</CardTitle>
            <CardDescription>
              Events that would be emitted by this transaction
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {result.events.map((event, index) => (
                <div key={index} className="p-3 bg-muted/50 rounded-lg text-sm">
                  <p className="font-medium">Type: {event.type}</p>
                  <pre className="text-xs text-muted-foreground mt-1 overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              onClick={() => {
                const data = JSON.stringify(result, null, 2);
                navigator.clipboard.writeText(data);
              }}
              className=""
            >
              <Copy className="h-4 w-4 mr-2" />
              Copy Results
            </Button>
            <Button
              variant="outline"
              onClick={() => window.open(getExplorerUrl(), '_blank')}
              className=""
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              View on Explorer
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}