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
        return { label: 'Resource Modified', color: 'text-blue-400 bg-blue-500/20' };
      case 'delete_resource':
        return { label: 'Resource Deleted', color: 'text-red-400 bg-red-500/20' };
      case 'write_module':
        return { label: 'Module Published', color: 'text-green-400 bg-green-500/20' };
      case 'delete_module':
        return { label: 'Module Removed', color: 'text-red-400 bg-red-500/20' };
      default:
        return { label: type, color: 'text-muted-foreground bg-muted' };
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
        <h4 className="font-semibold text-foreground">State Changes ({changes.length})</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setJsonView(!jsonView)}
          className="text-xs"
        >
          {jsonView ? 'Normal View' : 'JSON View'}
        </Button>
      </div>

      {changes.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No state changes detected
        </div>
      ) : (
        <div className="space-y-3">
          {changes.map((change, index) => {
            const { label, color } = formatChangeType(change.type);
            
            return (
              <div
                key={index}
                className={`border border-border rounded bg-card p-4 cursor-pointer hover:bg-muted/50 ${
                  selectedChange === change ? 'ring-2 ring-primary' : ''
                }`}
                onClick={() => setSelectedChange(selectedChange === change ? null : change)}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
                      {label}
                    </span>
                    <code className="text-sm bg-muted px-2 py-1 rounded vscode-font">
                      {formatAddress(change.address)}
                    </code>
                  </div>
                </div>

                {selectedChange === change && (
                  <div className="mt-4 border-t border-border pt-4">
                    <div className="space-y-3">
                      <div>
                        <strong className="text-sm text-foreground">Address:</strong>
                        <code className="ml-2 text-sm bg-muted px-2 py-1 rounded vscode-font">
                          {change.address}
                        </code>
                      </div>
                      
                      <div>
                        <strong className="text-sm text-foreground">Change Type:</strong>
                        <span className="ml-2 text-muted-foreground">{change.type}</span>
                      </div>

                      {change.data && (
                        <div>
                          <strong className="text-sm text-foreground">Data:</strong>
                          <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto vscode-font">
                            {jsonView ? formatJSON(change.data) : JSON.stringify(change.data)}
                          </pre>
                        </div>
                      )}
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
      <h4 className="font-semibold text-foreground">Events ({events.length})</h4>
      
      {events.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No events emitted
        </div>
      ) : (
        <div className="space-y-3">
          {events.map((event, index) => (
            <div
              key={index}
              className="border border-border rounded bg-card p-4"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-500/20 text-purple-400">
                    Event
                  </span>
                  <code className="text-sm bg-muted px-2 py-1 rounded vscode-font">
                    {event.type}
                  </code>
                </div>
              </div>

              <div className="space-y-2">
                <div>
                  <strong className="text-sm text-foreground">Sequence Number:</strong>
                  <span className="ml-2 text-muted-foreground">{event.sequenceNumber}</span>
                </div>
                
                <div>
                  <strong className="text-sm text-foreground">GUID:</strong>
                  <code className="ml-2 text-sm bg-muted px-2 py-1 rounded vscode-font">
                    {event.guid}
                  </code>
                </div>

                {event.data && (
                  <div>
                    <strong className="text-sm text-foreground">Data:</strong>
                    <pre className="mt-2 text-xs bg-muted p-3 rounded overflow-auto vscode-font">
                      {formatJSON(event.data)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderAnalysis = () => (
    <div className="space-y-4">
      <h4 className="font-semibold text-foreground">Analysis</h4>
      
      {!stateAnalysis ? (
        <div className="text-center py-8 text-muted-foreground">
          State analysis not available
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-card border border-border rounded p-4">
              <h5 className="font-medium text-foreground mb-2">Resources</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Created:</span>
                  <span className="text-green-400">{stateAnalysis.resourcesCreated}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Modified:</span>
                  <span className="text-blue-400">{stateAnalysis.resourcesModified}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Deleted:</span>
                  <span className="text-red-400">{stateAnalysis.resourcesDeleted}</span>
                </div>
              </div>
            </div>

            <div className="bg-card border border-border rounded p-4">
              <h5 className="font-medium text-foreground mb-2">Events</h5>
              <div className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Total Events:</span>
                  <span className="text-purple-400">{stateAnalysis.totalEvents}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Unique Types:</span>
                  <span className="text-purple-400">{stateAnalysis.uniqueEventTypes}</span>
                </div>
              </div>
            </div>
          </div>

          {stateAnalysis.impactSummary && (
            <div className="bg-card border border-border rounded p-4">
              <h5 className="font-medium text-foreground mb-2">Impact Summary</h5>
              <p className="text-sm text-muted-foreground">{stateAnalysis.impactSummary}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-1 border-b border-border">
        {[
          { key: 'changes', label: 'Changes', count: changes.length },
          { key: 'events', label: 'Events', count: events.length },
          { key: 'analysis', label: 'Analysis', count: null },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            {tab.label}
            {tab.count !== null && (
              <span className="ml-1 text-xs text-muted-foreground">({tab.count})</span>
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'changes' && renderChanges()}
        {activeTab === 'events' && renderEvents()}
        {activeTab === 'analysis' && renderAnalysis()}
      </div>
    </div>
  );
}