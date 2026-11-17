export const SPEED = 1.38,
  RADIUS = 0.27;
export const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
export function inside(p, ring) {
  let yes = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const a = ring[i],
      b = ring[j];
    if (
      a[1] > p[1] !== b[1] > p[1] &&
      p[0] < ((b[0] - a[0]) * (p[1] - a[1])) / (b[1] - a[1]) + a[0]
    )
      yes = !yes;
  }
  return yes;
}
export function nearest(p, line) {
  let best = { point: line[0], distance: Infinity, index: 0, t: 0 };
  for (let i = 1; i < line.length; i++) {
    const a = line[i - 1],
      b = line[i],
      dx = b[0] - a[0],
      dz = b[1] - a[1],
      t = Math.max(
        0,
        Math.min(
          1,
          ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz || 1),
        ),
      ),
      point = [a[0] + t * dx, a[1] + t * dz],
      d = distance(p, point);
    if (d < best.distance) best = { point, distance: d, index: i - 1, t };
  }
  return best;
}
export function walkable(s, p) {
  const roads = s.roads.filter(
    (r) => nearest(p, r.points).distance < r.width / 2 - RADIUS,
  );
  if (!roads.length) return false;
  if (roads.some((r) => r.bridge)) return true;
  if (
    s.waters.some(
      (r) => inside(p, r[0]) && !r.slice(1).some((h) => inside(p, h)),
    )
  )
    return false;
  return !s.buildings.some(
    (b) => inside(p, b.ring) || nearest(p, b.ring).distance < RADIUS,
  );
}
export function move(s, p, delta) {
  const len = Math.hypot(...delta),
    steps = Math.max(1, Math.ceil(len / 0.15));
  let result = [...p];
  for (let n = 0; n < steps; n++) {
    const q = [result[0] + delta[0] / steps, result[1] + delta[1] / steps];
    if (walkable(s, q)) result = q;
    else {
      const x = [q[0], result[1]],
        z = [result[0], q[1]];
      if (walkable(s, x)) result = x;
      else if (walkable(s, z)) result = z;
    }
  }
  return result;
}
// Click routing follows the OSM road graph. Geometry, not image colours, defines it.
export function pathTo(s, start, end) {
  const nodes = [],
    edges = [];
  for (const road of s.roads) {
    let previous = -1;
    for (const p of road.points) {
      let index = nodes.findIndex((q) => distance(p, q) < 0.15);
      if (index < 0) {
        index = nodes.length;
        nodes.push(p);
        edges.push([]);
      }
      if (previous >= 0) {
        const d = distance(nodes[previous], p);
        edges[previous].push([index, d]);
        edges[index].push([previous, d]);
      }
      previous = index;
    }
  }
  const anchor = (p) => {
    let best = { d: Infinity, a: 0, b: 0, p };
    for (let a = 0; a < nodes.length; a++)
      for (const [b] of edges[a]) {
        const n = nearest(p, [nodes[a], nodes[b]]);
        if (n.distance < best.d) best = { d: n.distance, a, b, p: n.point };
      }
    return best;
  };
  const a = anchor(start),
    b = anchor(end);
  if (b.d > 8) return [];
  if ((a.a === b.a && a.b === b.b) || (a.a === b.b && a.b === b.a))
    return [b.p];
  const costs = nodes.map(() => Infinity),
    prev = nodes.map(() => -1),
    open = new Set(nodes.map((_, i) => i));
  for (const k of [a.a, a.b]) costs[k] = distance(start, nodes[k]);
  while (open.size) {
    let k = -1;
    for (const i of open) if (k < 0 || costs[i] < costs[k]) k = i;
    if (!Number.isFinite(costs[k])) break;
    open.delete(k);
    for (const [j, d] of edges[k])
      if (costs[k] + d < costs[j]) {
        costs[j] = costs[k] + d;
        prev[j] = k;
      }
  }
  let k =
    costs[b.a] + distance(nodes[b.a], b.p) <
    costs[b.b] + distance(nodes[b.b], b.p)
      ? b.a
      : b.b;
  if (!Number.isFinite(costs[k])) return [];
  const path = [b.p];
  for (let n = 0; k >= 0 && n < nodes.length; n++) {
    path.unshift(nodes[k]);
    k = prev[k];
  }
  return path;
}
export function routeLength(route) {
  return route.slice(1).reduce((sum, p, i) => sum + distance(p, route[i]), 0);
}
// Secondary gates are points on existing OSM ways, with the same coordinates in
// both paintings. They do not invent a physical connection or move the walker.
/** @returns {Array<{point: [number,number], to: number, label: string}>} */
export function extraExits(s) {
  const gates = [];
  for (const gate of [
    { way: 647696686, vertex: 3, a: 0, b: 1, label: "Le quai" },
    { way: 647696688, vertex: 1, a: 1, b: 2, label: "La rive sud" },
  ])
    if (s.index === gate.a || s.index === gate.b) {
      const r = s.roads.find((r) => r.id === gate.way);
      if (r)
        gates.push({
          point:
            gate.way === 647696688
              ? r.points[0].map((v, i) => v + (r.points[1][i] - v) * 0.4)
              : r.points[gate.vertex],
          to: s.index === gate.a ? gate.b : gate.a,
          label: gate.label,
        });
    }
  return gates;
}
