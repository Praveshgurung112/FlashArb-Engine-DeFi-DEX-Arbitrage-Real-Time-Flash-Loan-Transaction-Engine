import { ethers } from 'ethers';
import { PAIR_ABI, FACTORY_ABI, ROUTER_ABI, TOKENS } from '../config/constants.js';

/**
 * Computes a Uniswap V2 pair address deterministically from the factory,
 * token pair, and init code hash — no RPC call needed.
 */
export function computePairAddress(factory, tokenA, tokenB, initCodeHash) {
  const [token0, token1] =
    tokenA.toLowerCase() < tokenB.toLowerCase()
      ? [tokenA, tokenB]
      : [tokenB, tokenA];

  return ethers.getCreate2Address(
    factory,
    ethers.solidityPackedKeccak256(['address', 'address'], [token0, token1]),
    initCodeHash
  );
}

/**
 * Fetches on-chain reserves for a Uniswap V2-style pair.
 * Returns reserves normalized to the order (tokenA, tokenB) the caller specified.
 */
export async function getReserves(provider, pairAddress, tokenAAddress, tokenBAddress) {
  try {
    const pair = new ethers.Contract(pairAddress, PAIR_ABI, provider);
    const [reserve0, reserve1] = await pair.getReserves();
    const token0 = await pair.token0();

    const isToken0A = token0.toLowerCase() === tokenAAddress.toLowerCase();
    return {
      reserveA: isToken0A ? reserve0 : reserve1,
      reserveB: isToken0A ? reserve1 : reserve0,
    };
  } catch {
    return null; // pair doesn't exist or call reverted
  }
}

/**
 * Calculates the output amount for a Uniswap V2 constant-product swap.
 * Includes the 0.3% (or custom) fee.
 *
 *   amountOut = (reserveOut * amountInWithFee) / (reserveIn * 1000 + amountInWithFee)
 */
export function getAmountOut(amountIn, reserveIn, reserveOut, feeBps = 30) {
  if (reserveIn === 0n || reserveOut === 0n || amountIn === 0n) return 0n;

  const feeMultiplier = 10_000n - BigInt(feeBps * 10);
  const amountInWithFee = amountIn * feeMultiplier;
  const numerator = amountInWithFee * reserveOut;
  const denominator = reserveIn * 10_000n + amountInWithFee;
  return numerator / denominator;
}

/**
 * Computes effective exchange rate from reserves (human-readable).
 * Returns how many units of tokenB you get for 1 unit of tokenA.
 */
export function getExchangeRate(reserveA, reserveB, decimalsA, decimalsB) {
  if (reserveA === 0n) return 0;

  const rateRaw =
    (reserveB * 10n ** BigInt(decimalsA)) / reserveA;

  return Number(rateRaw) / 10 ** decimalsB;
}

/**
 * Estimates slippage impact for a trade of given size.
 */
export function estimateSlippage(amountIn, reserveIn) {
  if (reserveIn === 0n) return 1; // 100% slippage
  return Number(amountIn * 10_000n / reserveIn) / 10_000;
}

/**
 * Converts a token amount to human-readable with proper decimals.
 */
export function formatTokenAmount(amount, decimals) {
  return Number(ethers.formatUnits(amount, decimals));
}

/**
 * Converts a human-readable number to a BigInt with proper decimals.
 */
export function parseTokenAmount(amount, decimals) {
  return ethers.parseUnits(String(amount), decimals);
}
