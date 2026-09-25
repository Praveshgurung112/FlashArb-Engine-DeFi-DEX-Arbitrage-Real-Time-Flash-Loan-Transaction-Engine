import React from 'react';
import ArbCard from './ArbCard.jsx';
import { Target, Sparkles, AlertCircle } from 'lucide-react';

export default function ArbList({ opportunities, onSimulate, onExecuteDirect }) {
  const directSpreads = opportunities?.spreads || [];
  const cycles = opportunities?.cycles || [];

  const allOpps = [
    ...cycles.map((c) => ({ ...c, type: 'triangular' })),
    ...directSpreads.map((s) => ({ ...s, type: 'direct' })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            Detected Arbitrage Routes ({allOpps.length})
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time Bellman-Ford negative cycles & cross-DEX price discrepancies
          </p>
        </div>
      </div>

      {allOpps.length === 0 ? (
        <div className="p-8 text-center border border-dashed border-slate-800 rounded-xl bg-slate-900/20 text-slate-500 text-xs">
          <AlertCircle className="w-6 h-6 mx-auto mb-2 text-slate-600" />
          <p>Scanning order routing graphs for profitable cycles...</p>
          <p className="text-slate-600 mt-1">
            Opportunities surface automatically as pool reserves fluctuate.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {allOpps.map((opp, idx) => (
            <ArbCard
              key={idx}
              opp={opp}
              onSimulate={onSimulate}
              onExecuteDirect={onExecuteDirect}
            />
          ))}
        </div>
      )}
    </div>
  );
}
