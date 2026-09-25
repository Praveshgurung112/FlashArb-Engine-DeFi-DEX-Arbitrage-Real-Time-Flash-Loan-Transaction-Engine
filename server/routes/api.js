import express from 'express';
import { TOKENS, DEXES } from '../config/constants.js';

export function createApiRouter(priceService, arbEngine, txEngine) {
  const router = express.Router();

  // Get current prices snapshot
  router.get('/prices', (req, res) => {
    res.json(priceService.getSnapshot());
  });

  // Get current arbitrage opportunities
  router.get('/opportunities', (req, res) => {
    const data = arbEngine.scan();
    res.json(data);
  });

  // Simulate flash loan execution
  router.post('/simulate', (req, res) => {
    const { route, dexes, amountHuman, provider } = req.body;

    if (!route || !dexes || !amountHuman) {
      return res.status(400).json({
        error: 'Missing required params: route, dexes, amountHuman',
      });
    }

    const result = arbEngine.simulateFlashLoan({
      route,
      dexes,
      amountHuman: Number(amountHuman),
      provider: provider || 'aave',
    });

    res.json(result);
  });

  // Execute a real-time Flash Loan Transaction
  router.post('/execute', (req, res) => {
    const { route, dexes, amountHuman, provider } = req.body;

    if (!route || !dexes || !amountHuman) {
      return res.status(400).json({
        error: 'Missing required params: route, dexes, amountHuman',
      });
    }

    const txRecord = txEngine.executeTrade({
      route,
      dexes,
      amountHuman: Number(amountHuman),
      provider: provider || 'aave',
      isAuto: false,
    });

    res.json({
      success: true,
      transaction: txRecord,
    });
  });

  // Get executed transactions ledger
  router.get('/transactions', (req, res) => {
    const limit = parseInt(req.query.limit || '50');
    res.json(txEngine.getTransactions(limit));
  });

  // Get single transaction details
  router.get('/transactions/:txHash', (req, res) => {
    const tx = txEngine.getTransactionByHash(req.params.txHash);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(tx);
  });

  // Get bot stats
  router.get('/bot/stats', (req, res) => {
    res.json(txEngine.getStats());
  });

  // Update auto-bot configuration
  router.post('/bot/config', (req, res) => {
    const updated = txEngine.updateBotConfig(req.body);
    res.json(updated);
  });

  // Get historical opportunities
  router.get('/history', (req, res) => {
    res.json(arbEngine.getHistory());
  });

  // Get tokens config
  router.get('/tokens', (req, res) => {
    res.json(TOKENS);
  });

  // Get DEXes config
  router.get('/dexes', (req, res) => {
    res.json(DEXES);
  });

  return router;
}
