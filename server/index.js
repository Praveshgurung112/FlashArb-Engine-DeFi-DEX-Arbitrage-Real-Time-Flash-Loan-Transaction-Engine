import http from 'http';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import dotenv from 'dotenv';
import { ethers } from 'ethers';

import { PriceService } from './services/priceService.js';
import { LiveMarketSimulator } from './services/liveMarket.js';
import { ArbEngine } from './services/arbEngine.js';
import { TxExecutionEngine } from './services/txEngine.js';
import { createApiRouter } from './routes/api.js';

// Safe JSON serialization for BigInt values
BigInt.prototype.toJSON = function () {
  return this.toString();
};

dotenv.config();

const PORT = process.env.PORT || 3001;
const ETH_RPC_URL = process.env.ETH_RPC_URL;

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let priceEngine;

// Test if real RPC is reachable or fallback to live realistic market engine
async function initEngine() {
  if (ETH_RPC_URL && !ETH_RPC_URL.includes('YOUR_API_KEY')) {
    try {
      console.log(`[Init] Connecting to Ethereum RPC: ${ETH_RPC_URL}`);
      const provider = new ethers.JsonRpcProvider(ETH_RPC_URL);
      await provider.getBlockNumber();
      console.log('[Init] Successfully connected to on-chain RPC!');
      priceEngine = new PriceService(provider);
      priceEngine.startPolling(parseInt(process.env.SCAN_INTERVAL_MS || '10000'));
      return;
    } catch (err) {
      console.warn(`[Init] On-chain RPC connection failed (${err.message}). Using high-fidelity live simulation.`);
    }
  } else {
    console.log('[Init] No RPC key provided. Initializing active live multi-DEX simulator with live volatility.');
  }

  priceEngine = new LiveMarketSimulator();
  priceEngine.startPolling(3500); // 3.5s refresh for great UX
}

await initEngine();

const arbEngine = new ArbEngine(priceEngine);
const txEngine = new TxExecutionEngine(priceEngine, arbEngine);

// Mount API routes
app.use('/api', createApiRouter(priceEngine, arbEngine, txEngine));

// Root healthcheck
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    service: 'DeFi DEX Arbitrage & Real-Time Transaction Engine API',
    endpoints: [
      '/api/prices',
      '/api/opportunities',
      '/api/simulate',
      '/api/execute',
      '/api/transactions',
      '/api/bot/stats',
    ],
  });
});

// Broadcast helper for all connected clients
function broadcastToAll(type, data) {
  try {
    const payload = JSON.stringify({ type, data });
    wss.clients.forEach((client) => {
      if (client.readyState === 1) { // OPEN
        client.send(payload);
      }
    });
  } catch (err) {
    console.error('Broadcast error:', err.message);
  }
}

// Hook transaction engine broadcasts
txEngine.subscribe((event, data) => {
  broadcastToAll(event, data);
});

// Hook price updates and check auto-execution
priceEngine.subscribe((event, data) => {
  broadcastToAll(event, data);

  // Recalculate arbitrage opportunities
  const opps = arbEngine.scan();
  broadcastToAll('opportunities', opps);

  // Check and run auto-trade if bot is enabled
  txEngine.checkAutoExecution(opps);
});

// WebSocket connection lifecycle
wss.on('connection', (ws) => {
  console.log('[WS] Client connected');

  try {
    // Send initial state snapshot immediately
    ws.send(JSON.stringify({ type: 'prices', data: priceEngine.getSnapshot() }));
    ws.send(JSON.stringify({ type: 'opportunities', data: arbEngine.scan() }));
    ws.send(JSON.stringify({ type: 'transactions', data: txEngine.getTransactions(30) }));
    ws.send(JSON.stringify({ type: 'bot_stats', data: txEngine.getStats() }));
  } catch (err) {
    console.error('WS initial send error:', err.message);
  }

  ws.on('close', () => {
    console.log('[WS] Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 DeFi Arbitrage & Real-Time Transaction Engine Running!`);
  console.log(`📡 Server API: http://localhost:${PORT}`);
  console.log(`⚡ WebSocket Stream: ws://localhost:${PORT}`);
  console.log(`🤖 Real-Time Auto-Execution Bot: ACTIVE`);
  console.log(`======================================================\n`);
});
