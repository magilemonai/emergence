// engine/graph.js — the derived graph and the deterministic flow pass.
// Nodes declare ports; edges are DERIVED from those ports (a converter never names an edge), so every flow in
// the game is a pipe the renderer can draw. Pure: no clock, no randomness, no view.
import { assertNode } from './types.js';

/** the store node that banks a resource: the store whose res matches, in the resource's own stratum */
export function storeFor(state, res) {
  const def = state.resources[res];
  const era = def ? def.era : null;
  let fallback = null;
  for (const id of state.nodeOrder) {
    const n = state.nodes[id];
    if (!n || n.kind !== 'store' || n.res !== res) continue;
    if (era === null || n.era === era) return id;
    if (!fallback) fallback = id;
  }
  return fallback;
}

/** pass order: stratum ascending, then insertion order (deterministic; never a for..in over nodes) */
export function passOrder(state) {
  const ids = state.nodeOrder.slice();
  const at = new Map();
  ids.forEach((id, i) => at.set(id, i));
  const era = (id) => (state.nodes[id] ? state.nodes[id].era : 0);
  ids.sort((a, b) => (era(a) - era(b)) || (at.get(a) - at.get(b)));
  return ids;
}

/**
 * Rebuild state.edges from the ports of every node, in pass order.
 * Returns a lookup index, kept OUT of state so state stays JSON-safe and small.
 * An input port becomes store -> node; an output port becomes node -> store. riser = the bank sits in another
 * stratum, which is exactly the reach-back the player can follow with their eye in the overview.
 */
export function deriveEdges(state) {
  const edges = [];
  const index = { in: {}, out: {}, order: [] };
  const order = passOrder(state);
  for (const id of order) {
    const n = state.nodes[id];
    if (!n || n.kind === 'store') continue;
    for (const p of n.inputs) {
      const from = storeFor(state, p.res);
      if (!from) continue;
      const bag = index.in[id] || (index.in[id] = {});
      if (bag[p.res]) continue;
      const e = { from: from, to: id, res: p.res, flow: 0, riser: state.nodes[from].era !== n.era };
      edges.push(e);
      bag[p.res] = e;
    }
    for (const p of n.outputs) {
      const to = storeFor(state, p.res);
      if (!to) continue;
      const bag = index.out[id] || (index.out[id] = {});
      if (bag[p.res]) continue;
      const e = { from: id, to: to, res: p.res, flow: 0, riser: state.nodes[to].era !== n.era };
      edges.push(e);
      bag[p.res] = e;
    }
  }
  state.edges = edges;
  index.order = order;
  return index;
}

/** product of a node's named multipliers (milestones, upgrades, recursion) */
export function multOf(node) {
  let m = 1;
  for (const k of Object.keys(node.mult)) {
    const v = node.mult[k];
    if (typeof v === 'number' && isFinite(v)) m *= v;
  }
  return m;
}

/**
 * One graph pass. Sources add, converters draw the scarcest input proportionally then produce, sinks draw.
 * Semantics ported from v4 Origins produce(): the draw is limited by what is actually in the bank, upkeep is
 * just a second input port, and a paused node moves nothing. One factor for the whole node means a scarce
 * input throttles every port of it (no free lunch).
 * edge.flow is per second, so the renderer turns it straight into particle density.
 */
export function tickGraph(state, dt, index) {
  const idx = index || deriveEdges(state);
  const order = idx.order && idx.order.length ? idx.order : passOrder(state);
  for (const e of state.edges) e.flow = 0;
  const opening = {};
  for (const r of Object.keys(state.stocks)) opening[r] = state.stocks[r];

  if (dt > 0) {
    for (const id of order) {
      const n = state.nodes[id];
      if (!n || n.paused || n.count <= 0) continue;
      if (n.kind === 'store' || n.kind === 'goal') continue;
      const m = multOf(n);
      if (n.kind === 'source') {
        for (const p of n.outputs) {
          const give = n.count * p.rate * m * dt;
          if (!(give > 0)) continue;
          state.stocks[p.res] = (state.stocks[p.res] || 0) + give;
          const e = idx.out[id] && idx.out[id][p.res];
          if (e) e.flow += give / dt;
        }
        continue;
      }
      let factor = 1;
      for (const p of n.inputs) {
        const demand = n.count * p.rate * m * dt;
        if (!(demand > 0)) continue;
        const f = (state.stocks[p.res] || 0) / demand;
        if (f < factor) factor = f;
      }
      if (!(factor > 0)) continue;
      if (factor > 1) factor = 1;
      for (const p of n.inputs) {
        const take = factor * n.count * p.rate * m * dt;
        if (!(take > 0)) continue;
        state.stocks[p.res] = (state.stocks[p.res] || 0) - take;
        const e = idx.in[id] && idx.in[id][p.res];
        if (e) e.flow += take / dt;
      }
      for (const p of n.outputs) {
        const give = factor * n.count * p.rate * m * dt;
        if (!(give > 0)) continue;
        state.stocks[p.res] = (state.stocks[p.res] || 0) + give;
        const e = idx.out[id] && idx.out[id][p.res];
        if (e) e.flow += give / dt;
      }
    }
  }

  let flows = 0;
  for (const e of state.edges) if (e.flow > 0) flows++;
  for (const r of Object.keys(state.stocks)) state.rates[r] = dt > 0 ? (state.stocks[r] - opening[r]) / dt : 0;
  return { flows: flows };
}

/** shape-check + insert, so sim.addNode and the tests share one door into the graph */
export function insertNode(state, def) {
  assertNode(def);
  if (state.nodes[def.id]) throw new Error('duplicate node id ' + def.id);
  state.nodes[def.id] = def;
  state.nodeOrder.push(def.id);
  return def;
}
