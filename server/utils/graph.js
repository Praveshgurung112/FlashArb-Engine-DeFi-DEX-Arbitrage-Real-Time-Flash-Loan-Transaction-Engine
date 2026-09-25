/**
 * Bellman-Ford negative-cycle detection on a weighted token graph.
 *
 * Edges represent exchange rates across DEXes. Weights = -log(rate), so
 * a negative cycle means a cycle whose product of rates > 1.0 (profitable).
 */

/**
 * Builds a directed weighted graph from live price data.
 */
export function buildGraph(priceMap) {
  const nodeSet = new Set();
  const edges = [];

  for (const [key, data] of priceMap.entries()) {
    const [tokenA, tokenB, dex] = key.split('/');
    nodeSet.add(tokenA);
    nodeSet.add(tokenB);

    if (data.rate > 0) {
      edges.push({
        from: tokenA,
        to: tokenB,
        weight: -Math.log(data.rate),
        dex,
        rate: data.rate,
      });
    }

    if (data.reverseRate > 0) {
      edges.push({
        from: tokenB,
        to: tokenA,
        weight: -Math.log(data.reverseRate),
        dex,
        rate: data.reverseRate,
      });
    }
  }

  return { nodes: [...nodeSet], edges };
}

/**
 * Finds all negative cycles (arbitrage routes) using Bellman-Ford.
 */
export function findArbitrageCycles(nodes, edges) {
  const cycles = [];
  const seen = new Set();

  for (const source of nodes) {
    const dist = {};
    const prev = {};
    const prevEdge = {};

    for (const n of nodes) dist[n] = Infinity;
    dist[source] = 0;

    // Relax edges |V| - 1 times
    for (let i = 0; i < nodes.length - 1; i++) {
      for (const edge of edges) {
        const newDist = dist[edge.from] + edge.weight;
        if (newDist < dist[edge.to]) {
          dist[edge.to] = newDist;
          prev[edge.to] = edge.from;
          prevEdge[edge.to] = edge;
        }
      }
    }

    // One more pass to detect negative cycles
    for (const edge of edges) {
      if (dist[edge.from] + edge.weight < dist[edge.to]) {
        // Trace back the cycle
        const cycle = traceCycle(edge.to, prev, prevEdge, nodes.length);
        if (cycle) {
          const key = [...cycle.tokens].sort().join('-') + ':' + cycle.dexes.sort().join('-');
          if (!seen.has(key)) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      }
    }
  }

  return cycles;
}

/**
 * Traces back from a node in a negative cycle to reconstruct the full loop.
 */
function traceCycle(start, prev, prevEdge, maxLen) {
  const tokens = [];
  const dexes = [];
  const rates = [];
  let current = start;
  const visited = new Set();

  // Walk back maxLen steps to get into the cycle
  for (let i = 0; i < maxLen; i++) {
    if (!prev[current]) return null;
    current = prev[current];
  }

  // Now current is on the cycle — trace it
  const cycleStart = current;
  do {
    if (visited.has(current)) break;
    visited.add(current);
    tokens.push(current);
    if (prevEdge[current]) {
      dexes.push(prevEdge[current].dex);
      rates.push(prevEdge[current].rate);
    }
    current = prev[current];
    if (!current) return null;
  } while (current !== cycleStart);

  tokens.push(cycleStart); // close the loop
  tokens.reverse();
  dexes.reverse();
  rates.reverse();

  if (tokens.length < 3) return null;

  // Calculate gross profit
  let grossMultiplier = 1;
  for (const r of rates) {
    grossMultiplier *= r;
  }
  const profitPct = (grossMultiplier - 1) * 100;

  return {
    tokens,
    dexes,
    grossMultiplier,
    profitPct,
  };
}

/**
 * Brute-force cross-DEX spread detection for direct pairs.
 */
export function findDirectSpreads(priceMap) {
  const groups = new Map();

  for (const [key, data] of priceMap.entries()) {
    const [tokenA, tokenB, dex] = key.split('/');
    const pairKey = `${tokenA}/${tokenB}`;

    if (!groups.has(pairKey)) groups.set(pairKey, []);
    groups.get(pairKey).push({
      dex,
      rate: data.rate,
      reverseRate: data.reverseRate,
    });
  }

  const spreads = [];

  for (const [pair, entries] of groups.entries()) {
    if (entries.length < 2) continue;

    let bestBuy = entries[0];
    let bestSell = entries[0];

    for (const entry of entries) {
      if (entry.rate < bestBuy.rate) bestBuy = entry;
      if (entry.rate > bestSell.rate) bestSell = entry;
    }

    if (bestBuy.dex === bestSell.dex) continue;

    const spreadPct = ((bestSell.rate - bestBuy.rate) / bestBuy.rate) * 100;
    if (spreadPct > 0.01) {
      const [tokenA, tokenB] = pair.split('/');
      spreads.push({
        tokenA,
        tokenB,
        buyDex: bestBuy.dex,
        sellDex: bestSell.dex,
        buyRate: bestBuy.rate,
        sellRate: bestSell.rate,
        spreadPct,
      });
    }
  }

  return spreads.sort((a, b) => b.spreadPct - a.spreadPct);
}
