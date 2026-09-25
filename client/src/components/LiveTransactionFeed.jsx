import React from 'react';
import {
  Activity,
  ArrowRight,
  CheckCircle2,
  ExternalLink,
  Zap,
  Clock,
  Layers,
  Fuel,
} from 'lucide-react';

export default function LiveTransactionFeed({ transactions, onSelectTx }) {
  const shortHash = (hash) =>
    hash ? `${hash.slice(0, 6)}...${hash.slice(-4)}` : '';

  const formatTimeAgo = (timestamp) => {
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 5) return 'just now';
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    return `${Math.floor(minutes / 60)}h ago`;
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-xl overflow-hidden backdrop-blur-sm">
      {/* Header */}
      <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <h2 className="text-sm font-semibold text-slate-200 flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-400" />
            Live Executed Transactions & MEV Ledger
          </h2>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {transactions.length} Mined Transactions
        </span>
      </div>

      {/* Transaction Table */}
      <div className="overflow-x-auto max-h-[360px] overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800 sticky top-0 z-10 font-sans">
            <tr>
              <th className="py-2.5 px-4">Tx Hash</th>
              <th className="py-2.5 px-4">Type / Route</th>
              <th className="py-2.5 px-4">Block</th>
              <th className="py-2.5 px-4">Gas Fee</th>
              <th className="py-2.5 px-4">Latency</th>
              <th className="py-2.5 px-4 text-right">Net Realized PnL</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {transactions.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                  Listening for real-time transactions...
                </td>
              </tr>
            ) : (
              transactions.map((tx, idx) => {
                const isRecent = idx === 0 && Date.now() - tx.timestamp < 6000;

                return (
                  <tr
                    key={tx.txHash}
                    onClick={() => onSelectTx && onSelectTx(tx)}
                    className={`cursor-pointer hover:bg-slate-800/50 transition-colors group ${
                      isRecent ? 'bg-cyan-950/30' : ''
                    }`}
                  >
                    {/* Tx Hash */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400 font-semibold group-hover:text-cyan-300 group-hover:underline flex items-center gap-1">
                          {shortHash(tx.txHash)}
                          <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                        </span>
                        {isRecent && (
                          <span className="px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 text-[9px] font-sans font-bold animate-pulse">
                            NEW
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-500 font-sans mt-0.5">
                        {formatTimeAgo(tx.timestamp)}
                      </div>
                    </td>

                    {/* Route & Type */}
                    <td className="py-3 px-4 font-sans">
                      <div className="flex items-center gap-1 text-[11px]">
                        <span
                          className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                            tx.isAuto
                              ? 'bg-purple-950/80 border border-purple-800 text-purple-300'
                              : 'bg-blue-950/80 border border-blue-800 text-blue-300'
                          }`}
                        >
                          {tx.isAuto ? 'AUTO-BOT' : 'MANUAL'}
                        </span>
                        <span className="font-mono text-slate-200">
                          {tx.route ? tx.route.join(' → ') : `${tx.inputToken} Arb`}
                        </span>
                      </div>
                    </td>

                    {/* Block */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      #{tx.blockNumber}
                    </td>

                    {/* Gas Fee */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      <span className="text-rose-400 font-medium">
                        -${(tx.gasCostUsd || 0).toFixed(2)}
                      </span>
                    </td>

                    {/* Execution Latency */}
                    <td className="py-3 px-4 text-purple-300 text-[11px]">
                      {tx.executionTimeMs}ms
                    </td>

                    {/* Net Profit */}
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`inline-block px-2 py-0.5 rounded font-bold text-xs ${
                          tx.netProfitUsd > 0
                            ? 'bg-emerald-950/80 border border-emerald-700/60 text-emerald-400'
                            : 'bg-rose-950/80 border border-rose-700/60 text-rose-400'
                        }`}
                      >
                        {tx.netProfitUsd > 0 ? '+' : ''}${tx.netProfitUsd.toFixed(2)}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
