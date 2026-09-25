import type { Concept } from "../schema";

/**
 * Graph utilities over the prerequisite DAG.
 * Edge direction: prerequisite  ──▶  dependent concept.
 */

export interface ConceptGraph {
  ids: string[];
  byId: Map<string, Concept>;
  /** prerequisites of a concept (incoming edges) */
  prereqs: Map<string, string[]>;
  /** concepts that directly depend on a concept (outgoing edges) */
  dependents: Map<string, string[]>;
}

export function buildGraph(concepts: Concept[]): ConceptGraph {
  const byId = new Map(concepts.map((c) => [c.id, c]));
  const prereqs = new Map<string, string[]>();
  const dependents = new Map<string, string[]>();
  for (const c of concepts) {
    prereqs.set(
      c.id,
      c.prerequisites.filter((p) => byId.has(p) && p !== c.id),
    );
    dependents.set(c.id, []);
  }
  for (const c of concepts) {
    for (const p of prereqs.get(c.id)!) dependents.get(p)!.push(c.id);
  }
  return { ids: concepts.map((c) => c.id), byId, prereqs, dependents };
}

function walk(start: string, next: Map<string, string[]>): Map<string, number> {
  // BFS returning the shortest distance from `start` to every reachable node.
  const dist = new Map<string, number>();
  const queue: string[] = [start];
  dist.set(start, 0);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const n of next.get(cur) ?? []) {
      if (!dist.has(n)) {
        dist.set(n, dist.get(cur)! + 1);
        queue.push(n);
      }
    }
  }
  dist.delete(start);
  return dist;
}

/** All transitive prerequisites with their distance (1 = direct). */
export function ancestors(g: ConceptGraph, id: string): Map<string, number> {
  return walk(id, g.prereqs);
}

/** All concepts that transitively depend on `id`, with distance. */
export function descendants(g: ConceptGraph, id: string): Map<string, number> {
  return walk(id, g.dependents);
}

/** Concepts nothing depends on — the natural "goal" concepts of a course. */
export function sinks(g: ConceptGraph): string[] {
  return g.ids.filter((id) => (g.dependents.get(id) ?? []).length === 0);
}

/**
 * Kahn's algorithm. Ties are broken by `priority` (lower first) and then by
 * original order, so output is deterministic. Throws on a cycle.
 */
export function topoSort(g: ConceptGraph, priority?: (id: string) => number): string[] {
  const indeg = new Map(g.ids.map((id) => [id, g.prereqs.get(id)!.length]));
  const order = new Map(g.ids.map((id, i) => [id, i]));
  const cmp = (a: string, b: string) =>
    (priority ? priority(a) - priority(b) : 0) || order.get(a)! - order.get(b)!;
  const ready = g.ids.filter((id) => indeg.get(id) === 0).sort(cmp);
  const out: string[] = [];
  while (ready.length) {
    const cur = ready.shift()!;
    out.push(cur);
    for (const d of g.dependents.get(cur)!) {
      indeg.set(d, indeg.get(d)! - 1);
      if (indeg.get(d) === 0) {
        ready.push(d);
        ready.sort(cmp);
      }
    }
  }
  if (out.length !== g.ids.length) throw new Error("Concept graph contains a cycle");
  return out;
}

/**
 * Removes the minimum number of edges needed to make the prerequisite graph
 * acyclic (greedy DFS back-edge removal). Used to sanitise AI-generated graphs.
 * Returns new concept objects; the input is not mutated.
 */
export function breakCycles(concepts: Concept[]): { concepts: Concept[]; removed: [string, string][] } {
  const ids = new Set(concepts.map((c) => c.id));
  const prereqs = new Map(
    concepts.map((c) => [c.id, [...new Set(c.prerequisites.filter((p) => ids.has(p) && p !== c.id))]]),
  );
  const state = new Map<string, 0 | 1 | 2>(); // 0 new, 1 on stack, 2 done
  const removed: [string, string][] = [];

  const visit = (id: string) => {
    state.set(id, 1);
    const list = prereqs.get(id)!;
    for (const p of [...list]) {
      const s = state.get(p) ?? 0;
      if (s === 1) {
        // back edge id -> p closes a cycle; drop it
        list.splice(list.indexOf(p), 1);
        removed.push([p, id]);
      } else if (s === 0) {
        visit(p);
      }
    }
    state.set(id, 2);
  };
  for (const c of concepts) if ((state.get(c.id) ?? 0) === 0) visit(c.id);

  return {
    concepts: concepts.map((c) => ({ ...c, prerequisites: prereqs.get(c.id)! })),
    removed,
  };
}

/**
 * Longest-path layering: foundations (no prerequisites) sit on layer 0 and
 * every concept sits one layer above its highest prerequisite.
 */
export function layers(g: ConceptGraph): Map<string, number> {
  const layer = new Map<string, number>();
  for (const id of topoSort(g)) {
    const ps = g.prereqs.get(id)!;
    layer.set(id, ps.length ? Math.max(...ps.map((p) => layer.get(p)!)) + 1 : 0);
  }
  return layer;
}
