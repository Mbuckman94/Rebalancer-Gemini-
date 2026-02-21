import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, Activity, PieChart, TrendingUp } from 'lucide-react';

export function StrategiesView() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-2">Model Strategies</h1>
          <p className="text-zinc-400 max-w-lg">
            Define your target allocations. Create and backtest investment strategies.
          </p>
        </div>
        <div className="flex gap-3">
            <Button variant="secondary" size="lg" className="gap-2">
                <Activity className="h-4 w-4" />
                Backtest
            </Button>
            <Button size="lg" className="gap-2 shadow-blue-900/20 shadow-lg">
            <Plus className="h-4 w-4" />
            Create Model
            </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Strategy Card */}
        <Card className="group hover:border-zinc-700 transition-all duration-300 bg-zinc-900/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
                <div className="h-10 w-10 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                    <LayersIcon className="h-5 w-5" />
                </div>
                <div className="flex gap-2">
                     <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-600 hover:text-zinc-300">
                        <EditIcon className="h-4 w-4" />
                    </Button>
                </div>
            </div>
            <CardTitle>Growth Tech</CardTitle>
            <CardDescription>Aggressive growth focused on US Tech sector</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-white">MSFT</span>
                        <span className="font-mono text-zinc-400">25%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 w-1/4" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-white">GOOGL</span>
                        <span className="font-mono text-zinc-400">25%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 w-1/4" />
                    </div>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-white">META</span>
                        <span className="font-mono text-zinc-400">25%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-purple-500 w-1/4" />
                    </div>
                </div>
                 <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                        <span className="font-medium text-white">NVDA</span>
                        <span className="font-mono text-zinc-400">25%</span>
                    </div>
                    <div className="h-1.5 w-full bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-1/4" />
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>

        {/* Another Strategy Card */}
         <Card className="group hover:border-zinc-700 transition-all duration-300 bg-zinc-900/40 backdrop-blur-sm">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                    <PieChart className="h-5 w-5" />
                </div>
            </div>
            <CardTitle>Conservative Income</CardTitle>
            <CardDescription>Low volatility, high dividend yield focus</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-40 text-zinc-500 text-sm italic">
                Visualization placeholder
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

const LayersIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>
);

const EditIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"/></svg>
);
