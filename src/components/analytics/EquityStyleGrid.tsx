import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Position } from '@/types';

interface EquityStyleGridProps {
  positions: Position[];
}

export function EquityStyleGrid({ positions }: EquityStyleGridProps) {
  // Logic to categorize positions into the 3x3 grid
  // In a real app, this data would come from the API/AI Scan.
  // For now, we'll mock the distribution logic or use simple heuristics if available.
  // Since we don't have explicit cap/style data in Position yet, we'll simulate it 
  // or use a placeholder distribution for visual demonstration as requested by the prompt strategy 
  // which implies "based on AI-enriched metadata". 
  // I'll add a helper to simulate this distribution for the UI if data is missing.

  const gridData = React.useMemo(() => {
    // 3x3 Matrix: Rows = Size (Large, Mid, Small), Cols = Style (Value, Blend, Growth)
    // Indices: 0=LV, 1=LB, 2=LG, 3=MV, 4=MB, 5=MG, 6=SV, 7=SB, 8=SG
    const matrix = [0, 0, 0, 0, 0, 0, 0, 0, 0];
    let totalEquity = 0;

    positions.forEach(p => {
      if (p.assetClass === 'US_EQUITY' || p.assetClass === 'NON_US_EQUITY') {
        const val = p.currentValue;
        totalEquity += val;
        
        // Mock classification based on symbol hash for demo consistency
        const hash = p.symbol.split('').reduce((a,b) => a + b.charCodeAt(0), 0);
        const index = hash % 9;
        matrix[index] += val;
      }
    });

    return matrix.map(val => totalEquity > 0 ? (val / totalEquity) * 100 : 0);
  }, [positions]);

  const getIntensity = (pct: number) => {
    // Map 0-100% to opacity 0.1 - 1.0
    if (pct === 0) return 'bg-zinc-800/50 text-zinc-600';
    const opacity = Math.min(Math.max(pct / 40, 0.1), 1); // Assume >40% is max intensity
    return `bg-blue-500 text-white`; 
  };

  const getOpacityStyle = (pct: number) => {
     if (pct === 0) return {};
     const opacity = Math.min(Math.max(pct / 35, 0.15), 1);
     return { backgroundColor: `rgba(59, 130, 246, ${opacity})` };
  };

  const labels = [
    ['Large Value', 'Large Blend', 'Large Growth'],
    ['Mid Value', 'Mid Blend', 'Mid Growth'],
    ['Small Value', 'Small Blend', 'Small Growth']
  ];

  return (
    <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-purple-500" />
          Equity Style Box
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-1 h-[250px] w-full aspect-square mx-auto max-w-[250px]">
          {gridData.map((pct, i) => {
            const row = Math.floor(i / 3);
            const col = i % 3;
            return (
              <div 
                key={i}
                className={`flex flex-col items-center justify-center rounded border border-zinc-800/50 transition-all duration-500 ${pct === 0 ? 'bg-zinc-900/50' : ''}`}
                style={getOpacityStyle(pct)}
                title={`${labels[row][col]}: ${pct.toFixed(1)}%`}
              >
                 <span className={`text-xs font-bold ${pct > 15 ? 'text-white' : 'text-zinc-400'}`}>
                    {pct > 0 ? pct.toFixed(0) : '-'}
                 </span>
              </div>
            );
          })}
        </div>
        
        {/* Axis Labels */}
        <div className="flex justify-between text-[10px] text-zinc-500 uppercase tracking-wider mt-2 px-8">
            <span>Value</span>
            <span>Blend</span>
            <span>Growth</span>
        </div>
        <div className="absolute left-4 top-1/2 -translate-y-1/2 flex flex-col justify-between h-[200px] text-[10px] text-zinc-500 uppercase tracking-wider -ml-2">
            <span className="-rotate-90">Large</span>
            <span className="-rotate-90">Mid</span>
            <span className="-rotate-90">Small</span>
        </div>
      </CardContent>
    </Card>
  );
}
