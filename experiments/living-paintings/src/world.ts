import { OrthographicCamera, Vector3 } from "three";
export type Point = [number, number];
export type Scene = {
  index: number;
  title: string;
  description: string;
  center: Point;
  baseHeight: number;
  span: number;
  route: Point[];
  routeIds: number[];
  roads: {
    id: number;
    name: string;
    bridge: boolean;
    width: number;
    points: Point[];
  }[];
  buildings: { id: number; ring: Point[] }[];
  waters: Point[][][];
  patches: { kind: string; rings: Point[][] }[];
  terrain: { x: number; z: number; step: number; values: number[][] };
};
export const WIDTH = 2048,
  HEIGHT = 1280;
export function terrain(s: Scene, x: number, z: number) {
  const t = s.terrain,
    fx = Math.max(0, Math.min(71.999, (x - t.x) / t.step)),
    fz = Math.max(0, Math.min(71.999, (z - t.z) / t.step)),
    i = Math.floor(fx),
    j = Math.floor(fz),
    u = fx - i,
    v = fz - j;
  return (
    t.values[j][i] * (1 - u) * (1 - v) +
    t.values[j][i + 1] * u * (1 - v) +
    t.values[j + 1][i] * (1 - u) * v +
    t.values[j + 1][i + 1] * u * v
  );
}
export const depth = (p: Point) => 0.76 * p[0] + 0.65 * p[1];
export function projector(s: Scene) {
  const camera = new OrthographicCamera(
    -s.span / 2,
    s.span / 2,
    (s.span * HEIGHT) / WIDTH / 2,
    (-s.span * HEIGHT) / WIDTH / 2,
    0.1,
    2000,
  );
  const target = new Vector3(s.center[0], s.baseHeight, s.center[1]);
  camera.position
    .copy(target)
    .add(new Vector3(-0.76, 0.85, -0.65).multiplyScalar(350));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const project = (p: Point, h = terrain(s, ...p)) => {
    const v = new Vector3(p[0], h, p[1]).project(camera);
    return [((v.x + 1) * WIDTH) / 2, ((1 - v.y) * HEIGHT) / 2] as Point;
  };
  return {
    project,
    camera,
    pixelsPerMetre: WIDTH / s.span,
    unproject: (p: Point, seed: Point = s.center) => {
      let x = seed[0],
        z = seed[1];
      for (let n = 0; n < 8; n++) {
        const a = project([x, z]),
          b = project([x + 0.1, z]),
          c = project([x, z + 0.1]),
          dx = p[0] - a[0],
          dy = p[1] - a[1],
          bx = (b[0] - a[0]) * 10,
          by = (b[1] - a[1]) * 10,
          cx = (c[0] - a[0]) * 10,
          cy = (c[1] - a[1]) * 10,
          det = bx * cy - by * cx;
        if (Math.abs(det) < 0.01) break;
        x += (dx * cy - dy * cx) / det;
        z += (dy * bx - dx * by) / det;
      }
      return [x, z] as Point;
    },
  };
}
export function surfaceHeight(s: Scene, p: Point) {
  for (const road of s.roads.filter((r) => r.bridge)) {
    let best = Infinity,
      at = 0,
      total = 0;
    const lengths = road.points
      .slice(1)
      .map((q, i) =>
        Math.hypot(q[0] - road.points[i][0], q[1] - road.points[i][1]),
      );
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        dx = b[0] - a[0],
        dz = b[1] - a[1],
        t = Math.max(
          0,
          Math.min(
            1,
            ((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / (dx * dx + dz * dz),
          ),
        ),
        d = Math.hypot(p[0] - a[0] - dx * t, p[1] - a[1] - dz * t);
      if (d < best) {
        best = d;
        at = total + lengths[i - 1] * t;
      }
      total += lengths[i - 1];
    }
    if (best <= road.width / 2 + 0.3) {
      const a = terrain(s, ...road.points[0]),
        b = terrain(s, ...road.points.at(-1)!);
      return a + ((b - a) * at) / total + 0.12;
    }
  }
  return terrain(s, ...p) + 0.12;
}

// Picking projected source roads avoids ambiguous inverse terrain intersections
// on steep slopes. The image itself never supplies navigation geometry.
export function pickRoad(s: Scene, click: Point): Point | undefined {
  const P = projector(s);
  let best = 45,
    selected: Point | undefined;
  for (const road of s.roads)
    for (let i = 1; i < road.points.length; i++) {
      const a = road.points[i - 1],
        b = road.points[i],
        steps = Math.max(
          1,
          Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2),
        );
      for (let j = 0; j <= steps; j++) {
        const t = j / steps,
          p: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
          q = P.project(p, surfaceHeight(s, p)),
          d = Math.hypot(q[0] - click[0], q[1] - click[1]);
        if (d < best) {
          best = d;
          selected = p;
        }
      }
    }
  return selected;
}
