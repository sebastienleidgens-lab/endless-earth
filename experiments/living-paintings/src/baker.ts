import {
  type Scene,
  type Point,
  WIDTH,
  HEIGHT,
  projector,
  terrain,
  depth,
  surfaceHeight,
} from "./world";
import { inside, nearest } from "./navigation.mjs";
const canvas = () => {
  const c = document.createElement("canvas");
  c.width = WIDTH;
  c.height = HEIGHT;
  return c;
};
const seeded = (seed: number) => () => {
  seed |= 0;
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
async function bake(s: Scene) {
  const c = canvas(),
    ctx = c.getContext("2d")!,
    d = canvas(),
    dc = d.getContext("2d")!,
    water = canvas(),
    wc = water.getContext("2d")!,
    P = projector(s),
    project = P.project,
    rng = seeded(701 + s.index),
    leaves: any[] = [];
  ctx.fillStyle = "#7d8766";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  dc.fillStyle = "#ffff00";
  dc.fillRect(0, 0, WIDTH, HEIGHT);
  const rawDepth = dc.createImageData(WIDTH, HEIGHT);
  for (let k = 0; k < rawDepth.data.length; k += 4) {
    rawDepth.data[k] = rawDepth.data[k + 1] = rawDepth.data[k + 3] = 255;
  }
  const path = (ct: CanvasRenderingContext2D, pts: Point[]) => {
    ct.beginPath();
    pts.forEach((p, i) => (i ? ct.lineTo(...p) : ct.moveTo(...p)));
    ct.closePath();
  };
  function stamp(pts: Point[], dep: number | number[]) {
    const ds = typeof dep === "number" ? pts.map(() => dep) : dep;
    for (let i = 1; i < pts.length - 1; i++) {
      const ps = [pts[0], pts[i], pts[i + 1]],
        vs = [ds[0], ds[i], ds[i + 1]],
        a = ps[0],
        b = ps[1],
        c = ps[2],
        den = (b[1] - c[1]) * (a[0] - c[0]) + (c[0] - b[0]) * (a[1] - c[1]);
      if (Math.abs(den) < 0.001) continue;
      const x0 = Math.max(0, Math.floor(Math.min(...ps.map((p) => p[0])))),
        x1 = Math.min(WIDTH - 1, Math.ceil(Math.max(...ps.map((p) => p[0])))),
        y0 = Math.max(0, Math.floor(Math.min(...ps.map((p) => p[1])))),
        y1 = Math.min(HEIGHT - 1, Math.ceil(Math.max(...ps.map((p) => p[1]))));
      for (let y = y0; y <= y1; y++)
        for (let x = x0; x <= x1; x++) {
          const u =
              ((b[1] - c[1]) * (x - c[0]) + (c[0] - b[0]) * (y - c[1])) / den,
            v = ((c[1] - a[1]) * (x - c[0]) + (a[0] - c[0]) * (y - c[1])) / den,
            w = 1 - u - v;
          if (u < -0.005 || v < -0.005 || w < -0.005) continue;
          const z = u * vs[0] + v * vs[1] + w * vs[2],
            value = Math.max(
              0,
              Math.min(65534, Math.round((z - depth(s.center) + 300) * 100)),
            ),
            k = (y * WIDTH + x) * 4;
          rawDepth.data[k] = value >> 8;
          rawDepth.data[k + 1] = value & 255;
        }
    }
  }
  function poly(pts: Point[], color: string, dep?: number | number[]) {
    path(ctx, pts);
    ctx.fillStyle = color;
    ctx.fill();
    if (dep !== undefined) stamp(pts, dep);
  }

  function line(pts: Point[], color: string, width = 1) {
    ctx.beginPath();
    pts.forEach((p, i) => (i ? ctx.lineTo(...p) : ctx.moveTo(...p)));
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.stroke();
  }
  // Small coloured terrain triangles create a baked, reproducible gouache ground.
  for (let z = s.center[1] - 180; z < s.center[1] + 180; z += 2.5)
    for (let x = s.center[0] - 180; x < s.center[0] + 180; x += 2.5) {
      const q: Point = [x, z],
        p = project(q);
      if (p[0] < -80 || p[0] > WIDTH + 80 || p[1] < -80 || p[1] > HEIGHT + 80)
        continue;
      const patch = s.patches.find((f) => inside(q, f.rings[0]));
      const shade = Math.round(rng() * 5);
      const h = terrain(s, x + 2.5, z) - terrain(s, x, z);
      const base =
        patch?.kind === "wood"
          ? [67, 86, 62]
          : patch?.kind === "scrub"
            ? [104, 111, 72]
            : [137, 143, 99];
      const col = `rgb(${base[0] + shade - h * 1.2},${base[1] + shade - h * 1.2},${base[2] + shade - h * 1.2})`;
      poly(
        [
          p,
          project([x + 2.6, z]),
          project([x + 2.6, z + 2.6]),
          project([x, z + 2.6]),
        ],
        col,
      );
    }
  // Mapped water polygons are kept distinct from navigation, and exported as a mask.
  for (const rings of s.waters) {
    for (const ct of [ctx, wc]) {
      ct.beginPath();
      for (const ring of rings) {
        ring.forEach((p, i) => {
          const q = project(p, 66);
          i ? ct.lineTo(...q) : ct.moveTo(...q);
        });
        ct.closePath();
      }
      ct.fillStyle = ct === wc ? "#ffffff" : "#527b76";
      ct.fill("evenodd");
    }
  }
  for (let i = 0; i < 14000; i++) {
    const x = rng() * WIDTH,
      y = rng() * HEIGHT;
    ctx.fillStyle = rng() < 0.5 ? "#e0d9aa13" : "#253f3214";
    ctx.fillRect(x, y, 1 + rng() * 5, 1 + rng() * 2);
  }
  // Road strips follow every source vertex and the sampled terrain.
  for (const r of s.roads) {
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        n: Point = [
          ((-(b[1] - a[1]) / len) * r.width) / 2,
          (((b[0] - a[0]) / len) * r.width) / 2,
        ];
      const h = (p: Point) => surfaceHeight(s, p);
      const left: Point[] = [a, b].map((p) => [p[0] + n[0], p[1] + n[1]]),
        right: Point[] = [b, a].map((p) => [p[0] - n[0], p[1] - n[1]]);
      const ps = [...left, ...right].map((p) => project(p, h(p)));
      path(wc, ps);
      wc.fillStyle = "#000";
      wc.fill();
      poly(ps, r.bridge ? "#c3b599" : "#b6ad95");
      line([ps[0], ps[1]], "#6c70585c", 2);
      line([ps[2], ps[3]], "#6c70585c", 2);
      for (let t = 0; t < len; t += 0.9) {
        const f = t / len,
          base: Point = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
        const q = project(base, h(base));
        ctx.fillStyle = "#e6d9b533";
        ctx.fillRect(q[0] - 2, q[1], 3 + rng() * 6, 1);
      }
    }
  }
  // Short, seeded brush strokes break up the geometric ground without moving paths.
  for (let i = 0; i < 16000; i++) {
    const p: Point = [
      s.center[0] + (rng() - 0.5) * 220,
      s.center[1] + (rng() - 0.5) * 220,
    ];
    if (
      s.roads.some((r) => nearest(p, r.points).distance < r.width / 2) ||
      s.waters.some((r) => inside(p, r[0]))
    )
      continue;
    const q = project(p);
    if (q[0] < 0 || q[0] > WIDTH || q[1] < 0 || q[1] > HEIGHT) continue;
    line(
      [
        [q[0], q[1]],
        [q[0] + rng() * 7 - 3, q[1] - 2 - rng() * 5],
      ],
      rng() < 0.5 ? "#354e3433" : "#d5c89148",
      0.8 + rng(),
    );
    if (i % 13 === 0) {
      ctx.fillStyle = "#ead9a486";
      ctx.fillRect(q[0], q[1] - 4, 2, 2);
    }
  }
  for (const b of s.buildings) {
    const ring = b.ring.map((p) => project(p)),
      shadow = b.ring.map((p) => project([p[0] + 6, p[1] + 3]));
    poly([...ring, ...shadow.reverse()], "#243d3840");
  }
  const objects: { dep: number; draw: () => void }[] = [];
  // Building footprints are mapped. Heights, roofs, doors and stonework are inferred.
  for (const b of s.buildings) {
    const ring = b.ring.slice(0, -1),
      center = ring.reduce(
        (a, p) =>
          [a[0] + p[0] / ring.length, a[1] + p[1] / ring.length] as Point,
        [0, 0] as Point,
      ),
      h = 4.2 + (b.id % 4) * 0.7,
      base = terrain(s, ...center),
      dep = depth(center);
    const roofCenter = project(center, base + h + 2.8);
    objects.push({
      dep,
      draw: () => {
        for (const i of Array.from({ length: ring.length }, (_, i) => i).sort(
          (i, j) => {
            const mid = (k: number) =>
              depth([
                (ring[k][0] + ring[(k + 1) % ring.length][0]) / 2,
                (ring[k][1] + ring[(k + 1) % ring.length][1]) / 2,
              ]);
            return mid(j) - mid(i);
          },
        )) {
          const a = ring[i],
            b = ring[(i + 1) % ring.length];
          const shade = (i % 3) * 14;
          const bottomA = project(a, base),
            bottomB = project(b, base),
            topA = project(a, base + h),
            topB = project(b, base + h);
          const face = [bottomA, bottomB, topB, topA];
          poly(face, `rgb(${180 + shade},${169 + shade},${142 + shade})`, [
            depth(a),
            depth(b),
            depth(b),
            depth(a),
          ]);
          ctx.save();
          path(ctx, face);
          ctx.clip();
          const minX = Math.min(...face.map((p) => p[0])),
            maxX = Math.max(...face.map((p) => p[0])),
            minY = Math.min(...face.map((p) => p[1])),
            maxY = Math.max(...face.map((p) => p[1]));
          for (let y = minY; y < maxY; y += 5) {
            line(
              [
                [minX, y],
                [maxX, y + 2],
              ],
              "#776c5038",
              0.7,
            );
            for (let x = minX + (Math.floor(y / 5) % 2) * 7; x < maxX; x += 13)
              line(
                [
                  [x, y],
                  [x + 1, y + 5],
                ],
                "#776c502a",
                0.7,
              );
          }
          const len = Math.hypot(a[0] - b[0], a[1] - b[1]);
          for (let j = 1; j < len / 2.8; j++) {
            const f = j / (Math.floor(len / 2.8) + 1),
              p: Point = [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f],
              q = project(p, base + h * 0.63);
            ctx.fillStyle = "#3c4e48";
            ctx.fillRect(q[0] - 3, q[1] - 5, 6, 10);
            ctx.fillStyle = "#789081";
            ctx.fillRect(q[0] - 5, q[1] - 5, 2, 10);
            ctx.fillStyle = "#d8c4a0";
            ctx.fillRect(q[0] - 3, q[1] + 5, 7, 1);
          }
          ctx.restore();
          line([topA, topB], "#514b3e", 1.4);
        }
        for (const i of Array.from({ length: ring.length }, (_, i) => i).sort(
          (i, j) => {
            const mid = (k: number) =>
              depth([
                (ring[k][0] + ring[(k + 1) % ring.length][0]) / 2,
                (ring[k][1] + ring[(k + 1) % ring.length][1]) / 2,
              ]);
            return mid(j) - mid(i);
          },
        )) {
          const a = ring[i],
            b = ring[(i + 1) % ring.length],
            pa = project(a, base + h),
            pb = project(b, base + h);
          poly([pa, pb, roofCenter], i % 2 ? "#6e706a" : "#939080", [
            depth(a),
            depth(b),
            dep,
          ]);
          line([pa, roofCenter], "#c8be9e77", 1);
          ctx.save();
          path(ctx, [pa, pb, roofCenter]);
          ctx.clip();
          for (
            let y = Math.min(pa[1], pb[1], roofCenter[1]);
            y < Math.max(pa[1], pb[1]);
            y += 4
          )
            line(
              [
                [Math.min(pa[0], pb[0], roofCenter[0]), y],
                [Math.max(pa[0], pb[0], roofCenter[0]), y],
              ],
              "#393d392b",
              1,
            );
          ctx.restore();
        }
      },
    });
  }
  // Tree positions are deterministic illustrations inside mapped habitat polygons.
  for (let n = 0; n < 1000; n++) {
    const p: Point = [
      s.center[0] + (rng() - 0.5) * 270,
      s.center[1] + (rng() - 0.5) * 270,
    ];
    if (
      !s.patches.some(
        (f) => ["wood", "scrub"].includes(f.kind) && inside(p, f.rings[0]),
      )
    )
      continue;
    if (
      s.roads.some((r) => nearest(p, r.points).distance < r.width / 2 + 1.6) ||
      s.buildings.some((b) => inside(p, b.ring)) ||
      s.waters.some((r) => inside(p, r[0]))
    )
      continue;
    const base = project(p),
      size = 5 + rng() * 4,
      top = project(p, terrain(s, ...p) + size),
      dep = depth(p),
      seed = Math.round(rng() * 1e8);
    if (
      base[0] < -150 ||
      base[0] > WIDTH + 150 ||
      top[1] > HEIGHT + 150 ||
      base[1] < -50
    )
      continue;
    objects.push({
      dep,
      draw: () => {
        const random = seeded(seed);
        ctx.fillStyle = "#273e382b";
        ctx.beginPath();
        ctx.ellipse(base[0] + 20, base[1] + 3, 38, 12, -0.3, 0, Math.PI * 2);
        ctx.fill();
        poly(
          [
            [base[0] - 2, base[1]],
            [base[0] + 3, base[1]],
            [top[0] + 2, top[1] + 17],
            [top[0] - 2, top[1] + 15],
          ],
          "#655d43",
          dep,
        );
        for (let j = 0; j < 110; j++) {
          const angle = random() * Math.PI * 2,
            r = Math.sqrt(random()),
            x = top[0] + Math.cos(angle) * r * size * 4,
            y = top[1] + 20 + Math.sin(angle) * r * size * 3.4,
            rad = 5 + random() * 12;
          ctx.beginPath();
          ctx.ellipse(x, y, rad, rad * 0.7, 0, 0, Math.PI * 2);
          const light = Math.round(
            random() * 20 - 10 * Math.cos(angle) - 14 * Math.sin(angle),
          );
          ctx.fillStyle = `rgb(${51 + light},${77 + light},${47 + light * 0.6})`;
          ctx.fill();
          stamp(
            Array.from(
              { length: 16 },
              (_, k) =>
                [
                  x + Math.cos((k * Math.PI) / 8) * rad,
                  y + Math.sin((k * Math.PI) / 8) * rad * 0.7,
                ] as Point,
            ),
            dep,
          );
        }
        if (leaves.length < 35)
          leaves.push({
            p: [top[0], top[1] + 20],
            depth: dep,
            r: size * 4,
            seed,
          });
      },
    });
  }
  // Parapets use the verified bridge line; their profile is an interpretation.
  for (const r of s.roads.filter((r) => r.bridge))
    for (let i = 1; i < r.points.length; i++) {
      const a = r.points[i - 1],
        b = r.points[i],
        len = Math.hypot(a[0] - b[0], a[1] - b[1]);
      for (let k = 0; k < len; k += 1) {
        const t = k / len,
          u = Math.min(1, (k + 1) / len),
          n: Point = [
            (-(b[1] - a[1]) / len) * 2.5,
            ((b[0] - a[0]) / len) * 2.5,
          ];
        for (const sign of [-1, 1]) {
          const p: Point = [
              a[0] + (b[0] - a[0]) * t + n[0] * sign,
              a[1] + (b[1] - a[1]) * t + n[1] * sign,
            ],
            q: Point = [
              a[0] + (b[0] - a[0]) * u + n[0] * sign,
              a[1] + (b[1] - a[1]) * u + n[1] * sign,
            ];
          objects.push({
            dep: depth(p),
            draw: () => {
              const ps = [
                project(p, surfaceHeight(s, p) - 0.6),
                project(q, surfaceHeight(s, q) - 0.6),
                project(q, surfaceHeight(s, q) + 0.9),
                project(p, surfaceHeight(s, p) + 0.9),
              ];
              poly(ps, "#a79e82", depth(p));
              line([ps[2], ps[3]], "#e0d4b0", 3);
            },
          });
        }
      }
    }
  objects.sort((a, b) => b.dep - a.dep).forEach((o) => o.draw());
  // Paper grain is baked once. No entire-image animation or runtime scene render.
  for (let i = 0; i < 80000; i++) {
    ctx.fillStyle = i % 2 ? "#fff4cf08" : "#20332d09";
    ctx.fillRect(rng() * WIDTH, rng() * HEIGHT, 1, 1);
  }
  const vignette = ctx.createRadialGradient(
    WIDTH / 2,
    HEIGHT / 2,
    300,
    WIDTH / 2,
    HEIGHT / 2,
    1250,
  );
  vignette.addColorStop(0, "#b8a16b05");
  vignette.addColorStop(1, "#1d302e8a");
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  // Water effects must not paint over bridge decks, walls or canopies.
  const visibleWater = wc.getImageData(0, 0, WIDTH, HEIGHT);
  for (let k = 0; k < rawDepth.data.length; k += 4)
    if (rawDepth.data[k] !== 255 || rawDepth.data[k + 1] !== 255)
      visibleWater.data[k] =
        visibleWater.data[k + 1] =
        visibleWater.data[k + 2] =
          0;
  wc.putImageData(visibleWater, 0, 0);
  dc.putImageData(rawDepth, 0, 0);
  return {
    image: c.toDataURL("image/webp", 0.9),
    depth: d.toDataURL("image/png"),
    water: water.toDataURL("image/png"),
    leaves,
  };
}
(window as any).bakeAll = async () => {
  const world = await (await fetch("./world.json")).json();
  const result = [];
  for (const scene of world.scenes) result.push(await bake(scene));
  return result;
};
