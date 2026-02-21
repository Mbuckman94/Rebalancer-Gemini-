import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Position } from '@/types';

interface SectorExposureCardProps {
  positions: Position[];
}

export function SectorExposureCard({ positions }: SectorExposureCardProps) {
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    positions.forEach(p => {
      // Only count equity sectors usually, but let's include all non-cash
      if (p.assetClass !== 'CASH') {
        const sector = p.sector || 'Unclassified';
        const value = p.currentValue;
        counts[sector] = (counts[sector] || 0) + value;
        total += value;
      }
    });

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percent: total > 0 ? (value / total) * 100 : 0
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 6); // Top 6 sectors
  }, [positions]);

  return (
    <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-indigo-500" />
          Sector Exposure
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item) => (
            <div key={item.name} className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-300 font-medium truncate max-w-[150px]">{item.name}</span>
                <span className="text-zinc-500 font-mono">{item.percent.toFixed(1)}%</span>
              </div>
              <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-500/80 rounded-full" 
                  style={{ width: `${item.percent}%` }}
                />
              </div>
            </div>
          ))}
          {data.length === 0 && (
            <div className="text-center text-zinc-500 text-sm italic py-8">
              No sector data available. Run AI Scan to classify assets.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
