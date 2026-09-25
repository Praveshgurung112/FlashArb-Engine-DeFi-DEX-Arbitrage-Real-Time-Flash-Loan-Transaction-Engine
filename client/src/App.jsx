import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header.jsx';
import PriceTable from './components/PriceTable.jsx';
import ArbList from './components/ArbList.jsx';
import FlashLoanModal from './components/FlashLoanModal.jsx';
import ProfitHistoryChart from './components/ProfitHistoryChart.jsx';
import LiveTransactionFeed from './components/LiveTransactionFeed.jsx';
import AutoBotControl from './components/AutoBotControl.jsx';
import TxInspectorModal from './components/TxInspectorModal.jsx';
import {
  Zap,
  TrendingUp,
  ShieldCheck,
  Cpu,
  DollarSign,
  Activity,
  Bot,
} from 'lucide-react';

export default function App() {
  const [pricesData, setPricesData] = useState(null);
  const [opportunities, setOpportunities] = useState(null);
  const [history, setHistory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [botStats, setBotStats] = useState(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [selectedArb, setSelectedArb] = useState(null);
  const [selectedTx, setSelectedTx] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [minProfitFilter, setMinProfitFilter] = useState(0.05);

  // Fetch initial REST data
  const fetchData = useCallback(async () => {
    try {
      const [pRes, oRes, hRes, tRes, bRes] = await Promise.all([
        fetch('/api/prices').then((r) => r.json()),
        fetch('/api/opportunities').then((r) => r.json()),
        fetch('/api/history').then((r) => r.json()),
        fetch('/api/transactions').then((r) => r.json()),
        fetch('/api/bot/stats').then((r) => r.json()),
      ]);
      setPricesData(pRes);
      setOpportunities(oRes);
      setHistory(hRes);
      setTransactions(tRes);
      setBotStats(bRes);
    } catch (err) {
      console.error('Fetch error:', err);
    }
  }, []);

  // WebSocket Live Connection
  useEffect(() => {
    fetchData();

    const wsUrl = `ws://${window.location.hostname}:3001`;
    let ws;

    function connect() {
      ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        setWsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const { type, data } = JSON.parse(event.data);
          if (type === 'prices') {
            setPricesData(data);
          } else if (type === 'opportunities') {
            setOpportunities(data);
          } else if (type === 'transactions') {
            setTransactions(data);
          } else if (type === 'bot_stats') {
            setBotStats(data);
          } else if (type === 'new_transaction') {
            setTransactions((prev) => [data, ...prev.slice(0, 49)]);
          }
        } catch (err) {
          console.error('WS msg parse error:', err);
        }
      };

      ws.onclose = () => {
        setWsConnected(false);
        setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    connect();

    // Regular interval refresh
    const histInterval = setInterval(() => {
      fetch('/api/history')
        .then((r) => r.json())
        .then(setHistory)
        .catch(() => {});
    }, 10000);

    return () => {
      if (ws) ws.close();
      clearInterval(histInterval);
    };
  }, [fetchData]);

  const handleOpenSimulate = (arb) => {
    setSelectedArb(arb);
    setIsModalOpen(true);
  };

  const handleExecuteDirect = async (arb) => {
    try {
      const res = await fetch('/api/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          route: arb.route,
          dexes: arb.dexes,
          amountHuman: botStats?.autoBot?.defaultLoanAmount || 10,
          provider: 'aave',
        }),
      });
      const data = await res.json();
      if (data.success && data.transaction) {
        setSelectedTx(data.transaction);
        setIsTxModalOpen(true);
      }
    } catch (err) {
      console.error('Direct execution error:', err);
    }
  };

  const handleUpdateBotConfig = async (newConfig) => {
    try {
      const res = await fetch('/api/bot/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newConfig),
      });
      const data = await res.json();
      setBotStats((prev) => ({ ...prev, autoBot: data }));
    } catch (err) {
      console.error('Bot config update error:', err);
    }
  };

  const handleSelectPair = ({ pair, dexes }) => {
    const [tokenA, tokenB] = pair.split('/');
    handleOpenSimulate({
      route: [tokenA, tokenB, tokenA],
      dexes: [dexes[0]?.dex || 'uniswap-v2', dexes[1]?.dex || 'sushiswap'],
      profitPct: 0.35,
      gasCostUsd: pricesData?.swapGasCostUsd || 4.2,
    });
  };

  const handleSelectTx = (tx) => {
    setSelectedTx(tx);
    setIsTxModalOpen(true);
  };

  // Filter opportunities
  const filteredOpportunities = {
    spreads: (opportunities?.spreads || []).filter((s) => s.spreadPct >= minProfitFilter),
    cycles: (opportunities?.cycles || []).filter((c) => c.profitPct >= minProfitFilter),
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation */}
      <Header
        status={{
          prices: pricesData,
          opportunities,
          wsConnected,
        }}
        onRefresh={fetchData}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Top Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>REAL-TIME NET PROFIT</span>
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-emerald-400">
              +${(botStats?.totalNetProfitUsd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Cumulative realized MEV gain</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>ACTIVE ARB ROUTES</span>
              <Zap className="w-3.5 h-3.5 text-cyan-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-cyan-300">
              {(filteredOpportunities.cycles.length + filteredOpportunities.spreads.length)}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Across Uni V2, Sushi, Pancake</p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>TRANSACTIONS MINED</span>
              <Activity className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-purple-300">
              {botStats?.totalTrades || 0}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Win rate: {botStats?.winRate || 100}%
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
            <div className="flex items-center justify-between text-slate-400 text-xs font-mono mb-1">
              <span>AVG EXECUTION SPEED</span>
              <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold font-mono text-indigo-300">
              ~210 ms
            </div>
            <p className="text-[11px] text-slate-500 mt-1">Sub-block atomic execution</p>
          </div>
        </div>

        {/* Auto Bot Controller Panel */}
        <AutoBotControl
          botStats={botStats}
          onUpdateConfig={handleUpdateBotConfig}
        />

        {/* Live Executed Transaction Ledger */}
        <LiveTransactionFeed
          transactions={transactions}
          onSelectTx={handleSelectTx}
        />

        {/* Live Spread Volatility Chart */}
        <ProfitHistoryChart history={history} />

        {/* Two-Column Grid: Opportunities & Price Matrix */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Opportunities (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <ArbList
              opportunities={filteredOpportunities}
              onSimulate={handleOpenSimulate}
              onExecuteDirect={handleExecuteDirect}
            />
          </div>

          {/* Price Matrix Table (5 cols) */}
          <div className="lg:col-span-5">
            <PriceTable
              pricesData={pricesData}
              onSelectPair={handleSelectPair}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500 font-mono">
        <p>
          FlashArb &bull; Real-Time Transaction Engine &bull; Zero Capital Risk Flash Loans &bull; Ethereum Mainnet
        </p>
      </footer>

      {/* Flash Loan Simulator & Executor Modal */}
      <FlashLoanModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        selectedArb={selectedArb}
        ethPriceUsd={pricesData?.ethPriceUsd || 3450}
        onTxExecuted={handleSelectTx}
      />

      {/* Etherscan-Style Transaction Inspector Modal */}
      <TxInspectorModal
        isOpen={isTxModalOpen}
        onClose={() => setIsTxModalOpen(false)}
        tx={selectedTx}
      />
    </div>
  );
}
