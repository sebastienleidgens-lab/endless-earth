import { readFile, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
const root = new URL("../../../", import.meta.url),
  out = new URL("../public/", import.meta.url);
const read = async (p) => JSON.parse(await readFile(new URL(p, root), "utf8"));
const osm = await read("public/data/angles-osm.geojson"),
  dem = await read("public/data/angles-terrain.json"),
  env = await read("public/data/angles-environment.json");
const origin = [0.8844, 46.6953],
  cos = Math.cos((origin[1] * Math.PI) / 180);
const local = (p) => [
  (p[0] - origin[0]) * 111320 * cos,
  -(p[1] - origin[1]) * 111320,
];
function height(x, z) {
  let i = (x - dem.origin_x_m) / dem.step_m,
    j = (z - dem.origin_z_m) / dem.step_m;
  const a = Math.floor(i),
    b = Math.floor(j);
  i -= a;
  j -= b;
  const get = (dx, dz) => dem.elevations_m[(b + dz) * dem.width + a + dx];
  return (
    get(0, 0) * (1 - i) * (1 - j) +
    get(1, 0) * i * (1 - j) +
    get(0, 1) * (1 - i) * j +
    get(1, 1) * i * j
  );
}
const way = (id) => osm.features.find((f) => f.properties.osm_id === id);
const routeIds = [[58717597, 900319308], [647696691], [647696678]];
const routes = routeIds.map((ids, i) =>
  ids.flatMap((id, n) => {
    const c = way(id).geometry.coordinates;
    return (i === 2 ? [...c].reverse() : c).slice(n ? 1 : 0).map(local);
  }),
);
const titles = [
  "Les ruelles de pierre",
  "Le passage de l’Anglin",
  "Vers Sainte-Croix",
];
const descriptions = [
  "La rue du Pont descend du village vers la rivière.",
  "Le pont relie les deux rives de l’Anglin.",
  "La rue Sainte-Croix s’éloigne du pont, vers le coteau.",
];
const scenes = routes.map((route, index) => {
  const mid = route[Math.floor(route.length / 2)],
    center = [
      (route[0][0] + route.at(-1)[0]) / 2,
      (route[0][1] + route.at(-1)[1]) / 2,
    ];
  const near = (p) => Math.hypot(p[0] - center[0], p[1] - center[1]) < 155;
  const roads = osm.features
    .filter((f) => f.properties.highway && f.geometry.type === "LineString")
    .map((f) => ({
      id: f.properties.osm_id,
      name: f.properties.name ?? "Voie cartographiée",
      bridge: f.properties.bridge === "yes",
      width:
        f.properties.highway === "footway" || f.properties.highway === "steps"
          ? 1.5
          : 5,
      points: f.geometry.coordinates.map(local),
    }))
    .filter((r) => r.points.some(near));
  const buildings = osm.features
    .filter((f) => f.properties.building && f.geometry.type === "Polygon")
    .map((f) => ({
      id: f.properties.osm_id,
      ring: f.geometry.coordinates[0].map(local),
    }))
    .filter((b) => b.ring.some(near));
  const waters = osm.features
    .filter(
      (f) => f.properties.natural === "water" && f.geometry.type === "Polygon",
    )
    .map((f) => f.geometry.coordinates.map((r) => r.map(local)))
    .filter((r) => r[0].some(near));
  const patches = env.features
    .filter(
      (f) =>
        ["wood", "scrub", "grass", "meadow"].includes(f.properties.class) &&
        f.geometry.type === "Polygon",
    )
    .map((f) => ({
      kind: f.properties.class,
      rings: f.geometry.coordinates.map((r) => r.map(local)),
    }))
    .filter((r) => r.rings[0].some(near));
  // A compact, bilinear sample of the existing IGN grid; no source file is modified.
  const terrain = [];
  for (let z = center[1] - 180; z <= center[1] + 180; z += 5) {
    const row = [];
    for (let x = center[0] - 180; x <= center[0] + 180; x += 5)
      row.push(+height(x, z).toFixed(3));
    terrain.push(row);
  }
  return {
    index,
    title: titles[index],
    description: descriptions[index],
    center,
    baseHeight: height(...mid),
    span: 125,
    route,
    routeIds: routeIds[index],
    roads,
    buildings,
    waters,
    patches,
    terrain: {
      x: center[0] - 180,
      z: center[1] - 180,
      step: 5,
      values: terrain,
    },
  };
});
const hashes = {};
for (const p of [
  "angles-osm.geojson",
  "angles-terrain.json",
  "angles-environment.json",
])
  hashes[p] = createHash("sha256")
    .update(await readFile(new URL("public/data/" + p, root)))
    .digest("hex");
await writeFile(
  new URL("world.json", out),
  JSON.stringify({ schema: "lp01-v1", origin, sourceHashes: hashes, scenes }),
);
console.log(
  "Prepared three separate OSM scenes",
  scenes.map((s) => ({
    id: s.index,
    buildings: s.buildings.length,
    water: s.waters.length,
    patches: s.patches.length,
  })),
);
