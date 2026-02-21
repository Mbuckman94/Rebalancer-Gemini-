import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Position } from '@/types';

interface AssetDistributionCardProps {
  positions: Position[];
}

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b', '#64748b'];

export function AssetDistributionCard({ positions }: AssetDistributionCardProps) {
  const data = React.useMemo(() => {
    const counts: Record<string, number> = {};
    let total = 0;

    positions.forEach(p => {
      const assetClass = p.assetClass || 'OTHER';
      const value = p.currentValue;
      counts[assetClass] = (counts[assetClass] || 0) + value;
      total += value;
    });

    return Object.entries(counts).map(([name, value]) => ({
      name: name.replace('_', ' '),
      value,
      percent: total > 0 ? (value / total) * 100 : 0
    })).sort((a, b) => b.value - a.value);
  }, [positions]);

  return (
    <Card className="h-full bg-zinc-900/40 backdrop-blur-sm border-zinc-800">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-blue-500" />
          Asset Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0.5)" />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', color: '#f4f4f5' }}
                itemStyle={{ color: '#f4f4f5' }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Value']}
              />
              <Legend 
                verticalAlign="bottom" 
                height={36}
                formatter={(value, entry: any) => (
                    <span className="text-zinc-400 text-xs ml-1">{value} ({entry.payload.percent.toFixed(1)}%)</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
