import React from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { Activity, Clock } from 'lucide-react';

export default function ProfitHistoryChart({ history }) {
  const chartData = (history || []).slice(-25).map((item, idx) => {
    const time = new Date(item.timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    return {
      time,
      spread: parseFloat((item.profitPct || 0).toFixed(3)),
      type: item.type,
    };
  });

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
            Arbitrage Spread Volatility Stream
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Last {chartData.length} opportunities</span>
        </div>
      </div>

      <div className="h-44 w-full">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="spreadGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#00f2fe" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#00f2fe" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="time"
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#475569"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => `+${val}%`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '0.5rem',
                  fontSize: '11px',
                  fontFamily: 'monospace',
                }}
                labelStyle={{ color: '#94a3b8' }}
              />
              <Area
                type="monotone"
                dataKey="spread"
                stroke="#00f2fe"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#spreadGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-600 text-xs font-mono">
            Collecting spread data points...
          </div>
        )}
      </div>
    </div>
  );
}
