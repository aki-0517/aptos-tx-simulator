'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StateChange, SimulationEvent, StateChangeAnalysis } from '@/types';

interface StateChangeViewerProps {
  changes: StateChange[];
  events: SimulationEvent[];
  stateAnalysis?: StateChangeAnalysis;
}

export function StateChangeViewer({ changes, events, stateAnalysis }: StateChangeViewerProps) {
  const [activeTab, setActiveTab] = useState<'changes' | 'events' | 'analysis'>('changes');
  const [selectedChange, setSelectedChange] = useState<StateChange | null>(null);
  const [jsonView, setJsonView] = useState(false);

  const formatChangeType = (type: string): { label: string; color: string } => {
    switch (type) {
      case 'write_resource':
        return { label: 'Resource Modified', color: 'text-blue-600 bg-blue-100' };
      case 'delete_resource':
        return { label: 'Resource Deleted', color: 'text-red-600 bg-red-100' };
      case 'write_module':
        return { label: 'Module Published', color: 'text-green-600 bg-green-100' };
      case 'delete_module':
        return { label: 'Module Removed', color: 'text-red-600 bg-red-100' };
      default:
        return { label: type, color: 'text-gray-600 bg-gray-100' };
    }
  };

  const formatAddress = (address: string): string => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-6)}`;
  };

  const formatJSON = (data: any): string => {
    try {
      return JSON.stringify(data, null, 2);
    } catch {
      return String(data);
    }
  };

  const renderChanges = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold">State Changes ({changes.length})</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setJsonView(!jsonView)}
        >
          {jsonView ? 'Normal View' : 'JSON View'}
        </Button>
      </div>

      {changes.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No state changes detected
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change, index) => {
            const { label, color } = formatChangeType(change.type);
            
            return (
              <div
                key={index}
                className={`border rounded-lg p-4 cursor-pointer hover:bg-gray-50 ${
                  selectedChange === change ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setSelectedChange(selectedChange === change ? null : change)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {label}
                    </span>
                    <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                      {formatAddress(change.address)}
                    </code>
                  </div>
                </div>

                {selectedChange === change && (
                  <div className="mt-4 border-t pt-4">
                    <div className="space-y-3">
                      <div>
                        <strong className="text-sm">Address:</strong>
                        <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                          {change.address}
                        </code>
                      </div>
                      
                      <div>
                        <strong className="text-sm">Change Type:</strong>
                        <span className="ml-2">{change.type}</span>
                      </div>

                      <div>
                        <strong className="text-sm">Data:</strong>
                        <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-64">
                          {jsonView ? formatJSON(change.data) : JSON.stringify(change.data, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderEvents = () => (
    <div className="space-y-4">
      <h4 className="font-semibold">Events Emitted ({events.length})</h4>
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No events emitted
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div key={index} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-sm">Event #{index + 1}</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-600">
                  {event.type}
                </span>
              </div>
              
              <div className="space-y-2">
                <div>
                  <strong className="text-sm">Type:</strong>
                  <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded">
                    {event.type}
                  </code>
                </div>
                
                <div>
                  <strong className="text-sm">Data:</strong>
                  <pre className="mt-2 p-3 bg-gray-50 rounded-lg text-xs overflow-x-auto max-h-48">
                    {formatJSON(event.data)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => {
    if (!stateAnalysis) {
      return (
        <div className="text-center py-8 text-gray-500">
          State analysis not available
        </div>
      );
    }

    return (
      <div className="space-y-6">
        <h4 className="font-semibold">State Analysis</h4>
        
        {/* Coin Store Changes */}
        <div className="space-y-4">
          <h5 className="font-medium">Coin Balance Changes</h5>
          {stateAnalysis.coinStoreDiff.balanceChanges.size === 0 ? (
            <p className="text-sm text-gray-600">No coin balance changes detected</p>
          ) : (
            <div className="space-y-2">
              {Array.from(stateAnalysis.coinStoreDiff.balanceChanges.entries()).map(([coinType, change], index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <code className="text-sm">{coinType}</code>
                  <span className={`font-medium ${change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {change > 0 ? '+' : ''}{change.toString()}
                  </span>
                </div>
              ))}
            </div>
          )}

          {stateAnalysis.coinStoreDiff.newCoinTypes.length > 0 && (
            <div>
              <h6 className="font-medium text-sm mb-2">New Coin Types</h6>
              <div className="space-y-1">
                {stateAnalysis.coinStoreDiff.newCoinTypes.map((coinType, index) => (
                  <code key={index} className="block text-sm bg-green-50 border border-green-200 px-2 py-1 rounded">
                    {coinType}
                  </code>
                ))}
              </div>
            </div>
          )}

          {stateAnalysis.coinStoreDiff.removedCoinTypes.length > 0 && (
            <div>
              <h6 className="font-medium text-sm mb-2">Removed Coin Types</h6>
              <div className="space-y-1">
                {stateAnalysis.coinStoreDiff.removedCoinTypes.map((coinType, index) => (
                  <code key={index} className="block text-sm bg-red-50 border border-red-200 px-2 py-1 rounded">
                    {coinType}
                  </code>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Resource Changes */}
        <div className="space-y-4">
          <h5 className="font-medium">Resource Changes</h5>
          {stateAnalysis.resourceDiff.length === 0 ? (
            <p className="text-sm text-gray-600">No resource changes detected</p>
          ) : (
            <div className="space-y-3">
              {stateAnalysis.resourceDiff.map((diff, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <code className="text-sm font-medium">{diff.resourceType}</code>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      diff.action === 'created' ? 'bg-green-100 text-green-600' :
                      diff.action === 'modified' ? 'bg-blue-100 text-blue-600' :
                      'bg-red-100 text-red-600'
                    }`}>
                      {diff.action}
                    </span>
                  </div>

                  {diff.beforeValue && diff.afterValue && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <strong className="text-sm">Before:</strong>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                          {formatJSON(diff.beforeValue)}
                        </pre>
                      </div>
                      <div>
                        <strong className="text-sm">After:</strong>
                        <pre className="mt-1 p-2 bg-gray-50 rounded text-xs max-h-32 overflow-y-auto">
                          {formatJSON(diff.afterValue)}
                        </pre>
                      </div>
                    </div>
                  )}

                  {!diff.beforeValue && diff.afterValue && (
                    <div>
                      <strong className="text-sm">Created with:</strong>
                      <pre className="mt-1 p-2 bg-green-50 rounded text-xs max-h-32 overflow-y-auto">
                        {formatJSON(diff.afterValue)}
                      </pre>
                    </div>
                  )}

                  {diff.fieldChanges && diff.fieldChanges.size > 0 && (
                    <div className="mt-3">
                      <strong className="text-sm">Field Changes:</strong>
                      <div className="mt-1 space-y-1">
                        {Array.from(diff.fieldChanges.entries()).map(([field, value], fieldIndex) => (
                          <div key={fieldIndex} className="flex items-center justify-between text-xs">
                            <code className="bg-gray-100 px-2 py-1 rounded">{field}</code>
                            <span>{formatJSON(value)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">State Changes & Events</h3>
      
      {/* Tab Navigation */}
      <div className="flex space-x-1 mb-6 border-b">
        {[
          { key: 'changes', label: 'State Changes', count: changes.length },
          { key: 'events', label: 'Events', count: events.length },
          { key: 'analysis', label: 'Analysis', count: stateAnalysis ? 1 : 0 },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium ${
              activeTab === tab.key
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="ml-2 px-2 py-1 bg-gray-200 text-gray-700 rounded-full text-xs">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-64">
        {activeTab === 'changes' && renderChanges()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'analysis' && renderAnalysis()}
      </div>
    </Card>
  );
}