import React, { useState } from 'react';
import {
  X,
  Zap,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Play,
  Flame,
  ExternalLink,
} from 'lucide-react';

export default function FlashLoanModal({
  isOpen,
  onClose,
  selectedArb,
  ethPriceUsd,
  onTxExecuted,
}) {
  const [loanAmount, setLoanAmount] = useState(10);
  const [provider, setProvider] = useState('aave');
  const [loading, setLoading] = useState(false);
  const [executing, setExecuting] = useState(false);
  const [simResult, setSimResult] = useState(null);
  const [txResult, setTxResult] = useState(null);

  if (!isOpen || !selectedArb) return null;

  const route = selectedArb.route || ['WETH', 'USDC', 'DAI', 'WETH'];
  const dexes = selectedArb.dexes || ['uniswap-v2', 'sushiswap', 'uniswap-v2'];
  const startToken = route[0];

  const handleSimulate = async () => {
    setLoading(true);
    setSimResult(null);
    setTxResult(null);

    try {
      const res = await fetch('/api/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route,
          dexes,
          amountHuman: loanAmount,
          provider,
        }),
      });
      const data = await res.json();
      setSimResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteLive = async () => {
    setExecuting(true);
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route,
          dexes,
          amountHuman: loanAmount,
          provider,
        }),
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setTxResult(data.transaction);
        if (onTxExecuted) onTxExecuted(data.transaction);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setExecuting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl shadow-cyan-950/40">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center">
              <Zap className="w-4 h-4 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Flash Loan Arbitrage Execution
              </h3>
              <p className="text-xs text-slate-400">
                Zero-Capital Atomic Transaction Executor
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
        <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto font-sans">
          {/* Selected Route */}
          <div>
            <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
              Swap Path & DEX Protocol Sequence
            </label>
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center flex-wrap gap-2 text-xs font-mono">
              {route.map((token, idx) => (
                <React.Fragment key={idx}>
                  <span className="font-bold text-slate-200 bg-slate-800 px-2.5 py-1 rounded border border-slate-700">
                    {token}
                  </span>
                  {idx < route.length - 1 && (
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                      <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-cyan-300">
                        {dexes[idx] || 'DEX'}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5 text-cyan-400" />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          {/* Capital & Provider Form */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Flash Loan Size */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                Flash Loan Capital ({startToken})
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0.1"
                  step="0.5"
                  value={loanAmount}
                  onChange={(e) => setLoanAmount(Math.max(0.1, parseFloat(e.target.value) || 0))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 font-mono text-sm focus:outline-none focus:border-cyan-500 transition-colors"
                />
                <span className="absolute right-3.5 top-2.5 text-xs text-slate-500 font-mono">
                  ≈ ${(loanAmount * (startToken === 'WETH' ? ethPriceUsd : 1)).toLocaleString(undefined, { maximumFractionDigits: 0 })} USD
                </span>
              </div>
              <div className="flex gap-2 mt-2">
                {[1, 5, 20, 50].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setLoanAmount(amt)}
                    className="text-[11px] px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono"
                  >
                    {amt} {startToken}
                  </button>
                ))}
              </div>
            </div>

            {/* Provider */}
            <div>
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400 block mb-2 font-mono">
                Flash Loan Liquidity Source
              </label>
              <select
                value={provider}
                onChange={(e) => setProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-4 py-2.5 text-slate-100 text-sm focus:outline-none focus:border-cyan-500 transition-colors"
              >
                <option value="aave">Aave V3 Pool (0.05% Fee)</option>
                <option value="balancer">Balancer Vault (0.00% Fee)</option>
                <option value="uniswap">Uniswap V2 Flash Swap (0.30% Fee)</option>
              </select>
              <p className="text-[11px] text-slate-500 mt-2">
                Atomic rollback protection: if net profit &le; 0, tx reverts safely.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={handleSimulate}
              disabled={loading || executing}
              className="py-3 rounded-xl bg-slate-800 hover:bg-slate-700 font-semibold text-xs text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition-all disabled:opacity-50"
            >
              {loading ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5" />
              )}
              Simulate PnL Math
            </button>

            <button
              onClick={handleExecuteLive}
              disabled={loading || executing}
              className="py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:opacity-90 font-bold text-xs text-white flex items-center justify-center gap-2 shadow-lg shadow-cyan-900/30 transition-all active:scale-[0.99] disabled:opacity-50"
            >
              {executing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Broadcasting & Mining On-Chain...
                </>
              ) : (
                <>
                  <Flame className="w-4 h-4 text-cyan-200 fill-cyan-200" />
                  Execute Live Transaction
                </>
              )}
            </button>
          </div>

          {/* Executed Transaction Banner */}
          {txResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-700/80 space-y-2 animate-fadeIn font-mono text-xs">
              <div className="flex items-center justify-between">
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 font-sans">
                  <CheckCircle2 className="w-4 h-4" /> Real-Time Transaction Mined!
                </span>
                <span className="text-[10px] text-slate-400 font-sans">
                  Latency: {txResult.executionTimeMs}ms
                </span>
              </div>
              <div className="text-[11px] text-slate-300">
                Tx Hash:{' '}
                <span className="text-cyan-300 font-semibold">
                  {txResult.txHash}
                </span>
              </div>
              <div className="flex items-center justify-between pt-1 text-xs">
                <span className="text-slate-400 font-sans">Net Profit Deposited:</span>
                <span className="text-emerald-400 font-bold text-sm">
                  +${txResult.netProfitUsd.toFixed(2)} USD
                </span>
              </div>
            </div>
          )}

          {/* Simulation Output */}
          {simResult && !txResult && (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs animate-fadeIn">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800 font-sans">
                <span className="font-semibold text-slate-200">Simulation Estimate</span>
                {simResult.isProfitable ? (
                  <span className="text-emerald-400 font-bold text-[11px]">
                    PROFITABLE ARBITRAGE
                  </span>
                ) : (
                  <span className="text-rose-400 font-bold text-[11px]">
                    UNPROFITABLE
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Input</span>
                  <span className="text-slate-200 font-bold">{simResult.inputAmount} {startToken}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Output</span>
                  <span className="text-slate-200 font-bold">{simResult.outputAmount.toFixed(4)} {startToken}</span>
                </div>
                <div className="p-2 rounded bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[10px] block">Gas Fee</span>
                  <span className="text-rose-400 font-bold">-${simResult.gasCostUsd.toFixed(2)}</span>
                </div>
                <div className="p-2 rounded bg-emerald-950/60 border border-emerald-700/60">
                  <span className="text-emerald-300 text-[10px] block">Net PnL</span>
                  <span className="text-emerald-400 font-bold">
                    +${simResult.netProfitUsd.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
