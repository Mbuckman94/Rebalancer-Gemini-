import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Position } from '@/types';

interface GeoConcentrationCardProps {
  positions: Position[];
}

export function GeoConcentrationCard({ positions }: GeoConcentrationCardProps) {
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let muniTotal = 0;

    positions.forEach(p => {
      if (p.assetClass === 'MUNI_BOND' && p.stateCode) {
        const state = p.stateCode;
        const value = p.currentValue;
        counts[state] = (counts[state] || 0) + value;
        muniTotal += value;
      }
    });

    if (muniTotal === 0) return [];

    return Object.entries(counts)
      .map(([name, value]) => ({
        name,
        value,
        percent: (value / muniTotal) * 100
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5); // Top 5 states
  }, [positions]);

  if (data.length === 0) {
    return (
      <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800 flex items-center justify-center">
        <div className="text-zinc-500 text-sm italic p-8">
          No Municipal Bonds with state data found.
        </div>
      </Card>
    );
  }

  return (
    <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Geo Concentration (Munis)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <XAxis type="number" hide />
              <YAxis dataKey="name" type="category" width={30} tick={{ fill: '#a1a1aa', fontSize: 12 }} axisLine={false} tickLine={false} />
              <Tooltip 
                cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Exposure']}
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={20}>
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index === 0 ? '#10b981' : '#3f3f46'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
