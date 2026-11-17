import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {buildArchitecture, architectureTriangles} from '../src/enrichment/architecture.mjs';
import {generateEnrichment} from '../src/enrichment/generator.mjs';
import {inside, nearestOnLine, roadWidth, PlanetSurface} from '../src/planet/surface.mjs';

const pack = JSON.parse(readFileSync(new URL('../public/enrichment/packs/vienne.json', import.meta.url)));
const mountain = JSON.parse(readFileSync(new URL('../public/enrichment/packs/mountain-fixture.json', import.meta.url)));
const tropical = JSON.parse(readFileSync(new URL('../public/enrichment/packs/tropical-fixture.json', import.meta.url)));
const closed = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]];
const building = (extra = {}) => ({id: 'osm:way:house-1', kind: 'building', polygon: true, points: closed(20, 20, 32, 28), tags: {building: 'house'}, ...extra});
const land = (tags = {landuse: 'forest'}) => ({id: 'osm:way:habitat', kind: 'landcover', polygon: true, points: closed(-20, -20, 1044, 1044), tags});
const tile = (features = [land(), building()], bounds = [0, 0, 1024, 1024], id = '0:0') => ({id, bounds, features, grid: {size: 2, heights: [0, 0, 0, 0], datum: 'test-relative'}});
const options = {coordinateNamespace: 'synthetic-test-metric-frame', spacing: 64, maxDetails: 512};
const xyArea = ({a, b, c}) => Math.abs((b.x - a.x) * (c.z - a.z) - (b.z - a.z) * (c.x - a.x)) / 2;

test('enrichment repeats exactly without mutating the source, independent of feature arrival order or render profile', () => {
  const source = tile(), before = JSON.stringify(source), first = generateEnrichment(source, pack, options);
  assert.deepEqual(first, generateEnrichment(source, pack, {...options, profile: 'eco'}));
  assert.deepEqual(first, generateEnrichment({...source, features: [...source.features].reverse()}, pack, options));
  assert.equal(JSON.stringify(source), before);
  assert.equal(first.audit.renderVerified, false);
  assert.ok(first.details.length > 0);
  assert.equal(first.buildings[0].worldObjectId, 'architecture/v1/osm:way:house-1');
});

test('same local metric coordinates in different declared frames cannot share decorative identity', () => {
  const a = generateEnrichment(tile(), pack, options), b = generateEnrichment(tile(), pack, {...options, coordinateNamespace: 'another-tangent-origin'});
  const ids = new Set(a.details.map(d => d.id));
  assert.ok(b.details.every(d => !ids.has(d.id)));
});

test('ordinary closed buildings gain windows, shutters, cornices and a roof without opening a door or moving their footprint', () => {
  const source = building(), plan = buildArchitecture(source, pack), triangles = [...architectureTriangles(source, plan)];
  assert.equal(plan.roof.type, 'gabled');
  assert.ok(triangles.some(t => t.part === 'window'));
  assert.ok(triangles.some(t => t.part === 'door'));
  assert.ok(triangles.some(t => t.part === 'roof'));
  assert.ok(triangles.every(t => Object.values(t).filter(v => typeof v === 'object').every(v => Number.isFinite(v.x) && Number.isFinite(v.y) && Number.isFinite(v.z))));
  const walls = triangles.filter(t => t.part === 'wall');
  assert.equal(walls.length, 8);
  assert.deepEqual(new Set(walls.flatMap(t => [t.a, t.b, t.c]).map(v => v.x + ',' + v.z)), new Set(source.points.map(v => v.join(','))));
  assert.equal(plan.provenance.facade, 'procedural-decorative');
  assert.ok([...architectureTriangles(source, plan, {facades: false})].every(t => ['wall', 'roof', 'gable'].includes(t.part)));
});

test('documented total height and unsupported roofs/landmarks are not silently converted into fictional faithful models', () => {
  const source = building({tags: {building: 'house', height: '9', 'roof:height': '2', 'roof:shape': 'gabled'}}), plan = buildArchitecture(source, pack);
  assert.equal(plan.totalHeight, 9);
  assert.equal(Math.max(...[...architectureTriangles(source, plan)].flatMap(t => [t.a.y, t.b.y, t.c.y])), 9);
  for (const roofShape of ['dome', 'skillion', 'mansard']) {
    const p = buildArchitecture(building({tags: {building: 'house', 'roof:shape': roofShape}}), pack);
    assert.equal(p.roof.type, 'flat'); assert.equal(p.provenance.roof, 'unverified'); assert.ok(p.warnings.length);
  }
  const monument = buildArchitecture(building({tags: {building: 'church', historic: 'church'}}), pack);
  assert.equal(monument.status, 'unverified');
  assert.ok(monument.warnings.some(w => w.includes('not an authentic reconstruction')));
});

test('flat fallback closes concave footprints and courtyard holes without covering the courtyard', () => {
  const courtyard = building({points: closed(0, 0, 20, 20), holes: [closed(5, 5, 15, 15)], tags: {building: 'apartments'}}), plan = buildArchitecture(courtyard, pack), roof = [...architectureTriangles(courtyard, plan)].filter(t => t.part === 'roof');
  assert.equal(plan.roof.type, 'flat');
  assert.ok(Math.abs(roof.reduce((n, t) => n + xyArea(t), 0) - 300) < 1e-9);
  for (const t of roof) assert.equal(inside({x: (t.a.x + t.b.x + t.c.x) / 3, y: (t.a.z + t.b.z + t.c.z) / 3}, courtyard.holes[0]), false);
  const concave = building({points: [[0, 0], [20, 0], [20, 8], [8, 8], [8, 20], [0, 20], [0, 0]]});
  const concaveRoof = [...architectureTriangles(concave, buildArchitecture(concave, pack))].filter(t => t.part === 'roof');
  assert.ok(Math.abs(concaveRoof.reduce((n, t) => n + xyArea(t), 0) - 256) < 1e-9);
});

test('each small corridor-cluster member respects roads, buildings, water, rails and denied access', () => {
  const road = {id: 'road', kind: 'road', polygon: false, points: [[0, 500], [1024, 500]], tags: {highway: 'path', width: '3'}},
    water = {id: 'water', kind: 'hydro', polygon: true, points: closed(400, 0, 480, 1024), tags: {water: 'river'}},
    privateArea = {id: 'private', kind: 'landcover', polygon: true, points: closed(0, 0, 180, 1024), tags: {landuse: 'forest', access: 'private'}},
    rail = {id: 'rail', kind: 'rail', points: [[700, 0], [700, 1024]], tags: {railway: 'rail'}};
  const result = generateEnrichment(tile([land(), building(), road, water, privateArea, rail]), pack, options);
  const clusters = result.details.filter(d => d.clusterId);
  assert.ok(clusters.length > 100);
  assert.ok(result.audit.corridorClusters > 0);
  for (const d of result.details) {
    const p = {x: d.x, y: d.y};
    assert.equal(inside(p, water.points), false); assert.equal(inside(p, privateArea.points), false); assert.equal(inside(p, building().points), false);
    assert.ok(nearestOnLine(p, road.points).distance >= roadWidth(road.tags) / 2 + 2.5);
    assert.ok(nearestOnLine(p, rail.points).distance >= 5);
    assert.equal(d.collision, false); assert.equal(d.provenance.status, 'procedural-decorative');
  }
  const groups = Object.groupBy ? Object.groupBy(clusters, d => d.clusterId) : clusters.reduce((g, d) => ((g[d.clusterId] ??= []).push(d), g), {});
  assert.ok(Object.values(groups).some(g => g.length >= 10));
  for (const group of Object.values(groups)) for (const a of group) for (const b of group) assert.ok(Math.hypot(a.x - b.x, a.y - b.y) <= 6.400001);
});

test('protected pilot receives neither building plans nor clustered/background detail', () => {
  const protectedBounds = [0, 0, 1024, 1024], result = generateEnrichment(tile(), pack, {...options, protectedBounds});
  assert.equal(result.details.length, 0); assert.equal(result.buildings.length, 0);
  assert.equal(result.audit.protectedBuildings, 1);
  assert.ok(result.audit.protectedDetails > 0);
  assert.ok(result.warnings.some(w => w.reason === 'no-enrichment-plans'));
});

test('half-open detail ownership stays unique across adjacent tile edges', () => {
  const source = [land()], a = generateEnrichment(tile(source, [0, 0, 512, 1024], 'a'), pack, {...options, maxDetails: 10000}), b = generateEnrichment(tile(source, [512, 0, 1024, 1024], 'b'), pack, {...options, maxDetails: 10000}), whole = generateEnrichment(tile(source), pack, {...options, maxDetails: 10000});
  const left = new Set(a.details.map(d => d.id));
  assert.ok(b.details.every(d => !left.has(d.id)));
  assert.deepEqual([...a.details, ...b.details].map(d => d.id).sort(), whole.details.map(d => d.id).sort());
  assert.ok(a.details.every(d => d.x < 512 && d.owner === 'a')); assert.ok(b.details.every(d => d.x >= 512 && d.owner === 'b'));
});

test('a source-bound cluster crossing a tile edge keeps the same members and one owner per member', () => {
  const road = {id: 'border-path', kind: 'road', points: [[505, 0], [505, 1024]], tags: {highway: 'path', width: '3'}}, source = [land(), road], unbounded = {...options, maxDetails: 10000};
  const a = generateEnrichment(tile(source, [0, 0, 512, 1024], 'a'), pack, unbounded), b = generateEnrichment(tile(source, [512, 0, 1024, 1024], 'b'), pack, unbounded), whole = generateEnrichment(tile(source), pack, unbounded);
  assert.ok(a.details.some(d => d.clusterId)); assert.ok(b.details.some(d => d.clusterId));
  const left = new Set(a.details.map(d => d.id));
  assert.ok(b.details.every(d => !left.has(d.id)));
  assert.deepEqual([...a.details, ...b.details].map(d => d.id).sort(), whole.details.map(d => d.id).sort());
});

test('same generator accepts declared mountain/tropical packs without French business logic', () => {
  const a = generateEnrichment(tile(), mountain, options), b = generateEnrichment(tile(), tropical, options);
  assert.equal(a.pack.fixture, true); assert.equal(b.pack.fixture, true);
  assert.ok(a.details.every(d => d.habitat.startsWith('alpine')));
  assert.ok(b.details.every(d => d.habitat.startsWith('tropical')));
  assert.notDeepEqual(a.buildings[0].palette, b.buildings[0].palette);
  assert.equal(a.buildings[0].worldObjectId, b.buildings[0].worldObjectId);
  assert.equal(a.audit.renderVerified, false);
});

test('decorative plans do not change the shared physical access answers', () => {
  const source = tile(), surface = new PlanetSurface({tileSize: 1024, accessDefaults: {}}); surface.add(source);
  const before = [[25, 25], [100, 100], [900, 900]].map(([x, y]) => surface.admission({x, y}));
  generateEnrichment(source, pack, options);
  assert.deepEqual([[25, 25], [100, 100], [900, 900]].map(([x, y]) => surface.admission({x, y})), before);
  assert.equal(before[0].reason, 'mapped-obstacle'); assert.equal(before[1].ok, false);
});

test('invalid/unbounded inputs fail explicitly and an aborted generation produces no success artifact', () => {
  assert.throws(() => generateEnrichment(tile(), pack, {...options, spacing: 0}), /Unbounded/);
  assert.throws(() => generateEnrichment(tile(), pack, {...options, maxDetails: 10001}), /Unbounded/);
  assert.throws(() => generateEnrichment(tile(), {}, options), /Invalid regional/);
  const abort = new AbortController(); abort.abort();
  assert.throws(() => generateEnrichment(tile(), pack, {...options, signal: abort.signal}), {name: 'AbortError'});
});
