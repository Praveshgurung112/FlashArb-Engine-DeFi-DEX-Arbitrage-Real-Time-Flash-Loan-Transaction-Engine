# ⚡ FlashArb Engine — DeFi DEX Arbitrage & Real-Time Flash Loan Transaction Engine

**FlashArb** is a decentralized exchange (DEX) arbitrage engine, autonomous MEV auto-trader, and real-time transaction execution platform for Ethereum and EVM blockchains. It continuously computes cross-DEX price discrepancies, discovers multi-hop triangular arbitrage routes using graph theory, and executes zero-capital flash loan transactions on-chain in real time.

---

## 📸 Key Features

### 1. 🤖 Real-Time MEV Auto-Execution Bot
- **Autonomous Execution Engine**: Evaluates Bellman-Ford negative cycles against live gas prices ($G_{\text{base}} + G_{\text{priority}}$) and DEX reserves.
- **Smart Profit Triggers**: Automatically executes atomic flash loan transactions whenever net profit exceeds the user-configured threshold (e.g. $> \$4.00$ USD).
- **Sub-Block Execution Latency**: Records execution latency ($\sim 140\text{ms} - 280\text{ms}$), block confirmations, and gas burned per mined trade.

### 2. 📜 Live Transaction Ledger & Mined Blocks Feed
- Real-time animated transaction stream displaying all executed flash loan trades.
- Shows transaction hash (`0x7f8a...`), execution type (`AUTO-BOT` vs `MANUAL`), block number, swap path sequence, gas fee paid, and net realized PnL.

### 3. 🔍 Etherscan-Style Transaction Inspector
- Click any transaction hash to open a deep on-chain trace modal:
  - **Atomic Confirmation Status**: `SUCCESS` / `REVERTED`
  - **Transaction Hash & Block Number**
  - **Gas Metrics**: Gas units used $\times$ Effective Gas Price in Gwei
  - **Event Logs & Traces**: `AaveV3Pool.flashLoan()`, `Router.swapExactTokensForTokens()`, `FlashLoanRepaid()`, and `ArbitrageProfitRealized()`.

### 4. ⚡ 1-Click Manual Execution & Flash Loan Simulator
- Test custom capital sizes ($1$ to $50$ WETH or USDC/DAI equivalent).
- Select between liquidity providers (**Aave V3 Pool**, **Balancer Vault**, or **Uniswap V2 Flash Swaps**).
- 1-click **"Execute Live Transaction"** button that broadcasts trades and records them to the live ledger.

### 5. 📊 Live DEX Price Matrix & Volatility Chart
- Real-time constant-product ($x \cdot y = k$) spot prices and pool reserves across **Uniswap V2**, **SushiSwap**, and **PancakeSwap V2**.
- Live historical spread volatility area chart powered by Recharts.

---

## 🧮 Mathematical Principles

### 1. Constant Product AMM Swap Formula
For Uniswap V2 forks with a $0.3\%$ fee ($\gamma = 997 / 1000$):
$$\Delta y = \frac{y \cdot \Delta x \cdot 997}{x \cdot 1000 + \Delta x \cdot 997}$$

### 2. Triangular Arbitrage Graph Transformation
To find profitable cyclical paths using shortest-path graph algorithms, exchange rates $R(A \to B)$ are transformed using negative logarithms:
$$w(A \to B) = -\ln(R(A \to B))$$
A cycle $A \to B \to C \to A$ is profitable if:
$$\prod R > 1 \iff \sum -\ln(R) < 0 \quad \text{(Negative Cycle)}$$

### 3. Net Arbitrage Profitability
$$\text{Net PnL} = \text{Gross Output} - \text{Principal} - \text{Flash Loan Fee} - \text{Gas Cost (USD)}$$

---

## 🚀 Quick Start

### 1. Prerequisites
- **Node.js** v18+ and **npm** installed

### 2. Installation
Install all dependencies:
```bash
# Install root & backend dependencies
npm install

# Install client dependencies
cd client && npm install
cd ..
```

### 3. Run Frontend & Backend Concurrently
```bash
npm run dev
```

- **Frontend dApp**: [http://localhost:3000](http://localhost:3000)
- **Backend API**: [http://localhost:3001](http://localhost:3001)
- **WebSocket Stream**: `ws://localhost:3001`

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/prices` | Snapshot of all DEX pool prices, gas price, and ETH/USD |
| `GET` | `/api/opportunities` | Current Bellman-Ford negative cycles and direct spreads |
| `POST` | `/api/simulate` | Simulate flash loan execution without broadcasting |
| `POST` | `/api/execute` | Execute an atomic flash loan transaction |
| `GET` | `/api/transactions` | List recent executed transactions |
| `GET` | `/api/transactions/:hash` | Detailed event log trace for a specific transaction |
| `GET` | `/api/bot/stats` | Cumulative win rate, total net profit, gas paid & volume |
| `POST` | `/api/bot/config` | Toggle auto-bot mode and adjust min profit trigger |

---

## 🛡️ License
MIT License. Built for research and educational purposes in DeFi algorithmic trading, MEV mechanics, and smart contract architecture.
