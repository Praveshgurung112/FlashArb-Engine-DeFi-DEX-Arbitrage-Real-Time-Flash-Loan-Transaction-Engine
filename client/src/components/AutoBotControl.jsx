import React, { useState } from 'react';
import {
  Bot,
  Power,
  Zap,
  TrendingUp,
  ShieldCheck,
  Settings,
  DollarSign,
  Percent,
} from 'lucide-react';

export default function AutoBotControl({ botStats, onUpdateConfig }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const botConfig = botStats?.autoBot || {
    enabled: true,
    minProfitUsd: 4.0,
    defaultLoanAmount: 10,
    provider: 'aave',
  };

  const handleToggleBot = async () => {
    setIsUpdating(true);
    try {
      await onUpdateConfig({
        ...botConfig,
        enabled: !botConfig.enabled,
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleChangeMinProfit = async (val) => {
    await onUpdateConfig({
      ...botConfig,
      minProfitUsd: parseFloat(val) || 1,
    });
  };

  const handleChangeLoanSize = async (val) => {
    await onUpdateConfig({
      ...botConfig,
      defaultLoanAmount: parseFloat(val) || 1,
    });
  };

  return (
    <div className="bg-slate-900/70 border border-slate-800 rounded-xl p-5 backdrop-blur-sm shadow-sm space-y-4">
      {/* Bot Header & Switch */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
              botConfig.enabled
                ? 'bg-gradient-to-tr from-purple-600 to-cyan-500 shadow-lg shadow-purple-500/30'
                : 'bg-slate-800 text-slate-500'
            }`}
          >
            <Bot className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-100">
                MEV Flash Arbitrage Auto-Trader Bot
              </h2>
              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  botConfig.enabled
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-700/60 animate-pulse'
                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                }`}
              >
                {botConfig.enabled ? 'ACTIVE & EXECUTING' : 'PAUSED'}
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Autonomous on-chain transaction execution when spread &gt; gas + fees
            </p>
          </div>
        </div>

        {/* Toggle button */}
        <button
          onClick={handleToggleBot}
          disabled={isUpdating}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-xs shadow-md transition-all active:scale-95 ${
            botConfig.enabled
              ? 'bg-rose-950/80 hover:bg-rose-900/80 text-rose-300 border border-rose-700/70'
              : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:opacity-90 text-white shadow-emerald-900/30'
          }`}
        >
          <Power className="w-3.5 h-3.5" />
          {botConfig.enabled ? 'Pause Auto-Execution' : 'Start Auto-Execution'}
        </button>
      </div>

      {/* Bot Performance Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block uppercase">
            Total Trades Mined
          </span>
          <span className="text-base font-bold text-slate-100 mt-0.5 block">
            {botStats?.totalTrades || 0}
          </span>
          <span className="text-[10px] text-emerald-400 font-sans">
            Win Rate: {botStats?.winRate || 100}%
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block uppercase">
            Cumulative Net Profit
          </span>
          <span className="text-base font-bold text-emerald-400 mt-0.5 block">
            +${(botStats?.totalNetProfitUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            Gross: ${(botStats?.totalGrossProfitUsd || 0).toFixed(2)}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block uppercase">
            Gas Burned (USD)
          </span>
          <span className="text-base font-bold text-rose-400 mt-0.5 block">
            -${(botStats?.totalGasPaidUsd || 0).toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            {(botStats?.totalTrades || 0) > 0 ? `$${((botStats?.totalGasPaidUsd || 0) / botStats.totalTrades).toFixed(2)} / trade` : '--'}
          </span>
        </div>

        <div className="p-3 rounded-lg bg-slate-950/70 border border-slate-800">
          <span className="text-[10px] text-slate-400 font-sans block uppercase">
            Capital Volume Cycled
          </span>
          <span className="text-base font-bold text-cyan-300 mt-0.5 block">
            ${((botStats?.totalVolumeUsd || 0) / 1000).toFixed(1)}k
          </span>
          <span className="text-[10px] text-slate-500 font-sans">
            Zero-capital flash loans
          </span>
        </div>
      </div>

      {/* Bot Controls Form */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-sans">
              Min Net Profit Trigger (USD):
            </span>
            <span className="font-mono font-bold text-cyan-400">
              ${botConfig.minProfitUsd}
            </span>
          </div>
          <input
            type="range"
            min="1"
            max="25"
            step="1"
            value={botConfig.minProfitUsd}
            onChange={(e) => handleChangeMinProfit(e.target.value)}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
            <span>$1 (Aggressive)</span>
            <span>$25 (Conservative)</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-slate-400 font-sans">
              Flash Loan Size per Trade:
            </span>
            <span className="font-mono font-bold text-cyan-400">
              {botConfig.defaultLoanAmount} WETH
            </span>
          </div>
          <input
            type="range"
            min="2"
            max="50"
            step="2"
            value={botConfig.defaultLoanAmount}
            onChange={(e) => handleChangeLoanSize(e.target.value)}
            className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg"
          />
          <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-0.5">
            <span>2 WETH</span>
            <span>50 WETH</span>
          </div>
        </div>
      </div>
    </div>
  );
}
