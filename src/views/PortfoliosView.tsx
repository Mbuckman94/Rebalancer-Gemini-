import React, { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Search, Filter, ArrowUpRight, ArrowRight, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { useStore } from '@/hooks/use-store';
import { Client } from '@/types';
import { Modal } from '@/components/ui/Modal';

interface PortfoliosViewProps {
  onNavigateToClient?: (clientId: string) => void;
}

export function PortfoliosView({ onNavigateToClient }: PortfoliosViewProps) {
  const { clients, addClient, removeClient, getClientValue } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'value'>('recent');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newClientName, setNewClientName] = useState('');

  const filteredClients = useMemo(() => {
    let result = clients.filter(client => 
      client.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortBy === 'recent') {
      result.sort((a, b) => b.lastUpdated - a.lastUpdated);
    } else if (sortBy === 'name') {
      result.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'value') {
      result.sort((a, b) => getClientValue(b) - getClientValue(a));
    }

    return result;
  }, [clients, searchTerm, sortBy, getClientValue]);

  const handleAddClient = () => {
    if (newClientName.trim()) {
      addClient(newClientName);
      setNewClientName('');
      setIsAddModalOpen(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value);
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Portfolios</h1>
          <p className="text-zinc-400 max-w-lg">
            Quant-based rebalancing & allocation tools. Manage client accounts and execute trades.
          </p>
        </div>
        <Button size="lg" className="gap-2 shadow-blue-900/20 shadow-lg" onClick={() => setIsAddModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Add New Client
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex gap-4 items-center bg-zinc-900/30 p-1 rounded-lg border border-zinc-800/50 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
            <Input 
              placeholder="Search portfolios..." 
              className="pl-9 w-full sm:w-64 bg-transparent border-none focus-visible:ring-0 placeholder:text-zinc-600" 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex gap-2">
          <select 
            className="bg-zinc-900 border border-zinc-800 text-zinc-300 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
          >
            <option value="recent">Sort by Recent</option>
            <option value="name">Sort by Name</option>
            <option value="value">Sort by Value (High-Low)</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client) => {
          const totalValue = getClientValue(client);
          // Placeholder for 24h change logic - would need historical data
          const change24h = 0; 

          return (
            <Card key={client.id} className="group hover:border-zinc-700 transition-all duration-300 hover:shadow-xl hover:shadow-black/40 bg-zinc-900/40 backdrop-blur-sm">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500 mb-4 group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300">
                    <BriefcaseIcon className="h-5 w-5" />
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-8 w-8 text-zinc-600 hover:text-red-400 hover:bg-red-900/20 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => removeClient(client.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <CardTitle className="text-xl truncate" title={client.name}>{client.name}</CardTitle>
                <CardDescription>Last updated: {new Date(client.lastUpdated).toLocaleDateString()}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 space-y-1">
                  <div className="text-3xl font-mono font-medium tracking-tight text-white truncate" title={formatCurrency(totalValue)}>
                    {formatCurrency(totalValue)}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-emerald-500 font-mono">
                    <ArrowUpRight className="h-3 w-3" />
                    +{change24h.toFixed(1)}% (24h)
                  </div>
                </div>
                
                <div className="mt-6 pt-6 border-t border-zinc-800/50 flex justify-between items-center">
                  <div className="text-xs text-zinc-500 font-mono">
                    {client.accounts.length} ACCOUNTS
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-blue-400 hover:text-blue-300 hover:bg-blue-900/20 gap-1 text-xs font-medium"
                    onClick={() => onNavigateToClient?.(client.id)}
                  >
                    CONFIGURE <ArrowRight className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}

         {/* Empty State / Add New Card */}
         <Card 
            className="border-dashed border-zinc-800 bg-transparent flex flex-col items-center justify-center p-12 text-center hover:bg-zinc-900/20 transition-colors cursor-pointer group min-h-[300px]"
            onClick={() => setIsAddModalOpen(true)}
         >
            <div className="h-12 w-12 rounded-full bg-zinc-900 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 border border-zinc-800">
              <Plus className="h-5 w-5 text-zinc-500 group-hover:text-zinc-300" />
            </div>
            <h3 className="text-zinc-400 font-medium">Create New Portfolio</h3>
            <p className="text-zinc-600 text-sm mt-1">Start tracking a new client allocation</p>
         </Card>
      </div>

      <Modal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} title="Add New Client">
        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-zinc-400">Client Name</label>
            <Input 
              placeholder="e.g. John Doe Retirement" 
              value={newClientName}
              onChange={(e) => setNewClientName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleAddClient}>Create Client</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// Helper icons
const BriefcaseIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
);
