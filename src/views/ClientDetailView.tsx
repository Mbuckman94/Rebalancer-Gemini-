import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/hooks/use-store';
import { useConfig } from '@/hooks/use-config';
import { RebalancerTable } from '@/components/rebalancer/RebalancerTable';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Save, RefreshCw, Sparkles } from 'lucide-react';
import { Position } from '@/types';
import { startPricePolling, fetchMarketData, MarketData } from '@/services/marketData';
import { scanPortfolio } from '@/services/gemini';
import { AssetDistributionCard } from '@/components/analytics/AssetDistributionCard';
import { GeoConcentrationCard } from '@/components/analytics/GeoConcentrationCard';
import { SectorExposureCard } from '@/components/analytics/SectorExposureCard';
import { PortfolioHealthCard } from '@/components/analytics/PortfolioHealthCard';
import { EquityStyleGrid } from '@/components/analytics/EquityStyleGrid';
import { BacktestIntelligenceModal } from '@/components/analytics/BacktestIntelligenceModal';
import { Activity } from 'lucide-react';

interface ClientDetailViewProps {
  clientId: string;
  onBack: () => void;
}

export function ClientDetailView({ clientId, onBack }: ClientDetailViewProps) {
  const { clients, updateClient, getClientValue } = useStore();
  const { getGeminiKey } = useConfig();
  const client = clients.find(c => c.id === clientId);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isBacktestOpen, setIsBacktestOpen] = useState(false);

  // Collect all symbols for polling
  const symbols = useMemo(() => {
    if (!client) return [];
    const syms = new Set<string>();
    client.accounts.forEach(acc => {
      acc.positions.forEach(pos => {
        if (pos.symbol && pos.symbol.length < 9) { // Exclude bonds/CUSIPs from Finnhub polling
            syms.add(pos.symbol);
        }
      });
    });
    return Array.from(syms);
  }, [client]);

  // Flatten positions for analytics
  const allPositions = useMemo(() => {
    if (!client) return [];
    return client.accounts.flatMap(a => a.positions);
  }, [client]);

  // Handle price updates
  const handlePriceUpdate = (symbol: string, data: MarketData) => {
    if (!client) return;

    // Update all positions with this symbol across all accounts
    let hasUpdates = false;
    const updatedAccounts = client.accounts.map(acc => {
        const updatedPositions = acc.positions.map(pos => {
            if (pos.symbol === symbol && (pos.price !== data.price || pos.description !== data.name || pos.yield !== data.yield)) {
                hasUpdates = true;
                return { 
                  ...pos, 
                  price: data.price, 
                  description: data.name,
                  yield: data.yield,
                  currentValue: pos.quantity * data.price 
                };
            }
            return pos;
        });
        return { ...acc, positions: updatedPositions };
    });

    if (hasUpdates) {
        updateClient(client.id, { accounts: updatedAccounts });
    }
  };

  // Start polling
  useEffect(() => {
    if (symbols.length === 0) return;
    const cleanup = startPricePolling(symbols, handlePriceUpdate);
    return cleanup;
  }, [symbols]); // Re-run if symbols change

  const handleRefreshPrices = async () => {
    setIsRefreshing(true);
    try {
        for (const sym of symbols) {
            const data = await fetchMarketData(sym);
            if (data) {
                handlePriceUpdate(sym, data);
            }
        }
    } catch (e) {
        console.error('Manual refresh failed', e);
    } finally {
        setIsRefreshing(false);
    }
  };

  const handleAiScan = async () => {
    if (!client) return;
    setIsScanning(true);
    const apiKey = getGeminiKey();
    
    try {
        // Collect all unique positions to scan
        // We scan by symbol to avoid duplicates
        const uniquePositionsMap = new Map<string, Position>();
        allPositions.forEach(p => uniquePositionsMap.set(p.symbol, p));
        const uniquePositions = Array.from(uniquePositionsMap.values());

        const classifiedPositions = await scanPortfolio(uniquePositions, apiKey);
        
        // Create a map of updates
        const updatesMap = new Map(classifiedPositions.map(p => [p.symbol, p]));

        // Apply updates to all accounts
        const updatedAccounts = client.accounts.map(acc => {
            const updatedPos = acc.positions.map(pos => {
                const update = updatesMap.get(pos.symbol);
                if (update) {
                    return { 
                        ...pos, 
                        assetClass: update.assetClass,
                        sector: update.sector,
                        stateCode: update.stateCode,
                        logoTicker: update.logoTicker
                    };
                }
                return pos;
            });
            return { ...acc, positions: updatedPos };
        });

        updateClient(client.id, { accounts: updatedAccounts });

    } catch (e) {
        console.error('AI Scan failed', e);
    } finally {
        setIsScanning(false);
    }
  };

  if (!client) {
    return <div className="p-8 text-center text-zinc-500">Client not found</div>;
  }

  const totalValue = getClientValue(client);

  const handleUpdatePosition = (accountId: string, positionId: string, updates: Partial<Position>) => {
    const accountIndex = client.accounts.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;

    const updatedAccounts = [...client.accounts];
    const account = updatedAccounts[accountIndex];
    
    const positionIndex = account.positions.findIndex(p => p.id === positionId);
    if (positionIndex === -1) return;

    const updatedPositions = [...account.positions];
    updatedPositions[positionIndex] = { ...updatedPositions[positionIndex], ...updates };
    
    updatedAccounts[accountIndex] = { ...account, positions: updatedPositions };

    updateClient(client.id, { accounts: updatedAccounts });
  };

  const handleAddPosition = (accountId: string, symbol: string) => {
    const accountIndex = client.accounts.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;

    const updatedAccounts = [...client.accounts];
    const account = updatedAccounts[accountIndex];

    // Mock data fetch for new position
    const newPosition: Position = {
      id: crypto.randomUUID(),
      symbol: symbol.toUpperCase(),
      description: 'New Position', // In real app, fetch from API
      quantity: 0,
      price: 100, // Mock price
      currentValue: 0,
      yield: 0,
      targetPct: 0,
      roundingMode: 'nearest'
    };

    updatedAccounts[accountIndex] = { 
        ...account, 
        positions: [...account.positions, newPosition] 
    };

    updateClient(client.id, { accounts: updatedAccounts });
  };

  const handleRemovePosition = (accountId: string, positionId: string) => {
    const accountIndex = client.accounts.findIndex(a => a.id === accountId);
    if (accountIndex === -1) return;

    const updatedAccounts = [...client.accounts];
    const account = updatedAccounts[accountIndex];
    
    updatedAccounts[accountIndex] = { 
        ...account, 
        positions: account.positions.filter(p => p.id !== positionId) 
    };

    updateClient(client.id, { accounts: updatedAccounts });
  };

  return (
    <div className="p-8 space-y-8 animate-in slide-in-from-right duration-500">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack} className="rounded-full h-10 w-10 border border-zinc-800 hover:bg-zinc-800">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">{client.name}</h1>
            <div className="flex items-center gap-2 text-zinc-400 font-mono text-sm">
                <span>Total Value:</span>
                <span className="text-emerald-400 font-medium text-lg">
                    ${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
            </div>
          </div>
        </div>
        <div className="flex gap-3">
            <Button 
                variant="secondary" 
                className="gap-2" 
                onClick={() => setIsBacktestOpen(true)}
            >
                <Activity className="h-4 w-4" />
                Backtest
            </Button>
            <Button 
                variant="sparkle" 
                className="gap-2" 
                onClick={handleAiScan} 
                isLoading={isScanning}
            >
                <Sparkles className="h-4 w-4" />
                AI Scan
            </Button>
            <Button variant="secondary" className="gap-2" onClick={handleRefreshPrices} isLoading={isRefreshing}>
                <RefreshCw className="h-4 w-4" />
                Refresh Prices
            </Button>
            <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white border-0">
                <Save className="h-4 w-4" />
                Execute Trades
            </Button>
        </div>
      </div>

      {/* Analytics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 h-auto">
        <div className="col-span-1 md:col-span-1 lg:col-span-1 h-[320px]">
             <PortfolioHealthCard positions={allPositions} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 h-[320px]">
             <EquityStyleGrid positions={allPositions} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 h-[320px]">
             <AssetDistributionCard positions={allPositions} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 h-[320px]">
             <SectorExposureCard positions={allPositions} />
        </div>
        <div className="col-span-1 md:col-span-1 lg:col-span-1 h-[320px]">
             <GeoConcentrationCard positions={allPositions} />
        </div>
      </div>

      <BacktestIntelligenceModal 
        isOpen={isBacktestOpen}
        onClose={() => setIsBacktestOpen(false)}
        strategyName={client.name}
        tickers={symbols}
        weights={symbols.map(() => 100 / symbols.length)} // Equal weight for demo backtest
      />

      <div className="space-y-8">
        {client.accounts.map(account => (
            <RebalancerTable 
                key={account.id}
                account={account}
                totalPortfolioValue={totalValue}
                onUpdatePosition={(posId, updates) => handleUpdatePosition(account.id, posId, updates)}
                onAddPosition={(symbol) => handleAddPosition(account.id, symbol)}
                onRemovePosition={(posId) => handleRemovePosition(account.id, posId)}
            />
        ))}

        {client.accounts.length === 0 && (
            <div className="text-center p-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500">
                No accounts found for this client.
            </div>
        )}
      </div>
    </div>
  );
}
