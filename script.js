/**
 * ═══════════════════════════════════════════════════════════════════
 *  AI SEARCH ALGORITHM VISUALIZER — script.js
 *  Educational demonstration of BFS, DFS, and A* on user-defined graphs
 *
 *  Architecture:
 *    1. State management (appState)
 *    2. Graph data structures
 *    3. Algorithm implementations (BFS, DFS, A*)
 *    4. Canvas rendering (preview + simulation)
 *    5. UI / event handlers
 *    6. Animation engine
 *    7. Background particle system
 * ═══════════════════════════════════════════════════════════════════
 */

"use strict";

/* ═══════════════════════════════════════════════════════════════════
   1. APPLICATION STATE
═══════════════════════════════════════════════════════════════════ */
const appState = {
  nodes: [],          // array of node labels e.g. ["A","B","C"]
  edges: [],          // array of {from, to, weight}
  nodeCount: 5,
  selectedAlgo: null, // "bfs" | "dfs" | "astar"
  startNode: null,
  animSpeed: 3,       // 1–5

  // Simulation state
  sim: {
    steps: [],        // pre-computed animation steps
    currentStep: 0,
    running: false,
    paused: false,
    timer: null,
    result: null,     // {path: [], cost: number} | null
    nodePos: {},      // {nodeLabel: {x, y}} canvas positions
  }
};

/* ═══════════════════════════════════════════════════════════════════
   2. GRAPH DATA STRUCTURES
═══════════════════════════════════════════════════════════════════ */

/** Build adjacency list from edges array */
function buildAdjList(nodes, edges) {
  const adj = {};
  nodes.forEach(n => { adj[n] = []; });
  edges.forEach(({ from, to, weight }) => {
    adj[from].push({ node: to, weight });
    adj[to].push({ node: from, weight }); // undirected
  });
  return adj;
}

/** Compute node positions in a circle layout */
function computeNodePositions(nodes, cx, cy, radius) {
  const pos = {};
  nodes.forEach((n, i) => {
    const angle = (2 * Math.PI * i / nodes.length) - Math.PI / 2;
    pos[n] = {
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle)
    };
  });
  return pos;
}

/** Euclidean distance heuristic for A* */
function heuristic(nodeA, nodeB, nodePos) {
  if (!nodePos[nodeA] || !nodePos[nodeB]) return 0;
  const dx = nodePos[nodeA].x - nodePos[nodeB].x;
  const dy = nodePos[nodeA].y - nodePos[nodeB].y;
  return Math.sqrt(dx * dx + dy * dy) * 0.1; // scale down
}

/* ═══════════════════════════════════════════════════════════════════
   3. ALGORITHM IMPLEMENTATIONS
   Each algorithm returns an array of "steps" used for animation.
   Each step is an object:
   {
     visited:   Set of visited node labels
     frontier:  Array/Set of nodes in queue/stack
     current:   current node label being processed
     edge:      {from, to} edge being traversed (or null)
     path:      array of node labels (partial path)
     done:      boolean
     found:     boolean
     finalPath: array (only when found)
     totalCost: number
     log:       string message
   }
═══════════════════════════════════════════════════════════════════ */

/**
 * BFS — Breadth-First Search
 * Explores nodes level by level using a queue.
 * Finds shortest path (fewest edges) in unweighted graph.
 */
function runBFS(nodes, edges, startNode) {
  const adj = buildAdjList(nodes, edges);
  const steps = [];
  const visited = new Set();
  const parent = {}; // to reconstruct path
  const parentEdge = {}; // tracks which edge led to each node
  const queue = [startNode];
  visited.add(startNode);

  // Build a map: edge cost lookup
  const edgeCostMap = {};
  edges.forEach(e => {
    edgeCostMap[`${e.from}-${e.to}`] = e.weight;
    edgeCostMap[`${e.to}-${e.from}`] = e.weight;
  });

  steps.push({
    visited: new Set(visited),
    frontier: [...queue],
    current: null,
    edge: null,
    done: false, found: false,
    log: `🚀 BFS started from node ${startNode}. Queue: [${startNode}]`
  });

  while (queue.length > 0) {
    const current = queue.shift();

    steps.push({
      visited: new Set(visited),
      frontier: [...queue],
      current,
      edge: parentEdge[current] || null,
      done: false, found: false,
      log: `🔵 Dequeued: ${current} | Queue: [${queue.join(', ')}]`
    });

    // Explore neighbors
    const neighbors = adj[current] || [];
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        visited.add(neighbor);
        parent[neighbor] = current;
        parentEdge[neighbor] = { from: current, to: neighbor };
        queue.push(neighbor);

        steps.push({
          visited: new Set(visited),
          frontier: [...queue],
          current,
          edge: { from: current, to: neighbor },
          done: false, found: false,
          log: `  ↳ Discovered: ${neighbor} (from ${current}) | Queue: [${queue.join(', ')}]`
        });
      }
    }
  }

  // Reconstruct BFS spanning tree path from start
  // For TSP-style: find a path that visits all nodes
  const path = reconstructPath(parent, startNode, nodes);
  let totalCost = computePathCost(path, edgeCostMap);

  steps.push({
    visited: new Set(visited),
    frontier: [],
    current: null,
    edge: null,
    done: true,
    found: path.length > 0,
    finalPath: path,
    totalCost,
    log: `✅ BFS Complete! Explored ${visited.size}/${nodes.length} nodes.`
  });

  return steps;
}

/**
 * DFS — Depth-First Search
 * Explores as deep as possible along each branch before backtracking.
 * Uses a stack (recursive approach simulated iteratively).
 */
function runDFS(nodes, edges, startNode) {
  const adj = buildAdjList(nodes, edges);
  const steps = [];
  const visited = new Set();
  const parent = {};
  const parentEdge = {};
  const stack = [startNode];

  const edgeCostMap = {};
  edges.forEach(e => {
    edgeCostMap[`${e.from}-${e.to}`] = e.weight;
    edgeCostMap[`${e.to}-${e.from}`] = e.weight;
  });

  steps.push({
    visited: new Set(visited),
    frontier: [...stack],
    current: null,
    edge: null,
    done: false, found: false,
    log: `🚀 DFS started from node ${startNode}. Stack: [${startNode}]`
  });

  while (stack.length > 0) {
    const current = stack.pop();

    if (visited.has(current)) continue;
    visited.add(current);

    steps.push({
      visited: new Set(visited),
      frontier: [...stack],
      current,
      edge: parentEdge[current] || null,
      done: false, found: false,
      log: `🟣 Popped: ${current} | Stack: [${stack.join(', ')}]`
    });

    // Push neighbors in reverse so left-most is processed first
    const neighbors = [...(adj[current] || [])].reverse();
    for (const { node: neighbor } of neighbors) {
      if (!visited.has(neighbor)) {
        if (!parent[neighbor]) {
          parent[neighbor] = current;
          parentEdge[neighbor] = { from: current, to: neighbor };
        }
        stack.push(neighbor);

        steps.push({
          visited: new Set(visited),
          frontier: [...stack],
          current,
          edge: { from: current, to: neighbor },
          done: false, found: false,
          log: `  ↳ Pushed: ${neighbor} | Stack: [${stack.join(', ')}]`
        });
      }
    }
  }

  const path = reconstructPath(parent, startNode, nodes);
  let totalCost = computePathCost(path, edgeCostMap);

  steps.push({
    visited: new Set(visited),
    frontier: [],
    current: null,
    edge: null,
    done: true,
    found: path.length > 0,
    finalPath: path,
    totalCost,
    log: `✅ DFS Complete! Explored ${visited.size}/${nodes.length} nodes.`
  });

  return steps;
}

/**
 * A* Algorithm
 * Uses f(n) = g(n) + h(n) where:
 *   g(n) = actual cost from start to n
 *   h(n) = heuristic estimate from n to goal (closest unvisited)
 * Finds the optimal weighted path.
 */
function runAStar(nodes, edges, startNode, nodePos) {
  const adj = buildAdjList(nodes, edges);
  const steps = [];

  const edgeCostMap = {};
  edges.forEach(e => {
    edgeCostMap[`${e.from}-${e.to}`] = e.weight;
    edgeCostMap[`${e.to}-${e.from}`] = e.weight;
  });

  // Greedy nearest-unvisited A* traversal
  const visited = new Set();
  const path = [startNode];
  let totalCost = 0;
  visited.add(startNode);

  steps.push({
    visited: new Set(visited),
    frontier: [startNode],
    current: startNode,
    edge: null,
    done: false, found: false,
    log: `🚀 A* started from ${startNode}. f(${startNode}) = g:0 + h:0 = 0`
  });

  // A* explores all reachable nodes using priority queue
  // For TSP-style: we greedily pick the next best unvisited neighbor
  let currentNode = startNode;

  while (visited.size < nodes.length) {
    const neighbors = adj[currentNode] || [];
    const unvisitedNeighbors = neighbors.filter(n => !visited.has(n.node));

    if (unvisitedNeighbors.length === 0) {
      // Find any reachable unvisited node
      const allUnvisited = nodes.filter(n => !visited.has(n));
      if (allUnvisited.length === 0) break;

      steps.push({
        visited: new Set(visited),
        frontier: allUnvisited,
        current: currentNode,
        edge: null,
        done: false, found: false,
        log: `⚠️ No direct neighbors from ${currentNode}. Graph may be disconnected.`
      });
      break;
    }

    // Score each neighbor using f(n) = g(n) + h(n)
    // g = edge weight from current, h = min edge weight from neighbor
    const scored = unvisitedNeighbors.map(n => {
      const g = n.weight;
      // heuristic: average edge weight from that neighbor to remaining unvisited nodes
      const remaining = nodes.filter(x => !visited.has(x) && x !== n.node);
      let h = 0;
      if (remaining.length > 0) {
        const neighborAdj = adj[n.node] || [];
        const toUnvisited = neighborAdj.filter(x => remaining.includes(x.node));
        h = toUnvisited.length > 0
          ? Math.min(...toUnvisited.map(x => x.weight))
          : edgeCostMap[`${n.node}-${remaining[0]}`] || 0;
      }
      return { node: n.node, g, h, f: g + h };
    });

    // Show all scores
    scored.forEach(s => {
      steps.push({
        visited: new Set(visited),
        frontier: scored.map(x => x.node),
        current: currentNode,
        edge: { from: currentNode, to: s.node },
        done: false, found: false,
        log: `  📊 f(${s.node}) = g:${s.g} + h:${s.h.toFixed(1)} = ${s.f.toFixed(1)}`
      });
    });

    // Pick best (lowest f)
    scored.sort((a, b) => a.f - b.f);
    const best = scored[0];

    visited.add(best.node);
    path.push(best.node);
    totalCost += best.g;

    steps.push({
      visited: new Set(visited),
      frontier: scored.slice(1).map(x => x.node),
      current: best.node,
      edge: { from: currentNode, to: best.node },
      done: false, found: false,
      log: `✅ A* chose ${best.node} (f=${best.f.toFixed(1)}) from ${currentNode}. Cost so far: ${totalCost}`
    });

    currentNode = best.node;
  }

  const found = path.length > 1;
  steps.push({
    visited: new Set(visited),
    frontier: [],
    current: null,
    edge: null,
    done: true,
    found,
    finalPath: path,
    totalCost,
    log: `🏁 A* Complete! Path: ${path.join(' → ')} | Total: ${totalCost}`
  });

  return steps;
}

/** Reconstruct path from parent map for BFS/DFS spanning traversal */
function reconstructPath(parent, startNode, allNodes) {
  // Build traversal order from BFS/DFS tree
  const visited = new Set([startNode]);
  const path = [startNode];

  // Follow the tree as deeply as possible
  let current = startNode;
  let extended = true;

  while (extended) {
    extended = false;
    for (const node of allNodes) {
      if (!visited.has(node) && parent[node]) {
        // Find the node whose parent is already in path (DFS-like reconstruction)
        // For BFS, we want the order of discovery — use parent chain
        if (visited.has(parent[node])) {
          path.push(node);
          visited.add(node);
          extended = true;
          break;
        }
      }
    }
  }
  return path;
}

/** Compute total cost along a path using edge cost map */
function computePathCost(path, edgeCostMap) {
  let total = 0;
  for (let i = 0; i < path.length - 1; i++) {
    const key = `${path[i]}-${path[i+1]}`;
    total += edgeCostMap[key] || edgeCostMap[`${path[i+1]}-${path[i]}`] || 0;
  }
  return total;
}

/* ═══════════════════════════════════════════════════════════════════
   4. CANVAS RENDERING
═══════════════════════════════════════════════════════════════════ */

/* ── Preview canvas (Page 1) ── */
function renderPreviewCanvas() {
  const canvas = document.getElementById('preview-canvas');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  const { nodes, edges } = appState;

  ctx.clearRect(0, 0, W, H);

  const emptyMsg = document.getElementById('canvas-empty-msg');
  if (nodes.length === 0) {
    emptyMsg.classList.remove('hidden');
    return;
  }
  emptyMsg.classList.add('hidden');

  // Compute layout
  const pos = computeNodePositions(nodes, W / 2, H / 2, Math.min(W, H) * 0.35);

  // Draw edges
  edges.forEach(({ from, to, weight }) => {
    const a = pos[from], b = pos[to];
    if (!a || !b) return;

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = 'rgba(0, 200, 255, 0.35)';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Weight label
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = 'bold 11px "Share Tech Mono"';
    ctx.fillStyle = 'rgba(255, 230, 0, 0.9)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(weight, mx, my - 8);
  });

  // Draw nodes
  nodes.forEach(n => {
    const { x, y } = pos[n];
    const r = 22;

    // Glow
    const grd = ctx.createRadialGradient(x, y, 0, x, y, r * 2.5);
    grd.addColorStop(0, 'rgba(0, 255, 255, 0.15)');
    grd.addColorStop(1, 'rgba(0, 255, 255, 0)');
    ctx.beginPath();
    ctx.arc(x, y, r * 2.5, 0, Math.PI * 2);
    ctx.fillStyle = grd;
    ctx.fill();

    // Circle
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(0, 30, 60, 0.9)';
    ctx.fill();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.7)';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Label
    ctx.font = 'bold 14px "Orbitron"';
    ctx.fillStyle = '#00ffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(n, x, y);
  });
}

/* ── Simulation canvas (Page 2) ── */
const SIM_COLORS = {
  unvisited:  { fill: '#0d1f35', stroke: '#3a6080', glow: null },
  frontier:   { fill: 'rgba(191,95,255,0.25)', stroke: '#bf5fff', glow: '#bf5fff' },
  current:    { fill: 'rgba(255,230,0,0.25)',   stroke: '#ffe600', glow: '#ffe600' },
  visited:    { fill: 'rgba(40,80,180,0.35)',   stroke: '#3b82f6', glow: '#3b82f6' },
  path:       { fill: 'rgba(0,255,159,0.2)',    stroke: '#00ff9f', glow: '#00ff9f' },
};

const SIM_EDGE_COLORS = {
  default:    'rgba(0, 200, 255, 0.18)',
  explored:   'rgba(59, 130, 246, 0.7)',
  current:    'rgba(255, 230, 0, 0.9)',
  path:       'rgba(0, 255, 159, 0.9)',
};

/**
 * Draw the full simulation frame
 * @param {HTMLCanvasElement} canvas
 * @param {Object} step - current animation step
 * @param {Array} allSteps - all steps for path highlighting
 * @param {Object} nodePos - {label: {x,y}}
 */
function drawSimFrame(canvas, step, allSteps, nodePos) {
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const W = canvas.offsetWidth, H = canvas.offsetHeight;
  canvas.width = W;
  canvas.height = H;
  ctx.clearRect(0, 0, W, H);

  const { nodes, edges } = appState;
  const { visited, frontier, current, edge: activeEdge, done, finalPath } = step;

  // Determine which edges are "explored" (both endpoints visited)
  const exploredEdgeSet = new Set();
  allSteps.slice(0, appState.sim.currentStep + 1).forEach(s => {
    if (s.edge) exploredEdgeSet.add(`${s.edge.from}-${s.edge.to}`);
  });

  // Final path edges
  const pathEdgeSet = new Set();
  if (done && finalPath && finalPath.length > 1) {
    for (let i = 0; i < finalPath.length - 1; i++) {
      pathEdgeSet.add(`${finalPath[i]}-${finalPath[i+1]}`);
      pathEdgeSet.add(`${finalPath[i+1]}-${finalPath[i]}`);
    }
  }

  // ── Draw edges ──
  edges.forEach(({ from, to, weight }) => {
    const a = nodePos[from], b = nodePos[to];
    if (!a || !b) return;

    const key1 = `${from}-${to}`, key2 = `${to}-${from}`;
    const isPath    = pathEdgeSet.has(key1)    || pathEdgeSet.has(key2);
    const isCurrent = activeEdge && ((activeEdge.from === from && activeEdge.to === to) || (activeEdge.from === to && activeEdge.to === from));
    const isExplored = exploredEdgeSet.has(key1) || exploredEdgeSet.has(key2);

    let color = SIM_EDGE_COLORS.default;
    let lineW = 1.5;
    if (isPath)    { color = SIM_EDGE_COLORS.path;    lineW = 3.5; }
    else if (isCurrent) { color = SIM_EDGE_COLORS.current; lineW = 2.5; }
    else if (isExplored){ color = SIM_EDGE_COLORS.explored; lineW = 2; }

    // Glow for path edges
    if (isPath || isCurrent) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = isPath ? 'rgba(0,255,159,0.15)' : 'rgba(255,230,0,0.15)';
      ctx.lineWidth = lineW + 8;
      ctx.stroke();
    }

    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineW;
    ctx.stroke();

    // Weight label
    const mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
    ctx.font = '10px "Share Tech Mono"';
    ctx.fillStyle = isPath ? '#00ff9f' : 'rgba(255,230,0,0.7)';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Small background pill
    ctx.fillStyle = 'rgba(2,11,24,0.7)';
    ctx.fillRect(mx - 10, my - 9, 20, 14);
    ctx.fillStyle = isPath ? '#00ff9f' : 'rgba(255,230,0,0.85)';
    ctx.fillText(weight, mx, my - 2);
  });

  // ── Draw nodes ──
  nodes.forEach(n => {
    const p = nodePos[n];
    if (!p) return;
    const r = 24;

    // Determine node state
    let stateKey = 'unvisited';
    if (done && finalPath && finalPath.includes(n)) stateKey = 'path';
    else if (n === current) stateKey = 'current';
    else if (visited && visited.has(n)) stateKey = 'visited';
    else if (frontier && (Array.isArray(frontier) ? frontier.includes(n) : frontier.has(n))) stateKey = 'frontier';

    const col = SIM_COLORS[stateKey];

    // Outer glow
    if (col.glow) {
      const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 3);
      grd.addColorStop(0, col.glow + '40');
      grd.addColorStop(1, col.glow + '00');
      ctx.beginPath();
      ctx.arc(p.x, p.y, r * 3, 0, Math.PI * 2);
      ctx.fillStyle = grd;
      ctx.fill();
    }

    // Node circle
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = col.fill;
    ctx.fill();
    ctx.strokeStyle = col.stroke;
    ctx.lineWidth = stateKey === 'current' ? 3 : 2;
    ctx.stroke();

    // Inner ring for current
    if (stateKey === 'current') {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r - 5, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(255,230,0,0.4)';
      ctx.lineWidth = 1;
      ctx.stroke();
    }

    // Label
    ctx.font = `bold 15px "Orbitron"`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = col.stroke;
    if (stateKey === 'current') ctx.shadowColor = col.glow;
    if (stateKey === 'current') ctx.shadowBlur = 12;
    ctx.fillText(n, p.x, p.y);
    ctx.shadowBlur = 0;

    // State indicator
    if (stateKey !== 'unvisited') {
      ctx.font = '8px "Share Tech Mono"';
      ctx.fillStyle = col.stroke + 'aa';
      ctx.fillText(stateKey.toUpperCase(), p.x, p.y + r + 12);
    }
  });
}

/* ═══════════════════════════════════════════════════════════════════
   5. PSEUDOCODE DATA
═══════════════════════════════════════════════════════════════════ */
const PSEUDOCODES = {
  bfs: `<span class="pcode-comment">// Breadth-First Search</span>
<span class="pcode-keyword">function</span> BFS(graph, start):
  visited ← {}
  queue   ← [start]
  parent  ← {}
  visited.add(start)

  <span class="pcode-keyword">while</span> queue not empty:
    current ← queue.dequeue()

    <span class="pcode-keyword">for each</span> neighbor of current:
      <span class="pcode-keyword">if</span> neighbor not in visited:
        visited.add(neighbor)
        parent[neighbor] ← current
        queue.enqueue(neighbor)

  <span class="pcode-keyword">return</span> reconstruct_path(parent)`,

  dfs: `<span class="pcode-comment">// Depth-First Search</span>
<span class="pcode-keyword">function</span> DFS(graph, start):
  visited ← {}
  stack   ← [start]
  parent  ← {}

  <span class="pcode-keyword">while</span> stack not empty:
    current ← stack.pop()

    <span class="pcode-keyword">if</span> current not in visited:
      visited.add(current)

      <span class="pcode-keyword">for each</span> neighbor of current:
        <span class="pcode-keyword">if</span> neighbor not in visited:
          parent[neighbor] ← current
          stack.push(neighbor)

  <span class="pcode-keyword">return</span> reconstruct_path(parent)`,

  astar: `<span class="pcode-comment">// A* Search Algorithm</span>
<span class="pcode-keyword">function</span> AStar(graph, start):
  g(start) ← 0
  h(start) ← heuristic(start)
  f(start) ← g + h
  open_set ← {start}
  visited  ← {}

  <span class="pcode-keyword">while</span> unvisited nodes remain:
    current ← node with lowest f(n)
              in open_set

    visited.add(current)

    <span class="pcode-keyword">for each</span> neighbor of current:
      g_new ← g(current) + cost(edge)
      h_new ← heuristic(neighbor)
      f_new ← g_new + h_new

      <span class="pcode-keyword">if</span> f_new < f(neighbor):
        update neighbor scores
        add to open_set

  <span class="pcode-keyword">return</span> path with lowest total cost`
};

/* ═══════════════════════════════════════════════════════════════════
   6. UI HANDLERS
═══════════════════════════════════════════════════════════════════ */

/** Switch between pages with animation */
function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const page = document.getElementById(id);
  page.classList.add('active');
}

/** Generate node labels and update UI */
function generateNodes(count) {
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  appState.nodes = Array.from({ length: count }, (_, i) => labels[i]);
  appState.edges = []; // clear edges when regenerating nodes
  refreshNodeUI();
  refreshEdgeDropdowns();
  renderPreviewCanvas();
  document.getElementById('edge-count-label').textContent = '0';
  document.getElementById('edge-list').innerHTML = '';
}

/** Update node chip display */
function refreshNodeUI() {
  const chips = document.getElementById('node-chips');
  chips.innerHTML = appState.nodes.map(n =>
    `<span class="chip">${n}</span>`
  ).join('');

  // Update start node select
  const startSel = document.getElementById('start-node');
  startSel.innerHTML = appState.nodes.map(n =>
    `<option value="${n}">${n}</option>`
  ).join('');
}

/** Populate edge from/to dropdowns */
function refreshEdgeDropdowns() {
  const selectors = ['#edge-from', '#edge-to'];
  selectors.forEach(sel => {
    document.querySelector(sel).innerHTML = appState.nodes.map(n =>
      `<option value="${n}">${n}</option>`
    ).join('');
  });
  // Default to different nodes
  if (appState.nodes.length > 1) {
    document.querySelector('#edge-to').value = appState.nodes[1];
  }
}

/** Add edge from UI inputs */
function addEdge() {
  const from   = document.getElementById('edge-from').value;
  const to     = document.getElementById('edge-to').value;
  const weight = parseInt(document.getElementById('edge-weight').value, 10) || 1;

  if (from === to) {
    flashError('Self-loops are not allowed!'); return;
  }
  if (weight < 1 || weight > 999) {
    flashError('Weight must be between 1 and 999'); return;
  }

  // Check for duplicate
  const exists = appState.edges.some(e =>
    (e.from === from && e.to === to) || (e.from === to && e.to === from)
  );
  if (exists) {
    flashError(`Edge ${from} ↔ ${to} already exists!`); return;
  }

  appState.edges.push({ from, to, weight });
  refreshEdgeList();
  renderPreviewCanvas();
}

/** Refresh the edge list UI */
function refreshEdgeList() {
  const container = document.getElementById('edge-list');
  container.innerHTML = appState.edges.map((e, i) => `
    <div class="edge-item">
      <span>${e.from} <span style="color:var(--cyan-dim)">→</span> ${e.to}
        <span class="edge-weight-badge">${e.weight}</span>
      </span>
      <span class="edge-remove" data-idx="${i}" title="Remove">✕</span>
    </div>
  `).join('');

  // Attach remove handlers
  container.querySelectorAll('.edge-remove').forEach(el => {
    el.addEventListener('click', () => {
      const idx = parseInt(el.dataset.idx, 10);
      appState.edges.splice(idx, 1);
      refreshEdgeList();
      renderPreviewCanvas();
      document.getElementById('edge-count-label').textContent = appState.edges.length;
    });
  });

  document.getElementById('edge-count-label').textContent = appState.edges.length;
}

/** Show a temporary error */
function flashError(msg) {
  const el = document.getElementById('run-error');
  el.textContent = '⚠ ' + msg;
  setTimeout(() => { el.textContent = ''; }, 3000);
}

/** Select algorithm card */
function selectAlgo(key) {
  appState.selectedAlgo = key;
  document.querySelectorAll('.algo-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.algo === key);
  });
  // Show pseudocode
  document.getElementById('pseudocode-text').innerHTML =
    PSEUDOCODES[key] || 'No pseudocode available.';
  document.getElementById('sim-pseudocode').innerHTML =
    PSEUDOCODES[key] || '';
}

/** Validate and launch simulation */
function launchSimulation() {
  const err = document.getElementById('run-error');
  err.textContent = '';

  if (appState.nodes.length < 2) {
    flashError('Add at least 2 nodes before running.'); return;
  }
  if (appState.edges.length < 1) {
    flashError('Add at least 1 edge before running.'); return;
  }
  if (!appState.selectedAlgo) {
    flashError('Please select an algorithm.'); return;
  }

  appState.startNode = document.getElementById('start-node').value;
  appState.animSpeed = parseInt(document.getElementById('speed-slider').value, 10);

  // Pre-compute steps
  const { nodes, edges, startNode, selectedAlgo } = appState;
  const simCanvasEl = document.getElementById('sim-canvas');

  // Compute node positions for simulation canvas
  // (Will be done on first render; store in appState.sim.nodePos)
  const tempPos = computeNodePositions(nodes, 400, 300, 220);
  appState.sim.nodePos = tempPos;

  let steps;
  if (selectedAlgo === 'bfs')   steps = runBFS(nodes, edges, startNode);
  else if (selectedAlgo === 'dfs')   steps = runDFS(nodes, edges, startNode);
  else if (selectedAlgo === 'astar') steps = runAStar(nodes, edges, startNode, tempPos);

  appState.sim.steps = steps;
  appState.sim.currentStep = 0;
  appState.sim.running = true;
  appState.sim.paused = false;
  appState.sim.result = null;

  // Update sim header
  document.getElementById('sim-algo-label').textContent =
    selectedAlgo === 'astar' ? 'A*' : selectedAlgo.toUpperCase();

  // Update info panel
  document.getElementById('info-algo').textContent =
    selectedAlgo === 'bfs' ? 'Breadth-First Search' :
    selectedAlgo === 'dfs' ? 'Depth-First Search' : 'A* Algorithm';
  document.getElementById('info-start').textContent = startNode;
  document.getElementById('info-status').innerHTML = '<span class="status-running">RUNNING</span>';
  document.getElementById('result-panel').style.display = 'none';

  // Set sim speed
  document.getElementById('sim-speed-slider').value = appState.animSpeed;

  // Clear step log
  document.getElementById('step-log').innerHTML = '';

  // Switch page
  showPage('page-sim');

  // Resize canvas after page is shown
  setTimeout(() => {
    resizeSimCanvas();
    startAnimation();
  }, 100);
}

/* ═══════════════════════════════════════════════════════════════════
   7. ANIMATION ENGINE
═══════════════════════════════════════════════════════════════════ */

/** Map speed level (1-5) to delay in ms */
function speedToDelay(speed) {
  const map = { 1: 1400, 2: 900, 3: 550, 4: 280, 5: 100 };
  return map[speed] || 550;
}

/** Resize simulation canvas to fit its container */
function resizeSimCanvas() {
  const canvas = document.getElementById('sim-canvas');
  const wrapper = canvas.parentElement;
  canvas.width  = wrapper.offsetWidth;
  canvas.height = wrapper.offsetHeight;

  // Re-compute node positions for new canvas size
  const cx = canvas.width / 2;
  const cy = canvas.height / 2;
  const r  = Math.min(canvas.width, canvas.height) * 0.35;
  appState.sim.nodePos = computeNodePositions(appState.nodes, cx, cy, r);
}

/** Advance one simulation step */
function stepSimulation() {
  const sim = appState.sim;
  if (sim.currentStep >= sim.steps.length) return;

  const step = sim.steps[sim.currentStep];
  const canvas = document.getElementById('sim-canvas');
  drawSimFrame(canvas, step, sim.steps, sim.nodePos);

  // Update info panel
  updateInfoPanel(step);

  // Log
  appendLog(step.log, step.done ? 'success' : step.found ? 'success' : '');

  sim.currentStep++;

  // Check done
  if (step.done) {
    finishSimulation(step);
  }
}

/** Update the left info panel */
function updateInfoPanel(step) {
  const { visited, frontier, current, done } = step;
  document.getElementById('info-explored').textContent =
    visited ? visited.size : 0;
  document.getElementById('info-current').textContent =
    current || (done ? '—' : '—');
  const frontierArr = Array.isArray(frontier) ? frontier : (frontier ? [...frontier] : []);
  document.getElementById('info-frontier').textContent =
    frontierArr.length > 0 ? '[' + frontierArr.join(', ') + ']' : '[ ]';
}

/** Called when simulation reaches the final step */
function finishSimulation(step) {
  const sim = appState.sim;
  sim.running = false;
  clearInterval(sim.timer);

  document.getElementById('info-status').innerHTML =
    step.found
      ? '<span class="status-done">COMPLETE ✓</span>'
      : '<span class="status-nopath">NO PATH FOUND</span>';

  if (step.found && step.finalPath) {
    const panel = document.getElementById('result-panel');
    panel.style.display = 'block';

    document.getElementById('result-path-display').innerHTML =
      `<div style="font-size:10px;letter-spacing:2px;color:var(--text-dim);margin-bottom:4px">OPTIMAL PATH FOUND</div>` +
      step.finalPath.map((n, i) => {
        if (i === step.finalPath.length - 1) return `<span>${n}</span>`;
        return `<span>${n}</span> <span style="color:var(--cyan-dim)">→</span> `;
      }).join('');

    document.getElementById('result-cost-display').innerHTML =
      `<span style="font-size:11px;color:var(--text-dim)">TOTAL DISTANCE: </span>${step.totalCost}`;

    document.getElementById('result-detail').textContent =
      `Nodes explored: ${step.visited ? step.visited.size : 0} / ${appState.nodes.length}
Algorithm: ${appState.selectedAlgo?.toUpperCase()}
Steps: ${sim.steps.length}`;

    appendLog(`🏆 RESULT: ${step.finalPath.join(' → ')} | Cost: ${step.totalCost}`, 'success');
  } else {
    appendLog('⚠️ No path found or graph is disconnected.', 'warning');
  }
}

/** Add entry to step log */
function appendLog(msg, type = '') {
  const log = document.getElementById('step-log');
  const entry = document.createElement('div');
  entry.className = 'step-log-entry' + (type ? ' ' + type : '');
  const step = appState.sim.currentStep;
  entry.textContent = `[${String(step).padStart(3,'0')}] ${msg}`;
  log.appendChild(entry);
  log.scrollTop = log.scrollHeight;
}

/** Start the animation loop */
function startAnimation() {
  const sim = appState.sim;
  if (sim.timer) clearInterval(sim.timer);

  const delay = speedToDelay(appState.animSpeed);
  sim.timer = setInterval(() => {
    if (sim.paused) return;
    if (sim.currentStep >= sim.steps.length) {
      clearInterval(sim.timer);
      return;
    }
    stepSimulation();
  }, delay);
}

/* ═══════════════════════════════════════════════════════════════════
   8. BACKGROUND PARTICLE SYSTEM
═══════════════════════════════════════════════════════════════════ */
function initParticles() {
  const canvas = document.getElementById('bg-particles');
  const ctx = canvas.getContext('2d');

  let particles = [];
  const PARTICLE_COUNT = 60;

  function resize() {
    canvas.width  = window.innerWidth;
    canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  // Create particles
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.5 + 0.3,
      alpha: Math.random() * 0.5 + 0.1,
    });
  }

  function drawParticles() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw connections
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.strokeStyle = `rgba(0,200,255,${0.05 * (1 - dist / 120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }

    // Draw particles
    particles.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0,200,255,${p.alpha})`;
      ctx.fill();

      // Move
      p.x += p.vx;
      p.y += p.vy;
      if (p.x < 0) p.x = canvas.width;
      if (p.x > canvas.width)  p.x = 0;
      if (p.y < 0) p.y = canvas.height;
      if (p.y > canvas.height) p.y = 0;
    });

    requestAnimationFrame(drawParticles);
  }
  drawParticles();
}

/* ═══════════════════════════════════════════════════════════════════
   9. PRESET GRAPHS
═══════════════════════════════════════════════════════════════════ */
const PRESETS = {
  small: {
    count: 4,
    edges: [
      { from: 'A', to: 'B', weight: 4 },
      { from: 'A', to: 'C', weight: 2 },
      { from: 'B', to: 'D', weight: 5 },
      { from: 'C', to: 'D', weight: 7 },
      { from: 'B', to: 'C', weight: 1 },
    ]
  },
  medium: {
    count: 6,
    edges: [
      { from: 'A', to: 'B', weight: 3 },
      { from: 'A', to: 'C', weight: 6 },
      { from: 'B', to: 'D', weight: 2 },
      { from: 'B', to: 'E', weight: 8 },
      { from: 'C', to: 'D', weight: 4 },
      { from: 'D', to: 'F', weight: 3 },
      { from: 'E', to: 'F', weight: 2 },
      { from: 'C', to: 'F', weight: 9 },
    ]
  },
  large: {
    count: 8,
    edges: [
      { from: 'A', to: 'B', weight: 5 },
      { from: 'A', to: 'C', weight: 3 },
      { from: 'B', to: 'D', weight: 4 },
      { from: 'B', to: 'E', weight: 7 },
      { from: 'C', to: 'D', weight: 2 },
      { from: 'C', to: 'F', weight: 6 },
      { from: 'D', to: 'G', weight: 3 },
      { from: 'E', to: 'H', weight: 4 },
      { from: 'F', to: 'G', weight: 5 },
      { from: 'F', to: 'H', weight: 8 },
      { from: 'G', to: 'H', weight: 2 },
      { from: 'E', to: 'F', weight: 3 },
    ]
  }
};

function loadPreset(key) {
  const preset = PRESETS[key];
  if (!preset) return;

  // Generate nodes
  const labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  appState.nodes = Array.from({ length: preset.count }, (_, i) => labels[i]);
  appState.edges = preset.edges.map(e => ({ ...e }));

  document.getElementById('node-count').value = preset.count;
  refreshNodeUI();
  refreshEdgeDropdowns();
  refreshEdgeList();
  renderPreviewCanvas();
}

/* ═══════════════════════════════════════════════════════════════════
   10. INIT — Wire up all event listeners
═══════════════════════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {

  // ── Background particles ──
  initParticles();

  // ── Initial state ──
  generateNodes(5);
  loadPreset('medium'); // start with a nice demo graph

  // ── Node count input ──
  document.getElementById('generate-nodes-btn').addEventListener('click', () => {
    const n = parseInt(document.getElementById('node-count').value, 10);
    if (n >= 2 && n <= 10) {
      generateNodes(n);
    } else {
      flashError('Node count must be between 2 and 10.');
    }
  });

  // ── Add edge ──
  document.getElementById('add-edge-btn').addEventListener('click', addEdge);
  document.getElementById('edge-weight').addEventListener('keydown', e => {
    if (e.key === 'Enter') addEdge();
  });

  // ── Clear edges ──
  document.getElementById('clear-edges-btn').addEventListener('click', () => {
    appState.edges = [];
    refreshEdgeList();
    renderPreviewCanvas();
  });

  // ── Preset buttons ──
  document.querySelectorAll('.btn-preset').forEach(btn => {
    btn.addEventListener('click', () => loadPreset(btn.dataset.preset));
  });

  // ── Algorithm cards ──
  document.querySelectorAll('.algo-card').forEach(card => {
    card.addEventListener('click', () => selectAlgo(card.dataset.algo));
  });
  // Select BFS by default
  selectAlgo('bfs');

  // ── Speed slider (Page 1) ──
  const speedSlider = document.getElementById('speed-slider');
  const speedLabel  = document.getElementById('speed-label');
  const speedNames  = ['', 'SLOW', 'SLOW+', 'NORMAL', 'FAST', 'FAST+'];
  speedSlider.addEventListener('input', () => {
    appState.animSpeed = parseInt(speedSlider.value, 10);
    speedLabel.textContent = speedNames[appState.animSpeed];
  });

  // ── Run simulation button ──
  document.getElementById('run-btn').addEventListener('click', launchSimulation);

  // ── Sim controls ──
  document.getElementById('btn-pause').addEventListener('click', () => {
    const sim = appState.sim;
    sim.paused = !sim.paused;
    document.getElementById('btn-pause').textContent = sim.paused ? '▶ RESUME' : '⏸ PAUSE';
  });

  document.getElementById('btn-step').addEventListener('click', () => {
    const sim = appState.sim;
    sim.paused = true;
    document.getElementById('btn-pause').textContent = '▶ RESUME';
    stepSimulation();
  });

  document.getElementById('btn-restart').addEventListener('click', () => {
    clearInterval(appState.sim.timer);
    appState.sim.currentStep = 0;
    appState.sim.paused = false;
    appState.sim.running = true;
    document.getElementById('btn-pause').textContent = '⏸ PAUSE';
    document.getElementById('info-status').innerHTML = '<span class="status-running">RUNNING</span>';
    document.getElementById('result-panel').style.display = 'none';
    document.getElementById('step-log').innerHTML = '';
    document.getElementById('info-explored').textContent = '0';
    document.getElementById('info-current').textContent = '—';
    document.getElementById('info-frontier').textContent = '—';
    startAnimation();
  });

  // ── Sim speed slider ──
  document.getElementById('sim-speed-slider').addEventListener('input', function () {
    appState.animSpeed = parseInt(this.value, 10);
    if (appState.sim.running && !appState.sim.paused) {
      clearInterval(appState.sim.timer);
      startAnimation();
    }
  });

  // ── Change algo button (sim page) ──
  document.getElementById('btn-change-algo').addEventListener('click', () => {
    clearInterval(appState.sim.timer);
    showPage('page-input');
  });

  // ── Return to input ──
  document.getElementById('btn-return-input').addEventListener('click', () => {
    clearInterval(appState.sim.timer);
    showPage('page-input');
    setTimeout(renderPreviewCanvas, 100);
  });

  // ── Window resize: re-render sim canvas ──
  window.addEventListener('resize', () => {
    if (document.getElementById('page-sim').classList.contains('active')) {
      resizeSimCanvas();
      if (appState.sim.steps.length > 0 && appState.sim.currentStep > 0) {
        const step = appState.sim.steps[Math.min(appState.sim.currentStep - 1, appState.sim.steps.length - 1)];
        drawSimFrame(document.getElementById('sim-canvas'), step, appState.sim.steps, appState.sim.nodePos);
      }
    }
  });
});
