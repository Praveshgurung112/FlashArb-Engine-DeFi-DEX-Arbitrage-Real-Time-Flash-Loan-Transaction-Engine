import React from 'react';
import {
  X,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  Copy,
  Layers,
  Fuel,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export default function TxInspectorModal({ isOpen, onClose, tx }) {
  if (!isOpen || !tx) return null;

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
  };

  const shortHash = (hash) =>
    hash ? `${hash.slice(0, 10)}...${hash.slice(-8)}` : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/40 text-slate-200 font-sans">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Transaction Details
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  Etherscan Simulation
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono">
                {shortHash(tx.txHash)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 space-y-4 max-h-[75vh] overflow-y-auto text-xs font-mono">
          {/* Status & Hash Banner */}
          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/90 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-slate-400 font-sans">Transaction Status:</span>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-700 text-emerald-400 font-bold text-[11px]">
                <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS (Atomic Confirmed)
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Tx Hash:</span>
              <div className="flex items-center gap-1.5 text-cyan-300">
                <span>{tx.txHash}</span>
                <button
                  onClick={() => copyToClipboard(tx.txHash)}
                  title="Copy Hash"
                  className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Block:</span>
              <span className="text-slate-200">
                #{tx.blockNumber} <span className="text-slate-500 font-sans">(1 Block Confirmation)</span>
              </span>
            </div>

            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-400 font-sans">Execution Latency:</span>
              <span className="text-purple-300 font-semibold">{tx.executionTimeMs} ms</span>
            </div>
          </div>

          {/* Key Financials */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-sans">
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Flash Loan Size</span>
              <span className="text-slate-100 font-mono font-bold text-xs mt-0.5 block">
                {tx.inputAmount} {tx.inputToken}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Gross Profit</span>
              <span className="text-cyan-300 font-mono font-bold text-xs mt-0.5 block">
                +${(tx.grossProfitUsd || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800">
              <span className="text-[10px] text-slate-400 block uppercase">Gas Fee Paid</span>
              <span className="text-rose-400 font-mono font-bold text-xs mt-0.5 block">
                -${(tx.gasCostUsd || 0).toFixed(2)}
              </span>
            </div>
            <div className="p-2.5 rounded-lg bg-emerald-950/60 border border-emerald-700/60">
              <span className="text-[10px] text-emerald-300 block uppercase">Net Realized PnL</span>
              <span className="text-emerald-400 font-mono font-bold text-xs mt-0.5 block">
                +${(tx.netProfitUsd || 0).toFixed(2)}
              </span>
            </div>
          </div>

          {/* Swap Route Sequence */}
          <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans">
              Arbitrage Swap Route
            </span>
            <div className="flex items-center flex-wrap gap-1.5 text-xs">
              {tx.route?.map((token, i) => (
                <React.Fragment key={i}>
                  <span className="bg-slate-800 px-2 py-0.5 rounded text-slate-200 border border-slate-700 font-bold">
                    {token}
                  </span>
                  {i < tx.route.length - 1 && (
                    <div className="flex items-center gap-1 text-[10px] text-cyan-400">
                      <ArrowRight className="w-3 h-3" />
                      <span className="bg-cyan-950 text-cyan-300 border border-cyan-800 px-1.5 py-0.5 rounded font-sans">
                        {tx.dexes?.[i] || 'DEX'}
                      </span>
                      <ArrowRight className="w-3 h-3" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Event Logs Trace */}
          <div className="space-y-2">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 block font-sans">
              On-Chain Event Logs ({tx.logs?.length || 0})
            </span>
            <div className="space-y-2">
              {tx.logs?.map((log, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-indigo-400 font-sans">
                      [{idx + 1}] Event: {log.event}
                    </span>
                    <span className="text-slate-500 font-sans">{log.contractName}</span>
                  </div>
                  <div className="text-slate-300 pl-2 border-l-2 border-slate-800 space-y-0.5">
                    {Object.entries(log.data || {}).map(([key, val]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-500">{key}:</span>
                        <span className="text-slate-300">{String(val)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Simulated under EVM atomic flash loan rules</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
