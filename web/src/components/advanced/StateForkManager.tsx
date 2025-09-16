'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  GitBranch, 
  Plus, 
  Copy, 
  Trash2, 
  Settings, 
  AlertCircle, 
  Clock,
  User,
  Network
} from 'lucide-react';
import { StateFork, StateModification } from '@/types/aptos';
import { stateForkManager } from '@/lib/state-fork-manager';

export function StateForkManager() {
  const [forks, setForks] = useState<StateFork[]>([]);
  const [selectedFork, setSelectedFork] = useState<StateFork | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [newForkName, setNewForkName] = useState('');
  const [newForkDescription, setNewForkDescription] = useState('');

  useEffect(() => {
    loadForks();
  }, []);

  const loadForks = async () => {
    try {
      const loadedForks = await stateForkManager.listForks();
      setForks(loadedForks);
    } catch (error) {
      console.error('Failed to load forks:', error);
    }
  };

  const createFork = async () => {
    if (!newForkName.trim()) return;

    try {
      const fork = await stateForkManager.createFork(
        newForkName.trim(),
        newForkDescription.trim() || 'No description provided'
      );
      await loadForks();
      setSelectedFork(fork);
      setIsCreating(false);
      setNewForkName('');
      setNewForkDescription('');
    } catch (error) {
      console.error('Failed to create fork:', error);
    }
  };

  const cloneFork = async (forkId: string) => {
    const originalFork = forks.find(f => f.id === forkId);
    if (!originalFork) return;

    const cloneName = `${originalFork.name} (Clone)`;
    try {
      const clonedFork = await stateForkManager.cloneFork(forkId, cloneName);
      await loadForks();
      setSelectedFork(clonedFork);
    } catch (error) {
      console.error('Failed to clone fork:', error);
    }
  };

  const deleteFork = async (forkId: string) => {
    if (!confirm('Are you sure you want to delete this fork?')) return;

    try {
      await stateForkManager.deleteFork(forkId);
      await loadForks();
      if (selectedFork?.id === forkId) {
        setSelectedFork(null);
      }
    } catch (error) {
      console.error('Failed to delete fork:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GitBranch className="h-5 w-5" />
            State Fork Management
          </CardTitle>
          <CardDescription>
            Create and manage blockchain state forks for "what-if" scenario testing
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-medium">Your Forks ({forks.length})</h3>
            <Button onClick={() => setIsCreating(true)} size="sm">
              <Plus className="h-4 w-4 mr-1" />
              Create Fork
            </Button>
          </div>

          {/* Create Fork Dialog */}
          {isCreating && (
            <Card className="mb-4">
              <CardContent className="pt-6 space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Fork Name</label>
                  <Input
                    placeholder="My Test Fork"
                    value={newForkName}
                    onChange={(e) => setNewForkName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Description (Optional)</label>
                  <Textarea
                    placeholder="What is this fork for?"
                    value={newForkDescription}
                    onChange={(e) => setNewForkDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setIsCreating(false)}>
                    Cancel
                  </Button>
                  <Button onClick={createFork} disabled={!newForkName.trim()}>
                    Create Fork
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Fork List */}
          {forks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <GitBranch className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No state forks created yet</p>
              <p className="text-sm">Create your first fork to start testing scenarios</p>
            </div>
          ) : (
            <div className="grid gap-3">
              {forks.map((fork) => (
                <ForkCard
                  key={fork.id}
                  fork={fork}
                  isSelected={selectedFork?.id === fork.id}
                  onSelect={setSelectedFork}
                  onClone={() => cloneFork(fork.id)}
                  onDelete={() => deleteFork(fork.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Fork Details */}
      {selectedFork && (
        <ForkDetails 
          fork={selectedFork} 
          onUpdate={() => loadForks()} 
        />
      )}
    </div>
  );
}

interface ForkCardProps {
  fork: StateFork;
  isSelected: boolean;
  onSelect: (fork: StateFork) => void;
  onClone: () => void;
  onDelete: () => void;
}

function ForkCard({ fork, isSelected, onSelect, onClone, onDelete }: ForkCardProps) {
  return (
    <Card 
      className={`cursor-pointer transition-colors ${
        isSelected ? 'ring-2 ring-primary' : 'hover:bg-muted/50'
      }`}
      onClick={() => onSelect(fork)}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{fork.name}</h4>
              <Badge variant="outline" className="text-xs">
                <Network className="h-3 w-3 mr-1" />
                {fork.metadata.network}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">{fork.description}</p>
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {new Date(fork.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <Settings className="h-3 w-3" />
                {fork.modifications.length} modifications
              </div>
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {fork.metadata.creator}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="sm" onClick={onClone}>
              <Copy className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onDelete}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface ForkDetailsProps {
  fork: StateFork;
  onUpdate: () => void;
}

function ForkDetails({ fork, onUpdate }: ForkDetailsProps) {
  const [newModAddress, setNewModAddress] = useState('');
  const [newModBalance, setNewModBalance] = useState('');

  const addBalanceModification = async () => {
    if (!newModAddress.trim() || !newModBalance.trim()) return;

    try {
      const balance = parseFloat(newModBalance) * 100000000; // Convert APT to octas
      await stateForkManager.modifyAccountBalance(fork.id, newModAddress.trim(), balance);
      onUpdate();
      setNewModAddress('');
      setNewModBalance('');
    } catch (error) {
      console.error('Failed to add modification:', error);
    }
  };

  const removeModification = async (index: number) => {
    try {
      await stateForkManager.removeModification(fork.id, index);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove modification:', error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <GitBranch className="h-5 w-5" />
          {fork.name}
        </CardTitle>
        <CardDescription>{fork.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="modifications" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="modifications">Modifications</TabsTrigger>
            <TabsTrigger value="info">Fork Info</TabsTrigger>
            <TabsTrigger value="scenarios">Scenarios</TabsTrigger>
          </TabsList>
          
          <TabsContent value="modifications" className="space-y-4">
            {/* Add New Modification */}
            <Card>
              <CardContent className="pt-6 space-y-4">
                <h4 className="text-sm font-medium">Add Account Balance Modification</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Account Address</label>
                    <Input
                      placeholder="0x..."
                      value={newModAddress}
                      onChange={(e) => setNewModAddress(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">New Balance (APT)</label>
                    <Input
                      type="number"
                      placeholder="100.0"
                      value={newModBalance}
                      onChange={(e) => setNewModBalance(e.target.value)}
                    />
                  </div>
                </div>
                <Button 
                  onClick={addBalanceModification}
                  disabled={!newModAddress.trim() || !newModBalance.trim()}
                  size="sm"
                >
                  Add Modification
                </Button>
              </CardContent>
            </Card>

            {/* Existing Modifications */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium">Current Modifications ({fork.modifications.length})</h4>
              {fork.modifications.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  No modifications in this fork yet
                </div>
              ) : (
                fork.modifications.map((mod, index) => (
                  <ModificationCard
                    key={index}
                    modification={mod}
                    index={index}
                    onRemove={() => removeModification(index)}
                  />
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Fork Information</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>ID:</strong> {fork.id}</div>
                  <div><strong>Created:</strong> {new Date(fork.createdAt).toLocaleString()}</div>
                  <div><strong>Network:</strong> {fork.metadata.network}</div>
                  <div><strong>Creator:</strong> {fork.metadata.creator}</div>
                  <div><strong>Base Block:</strong> {fork.baseBlockHeight}</div>
                </div>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Statistics</h4>
                <div className="space-y-1 text-sm">
                  <div><strong>Modifications:</strong> {fork.modifications.length}</div>
                  <div><strong>Tags:</strong> {fork.metadata.tags.length || 'None'}</div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                What-if scenario comparison is coming soon. This will allow you to compare 
                multiple variations of this fork with different modifications.
              </AlertDescription>
            </Alert>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

interface ModificationCardProps {
  modification: StateModification;
  index: number;
  onRemove: () => void;
}

function ModificationCard({ modification, index, onRemove }: ModificationCardProps) {
  const formatBalance = (value: any) => {
    if (value?.coin?.value) {
      return (parseInt(value.coin.value) / 100000000).toFixed(6) + ' APT';
    }
    return 'Unknown';
  };

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline">#{index + 1}</Badge>
              <Badge variant={modification.action === 'create' ? 'default' : 'secondary'}>
                {modification.action}
              </Badge>
              <span className="text-sm font-medium">Account Balance</span>
            </div>
            <div className="text-sm text-muted-foreground">
              <div><strong>Address:</strong> {modification.address}</div>
              <div><strong>New Balance:</strong> {formatBalance(modification.afterValue)}</div>
              {modification.beforeValue && (
                <div><strong>Previous:</strong> {formatBalance(modification.beforeValue)}</div>
              )}
              <div><strong>Modified:</strong> {new Date(modification.timestamp).toLocaleString()}</div>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onRemove}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}