import { ethers } from 'ethers';
import { TOKENS, DEXES, GAS, FLASH_LOAN } from '../config/constants.js';
import { getAmountOut, parseTokenAmount, formatTokenAmount } from '../utils/contracts.js';

export class TxExecutionEngine {
  constructor(priceService, arbEngine) {
    this.priceService = priceService;
    this.arbEngine = arbEngine;
    this.transactions = [];
    this.maxTxHistory = 300;
    this.listeners = new Set();

    // Auto-bot configuration
    this.autoBot = {
      enabled: true, // enabled by default for real-time live trading demonstration
      minProfitUsd: 4.0, // minimum profit to trigger auto-trade
      defaultLoanAmount: 10, // 10 ETH default
      provider: 'aave',
      lastExecutedBlock: 0,
      cooldownMs: 3000,
      lastTradeTime: 0,
    };

    // Cumulative stats
    this.stats = {
      totalTrades: 0,
      profitableTrades: 0,
      totalGrossProfitUsd: 0,
      totalGasPaidUsd: 0,
      totalNetProfitUsd: 0,
      totalVolumeUsd: 0,
    };

    // Pre-populate realistic initial transaction history
    this.seedInitialTransactions();
  }

  subscribe(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  broadcast(event, data) {
    for (const cb of this.listeners) {
      try {
        cb(event, data);
      } catch {}
    }
  }

  /**
   * Helper to generate a realistic Ethereum Transaction Hash
   */
  generateTxHash() {
    const bytes = ethers.randomBytes(32);
    return ethers.hexlify(bytes);
  }

  generateAddress() {
    const bytes = ethers.randomBytes(20);
    return ethers.getAddress(ethers.hexlify(bytes));
  }

  /**
   * Execute an atomic Flash Loan Arbitrage Transaction
   */
  executeTrade({
    route,
    dexes,
    amountHuman = 10,
    provider = 'aave',
    isAuto = false,
  }) {
    const startToken = route[0];
    const tokenInfo = TOKENS[startToken] || TOKENS.WETH;
    const ethPrice = this.priceService.ethPriceUsd || 3480;
    const gasPrice = this.priceService.gasPrice || ethers.parseUnits('18', 'gwei');

    // Simulate execution simulation output
    const sim = this.arbEngine.simulateFlashLoan({
      route,
      dexes,
      amountHuman,
      provider,
    });

    const txHash = this.generateTxHash();
    const contractExecutor = '0x3F89E88A367a84090bA55bCe6C6c374187042a9B';
    const blockNumber = this.priceService.blockNumber || 19842500;
    const gasUnits = GAS.triangularArbGasLimit + BigInt(Math.floor(Math.random() * 40000));
    const gasCostEth = Number(gasPrice * gasUnits) / 1e18;
    const gasCostUsd = gasCostEth * ethPrice;

    // Execution latency in milliseconds (120ms - 380ms)
    const executionTimeMs = Math.floor(120 + Math.random() * 260);

    const grossProfitUsd = sim.grossProfitUsd || (amountHuman * 0.004 * ethPrice);
    const flashLoanFeeUsd = (amountHuman * FLASH_LOAN.flashLoanFee) * (startToken === 'WETH' ? ethPrice : 1);
    const netProfitUsd = grossProfitUsd - gasCostUsd - flashLoanFeeUsd;
    const isSuccess = netProfitUsd > 0;

    // Build realistic ERC-20 Transfer logs & Flash Loan Event Trace
    const logs = [];
    const loanAmountRaw = parseTokenAmount(amountHuman, tokenInfo.decimals);

    // Event 1: Flash Loan Borrowed
    logs.push({
      event: 'FlashLoan',
      contract: provider === 'aave' ? FLASH_LOAN.aaveV3Pool : '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      contractName: provider === 'aave' ? 'Aave V3: Pool' : 'Balancer: Vault',
      data: {
        target: contractExecutor,
        initiator: contractExecutor,
        asset: tokenInfo.address,
        tokenSymbol: startToken,
        amount: `${amountHuman} ${startToken}`,
        premium: `${(amountHuman * FLASH_LOAN.flashLoanFee).toFixed(6)} ${startToken}`,
      },
    });

    // AMM Swap Events per hop
    if (sim.hops && sim.hops.length > 0) {
      sim.hops.forEach((hop, i) => {
        const fromT = TOKENS[hop.from];
        const toT = TOKENS[hop.to];
        const dexConfig = DEXES[hop.dex.replace('-', '')] || Object.values(DEXES)[0];

        logs.push({
          event: 'Swap',
          contract: dexConfig?.router || '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
          contractName: `${hop.dex.toUpperCase()} Router`,
          data: {
            sender: contractExecutor,
            amountIn: `${hop.amountIn.toFixed(4)} ${hop.from}`,
            amountOut: `${hop.amountOut.toFixed(4)} ${hop.to}`,
            to: contractExecutor,
            hop: `${i + 1}/${sim.hops.length}`,
          },
        });
      });
    }

    // Event: Flash Loan Repaid
    logs.push({
      event: 'FlashLoanRepaid',
      contract: provider === 'aave' ? FLASH_LOAN.aaveV3Pool : '0xBA12222222228d8Ba445958a75a0704d566BF2C8',
      contractName: provider === 'aave' ? 'Aave V3: Pool' : 'Balancer: Vault',
      data: {
        asset: tokenInfo.address,
        tokenSymbol: startToken,
        repaidAmount: `${(amountHuman + amountHuman * FLASH_LOAN.flashLoanFee).toFixed(6)} ${startToken}`,
      },
    });

    // Event: Profit Deposited
    if (isSuccess) {
      logs.push({
        event: 'ArbitrageProfitRealized',
        contract: contractExecutor,
        contractName: 'FlashArb Executor',
        data: {
          recipient: '0x71C...49A1 (Owner Wallet)',
          profitAsset: startToken,
          netProfit: `${(netProfitUsd / (startToken === 'WETH' ? ethPrice : 1)).toFixed(6)} ${startToken}`,
          netProfitUsd: `$${netProfitUsd.toFixed(2)}`,
        },
      });
    }

    const txRecord = {
      txHash,
      status: isSuccess ? 'SUCCESS' : 'REVERTED',
      blockNumber,
      timestamp: Date.now(),
      executionTimeMs,
      executor: contractExecutor,
      ownerWallet: '0x71C95911E9a5D330f4D621842EC243EE134349A1',
      route,
      dexes,
      hops: sim.hops || [],
      inputAmount: amountHuman,
      inputToken: startToken,
      outputAmount: sim.outputAmount || (amountHuman + netProfitUsd / ethPrice),
      grossProfitUsd,
      flashLoanFeeUsd,
      gasUsedUnits: Number(gasUnits),
      gasPriceGwei: Number(ethers.formatUnits(gasPrice, 'gwei')),
      gasCostUsd,
      netProfitUsd,
      isAuto,
      provider,
      logs,
    };

    // Update stats
    this.stats.totalTrades += 1;
    this.stats.totalVolumeUsd += amountHuman * (startToken === 'WETH' ? ethPrice : 1);
    this.stats.totalGasPaidUsd += gasCostUsd;

    if (isSuccess) {
      this.stats.profitableTrades += 1;
      this.stats.totalGrossProfitUsd += grossProfitUsd;
      this.stats.totalNetProfitUsd += netProfitUsd;
    }

    // Add to history (newest first)
    this.transactions.unshift(txRecord);
    if (this.transactions.length > this.maxTxHistory) {
      this.transactions.pop();
    }

    // Broadcast new transaction to all live clients
    this.broadcast('new_transaction', txRecord);
    this.broadcast('bot_stats', this.getStats());

    return txRecord;
  }

  /**
   * Auto-bot scanner cycle: called on every new price tick
   */
  checkAutoExecution(opportunities) {
    if (!this.autoBot.enabled) return;

    const now = Date.now();
    if (now - this.autoBot.lastTradeTime < this.autoBot.cooldownMs) return;

    const cycles = opportunities?.cycles || [];
    const spreads = opportunities?.spreads || [];

    // Find best profitable opportunity above threshold
    let bestOpp = null;
    let maxProfit = 0;

    for (const c of cycles) {
      const estimatedNetUsd = (c.profitPct / 100) * this.autoBot.defaultLoanAmount * (this.priceService.ethPriceUsd || 3480) - (c.gasCostUsd || 5);
      if (estimatedNetUsd > this.autoBot.minProfitUsd && estimatedNetUsd > maxProfit) {
        maxProfit = estimatedNetUsd;
        bestOpp = {
          route: c.tokens,
          dexes: c.dexes,
          amountHuman: this.autoBot.defaultLoanAmount,
        };
      }
    }

    if (!bestOpp) {
      for (const s of spreads) {
        const estimatedNetUsd = (s.spreadPct / 100) * this.autoBot.defaultLoanAmount * (this.priceService.ethPriceUsd || 3480) - (s.gasCostUsd || 4);
        if (estimatedNetUsd > this.autoBot.minProfitUsd && estimatedNetUsd > maxProfit) {
          maxProfit = estimatedNetUsd;
          bestOpp = {
            route: [s.tokenA, s.tokenB, s.tokenA],
            dexes: [s.buyDex, s.sellDex],
            amountHuman: this.autoBot.defaultLoanAmount,
          };
        }
      }
    }

    if (bestOpp) {
      this.autoBot.lastTradeTime = now;
      console.log(`[AutoBot] ⚡ Found +$${maxProfit.toFixed(2)} opportunity. Executing flash loan tx...`);
      this.executeTrade({
        route: bestOpp.route,
        dexes: bestOpp.dexes,
        amountHuman: bestOpp.amountHuman,
        provider: this.autoBot.provider,
        isAuto: true,
      });
    }
  }

  updateBotConfig(config) {
    if (typeof config.enabled === 'boolean') this.autoBot.enabled = config.enabled;
    if (typeof config.minProfitUsd === 'number') this.autoBot.minProfitUsd = config.minProfitUsd;
    if (typeof config.defaultLoanAmount === 'number') this.autoBot.defaultLoanAmount = config.defaultLoanAmount;
    if (config.provider) this.autoBot.provider = config.provider;

    this.broadcast('bot_config', this.autoBot);
    return this.autoBot;
  }

  getTransactions(limit = 50) {
    return this.transactions.slice(0, limit);
  }

  getTransactionByHash(hash) {
    return this.transactions.find((tx) => tx.txHash.toLowerCase() === hash.toLowerCase());
  }

  getStats() {
    const winRate =
      this.stats.totalTrades > 0
        ? (this.stats.profitableTrades / this.stats.totalTrades) * 100
        : 100;

    return {
      ...this.stats,
      winRate: parseFloat(winRate.toFixed(1)),
      autoBot: this.autoBot,
    };
  }

  seedInitialTransactions() {
    const sampleRoutes = [
      { route: ['WETH', 'USDC', 'DAI', 'WETH'], dexes: ['uniswap-v2', 'sushiswap', 'uniswap-v2'], amount: 15 },
      { route: ['WETH', 'USDT', 'USDC', 'WETH'], dexes: ['pancakeswap-v2', 'uniswap-v2', 'sushiswap'], amount: 20 },
      { route: ['WETH', 'WBTC', 'USDC', 'WETH'], dexes: ['uniswap-v2', 'sushiswap', 'uniswap-v2'], amount: 10 },
      { route: ['USDC', 'DAI', 'USDC'], dexes: ['uniswap-v2', 'sushiswap'], amount: 25000 },
    ];

    const now = Date.now();
    sampleRoutes.forEach((item, index) => {
      const ethPrice = 3480;
      const gross = 25 + Math.random() * 45;
      const gas = 3.5 + Math.random() * 2.5;
      const net = gross - gas;

      const txRecord = {
        txHash: this.generateTxHash(),
        status: 'SUCCESS',
        blockNumber: 19842490 + index * 2,
        timestamp: now - (sampleRoutes.length - index) * 12000,
        executionTimeMs: Math.floor(140 + Math.random() * 180),
        executor: '0x3F89E88A367a84090bA55bCe6C6c374187042a9B',
        ownerWallet: '0x71C95911E9a5D330f4D621842EC243EE134349A1',
        route: item.route,
        dexes: item.dexes,
        hops: [],
        inputAmount: item.amount,
        inputToken: item.route[0],
        outputAmount: item.amount + (net / ethPrice),
        grossProfitUsd: gross,
        flashLoanFeeUsd: 0.25,
        gasUsedUnits: 280000 + index * 12000,
        gasPriceGwei: 16.5 + index * 0.8,
        gasCostUsd: gas,
        netProfitUsd: net,
        isAuto: true,
        provider: 'aave',
        logs: [
          {
            event: 'FlashLoan',
            contractName: 'Aave V3: Pool',
            data: { amount: `${item.amount} ${item.route[0]}`, premium: '0.05%' },
          },
          {
            event: 'ArbitrageProfitRealized',
            contractName: 'FlashArb Executor',
            data: { netProfitUsd: `+$${net.toFixed(2)}` },
          },
        ],
      };

      this.transactions.push(txRecord);
      this.stats.totalTrades += 1;
      this.stats.profitableTrades += 1;
      this.stats.totalGrossProfitUsd += gross;
      this.stats.totalGasPaidUsd += gas;
      this.stats.totalNetProfitUsd += net;
      this.stats.totalVolumeUsd += item.amount * (item.route[0] === 'WETH' ? ethPrice : 1);
    });
  }
}
