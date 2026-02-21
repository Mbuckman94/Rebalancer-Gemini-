import React, { useState, useEffect, useMemo } from 'react';
import { Position, Account } from '@/types';
import { CompanyLogo } from '@/components/ui/CompanyLogo';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Trash2, Plus, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface RebalancerTableProps {
  account: Account;
  onUpdatePosition: (positionId: string, updates: Partial<Position>) => void;
  onAddPosition: (symbol: string) => void;
  onRemovePosition: (positionId: string) => void;
  totalPortfolioValue: number;
}

export const RebalancerTable: React.FC<RebalancerTableProps> = ({ 
  account, 
  onUpdatePosition, 
  onAddPosition, 
  onRemovePosition,
  totalPortfolioValue 
}) => {
  const [newTicker, setNewTicker] = useState('');

  // Helper to check if bond
  const isBond = (symbol: string) => symbol.length === 9;

  // Calculate market value based on type
  const calculateMarketValue = (pos: Position) => {
    if (isBond(pos.symbol)) {
      return (pos.quantity * pos.price) / 100; // Bond pricing convention
    }
    return pos.quantity * pos.price;
  };

  // Calculate trade amounts based on goal %
  const calculateTrade = (pos: Position, goalPct: number) => {
    const targetValue = totalPortfolioValue * (goalPct / 100);
    const currentValue = calculateMarketValue(pos);
    const diffValue = targetValue - currentValue;
    
    let tradeShares = 0;
    if (pos.price > 0) {
        // Bond price is usually % of par (100), but quantity is face value. 
        // Trade logic for bonds is complex, assuming standard equity logic for now unless specified otherwise,
        // but adjusting for bond price factor if needed. 
        // For simplicity in this prompt context: Trade $ / Price = Shares.
        // If bond: Trade $ / (Price / 100) = Face Value Quantity
        const priceFactor = isBond(pos.symbol) ? pos.price / 100 : pos.price;
        tradeShares = diffValue / priceFactor;
    }

    // Apply rounding
    if (pos.roundingMode === 'down') {
      tradeShares = Math.floor(tradeShares);
    } else if (pos.roundingMode === 'up') {
      tradeShares = Math.ceil(tradeShares);
    } else if (pos.roundingMode === 'nearest') {
      tradeShares = Math.round(tradeShares);
    }
    // 'EX' (exact) does nothing

    const finalTradeValue = tradeShares * (isBond(pos.symbol) ? pos.price / 100 : pos.price);

    return { tradeShares, finalTradeValue };
  };

  const handleGoalPctChange = (pos: Position, newPct: number) => {
    onUpdatePosition(pos.id, { targetPct: newPct });
  };

  const handleGoalValueChange = (pos: Position, newValue: number) => {
    const newPct = (newValue / totalPortfolioValue) * 100;
    onUpdatePosition(pos.id, { targetPct: newPct });
  };

  const totalCurrentValue = account.positions.reduce((sum, pos) => sum + calculateMarketValue(pos), 0);
  const totalTargetPct = account.positions.reduce((sum, pos) => sum + pos.targetPct, 0);
  
  // Cash row calculations
  const cashValue = account.cash;
  const cashWeight = (cashValue / totalPortfolioValue) * 100;
  const remainingTargetPct = 100 - totalTargetPct;
  const cashGoalValue = totalPortfolioValue * (remainingTargetPct / 100);
  const cashDiff = cashGoalValue - cashValue;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-zinc-800 bg-zinc-900/30 backdrop-blur-sm">
      <div className="flex items-center justify-between p-4 border-b border-zinc-800 bg-zinc-900/50">
        <h3 className="font-medium text-zinc-200">{account.name} <span className="text-zinc-500 text-sm ml-2">({account.type})</span></h3>
        <div className="flex gap-2">
            <div className="relative">
                <Input 
                    placeholder="Add Ticker..." 
                    className="h-8 w-32 bg-zinc-950 border-zinc-700"
                    value={newTicker}
                    onChange={(e) => setNewTicker(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && newTicker) {
                            onAddPosition(newTicker);
                            setNewTicker('');
                        }
                    }}
                />
            </div>
            <Button size="sm" variant="secondary" onClick={() => { if(newTicker) { onAddPosition(newTicker); setNewTicker(''); } }}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="text-xs text-zinc-400 uppercase bg-zinc-900/80 backdrop-blur-md sticky top-0 z-10">
            <tr>
              <th className="px-4 py-3 font-medium">Security</th>
              <th className="px-4 py-3 font-medium text-right">Shares</th>
              <th className="px-4 py-3 font-medium text-right">Price</th>
              <th className="px-4 py-3 font-medium text-right">Value</th>
              <th className="px-4 py-3 font-medium text-right">Yield</th>
              <th className="px-4 py-3 font-medium text-right">Weight</th>
              <th className="px-4 py-3 font-medium text-right w-24">Goal %</th>
              <th className="px-4 py-3 font-medium text-right w-32">Goal $</th>
              <th className="px-4 py-3 font-medium text-right">Trade $</th>
              <th className="px-4 py-3 font-medium text-right">Trade Shares</th>
              <th className="px-4 py-3 font-medium w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/50">
            {account.positions.map((pos) => {
              const marketValue = calculateMarketValue(pos);
              const weight = (marketValue / totalPortfolioValue) * 100;
              const { tradeShares, finalTradeValue } = calculateTrade(pos, pos.targetPct);
              
              return (
                <tr key={pos.id} className="hover:bg-zinc-800/30 transition-colors group">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CompanyLogo symbol={pos.symbol} className="h-8 w-8" />
                      <div>
                        <div className="font-bold text-zinc-200">{pos.symbol}</div>
                        <div className="text-xs text-zinc-500 truncate max-w-[120px]">{pos.description}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">
                    {pos.quantity.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-300">
                    ${pos.price.toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-200 font-medium">
                    ${marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {pos.yield.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {weight.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                        <input
                            type="number"
                            className="w-16 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                            value={pos.targetPct}
                            onChange={(e) => handleGoalPctChange(pos, parseFloat(e.target.value) || 0)}
                            step="0.1"
                        />
                        <span className="text-zinc-600">%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right">
                     <div className="flex items-center justify-end gap-1">
                        <span className="text-zinc-600">$</span>
                        <input
                            type="number"
                            className="w-24 bg-zinc-950 border border-zinc-800 rounded px-2 py-1 text-right font-mono text-blue-400 focus:outline-none focus:border-blue-500"
                            value={(totalPortfolioValue * (pos.targetPct / 100)).toFixed(2)}
                            onChange={(e) => handleGoalValueChange(pos, parseFloat(e.target.value) || 0)}
                        />
                    </div>
                  </td>
                  <td className={cn("px-4 py-3 text-right font-mono font-medium", finalTradeValue > 0 ? "text-emerald-400" : finalTradeValue < 0 ? "text-red-400" : "text-zinc-500")}>
                    {finalTradeValue > 0 ? '+' : ''}{finalTradeValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </td>
                  <td className={cn("px-4 py-3 text-right font-mono", tradeShares > 0 ? "text-emerald-400" : tradeShares < 0 ? "text-red-400" : "text-zinc-500")}>
                    {tradeShares > 0 ? '+' : ''}{tradeShares.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button 
                        onClick={() => onRemovePosition(pos.id)}
                        className="text-zinc-600 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
            
            {/* CASH ROW */}
            <tr className="bg-zinc-900/30 border-t-2 border-zinc-800 font-medium">
                <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-emerald-900/30 text-emerald-500 rounded flex items-center justify-center font-bold text-xs border border-emerald-900/50">
                        $
                      </div>
                      <div>
                        <div className="font-bold text-emerald-500">CASH</div>
                        <div className="text-xs text-zinc-500">Sweep Vehicle</div>
                      </div>
                    </div>
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-500">--</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-300">$1.00</td>
                <td className="px-4 py-3 text-right font-mono text-white">
                    ${cashValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-500">--</td>
                <td className="px-4 py-3 text-right font-mono text-zinc-400">
                    {cashWeight.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    {remainingTargetPct.toFixed(2)}%
                </td>
                <td className="px-4 py-3 text-right font-mono text-emerald-400">
                    ${cashGoalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className={cn("px-4 py-3 text-right font-mono", cashDiff > 0 ? "text-emerald-400" : cashDiff < 0 ? "text-red-400" : "text-zinc-500")}>
                     {cashDiff > 0 ? '+' : ''}{cashDiff.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </td>
                <td className="px-4 py-3 text-right font-mono text-zinc-500">--</td>
                <td></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
