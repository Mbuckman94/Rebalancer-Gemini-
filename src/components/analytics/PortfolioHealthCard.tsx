import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { SleekGauge } from '@/components/analytics/SleekGauge';
import { Position } from '@/types';

interface PortfolioHealthCardProps {
  positions: Position[];
}

export function PortfolioHealthCard({ positions }: PortfolioHealthCardProps) {
  // Calculate weights
  const totalValue = positions.reduce((sum, p) => sum + p.currentValue, 0);
  
  const getWeight = (filter: (p: Position) => boolean) => {
    if (totalValue === 0) return 0;
    const val = positions.filter(filter).reduce((sum, p) => sum + p.currentValue, 0);
    return (val / totalValue) * 100;
  };

  const equityWeight = getWeight(p => p.assetClass === 'US_EQUITY' || p.assetClass === 'NON_US_EQUITY');
  const fixedIncomeWeight = getWeight(p => p.assetClass === 'FIXED_INCOME' || p.assetClass === 'MUNI_BOND');
  const cashWeight = getWeight(p => p.assetClass === 'CASH');
  // Mock covered calls logic (e.g. options) - assuming 'OTHER' or specific description check
  const optionsWeight = getWeight(p => p.description.includes('CALL') || p.description.includes('PUT'));

  return (
    <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-pink-500" />
          Portfolio Composition
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
            <SleekGauge value={equityWeight} label="Equities" colorStart="#ec4899" colorEnd="#8b5cf6" />
            <SleekGauge value={fixedIncomeWeight} label="Fixed Income" colorStart="#3b82f6" colorEnd="#06b6d4" />
            <SleekGauge value={cashWeight} label="Cash" colorStart="#10b981" colorEnd="#34d399" />
            <SleekGauge value={optionsWeight} label="Options" colorStart="#f59e0b" colorEnd="#fcd34d" />
        </div>
      </CardContent>
    </Card>
  );
}
