import React from 'react';
import { ArrowRight, Zap, ShieldCheck, Flame, Play } from 'lucide-react';

export default function ArbCard({ opp, onSimulate, onExecuteDirect }) {
  const isDirect = opp.type === 'direct' || !opp.route || opp.route.length === 2;
  const routeTokens = opp.route || [opp.tokenA, opp.tokenB];
  const dexes = opp.dexes || [opp.buyDex, opp.sellDex];
  const profitPct = opp.profitPct || opp.spreadPct || 0;
  const gasCostUsd = opp.gasCostUsd || 0;

  const isProfitable = profitPct > 0.2;

  const getDexName = (slug) => {
    if (slug === 'uniswap-v2') return 'Uniswap V2';
    if (slug === 'sushiswap') return 'SushiSwap';
    if (slug === 'pancakeswap-v2') return 'Pancake V2';
    return slug;
  };

  const getDexColor = (slug) => {
    if (slug === 'uniswap-v2') return 'bg-pink-950/70 border-pink-700/60 text-pink-300';
    if (slug === 'sushiswap') return 'bg-fuchsia-950/70 border-fuchsia-700/60 text-fuchsia-300';
    if (slug === 'pancakeswap-v2') return 'bg-amber-950/70 border-amber-700/60 text-amber-300';
    return 'bg-slate-800 text-slate-300';
  };

  return (
    <div className="bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all rounded-xl p-4 flex flex-col justify-between group shadow-sm hover:shadow-cyan-900/10">
      <div>
        {/* Header Badge */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <span
            className={`text-[11px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
              isDirect
                ? 'bg-blue-950/80 text-blue-300 border border-blue-800/60'
                : 'bg-purple-950/80 text-purple-300 border border-purple-800/60'
            }`}
          >
            {isDirect ? 'Cross-DEX Arbitrage' : 'Triangular Loop'}
          </span>

          <span
            className={`text-xs font-mono font-bold px-2.5 py-1 rounded-md ${
              isProfitable
                ? 'bg-emerald-950/90 text-emerald-400 border border-emerald-700/70'
                : 'bg-amber-950/90 text-amber-300 border border-amber-700/70'
            }`}
          >
            +{profitPct.toFixed(3)}% Spread
          </span>
        </div>

        {/* Route Diagram */}
        <div className="py-2 flex items-center flex-wrap gap-1.5 font-mono text-xs">
          {routeTokens.map((token, idx) => (
            <React.Fragment key={idx}>
              <span className="font-bold text-slate-200 bg-slate-800/90 px-2 py-1 rounded border border-slate-700">
                {token}
              </span>
              {idx < routeTokens.length - 1 && (
                <div className="flex items-center gap-1">
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                  {dexes[idx] && (
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded border font-sans font-medium ${getDexColor(
                        dexes[idx]
                      )}`}
                    >
                      {getDexName(dexes[idx])}
                    </span>
                  )}
                  <ArrowRight className="w-3 h-3 text-cyan-400" />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Gas & Fee details */}
        <div className="mt-3 grid grid-cols-2 gap-2 text-[11px] bg-slate-950/50 p-2.5 rounded-lg border border-slate-800/60 font-mono">
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Est. Gas Cost</span>
            <span className="text-slate-200 font-semibold">${gasCostUsd.toFixed(2)} USD</span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Protocol Risk</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Atomic / Zero Risk
            </span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-800/60 grid grid-cols-2 gap-2">
        <button
          onClick={() =>
            onSimulate({
              route: routeTokens,
              dexes,
              profitPct,
              gasCostUsd,
            })
          }
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-medium text-xs border border-slate-700/80 transition-all"
        >
          <Play className="w-3 h-3" />
          Simulate
        </button>

        <button
          onClick={() =>
            onExecuteDirect({
              route: routeTokens,
              dexes,
              profitPct,
              gasCostUsd,
            })
          }
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-md shadow-cyan-900/20 transition-all active:scale-[0.98]"
        >
          <Flame className="w-3 h-3 text-cyan-200 fill-cyan-200" />
          Execute Tx
        </button>
      </div>
    </div>
  );
}
