// Well-known token addresses on Ethereum Mainnet
export const TOKENS = {
  WETH: {
    address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2',
    symbol: 'WETH',
    name: 'Wrapped Ether',
    decimals: 18,
    logoColor: '#627EEA',
  },
  USDC: {
    address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoColor: '#2775CA',
  },
  USDT: {
    address: '0xdAC17F958D2ee523a2206206994597C13D831ec7',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoColor: '#50AF95',
  },
  DAI: {
    address: '0x6B175474E89094C44Da98b954EedeAC495271d0F',
    symbol: 'DAI',
    name: 'Dai Stablecoin',
    decimals: 18,
    logoColor: '#F5AC37',
  },
  WBTC: {
    address: '0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599',
    symbol: 'WBTC',
    name: 'Wrapped BTC',
    decimals: 8,
    logoColor: '#F7931A',
  },
  LINK: {
    address: '0x514910771AF9Ca656af840dff83E8264EcF986CA',
    symbol: 'LINK',
    name: 'Chainlink',
    decimals: 18,
    logoColor: '#2A5ADA',
  },
  UNI: {
    address: '0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984',
    symbol: 'UNI',
    name: 'Uniswap',
    decimals: 18,
    logoColor: '#FF007A',
  },
};

// DEX Router & Factory addresses
export const DEXES = {
  uniswapV2: {
    name: 'Uniswap V2',
    slug: 'uniswap-v2',
    color: '#FF007A',
    factory: '0x5C69bEe701ef814a2B6a3EDD4B1652CB9cc5aA6f',
    router: '0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D',
    initCodeHash: '0x96e8ac4277198ff8b6f785478aa9a39f403cb768dd02cbee326c3e7da348845f',
    fee: 0.003, // 0.3%
  },
  sushiswap: {
    name: 'SushiSwap',
    slug: 'sushiswap',
    color: '#FA52A0',
    factory: '0xC0AEe478e3658e2610c5F7A4A2E1777cE9e4f2Ac',
    router: '0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F',
    initCodeHash: '0xe18a34eb0e04b04f7a0ac29a6e80748dca96319b42c54d679cb821dca90c6303',
    fee: 0.003,
  },
  pancakeswapV2: {
    name: 'PancakeSwap V2',
    slug: 'pancakeswap-v2',
    color: '#D1884F',
    factory: '0x1097053Fd2ea711dad45caCcc45EfF7548fCB362',
    router: '0xEfF92A263d31888d860bD50809A8D171709b7b1c',
    initCodeHash: '0x57224589c67f3f30a6b0d7a1b54cf3153ab84563bc609ef41dfb34f8b2974d2d',
    fee: 0.0025, // 0.25%
  },
};

// Common trading pairs to monitor
export const TRADING_PAIRS = [
  ['WETH', 'USDC'],
  ['WETH', 'USDT'],
  ['WETH', 'DAI'],
  ['WETH', 'WBTC'],
  ['WETH', 'LINK'],
  ['WETH', 'UNI'],
  ['USDC', 'USDT'],
  ['USDC', 'DAI'],
  ['WBTC', 'USDC'],
];

// Triangular arbitrage routes
export const TRIANGULAR_ROUTES = [
  ['WETH', 'USDC', 'DAI'],
  ['WETH', 'USDC', 'USDT'],
  ['WETH', 'DAI', 'USDT'],
  ['WETH', 'WBTC', 'USDC'],
  ['WETH', 'LINK', 'USDC'],
  ['WETH', 'UNI', 'USDC'],
];

// Uniswap V2 Pair ABI (minimal)
export const PAIR_ABI = [
  'function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast)',
  'function token0() external view returns (address)',
  'function token1() external view returns (address)',
];

// Uniswap V2 Factory ABI (minimal)
export const FACTORY_ABI = [
  'function getPair(address tokenA, address tokenB) external view returns (address pair)',
];

// Uniswap V2 Router ABI (minimal)
export const ROUTER_ABI = [
  'function getAmountsOut(uint amountIn, address[] memory path) public view returns (uint[] memory amounts)',
];

// Flash loan provider (Aave V3 on Mainnet)
export const FLASH_LOAN = {
  aaveV3Pool: '0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2',
  flashLoanFee: 0.0005, // 0.05%
};

// Gas estimation constants
export const GAS = {
  swapGasLimit: 150_000n,
  flashLoanGasLimit: 500_000n,
  triangularArbGasLimit: 800_000n,
};
