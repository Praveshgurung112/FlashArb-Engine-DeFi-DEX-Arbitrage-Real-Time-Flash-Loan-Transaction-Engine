import { ethers } from 'ethers';
import {
  TOKENS,
  DEXES,
  TRADING_PAIRS,
  GAS,
} from '../config/constants.js';
import {
  computePairAddress,
  getReserves,
  getExchangeRate,
  getAmountOut,
  formatTokenAmount,
  parseTokenAmount,
} from '../utils/contracts.js';
import { buildGraph, findArbitrageCycles, findDirectSpreads } from '../utils/graph.js';

export class PriceService {
  constructor(provider) {
    this.provider = provider;
    /** @type {Map<string, object>} key = "TOKENA/TOKENB/dex-slug" */
    this.priceMap = new Map();
    this.lastUpdate = null;
    this.gasPrice = 0n;
    this.ethPriceUsd = 0;
    this.listeners = new Set();
    this.blockNumber = 0;
  }

  /** Register a WebSocket listener */
  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /** Broadcast updated data to all listeners */
  broadcast(event, data) {
    for (const cb of this.listeners) {
      try {
        cb(event, data);
      } catch { /* ignore dead listeners */ }
    }
  }

  /** Main polling loop */
  async startPolling(intervalMs = 10_000) {
    console.log('[PriceService] Starting price polling...');
    await this.fetchAll();
    this.interval = setInterval(() => this.fetchAll(), intervalMs);
  }

  stopPolling() {
    clearInterval(this.interval);
  }

  /** Fetch all prices across all DEXes */
  async fetchAll() {
    try {
      this.blockNumber = await this.provider.getBlockNumber();
      const feeData = await this.provider.getFeeData();
      this.gasPrice = feeData.gasPrice ?? 0n;

      // Fetch reserves for every pair on every DEX in parallel
      const tasks = [];
      for (const [dexKey, dex] of Object.entries(DEXES)) {
        for (const [symA, symB] of TRADING_PAIRS) {
          tasks.push(this.fetchPairPrice(dex, symA, symB));
        }
      }
      await Promise.allSettled(tasks);

      // Derive ETH/USD price from WETH/USDC rates
      this.ethPriceUsd = this.getEthPrice();
      this.lastUpdate = Date.now();

      this.broadcast('prices', this.getSnapshot());
    } catch (err) {
      console.error('[PriceService] fetchAll error:', err.message);
    }
  }

  /** Fetch a single pair's reserves from one DEX */
  async fetchPairPrice(dex, symbolA, symbolB) {
    const tokenA = TOKENS[symbolA];
    const tokenB = TOKENS[symbolB];
    if (!tokenA || !tokenB) return;

    const pairAddress = computePairAddress(
      dex.factory,
      tokenA.address,
      tokenB.address,
      dex.initCodeHash
    );

    const reserves = await getReserves(
      this.provider,
      pairAddress,
      tokenA.address,
      tokenB.address
    );
    if (!reserves) return;

    const rate = getExchangeRate(
      reserves.reserveA,
      reserves.reserveB,
      tokenA.decimals,
      tokenB.decimals
    );
    const reverseRate = getExchangeRate(
      reserves.reserveB,
      reserves.reserveA,
      tokenB.decimals,
      tokenA.decimals
    );

    const key = `${symbolA}/${symbolB}/${dex.slug}`;
    this.priceMap.set(key, {
      rate,
      reverseRate,
      reserveA: reserves.reserveA,
      reserveB: reserves.reserveB,
      decimalsA: tokenA.decimals,
      decimalsB: tokenB.decimals,
      pairAddress,
      dex: dex.slug,
      dexName: dex.name,
      dexColor: dex.color,
      fee: dex.fee,
      tokenA: symbolA,
      tokenB: symbolB,
    });
  }

  /** Pull ETH/USD from WETH/USDC prices */
  getEthPrice() {
    for (const [, data] of this.priceMap) {
      if (data.tokenA === 'WETH' && data.tokenB === 'USDC' && data.rate > 0) {
        return data.rate;
      }
    }
    return 3500; // fallback
  }

  /** Return the full state snapshot for the frontend */
  getSnapshot() {
    const prices = [];
    for (const [key, data] of this.priceMap) {
      prices.push({ key, ...data });
    }

    const gasPriceGwei = Number(ethers.formatUnits(this.gasPrice, 'gwei'));
    const swapGasCostUsd =
      Number(this.gasPrice * GAS.swapGasLimit) / 1e18 * this.ethPriceUsd;

    return {
      prices,
      ethPriceUsd: this.ethPriceUsd,
      gasPriceGwei,
      swapGasCostUsd,
      blockNumber: this.blockNumber,
      lastUpdate: this.lastUpdate,
    };
  }
}
