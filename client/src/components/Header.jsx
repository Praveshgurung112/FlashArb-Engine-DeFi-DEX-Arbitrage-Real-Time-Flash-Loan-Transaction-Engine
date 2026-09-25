import React from 'react';
import { Activity, Zap, Fuel, Layers, Globe, RefreshCw } from 'lucide-react';

export default function Header({ status, onRefresh }) {
  const { prices, opportunities, wsConnected } = status;
  const gasGwei = prices?.gasPriceGwei || 18;
  const ethPrice = prices?.ethPriceUsd || 3450;
  const blockNum = prices?.blockNumber || '---';

  const gasColor =
    gasGwei < 20 ? 'text-emerald-400' : gasGwei < 40 ? 'text-amber-400' : 'text-rose-400';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/70 backdrop-blur-md sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-wrap items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Zap className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold bg-gradient-to-r from-white via-slate-200 to-cyan-400 bg-clip-text text-transparent">
                FlashArb Engine
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-700/50 text-cyan-300">
                Mainnet v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Real-Time Cross-DEX Arbitrage & Flash Loan Simulator
            </p>
          </div>
        </div>

        {/* Live Telemetry Badges */}
        <div className="flex items-center flex-wrap gap-2.5 sm:gap-3 text-xs">
          {/* WebSocket status */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'
              }`}
            />
            <span className="text-slate-300 font-medium">
              {wsConnected ? 'Live Feed' : 'Connecting...'}
            </span>
          </div>

          {/* ETH Price */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">ETH:</span>
            <span className="text-slate-200 font-semibold">
              ${ethPrice.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Gas Tracker */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono">
            <Fuel className={`w-3.5 h-3.5 ${gasColor}`} />
            <span className="text-slate-400">Gas:</span>
            <span className={`font-semibold ${gasColor}`}>
              {gasGwei.toFixed(1)} Gwei
            </span>
          </div>

          {/* Block Number */}
          <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-800 font-mono">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">Block:</span>
            <span className="text-slate-300">#{blockNum}</span>
          </div>

          {/* Manual refresh button */}
          <button
            onClick={onRefresh}
            title="Force refresh scanner"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors border border-slate-700/60"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
}
