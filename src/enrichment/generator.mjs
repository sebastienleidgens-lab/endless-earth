import {PlanetSurface, inside, nearestOnLine, roadWidth, sampleTile} from '../planet/surface.mjs';
import {buildArchitecture, stableHash, ENRICHMENT_VERSION} from './architecture.mjs';

const denied = new Set(['private', 'no', 'permit', 'customers', 'agricultural', 'forestry']);
const within = (p, f) => f.polygon && inside(p, f.points) && !(f.holes ?? []).some(r => inside(p, r));
const overlaps = (a, b) => a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
const featureBounds = f => f.points.reduce((b, p) => [Math.min(b[0], p[0]), Math.min(b[1], p[1]), Math.max(b[2], p[0]), Math.max(b[3], p[1])], [Infinity, Infinity, -Infinity, -Infinity]);

/** Source habitat, not the chosen regional decoration, owns the classification. */
export function habitatForFeature(feature, pack) {
  if (feature.kind !== 'landcover') return null;
  for (const rule of pack.habitats ?? []) if (Object.entries(rule.match).every(([key, value]) => feature.tags?.[key] === value)) return rule;
  return null;
}

/** Pure CPU/offline plan generation. No renderer, access permission, or collider
 * is created by this function. Source layers and the tile remain immutable. */
export function generateEnrichment(tile, pack, options = {}) {
  if (!tile?.id || !Array.isArray(tile.bounds) || tile.bounds.length !== 4 || !tile.bounds.every(Number.isFinite) || !Array.isArray(tile.features)) throw Error('Invalid canonical tile');
  if (pack?.schema !== 'regional-enrichment-pack-v1' || !pack.id || !Array.isArray(pack.habitats)) throw Error('Invalid regional enrichment pack');
  const bounds = tile.bounds, tileWidth = bounds[2] - bounds[0], tileHeight = bounds[3] - bounds[1];
  if (!(tileWidth > 0 && tileHeight > 0)) throw Error('Invalid tile extent');
  const spacing = options.spacing ?? pack.detailSpacing ?? 128, maxDetails = options.maxDetails ?? pack.maxDetails ?? 512;
  if (!Number.isFinite(spacing) || spacing < 16 || !Number.isInteger(maxDetails) || maxDetails < 0 || maxDetails > 10000) throw Error('Unbounded detail generation refused');
  const features = [...tile.features].sort((a, b) => a.id.localeCompare(b.id)), buildings = [], details = [], warnings = [];
  const audit = {buildingPlans: 0, detailPlans: 0, corridorDetails: 0, corridorClusters: 0, unprocessedCorridorAnchors: 0, protectedBuildings: 0, protectedDetails: 0, excludedCandidates: 0, unknownHabitatCandidates: 0, slopeExcluded: 0, detailLimitDropped: 0, habitats: {}, renderVerified: false, physicalAuthority: 'unchanged-source-and-runtime', stage: 'generated-not-render-validated'};
  const blocked = options.protectedBounds, signal = options.signal;
  for (const feature of features) {
    signal?.throwIfAborted();
    if (feature.kind !== 'building') continue;
    if (blocked && overlaps(featureBounds(feature), blocked)) { audit.protectedBuildings++; continue; }
    const plan = buildArchitecture(feature, pack);
    if (plan) buildings.push(plan); else warnings.push({id: feature.id, reason: 'invalid-building-footprint'});
  }
  const surface = new PlanetSurface({tileSize: tileWidth});
  surface.add({...tile, features});
  const namespace = options.coordinateNamespace ?? 'declared-metric-frame';
  const own = (x, y) => x >= bounds[0] && x < bounds[2] && y >= bounds[1] && y < bounds[3];
  function candidate(x, y, cellId, clusterId = null) {
    if (!own(x, y)) return;
    if (blocked && x >= blocked[0] - 2 && x <= blocked[2] + 2 && y >= blocked[1] - 2 && y <= blocked[3] + 2) { audit.protectedDetails++; return; }
    const point = {x, y}, nearby = surface.query(point, 64), area = nearby.find(f => within(point, f) && habitatForFeature(f, pack));
    if (!area) { audit.unknownHabitatCandidates++; return; }
    const rule = habitatForFeature(area, pack);
    if ((stableHash(cellId + ':density') / 4294967296) > (rule.density ?? 1)) return;
    // Open fields remain open. Small field details belong at a documented edge,
    // never at arbitrary points across cultivated interiors.
    if (rule.edgeOnly && !clusterId && !nearby.some(f => f.kind === 'road' && nearestOnLine(point, f.points)?.distance < 24) && nearestOnLine(point, [...area.points, area.points[0]])?.distance > 16) return;
    const excluded = nearby.some(f => {
      if (denied.has(f.tags?.access) && (within(point, f) || nearestOnLine(point, f.points)?.distance < 3)) return true;
      if (['building', 'hydro', 'aviation'].includes(f.kind) && within(point, f)) return true;
      if (f.kind === 'building' && nearestOnLine(point, [...f.points, f.points[0]])?.distance < 1.2) return true;
      if (['road', 'rail', 'aviation', 'barrier'].includes(f.kind)) {
        const width = f.kind === 'road' ? roadWidth(f.tags) / 2 + 2.5 : f.kind === 'aviation' ? Math.max(18, Number.parseFloat(f.tags.width) || 18) / 2 + 8 : f.kind === 'rail' ? 5 : 2;
        return nearestOnLine(point, f.points)?.distance < width;
      }
      return false;
    });
    if (excluded) { audit.excludedCandidates++; return; }
    const support = tile.grid ? sampleTile(tile, point) : null;
    if (support && (!Number.isFinite(support.height) || support.slope > (rule.maxSlope ?? .85))) { audit.slopeExcluded++; return; }
    const wet = nearby.some(f => f.kind === 'hydro' && nearestOnLine(point, f.points)?.distance < 16), candidates = wet && rule.riparianKinds?.length ? rule.riparianKinds : rule.kinds;
    if (!candidates?.length) return;
    const kind = candidates[stableHash(cellId + ':kind') % candidates.length], scale = .5 + (stableHash(cellId + ':scale') / 4294967296) * .9;
    if (details.length >= maxDetails) { audit.detailLimitDropped++; return; }
    details.push({id: cellId, kind, x, y, scale: Math.round(scale * 1000) / 1000, rotation: stableHash(cellId + ':rotation') / 4294967296 * Math.PI * 2, phase: stableHash(cellId + ':wind') / 4294967296 * Math.PI * 2, heightOffset: 0, habitat: rule.id, sourceId: area.id, owner: tile.id, collision: false, ...(clusterId ? {clusterId} : {}), provenance: {status: 'procedural-decorative', habitat: 'source-derived', sourceId: area.id, pack: pack.id, license: pack.license}});
    if (clusterId) audit.corridorDetails++;
  }
  // At walking height, a small group beside a real path/river is more useful
  // than the same budget dispersed over square kilometres. Anchors follow the
  // complete source line's arc length, so a tile cut cannot restart the pattern.
  const anchors = [], corridorSpacing = pack.corridorSpacing ?? 96, halo = 16;
  if (!Number.isFinite(corridorSpacing) || corridorSpacing < 32) throw Error('Unbounded corridor generation refused');
  for (const f of features) {
    if (!(f.kind === 'road' && !f.tags.tunnel && !denied.has(f.tags.access) || f.kind === 'hydro' && f.polygon)) continue;
    let travelled = 0;
    for (let i = 1; i < f.points.length; i++) {
      signal?.throwIfAborted();
      const a = f.points[i - 1], b = f.points[i], dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy), start = travelled;
      travelled += length;
      if (length < .01 || Math.max(a[0], b[0]) < bounds[0] - halo || Math.min(a[0], b[0]) > bounds[2] + halo || Math.max(a[1], b[1]) < bounds[1] - halo || Math.min(a[1], b[1]) > bounds[3] + halo) continue;
      for (let k = Math.ceil(start / corridorSpacing); k * corridorSpacing < travelled; k++) {
        const t = (k * corridorSpacing - start) / length;
        for (const side of [-1, 1]) {
          const id = `detail/v1/${namespace}/corridor/${f.id}/${k}/${side}`, distance = f.kind === 'road' ? roadWidth(f.tags) / 2 + 5.7 : 5.4, x = a[0] + dx * t + side * dy / length * distance, y = a[1] + dy * t - side * dx / length * distance;
          if (x < bounds[0] - 3.5 || x >= bounds[2] + 3.5 || y < bounds[1] - 3.5 || y >= bounds[3] + 3.5) continue;
          const priority = f.kind === 'hydro' ? 1 : ['path', 'footway', 'track'].includes(f.tags.highway) ? 0 : 2;
          anchors.push({id, x, y, priority, rank: stableHash(id + ':rank')});
        }
      }
    }
  }
  anchors.sort((a, b) => a.priority - b.priority || a.rank - b.rank || a.id.localeCompare(b.id));
  const anchorBudget = Math.max(32, Math.ceil(maxDetails / 12) * 8);
  let evaluated = 0;
  for (const anchor of anchors) {
    if (details.length >= maxDetails || evaluated >= anchorBudget) break;
    evaluated++;
    const before = details.length;
    for (let member = 0; member < 16; member++) {
      const id = anchor.id + '/' + member, angle = stableHash(id + ':angle') / 4294967296 * Math.PI * 2, radius = Math.sqrt(stableHash(id + ':radius') / 4294967296) * 3.2;
      candidate(anchor.x + Math.cos(angle) * radius, anchor.y + Math.sin(angle) * radius, id, anchor.id);
    }
    if (details.length > before) audit.corridorClusters++;
  }
  audit.unprocessedCorridorAnchors = anchors.length - evaluated;
  const minCellX = Math.floor(bounds[0] / spacing), minCellY = Math.floor(bounds[1] / spacing), maxCellX = Math.ceil(bounds[2] / spacing), maxCellY = Math.ceil(bounds[3] / spacing);
  // Candidate jitter is keyed by a fixed metric cell. Neighbour arrival order,
  // profiles and LOD never participate in identity or placement.
  for (let cy = minCellY; cy < maxCellY && details.length < maxDetails; cy++) for (let cx = minCellX; cx < maxCellX && details.length < maxDetails; cx++) {
    signal?.throwIfAborted();
    const cellId = `detail/v1/${options.coordinateNamespace ?? 'declared-metric-frame'}/${spacing}/${cx}/${cy}`, seed = stableHash(cellId), random = stableHash(cellId + ':jitter');
    const x = (cx + .18 + (seed / 4294967296) * .64) * spacing, y = (cy + .18 + (random / 4294967296) * .64) * spacing;
    candidate(x, y, cellId);
  }
  details.sort((a, b) => a.id.localeCompare(b.id));
  for (const d of details) audit.habitats[d.habitat] = (audit.habitats[d.habitat] ?? 0) + 1;
  audit.buildingPlans = buildings.length; audit.detailPlans = details.length;
  if (!buildings.length && !details.length) warnings.push({reason: 'no-enrichment-plans', explanation: 'No eligible mapped habitat/building, or protected/excluded candidates. This is not artistic success.'});
  surface.clear();
  return {schema: ENRICHMENT_VERSION, tileId: tile.id, bounds: [...tile.bounds], pack: structuredClone(pack), coordinateNamespace: options.coordinateNamespace ?? 'declared-metric-frame', buildings, details, audit, warnings};
}
