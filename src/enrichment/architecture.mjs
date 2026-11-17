import {ShapeUtils, Vector2} from 'three';

export const ENRICHMENT_VERSION = 'world-enrichment-v1';
/** Hash selects decoration only. Object IDs keep their full source key. */
export function stableHash(value) {
  let hash = 2166136261;
  for (const ch of String(value)) { hash ^= ch.charCodeAt(0); hash = Math.imul(hash, 16777619); }
  return hash >>> 0;
}
const pick = (values, seed) => values[seed % values.length];
const positive = value => { const n = Number.parseFloat(value); return Number.isFinite(n) && n > 0 ? n : null; };
const bounded = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
function ring(points) {
  const r = points.filter(p => Array.isArray(p) && p.length >= 2 && p.every(Number.isFinite)).map(p => [p[0], p[1]]);
  if (r.length > 1 && r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1]) r.pop();
  return r;
}
const area = r => r.reduce((n, p, i) => { const q = r[(i + 1) % r.length]; return n + p[0] * q[1] - q[0] * p[1]; }, 0) / 2;
function rectangle(r) {
  if (r.length !== 4) return false;
  for (let i = 0; i < 4; i++) {
    const a = r[i], b = r[(i + 1) % 4], c = r[(i + 2) % 4], u = [b[0] - a[0], b[1] - a[1]], v = [c[0] - b[0], c[1] - b[1]];
    if (Math.abs(u[0] * v[0] + u[1] * v[1]) > .12 * Math.hypot(...u) * Math.hypot(...v)) return false;
  }
  return true;
}

/** Produce a compact, reproducible facade plan; source geometry is never edited. */
export function buildArchitecture(feature, pack) {
  if (!feature?.id || !feature.polygon || feature.kind !== 'building') throw Error('A source building footprint is required');
  if (pack?.schema !== 'regional-enrichment-pack-v1' || !pack.architecture?.palettes?.length) throw Error('A versioned architecture pack is required');
  const outline = ring(feature.points), tags = feature.tags ?? {}, seed = stableHash(feature.id + ':architecture-v1');
  if (outline.length < 3 || Math.abs(area(outline)) < .1) return null;
  const technical = ['industrial', 'warehouse', 'hangar', 'garage', 'garages', 'shed', 'greenhouse'].includes(tags.building);
  const monument = !!(tags.historic || tags.heritage || ['church', 'cathedral', 'chapel', 'castle'].includes(tags.building));
  const family = technical ? 'utility' : monument ? 'documented-landmark-fallback' : 'ordinary';
  const palettes = pack.architecture.palettes.filter(p => !p.family || p.family === (technical ? 'utility' : 'ordinary'));
  const palette = {...pick(palettes.length ? palettes : pack.architecture.palettes, seed)};
  const documentedHeight = positive(tags.height), levels = bounded(Math.round(positive(tags['building:levels']) ?? pack.architecture.defaultLevels), 1, 30);
  const legacyHeight = bounded(documentedHeight ?? Math.min(35, levels * 2.9), 1.5, 100);
  const closedRectangle = rectangle(outline) && !(feature.holes?.length);
  const unsupportedRoof = tags['roof:shape'] && !['flat', 'gabled', 'hipped'].includes(tags['roof:shape']);
  const pitched = closedRectangle && !technical && !monument && !unsupportedRoof && tags['roof:shape'] !== 'flat' && (!documentedHeight || positive(tags['roof:height']));
  const width = closedRectangle ? Math.min(...outline.map((p, i) => Math.hypot(p[0] - outline[(i + 1) % 4][0], p[1] - outline[(i + 1) % 4][1]))) : 0;
  const roofHeight = pitched ? bounded(positive(tags['roof:height']) ?? width * pack.architecture.roofRiseRatio, .4, Math.min(5, legacyHeight * .45)) : 0;
  const height = documentedHeight ? Math.max(1.5, legacyHeight - roofHeight) : legacyHeight;
  const roofType = !pitched ? 'flat' : tags['roof:shape'] === 'hipped' ? 'hipped' : 'gabled';
  if (tags['building:material'] === 'brick') palette.wall = pack.architecture.brickColor ?? palette.wall;
  if (tags['roof:material'] === 'slate') palette.roof = pack.architecture.slateColor ?? palette.roof;
  if (tags['roof:material'] === 'metal') palette.roof = pack.architecture.metalColor ?? palette.roof;
  return {
    id: feature.id, sourceId: feature.id, worldObjectId: 'architecture/v1/' + feature.id, version: ENRICHMENT_VERSION,
    family, seed, height, totalHeight: height + roofHeight, levels,
    roof: {type: roofType, height: roofHeight, color: palette.roof}, palette,
    facadeSpacing: technical ? 5.4 : pack.architecture.facadeSpacing * (.9 + (seed % 21) / 100),
    windowWidth: technical ? 1.6 : .86 + (seed % 9) * .035, windowHeight: technical ? .65 : 1.18,
    doorEdge: seed % outline.length, shutters: !technical && !monument && seed % 5 !== 0,
    status: monument ? 'unverified' : 'inferred',
    provenance: {footprint: 'source-derived', sourceId: feature.id, height: documentedHeight ? 'source-derived' : 'inferred', facade: 'procedural-decorative', roof: tags['roof:shape'] && roofType === 'flat' && tags['roof:shape'] !== 'flat' ? 'unverified' : 'inferred', regionalPack: pack.id, license: pack.license},
    warnings: [...(monument ? ['Mapped landmark: generic closed fallback, not an authentic reconstruction'] : []), ...(unsupportedRoof || !closedRectangle && tags['roof:shape'] && tags['roof:shape'] !== 'flat' ? ['Complex documented roof not reconstructed; flat closed fallback'] : [])],
  };
}

/** Canonical x=easting, z=northing; y is height relative to a common base.
 * A renderer whose northing axis is reversed must reverse triangle winding. */
export function* architectureTriangles(feature, plan, {facades = true} = {}) {
  if (!plan) return;
  const outer = ring(feature.points), holes = (feature.holes ?? []).map(ring).filter(r => r.length >= 3), h = plan.height, p = plan.palette;
  const point = (v, y) => ({x: v[0], y, z: v[1]});
  const triangle = (a, b, c, color, part) => ({a, b, c, color, part});
  function* quad(a, b, c, d, color, part, flip = false) {
    if (flip) { yield triangle(a, c, b, color, part); yield triangle(a, d, c, color, part); }
    else { yield triangle(a, b, c, color, part); yield triangle(a, c, d, color, part); }
  }
  for (const [ringIndex, outline] of [outer, ...holes].entries()) {
    const signed = area(outline), reverse = ringIndex === 0 ? signed < 0 : signed > 0;
    for (let edge = 0; edge < outline.length; edge++) {
      const a = outline[edge], b = outline[(edge + 1) % outline.length], dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
      if (length < .05) continue;
      yield* quad(point(a, 0), point(a, h), point(b, h), point(b, 0), p.wall, 'wall', reverse);
      if (!facades || ringIndex > 0 || length < 2.1 || plan.family === 'documented-landmark-fallback') continue;
      const sign = reverse ? -1 : 1, nx = sign * dz / length, nz = -sign * dx / length;
      const panel = (u, width, y, height, offset = .012) => {
        const at = (t, v) => ({x: a[0] + dx * t + nx * offset, y: v, z: a[1] + dz * t + nz * offset});
        const half = width / (2 * length);
        return [at(u - half, y), at(u - half, y + height), at(u + half, y + height), at(u + half, y)];
      };
      const slots = Math.max(1, Math.min(24, Math.floor(length / plan.facadeSpacing))), storeys = Math.max(1, Math.min(plan.levels, Math.floor(h / 2.1))), step = h / storeys;
      for (let floor = 0; floor < storeys; floor++) for (let i = 0; i < slots; i++) {
        const u = (i + .5) / slots, windowHeight = Math.min(plan.windowHeight, step - .85), width = Math.min(plan.windowWidth, length / slots * .62);
        if (floor === 0 && edge === plan.doorEdge && i === Math.floor(slots / 2)) {
          yield* quad(...panel(u, Math.min(1.08, width + .16), 0, Math.min(2.08, h - .15)), p.wood, 'door', reverse);
          continue;
        }
        const sill = floor * step + Math.max(.65, (step - windowHeight) * .56);
        yield* quad(...panel(u, width + .18, sill - .1, windowHeight + .2, .009), p.trim, 'trim', reverse);
        yield* quad(...panel(u, width, sill, windowHeight, .016), p.glass, 'window', reverse);
        if (plan.shutters) for (const side of [-1, 1]) yield* quad(...panel(u + side * (width + .26) / (2 * length), .22, sill, windowHeight, .02), p.wood, 'shutter', reverse);
      }
      yield* quad(...panel(.5, length, Math.max(.05, h - .16), .12, .006), p.trim, 'cornice', reverse);
    }
  }
  const topTri = (a, b, c, color, part) => {
    if ((b.z - a.z) * (c.x - a.x) - (b.x - a.x) * (c.z - a.z) < 0) [b, c] = [c, b];
    return triangle(a, b, c, color, part);
  };
  if (plan.roof.type === 'gabled' && outer.length === 4 && !holes.length) {
    let r = outer;
    if (Math.hypot(r[1][0] - r[0][0], r[1][1] - r[0][1]) < Math.hypot(r[2][0] - r[1][0], r[2][1] - r[1][1])) r = [...r.slice(1), r[0]];
    const q = r.map(v => point(v, h)), midpoint = (a, b) => ({x: (a.x + b.x) / 2, y: h + plan.roof.height, z: (a.z + b.z) / 2}), left = midpoint(q[0], q[3]), right = midpoint(q[1], q[2]);
    yield topTri(q[0], q[1], right, p.roof, 'roof'); yield topTri(q[0], right, left, p.roof, 'roof');
    yield topTri(q[3], left, right, p.roof, 'roof'); yield topTri(q[3], right, q[2], p.roof, 'roof');
    const reverse = area(r) < 0;
    yield triangle(q[0], ...(reverse ? [left, q[3]] : [q[3], left]), p.wall, 'gable');
    yield triangle(q[1], ...(reverse ? [q[2], right] : [right, q[2]]), p.wall, 'gable');
  } else if (plan.roof.type === 'hipped' && outer.length === 4 && !holes.length) {
    const center = {x: outer.reduce((n, v) => n + v[0], 0) / 4, y: h + plan.roof.height, z: outer.reduce((n, v) => n + v[1], 0) / 4};
    for (let i = 0; i < 4; i++) yield topTri(point(outer[i], h), point(outer[(i + 1) % 4], h), center, p.roof, 'roof');
  } else {
    const contours = outer.map(v => new Vector2(...v)), voids = holes.map(r => r.map(v => new Vector2(...v))), vertices = [...outer, ...holes.flat()];
    for (const ids of ShapeUtils.triangulateShape(contours, voids)) yield topTri(...ids.map(i => point(vertices[i], h)), p.roof, 'roof');
  }
}
