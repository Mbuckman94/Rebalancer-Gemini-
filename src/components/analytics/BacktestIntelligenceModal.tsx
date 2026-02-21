import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { fetchTiingoHistory } from '@/services/tiingo';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { Loader2 } from 'lucide-react';

interface BacktestIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  strategyName: string;
  tickers: string[];
  weights: number[]; // 0-100
}

export function BacktestIntelligenceModal({ 
  isOpen, 
  onClose, 
  strategyName, 
  tickers, 
  weights 
}: BacktestIntelligenceModalProps) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({ modelReturn: 0, benchmarkReturn: 0, alpha: 0, volatility: 0 });
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && tickers.length > 0) {
      runBacktest();
    }
  }, [isOpen, tickers]);

  const runBacktest = async () => {
    setLoading(true);
    setError('');
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 5 years ago

      // Fetch benchmark (SPY)
      const spyData = await fetchTiingoHistory('SPY', startDate, endDate);
      
      // Fetch all tickers
      const tickerDataPromises = tickers.map(t => fetchTiingoHistory(t, startDate, endDate));
      const allTickerData = await Promise.all(tickerDataPromises);

      // Process Data
      // Map date -> { date, spy: price, model: price }
      // We need to normalize to start at 100 or 0%
      
      const processedData: any[] = [];
      const dateMap = new Map<string, { spy: number, model: number }>();

      // Build SPY map
      if (!Array.isArray(spyData)) throw new Error("Failed to fetch benchmark data");
      
      const spyStartPrice = spyData[0].adjClose;
      spyData.forEach((day: any) => {
        dateMap.set(day.date.split('T')[0], { 
            spy: (day.adjClose / spyStartPrice - 1) * 100, 
            model: 0 
        });
      });

      // Calculate Model Performance
      // Assume daily rebalancing for simplicity or just buy-and-hold of the basket
      // For this demo, we'll do a simple weighted average of cumulative returns (Buy & Hold)
      
      const tickerStartPrices = allTickerData.map(d => d[0]?.adjClose || 0);
      
      // Iterate through dates present in SPY (trading days)
      const dates = Array.from(dateMap.keys()).sort();
      
      dates.forEach(date => {
        let dailyModelVal = 0;
        let validTickers = 0;

        allTickerData.forEach((tData, i) => {
            const dayData = tData.find((d: any) => d.date.startsWith(date));
            if (dayData && tickerStartPrices[i] > 0) {
                const ret = (dayData.adjClose / tickerStartPrices[i] - 1) * 100;
                dailyModelVal += ret * (weights[i] / 100);
                validTickers++;
            }
        });

        const entry = dateMap.get(date);
        if (entry) {
            entry.model = dailyModelVal;
            processedData.push({ date, ...entry });
        }
      });

      setData(processedData);

      // Calculate Metrics
      const final = processedData[processedData.length - 1];
      const modelReturn = final.model;
      const benchmarkReturn = final.spy;
      const alpha = modelReturn - benchmarkReturn;
      
      // Volatility (Standard Deviation of daily returns * sqrt(252)) - simplified for demo
      // Calculating daily returns first
      const dailyReturns = processedData.map((d, i) => {
          if (i === 0) return 0;
          return d.model - processedData[i-1].model;
      });
      const mean = dailyReturns.reduce((a,b) => a+b, 0) / dailyReturns.length;
      const variance = dailyReturns.reduce((a,b) => a + Math.pow(b - mean, 2), 0) / dailyReturns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252);

      setMetrics({ modelReturn, benchmarkReturn, alpha, volatility });

    } catch (e) {
      console.error("Backtest failed", e);
      setError("Failed to load backtest data. Please check API keys and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Backtest: ${strategyName}`} className="max-w-4xl">
      <div className="space-y-6">
        {loading ? (
            <div className="h-[400px] flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <span className="ml-2 text-zinc-400">Crunching numbers...</span>
            </div>
        ) : error ? (
            <div className="h-[400px] flex items-center justify-center text-red-400">
                {error}
            </div>
        ) : (
            <>
                <div className="grid grid-cols-4 gap-4">
                    <MetricCard label="Total Return" value={`${metrics.modelReturn.toFixed(1)}%`} color="text-white" />
                    <MetricCard label="Benchmark (SPY)" value={`${metrics.benchmarkReturn.toFixed(1)}%`} color="text-zinc-400" />
                    <MetricCard label="Alpha" value={`${metrics.alpha > 0 ? '+' : ''}${metrics.alpha.toFixed(1)}%`} color={metrics.alpha >= 0 ? "text-emerald-400" : "text-red-400"} />
                    <MetricCard label="Volatility" value={`${metrics.volatility.toFixed(1)}%`} color="text-yellow-400" />
                </div>

                <div className="h-[300px] w-full bg-zinc-900/30 rounded-xl border border-zinc-800 p-4">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                            <XAxis 
                                dataKey="date" 
                                stroke="#52525b" 
                                tickFormatter={(val) => val.substring(0, 4)} 
                                minTickGap={30}
                            />
                            <YAxis stroke="#52525b" tickFormatter={(val) => `${val}%`} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a' }}
                                formatter={(val: number) => [`${val.toFixed(2)}%`]}
                                labelStyle={{ color: '#a1a1aa' }}
                            />
                            <Legend />
                            <Line 
                                type="monotone" 
                                dataKey="model" 
                                name={strategyName} 
                                stroke="#3b82f6" 
                                strokeWidth={2} 
                                dot={false} 
                                activeDot={{ r: 6 }}
                            />
                            <Line 
                                type="monotone" 
                                dataKey="spy" 
                                name="S&P 500" 
                                stroke="#71717a" 
                                strokeWidth={2} 
                                strokeDasharray="4 4" 
                                dot={false} 
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </>
        )}
        
        <div className="flex justify-end">
            <Button onClick={onClose} variant="secondary">Close Analysis</Button>
        </div>
      </div>
    </Modal>
  );
}

function MetricCard({ label, value, color }: { label: string, value: string, color: string }) {
    return (
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 text-center">
            <div className="text-xs text-zinc-500 uppercase tracking-wider mb-1">{label}</div>
            <div className={`text-2xl font-mono font-bold ${color}`}>{value}</div>
        </div>
    );
}
