import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  walkable,
  move,
  inside,
  pathTo,
  distance,
  routeLength,
  SPEED,
  extraExits,
} from "../src/navigation.mjs";
import { occluded } from "../src/occlusion.mjs";
const world = JSON.parse(
  readFileSync(new URL("../public/world.json", import.meta.url)),
);
test("three distinct source-backed scenes join at identical geographic endpoints", () => {
  assert.equal(world.scenes.length, 3);
  for (let i = 0; i < 2; i++)
    assert.deepEqual(
      world.scenes[i].route.at(-1),
      world.scenes[i + 1].route[0],
    );
  assert.deepEqual(
    world.scenes.map((s) => s.routeIds),
    [[58717597, 900319308], [647696691], [647696678]],
  );
  assert.ok(world.scenes[1].roads.some((r) => r.bridge && r.id === 647696691));
  assert.equal(
    new Set(world.scenes.map((s) => JSON.stringify(s.center))).size,
    3,
  );
});
test("entire OSM route, forward and backward, traverses the real collision solver at natural speed", () => {
  let total = 0;
  for (const s of world.scenes)
    for (const r of [s.route, [...s.route].reverse()]) {
      let p = r[0];
      for (const target of r.slice(1)) {
        let count = 0;
        while (distance(p, target) > 0.025) {
          const d = distance(p, target),
            step = Math.min(d, SPEED / 60),
            q = move(s, p, [
              ((target[0] - p[0]) / d) * step,
              ((target[1] - p[1]) / d) * step,
            ]);
          assert.ok(distance(p, q) > 0.00001, "route must not stall");
          assert.ok(distance(p, q) <= SPEED / 60 + 0.00001);
          p = q;
          total += step;
          assert.ok(++count < 10000);
        }
      }
    }
  assert.ok(total > 570 && total < 575);
  assert.ok(total / SPEED > 410);
});
test("water, building interiors and road margins block movement; bridge remains traversable", () => {
  const s = world.scenes[1];
  assert.equal(walkable(s, [5000, 5000]), false);
  let walls = 0,
    water = 0;
  for (const b of s.buildings) {
    const p = b.ring.reduce(
      (a, q) => a.map((v, i) => v + q[i] / b.ring.length),
      [0, 0],
    );
    if (inside(p, b.ring)) {
      assert.equal(walkable(s, p), false);
      walls++;
    }
  }
  for (const ring of s.waters)
    for (const p of ring[0]) {
      const q = [p[0] + 2, p[1] + 2];
      if (
        inside(q, ring[0]) &&
        !s.roads.some((r) => r.bridge && distance(r.points[0], q) < 100)
      )
        if (!walkable(s, q)) water++;
    }
  assert.ok(walls > 10);
  assert.ok(water > 0);
  const bridge = s.roads.find((r) => r.bridge);
  assert.ok(walkable(s, bridge.points[1]));
});
test("click routing uses connected source ways and rejects a disconnected destination", () => {
  for (const s of world.scenes) {
    const p = pathTo(s, s.route[0], s.route.at(-1));
    assert.ok(p.length > 0);
    assert.ok(distance(p.at(-1), s.route.at(-1)) < 0.01);
    assert.deepEqual(pathTo(s, s.route[0], [9000, 9000]), []);
  }
});
test("depth clipping keeps actors behind obstacles, reveals actors in front and handles empty ground", () => {
  const mask = new Uint16Array([30000, 65535]);
  assert.equal(occluded(mask, 2, 1, 0, 0, -1, 0), false);
  assert.equal(occluded(mask, 2, 1, 0, 0, 1, 0), true);
  assert.equal(occluded(mask, 2, 1, 1, 0, -100, 0), false);
  assert.equal(occluded(mask, 2, 1, 5, 0, 0, 0), true);
});
test("walking distances are measured from the route rather than a fixed screen duration", () => {
  const lengths = world.scenes.map((s) => routeLength(s.route));
  assert.ok(lengths.every((x) => x > 80 && x < 110));
  assert.ok(lengths.every((x) => x / SPEED > 58));
  assert.ok(lengths.reduce((a, b) => a + b, 0) > 286);
});

test("secondary gates stay on walkable source geometry, pair exactly and are click reachable", () => {
  for (const s of world.scenes)
    for (const gate of extraExits(s)) {
      assert.ok(walkable(s, gate.point));
      const back = extraExits(world.scenes[gate.to]).find(
        (g) => g.to === s.index,
      );
      assert.deepEqual(back.point, gate.point);
      assert.ok(pathTo(s, s.route[0], gate.point).length > 0);
    }
});
