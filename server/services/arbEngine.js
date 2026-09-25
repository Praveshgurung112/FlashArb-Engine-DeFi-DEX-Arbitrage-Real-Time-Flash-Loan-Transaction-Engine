import { TOKENS, GAS, FLASH_LOAN } from '../config/constants.js';
import { buildGraph, findArbitrageCycles, findDirectSpreads } from '../utils/graph.js';
import { getAmountOut, parseTokenAmount, formatTokenAmount } from '../utils/contracts.js';

export class ArbEngine {
  constructor(priceService) {
    this.priceService = priceService;
    /** @type {Array} recent opportunities log */
    this.history = [];
    this.maxHistory = 200;
  }

  /** Run full scan: direct spreads + triangular arb */
  scan() {
    const priceMap = this.priceService.priceMap;
    if (priceMap.size === 0) return { spreads: [], cycles: [], timestamp: Date.now() };

    const spreads = findDirectSpreads(priceMap);
    const { nodes, edges } = buildGraph(priceMap);
    const rawCycles = findArbitrageCycles(nodes, edges);

    const ethPrice = this.priceService.ethPriceUsd;
    const gasPrice = this.priceService.gasPrice;

    // Enrich cycles with gas/profit estimates
    const cycles = rawCycles.map((c) => {
      const hops = c.tokens.length - 1;
      const gasUnits = GAS.swapGasLimit * BigInt(hops) + GAS.flashLoanGasLimit;
      const gasCostEth = Number(gasPrice * gasUnits) / 1e18;
      const gasCostUsd = gasCostEth * ethPrice;
      return {
        ...c,
        hops,
        gasCostUsd,
        gasCostEth,
      };
    });

    // Enrich direct spreads with gas cost
    const enrichedSpreads = spreads.map((s) => {
      const gasUnits = GAS.swapGasLimit * 2n; // buy + sell
      const gasCostEth = Number(gasPrice * gasUnits) / 1e18;
      const gasCostUsd = gasCostEth * ethPrice;
      return { ...s, gasCostUsd, gasCostEth };
    });

    const result = {
      spreads: enrichedSpreads,
      cycles,
      ethPriceUsd: ethPrice,
      gasPriceGwei: Number(gasPrice) / 1e9,
      blockNumber: this.priceService.blockNumber,
      timestamp: Date.now(),
    };

    // Store in history
    const opportunities = [
      ...cycles.map((c) => ({
        type: 'triangular',
        route: c.tokens,
        dexes: c.dexes,
        profitPct: c.profitPct,
        gasCostUsd: c.gasCostUsd,
        timestamp: Date.now(),
        blockNumber: this.priceService.blockNumber,
      })),
      ...enrichedSpreads.slice(0, 5).map((s) => ({
        type: 'direct',
        route: [s.tokenA, s.tokenB],
        dexes: [s.buyDex, s.sellDex],
        profitPct: s.spreadPct,
        gasCostUsd: s.gasCostUsd,
        timestamp: Date.now(),
        blockNumber: this.priceService.blockNumber,
      })),
    ];

    this.history.push(...opportunities);
    if (this.history.length > this.maxHistory) {
      this.history = this.history.slice(-this.maxHistory);
    }

    return result;
  }

  /** Simulate a flash loan arbitrage for a given route */
  simulateFlashLoan({
    route,       // e.g. ['WETH', 'USDC', 'DAI', 'WETH']
    dexes,       // e.g. ['uniswap-v2', 'sushiswap', 'uniswap-v2']
    amountHuman, // e.g. 10 (meaning 10 ETH)
    provider = 'aave',
  }) {
    const priceMap = this.priceService.priceMap;
    const startToken = route[0];
    const startDecimals = TOKENS[startToken].decimals;
    let currentAmount = parseTokenAmount(amountHuman, startDecimals);
    const inputAmount = currentAmount;

    const hops = [];

    for (let i = 0; i < route.length - 1; i++) {
      const fromToken = route[i];
      const toToken = route[i + 1];
      const dex = dexes[i];

      // Find the pair data in our price map
      const fwdKey = `${fromToken}/${toToken}/${dex}`;
      const revKey = `${toToken}/${fromToken}/${dex}`;
      const data = priceMap.get(fwdKey) || priceMap.get(revKey);

      if (!data) {
        return {
          success: false,
          error: `No price data for ${fromToken}→${toToken} on ${dex}`,
        };
      }

      // Determine correct reserves order
      let reserveIn, reserveOut, decimalsIn, decimalsOut;
      if (priceMap.has(fwdKey)) {
        reserveIn = data.reserveA;
        reserveOut = data.reserveB;
        decimalsIn = data.decimalsA;
        decimalsOut = data.decimalsB;
      } else {
        reserveIn = data.reserveB;
        reserveOut = data.reserveA;
        decimalsIn = data.decimalsB;
        decimalsOut = data.decimalsA;
      }

      const feeBps = Math.round(data.fee * 10000);
      const amountOut = getAmountOut(currentAmount, reserveIn, reserveOut, feeBps);

      hops.push({
        from: fromToken,
        to: toToken,
        dex,
        amountIn: formatTokenAmount(currentAmount, TOKENS[fromToken].decimals),
        amountOut: formatTokenAmount(amountOut, TOKENS[toToken].decimals),
        rate: formatTokenAmount(amountOut, TOKENS[toToken].decimals) /
              formatTokenAmount(currentAmount, TOKENS[fromToken].decimals),
      });

      currentAmount = amountOut;
    }

    // Flash loan fee
    const flashLoanFee = provider === 'aave' ? FLASH_LOAN.flashLoanFee : 0;
    const flashLoanFeeAmount = Number(inputAmount) * flashLoanFee / (10 ** startDecimals);

    // Gas cost
    const ethPrice = this.priceService.ethPriceUsd;
    const gasPrice = this.priceService.gasPrice;
    const gasUnits = GAS.triangularArbGasLimit;
    const gasCostEth = Number(gasPrice * gasUnits) / 1e18;
    const gasCostUsd = gasCostEth * ethPrice;

    // P&L
    const outputAmount = formatTokenAmount(currentAmount, startDecimals);
    const grossProfit = outputAmount - amountHuman;
    const grossProfitUsd = startToken === 'WETH'
      ? grossProfit * ethPrice
      : grossProfit; // stablecoins ≈ 1 USD

    const netProfitUsd = grossProfitUsd - gasCostUsd - (flashLoanFeeAmount * (startToken === 'WETH' ? ethPrice : 1));
    const isProfitable = netProfitUsd > 0;

    return {
      success: true,
      route,
      dexes,
      hops,
      inputAmount: amountHuman,
      outputAmount,
      inputToken: startToken,
      grossProfit,
      grossProfitUsd,
      flashLoanFee: flashLoanFeeAmount,
      gasCostEth,
      gasCostUsd,
      netProfitUsd,
      isProfitable,
      blockNumber: this.priceService.blockNumber,
      timestamp: Date.now(),
    };
  }

  getHistory() {
    return this.history;
  }
}
