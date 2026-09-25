import React from 'react';
import { ArrowRight, TrendingUp, Sparkles } from 'lucide-react';

export default function PriceTable({ pricesData, onSelectPair }) {
  if (!pricesData?.prices || pricesData.prices.length === 0) {
    return (
      <div className="p-8 text-center text-slate-500 border border-slate-800 rounded-xl bg-slate-900/40">
        <div className="inline-block animate-spin mb-3">⟳</div>
        <p>Syncing multi-DEX pair reserves from contracts...</p>
      </div>
    );
  }

  // Group prices by pair
  const pairGroups = {};
  for (const item of pricesData.prices) {
    const pairKey = `${item.tokenA}/${item.tokenB}`;
    if (!pairGroups[pairKey]) pairGroups[pairKey] = [];
    pairGroups[pairKey].push(item);
  }

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-cyan-400" />
            Live DEX Price Matrix & Spreads
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time constant-product rates across Uniswap V2, SushiSwap & PancakeSwap
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-slate-950/60 text-slate-400 font-mono uppercase tracking-wider text-[11px] border-b border-slate-800">
            <tr>
              <th className="py-3 px-4">Trading Pair</th>
              <th className="py-3 px-4">Uniswap V2</th>
              <th className="py-3 px-4">SushiSwap</th>
              <th className="py-3 px-4">PancakeSwap V2</th>
              <th className="py-3 px-4 text-right">Max Spread</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {Object.entries(pairGroups).map(([pair, dexes]) => {
              const [tokenA, tokenB] = pair.split('/');

              const uni = dexes.find((d) => d.dex === 'uniswap-v2');
              const sushi = dexes.find((d) => d.dex === 'sushiswap');
              const pancake = dexes.find((d) => d.dex === 'pancakeswap-v2');

              const validRates = [uni?.rate, sushi?.rate, pancake?.rate].filter(Boolean);
              const minRate = Math.min(...validRates);
              const maxRate = Math.max(...validRates);
              const spreadPct = minRate > 0 ? ((maxRate - minRate) / minRate) * 100 : 0;

              const isHighSpread = spreadPct > 0.4;

              return (
                <tr
                  key={pair}
                  className="hover:bg-slate-800/40 transition-colors group cursor-pointer"
                  onClick={() => onSelectPair && onSelectPair({ pair, dexes })}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{tokenA}</span>
                      <ArrowRight className="w-3 h-3 text-slate-500" />
                      <span className="text-slate-400">{tokenB}</span>
                      {isHighSpread && (
                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-800 text-[10px] text-cyan-300 font-sans">
                          <Sparkles className="w-2.5 h-2.5" /> Arb
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Uniswap */}
                  <td className="py-3 px-4">
                    {uni ? (
                      <div>
                        <span className="text-slate-200 font-medium">
                          {uni.rate < 0.001 ? uni.rate.toExponential(3) : uni.rate.toFixed(4)}
                        </span>
                        <div className="text-[10px] text-slate-500">fee 0.3%</div>
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>

                  {/* SushiSwap */}
                  <td className="py-3 px-4">
                    {sushi ? (
                      <div>
                        <span className="text-slate-200 font-medium">
                          {sushi.rate < 0.001 ? sushi.rate.toExponential(3) : sushi.rate.toFixed(4)}
                        </span>
                        <div className="text-[10px] text-slate-500">fee 0.3%</div>
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>

                  {/* PancakeSwap */}
                  <td className="py-3 px-4">
                    {pancake ? (
                      <div>
                        <span className="text-slate-200 font-medium">
                          {pancake.rate < 0.001 ? pancake.rate.toExponential(3) : pancake.rate.toFixed(4)}
                        </span>
                        <div className="text-[10px] text-slate-500">fee 0.25%</div>
                      </div>
                    ) : (
                      <span className="text-slate-600">--</span>
                    )}
                  </td>

                  {/* Spread */}
                  <td className="py-3 px-4 text-right">
                    <span
                      className={`inline-block px-2.5 py-1 rounded font-bold text-xs ${
                        spreadPct > 0.4
                          ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-400'
                          : spreadPct > 0.15
                          ? 'bg-amber-950/80 border border-amber-700/60 text-amber-300'
                          : 'text-slate-400'
                      }`}
                    >
                      +{spreadPct.toFixed(3)}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
