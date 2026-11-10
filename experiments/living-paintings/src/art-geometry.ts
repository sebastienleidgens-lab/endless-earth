import * as T from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import {
  type Scene,
  type Point,
  terrain,
  surfaceHeight,
  projector,
  depth,
} from "./world";
import { inside, nearest } from "./navigation.mjs";
import { rngFor, canvasTexture } from "./art-materials";
export type Palette = Record<string, T.MeshStandardMaterial>;
const up = new T.Vector3(0, 1, 0);
function mesh(parent: T.Object3D, g: T.BufferGeometry, m: T.Material) {
  const a = new T.Mesh(g, m);
  a.castShadow = true;
  a.receiveShadow = true;
  parent.add(a);
  return a;
}
function box(
  parent: T.Object3D,
  m: T.Material,
  p: T.Vector3,
  size: [number, number, number],
  angle = 0,
) {
  const a = mesh(parent, new T.BoxGeometry(...size), m);
  a.position.copy(p);
  a.rotation.y = angle;
  return a;
}
function branch(
  parent: T.Object3D,
  m: T.Material,
  a: T.Vector3,
  b: T.Vector3,
  r0: number,
  r1: number,
) {
  const d = new T.Vector3().subVectors(b, a),
    x = mesh(parent, new T.CylinderGeometry(r1, r0, d.length(), 7), m);
  x.position.copy(a).add(b).multiplyScalar(0.5);
  x.quaternion.setFromUnitVectors(up, d.normalize());
  return x;
}
function polygon(
  parent: T.Object3D,
  points: T.Vector3[],
  m: T.Material,
  uv: (p: T.Vector3) => [number, number],
) {
  const vertices: number[] = [],
    tex: number[] = [],
    indices = T.ShapeUtils.triangulateShape(
      points.map((p) => new T.Vector2(p.x, p.z)),
      [],
    );
  for (const tri of indices)
    for (const k of tri) {
      const p = points[k];
      vertices.push(p.x, p.y, p.z);
      tex.push(...uv(p));
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(vertices, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(tex, 2));
  g.computeVertexNormals();
  return mesh(parent, g, m);
}
function clip(ring: Point[], value: (p: Point) => number, positive: boolean) {
  const out: Point[] = [];
  for (let i = 0; i < ring.length; i++) {
    const a = ring[i],
      b = ring[(i + 1) % ring.length],
      v = value(a),
      w = value(b),
      ia = positive ? v >= 0 : v <= 0,
      ib = positive ? w >= 0 : w <= 0;
    if (ia) out.push(a);
    if (ia !== ib) {
      const t = v / (v - w);
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
  }
  return out;
}
function face(
  parent: T.Object3D,
  points: T.Vector3[],
  material: T.Material,
  uvs: number[],
) {
  const order = [0, 1, 2, 0, 2, 3],
    pos: number[] = [],
    uv: number[] = [];
  for (const i of order) {
    pos.push(...points[i].toArray());
    uv.push(uvs[i * 2], uvs[i * 2 + 1]);
  }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2));
  g.computeVertexNormals();
  return mesh(parent, g, material);
}
function terrainMesh(s: Scene, p: Palette, scene: T.Scene) {
  const extent = 155,
    step = 1.8,
    origin = [s.center[0] - extent, s.center[1] - extent],
    count = Math.floor((extent * 2) / step) + 1,
    positions: number[] = [],
    uvs: number[] = [],
    indices: number[] = [],
    colors: number[] = [];
  const groundMap = canvasTexture(
    512,
    (c, r) => {
      c.fillStyle = "#858971";
      c.fillRect(0, 0, 512, 512);
      for (const patch of s.patches) {
        c.fillStyle =
          patch.kind === "wood"
            ? "#505f44"
            : patch.kind === "scrub"
              ? "#777a54"
              : "#a6a578";
        c.beginPath();
        for (const ring of patch.rings) {
          ring.forEach((q, k) => {
            const x = ((q[0] - origin[0]) / (extent * 2)) * 512,
              y = ((q[1] - origin[1]) / (extent * 2)) * 512;
            k ? c.lineTo(x, y) : c.moveTo(x, y);
          });
          c.closePath();
        }
        c.fill("evenodd");
      }
      for (let i = 0; i < 100000; i++) {
        c.fillStyle = r() < 0.5 ? "#e6d9a713" : "#283b2517";
        c.fillRect(r() * 512, r() * 512, 0.4 + r() * 2, 0.4 + r() * 2);
      }
    },
    186,
  );
  groundMap.wrapS = groundMap.wrapT = T.ClampToEdgeWrapping;
  const material = new T.MeshStandardMaterial({
    map: p.grass.map,
    normalMap: p.grass.normalMap,
    normalScale: new T.Vector2(0.3, 0.3),
    color: "#c9c3b3",
    roughness: 1,
  });
  material.onBeforeCompile = (shader) => {
    shader.uniforms.classMap = { value: groundMap };
    shader.uniforms.forestMap = { value: p.forest.map };
    shader.uniforms.tileOrigin = { value: new T.Vector2(...origin) };
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vGround;")
      .replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nvGround=position;",
      );
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        "#include <common>\nvarying vec3 vGround; uniform sampler2D classMap,forestMap;uniform vec2 tileOrigin;",
      )
      .replace(
        "#include <map_fragment>",
        "#include <map_fragment>\nfloat woodland=1.-smoothstep(.12,.23,texture2D(classMap,(vGround.xz-tileOrigin)/310.).g);vec3 litter=texture2D(forestMap,vGround.xz/4.5).rgb;diffuseColor.rgb=mix(diffuseColor.rgb,litter*.70,woodland*.85);",
      );
  };
  for (let j = 0; j < count; j++)
    for (let i = 0; i < count; i++) {
      const x = origin[0] + i * step,
        z = origin[1] + j * step;
      positions.push(x, terrain(s, x, z), z);
      uvs.push(x / 4.5, z / 4.5);
      if (i < count - 1 && j < count - 1) {
        const a = j * count + i;
        indices.push(a, a + count, a + 1, a + 1, a + count, a + count + 1);
      }
    }
  const g = new T.BufferGeometry();
  g.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  g.setIndex(indices);
  g.computeVertexNormals();
  mesh(scene, g, material).castShadow = false;
}
export function buildWorld(s: Scene, p: Palette) {
  const scene = new T.Scene(),
    leaves: any[] = [],
    P = projector(s);
  scene.background = new T.Color("#b8c3ae");
  const glass = new T.MeshStandardMaterial({
      color: "#172626",
      roughness: 0.32,
    }),
    shutters = ["#71877e", "#5d6b77"].map((color) => {
      const m = p.wood.clone();
      m.color.set(color);
      return m;
    });
  scene.add(new T.HemisphereLight("#dce8db", "#4d4935", 1.25));
  const sun = new T.DirectionalLight("#ffe1af", 3.15);
  sun.position.set(s.center[0] - 85, s.baseHeight + 95, s.center[1] - 70);
  sun.target.position.set(s.center[0], s.baseHeight, s.center[1]);
  sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096);
  Object.assign(sun.shadow.camera, {
    left: -125,
    right: 125,
    top: 125,
    bottom: -125,
    near: 1,
    far: 360,
  });
  sun.shadow.camera.updateProjectionMatrix();
  sun.shadow.bias = -0.00015;
  sun.shadow.normalBias = 0.045;
  sun.shadow.radius = 3;
  scene.add(sun, sun.target);
  terrainMesh(s, p, scene);
  for (const rings of s.waters) {
    const outer = new T.Shape(rings[0].map((q) => new T.Vector2(q[0], -q[1])));
    for (const hole of rings.slice(1))
      outer.holes.push(new T.Path(hole.map((q) => new T.Vector2(q[0], -q[1]))));
    const g = new T.ShapeGeometry(outer);
    g.rotateX(-Math.PI / 2);
    const pos = g.getAttribute("position"),
      uv = g.getAttribute("uv");
    for (let k = 0; k < pos.count; k++)
      uv.setXY(k, pos.getX(k) / 30, pos.getZ(k) / 30);
    const water = mesh(scene, g, p.water);
    water.position.y = 66;
    water.castShadow = false;
    water.userData.water = true;
  }
  // Surfaces remain exactly on the imported road centre lines.
  for (const r of s.roads) {
    for (let k = 1; k < r.points.length; k++) {
      const a = r.points[k - 1],
        b = r.points[k],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 0.05) continue;
      const count = Math.ceil(len / 1.8),
        nx = ((-(b[1] - a[1]) / len) * r.width) / 2,
        nz = (((b[0] - a[0]) / len) * r.width) / 2;
      for (let j = 0; j < count; j++) {
        const u = j / count,
          v = (j + 1) / count,
          corners: Point[] = [
            [a[0] + (b[0] - a[0]) * u + nx, a[1] + (b[1] - a[1]) * u + nz],
            [a[0] + (b[0] - a[0]) * v + nx, a[1] + (b[1] - a[1]) * v + nz],
            [a[0] + (b[0] - a[0]) * v - nx, a[1] + (b[1] - a[1]) * v - nz],
            [a[0] + (b[0] - a[0]) * u - nx, a[1] + (b[1] - a[1]) * u - nz],
          ];
        const points = corners.map(
          (q) => new T.Vector3(q[0], surfaceHeight(s, q) + 0.035, q[1]),
        );
        face(scene, points, p.cobble, [
          0,
          (j * len) / count / 3,
          0,
          ((j + 1) * len) / count / 3,
          r.width / 3,
          ((j + 1) * len) / count / 3,
          r.width / 3,
          (j * len) / count / 3,
        ]).castShadow = false;
      }
    }
  }
  for (const b of s.buildings) {
    const ring = b.ring.slice(0, -1);
    if (ring.length < 3) continue;
    const center = ring.reduce(
        (a, q) =>
          [a[0] + q[0] / ring.length, a[1] + q[1] / ring.length] as Point,
        [0, 0] as Point,
      ),
      random = rngFor(b.id),
      group = new T.Group();
    scene.add(group);
    let longest = 0,
      axis: Point = [1, 0];
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        q = ring[(i + 1) % ring.length],
        l = Math.hypot(a[0] - q[0], a[1] - q[1]);
      if (l > longest) {
        longest = l;
        axis = [(q[0] - a[0]) / l, (q[1] - a[1]) / l];
      }
    }
    const side: Point = [-axis[1], axis[0]],
      u = (q: Point) =>
        (q[0] - center[0]) * axis[0] + (q[1] - center[1]) * axis[1],
      v = (q: Point) =>
        (q[0] - center[0]) * side[0] + (q[1] - center[1]) * side[1],
      vs = ring.map(v),
      minV = Math.min(...vs),
      maxV = Math.max(...vs),
      midV = (minV + maxV) / 2,
      half = Math.max(0.3, (maxV - minV) / 2),
      base = Math.min(...ring.map((q) => terrain(s, ...q))),
      eave =
        Math.max(...ring.map((q) => terrain(s, ...q))) +
        3.9 +
        (b.id % 4) * 0.55,
      rise = Math.min(3.6, half * 0.65),
      roofY = (q: Point) =>
        eave + rise * Math.max(0, 1 - Math.abs(v(q) - midV) / half),
      wall = random() < 0.42 ? p.stone : p.plaster,
      roof = random() < 0.72 ? p.clay : p.slate;
    // Mapped perimeter, two sloping roof planes. No invented landmark volumes.
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        q = ring[(i + 1) % ring.length],
        dx = q[0] - a[0],
        dz = q[1] - a[1],
        length = Math.hypot(dx, dz);
      if (length < 0.1) continue;
      const ab = terrain(s, ...a) - 0.1,
        qb = terrain(s, ...q) - 0.1;
      const va = v(a) - midV,
        vb = v(q) - midV,
        split: Point[] = [a];
      if (va * vb < 0) {
        const t = va / (va - vb);
        split.push([a[0] + dx * t, a[1] + dz * t]);
      }
      split.push(q);
      for (let part = 1; part < split.length; part++) {
        const aa = split[part - 1],
          bb = split[part],
          ay = terrain(s, ...aa) - 0.1,
          by = terrain(s, ...bb) - 0.1,
          u0 = Math.hypot(aa[0] - a[0], aa[1] - a[1]) / 3.8,
          u1 = Math.hypot(bb[0] - a[0], bb[1] - a[1]) / 3.8;
        face(
          group,
          [
            new T.Vector3(aa[0], ay, aa[1]),
            new T.Vector3(bb[0], by, bb[1]),
            new T.Vector3(bb[0], roofY(bb), bb[1]),
            new T.Vector3(aa[0], roofY(aa), aa[1]),
          ],
          wall,
          [
            u0,
            0,
            u1,
            0,
            u1,
            (roofY(bb) - by) / 3.8,
            u0,
            (roofY(aa) - ay) / 3.8,
          ],
        );
      }
      let nx = dz / length,
        nz = -dx / length;
      const edgeCenter: Point = [(a[0] + q[0]) / 2, (a[1] + q[1]) / 2];
      if (
        nx * (edgeCenter[0] - center[0]) + nz * (edgeCenter[1] - center[1]) <
        0
      ) {
        nx = -nx;
        nz = -nz;
      }
      const angle = -Math.atan2(dz, dx),
        windows = Math.floor(length / 2.8);
      for (let row = 0; row < (eave - base > 5.2 ? 2 : 1); row++)
        for (let n = 1; n <= windows; n++) {
          const t = n / (windows + 1),
            x = a[0] + dx * t,
            z = a[1] + dz * t,
            y = base + 1.5 + row * 2.25;
          if (y + 1 > roofY([x, z]) - 0.25) continue;
          const at = (o: number, yy = y) =>
            new T.Vector3(x + nx * o, yy, z + nz * o);
          box(group, glass, at(0.035), [0.74, 1.08, 0.075], angle);
          const trim = p.stone;
          box(group, trim, at(0.08, y + 0.59), [0.97, 0.15, 0.18], angle);
          box(group, trim, at(0.12, y - 0.6), [1, 0.17, 0.34], angle);
          box(group, p.wood, at(0.1), [0.045, 1.06, 0.08], angle);
          box(group, p.wood, at(0.11), [0.72, 0.045, 0.08], angle);
          if ((b.id + i + n) % 3 !== 0) {
            const shutter = shutters[(b.id + n) % 2];
            for (const sign of [-1, 1]) {
              const atSide = at(0.1).add(
                new T.Vector3(
                  (dx / length) * sign * 0.58,
                  0,
                  (dz / length) * sign * 0.58,
                ),
              );
              box(group, shutter, atSide, [0.31, 1.12, 0.09], angle);
            }
          }
        }
      if (length > 4 && (b.id + i) % 3 === 0) {
        const t = 0.35,
          x = a[0] + dx * t,
          z = a[1] + dz * t,
          y = terrain(s, x, z);
        box(
          group,
          p.wood,
          new T.Vector3(x + nx * 0.04, y + 1.04, z + nz * 0.04),
          [0.98, 2.08, 0.1],
          angle,
        );
        box(
          group,
          p.stone,
          new T.Vector3(x + nx * 0.11, y + 0.08, z + nz * 0.11),
          [1.22, 0.16, 0.55],
          angle,
        );
        box(
          group,
          p.stone,
          new T.Vector3(x + nx * 0.07, y + 2.16, z + nz * 0.07),
          [1.21, 0.17, 0.2],
          angle,
        );
      }
    }
    for (const positive of [false, true]) {
      const section = clip(ring, (q) => v(q) - midV, positive);
      if (section.length >= 3)
        polygon(
          group,
          section.map((q) => new T.Vector3(q[0], roofY(q) + 0.045, q[1])),
          roof,
          (q) => [u([q.x, q.z]) / 3.3, (v([q.x, q.z]) - minV) / 3.3],
        );
    }
    // Sparse ivy and limestone corner courses give the inferred facades scale.
    for (let corner = 0; corner < ring.length; corner++) {
      const q = ring[corner],
        baseY = terrain(s, ...q);
      if ((b.id + corner) % 2 === 0)
        for (let y = baseY + 0.25; y < eave - 0.15; y += 0.48) {
          const size = 0.32 + (Math.floor(y * 2) % 2) * 0.1;
          box(group, p.limestone, new T.Vector3(q[0], y, q[1]), [
            size,
            0.38,
            size,
          ]);
        }
    }
    if (b.id % 5 === 0) {
      const a = ring[0],
        q = ring[1],
        dx = q[0] - a[0],
        dz = q[1] - a[1],
        len = Math.hypot(dx, dz);
      if (len > 3) {
        let nx = dz / len,
          nz = -dx / len;
        if (
          nx * ((a[0] + q[0]) / 2 - center[0]) +
            nz * ((a[1] + q[1]) / 2 - center[1]) <
          0
        ) {
          nx = -nx;
          nz = -nz;
        }
        const ivy = new T.InstancedMesh(new T.PlaneGeometry(1, 1), p.leaf, 70),
          d = new T.Object3D();
        for (let n = 0; n < 70; n++) {
          const y = random() * Math.min(4, eave - base - 0.6),
            t = 0.16 + y * 0.035 + (random() - 0.5) * 0.19,
            x = a[0] + dx * t + nx * 0.12,
            z = a[1] + dz * t + nz * 0.12;
          d.position.set(x, terrain(s, x, z) + y, z);
          d.quaternion.setFromUnitVectors(
            new T.Vector3(0, 0, 1),
            new T.Vector3(nx, 0, nz),
          );
          d.rotateZ((random() - 0.5) * 2);
          d.scale.setScalar(0.22 + random() * 0.36);
          d.updateMatrix();
          ivy.setMatrixAt(n, d.matrix);
          ivy.setColorAt(n, new T.Color("#7b8959"));
        }
        ivy.castShadow = true;
        ivy.receiveShadow = true;
        group.add(ivy);
      }
    }
    // Chimneys and ridge caps are regional reconstruction, not surveyed details.
    const us = ring.map(u),
      minU = Math.min(...us),
      maxU = Math.max(...us);
    if (longest > 4 && inside(center, ring)) {
      const chimney = new T.Vector3(
        center[0] + axis[0] * (maxU - minU) * 0.15,
        roofY(center) + 0.4,
        center[1] + axis[1] * (maxU - minU) * 0.15,
      );
      box(group, p.stone, chimney, [0.65, 1.5, 0.7]);
      box(
        group,
        p.stone,
        chimney.clone().add(new T.Vector3(0, 0.78, 0)),
        [0.8, 0.14, 0.83],
      );
    }
    // Fine roof coping follows the real eave outline.
    for (let i = 0; i < ring.length; i++) {
      const a = ring[i],
        q = ring[(i + 1) % ring.length];
      branch(
        group,
        p.wood,
        new T.Vector3(a[0], roofY(a) + 0.04, a[1]),
        new T.Vector3(q[0], roofY(q) + 0.04, q[1]),
        0.045,
        0.045,
      );
    }
  }
  // Arched support is an explicitly inferred profile of the existing mapped bridge.
  for (const road of s.roads.filter((r) => r.bridge))
    for (let k = 1; k < road.points.length; k++) {
      const a = road.points[k - 1],
        b = road.points[k],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]);
      if (len < 12) continue;
      const h0 = surfaceHeight(s, a) - 0.1,
        h1 = surfaceHeight(s, b) - 0.1,
        shape = new T.Shape();
      shape.moveTo(0, 65.55);
      shape.lineTo(len, 65.55);
      shape.lineTo(len, h1);
      shape.lineTo(0, h0);
      shape.closePath();
      const arches = Math.max(1, Math.round(len / 11.8)),
        span = len / arches;
      for (let i = 0; i < arches; i++) {
        const left = i * span + span * 0.11,
          right = (i + 1) * span - span * 0.11,
          mid = (left + right) / 2,
          spring = 66.55,
          rise = Math.min(2.15, (Math.min(h0, h1) - spring) * 0.72),
          hole = new T.Path();
        hole.moveTo(left, 65.7);
        hole.lineTo(left, spring);
        for (let n = 0; n <= 24; n++) {
          const theta = Math.PI - (n / 24) * Math.PI;
          hole.lineTo(
            mid + (Math.cos(theta) * (right - left)) / 2,
            spring + Math.sin(theta) * rise,
          );
        }
        hole.lineTo(right, 65.7);
        hole.closePath();
        shape.holes.push(hole);
      }
      const g = new T.ExtrudeGeometry(shape, {
        depth: 5,
        bevelEnabled: false,
        curveSegments: 16,
      });
      g.translate(0, 0, -2.5);
      const uv = g.getAttribute("uv");
      for (let i = 0; i < uv.count; i++)
        uv.setXY(i, uv.getX(i) / 3.8, uv.getY(i) / 3.8);
      const support = mesh(scene, g, p.limestone);
      support.position.set(a[0], 0, a[1]);
      support.rotation.y = -Math.atan2(b[1] - a[1], b[0] - a[0]);
    }
  // Bridge parapets use the mapped span; the modest stone profile is illustrative.
  for (const road of s.roads.filter((r) => r.bridge))
    for (let k = 1; k < road.points.length; k++) {
      const a = road.points[k - 1],
        b = road.points[k],
        len = Math.hypot(b[0] - a[0], b[1] - a[1]),
        count = Math.ceil(len / 2);
      for (let i = 0; i < count; i++) {
        const t = (i + 0.5) / count,
          pt: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t],
          angle = -Math.atan2(b[1] - a[1], b[0] - a[0]),
          nx = -(b[1] - a[1]) / len,
          nz = (b[0] - a[0]) / len,
          h = surfaceHeight(s, pt);
        for (const sign of [-1, 1]) {
          const point = new T.Vector3(
            pt[0] + nx * sign * 2.55,
            h + 0.43,
            pt[1] + nz * sign * 2.55,
          );
          box(scene, p.stone, point, [len / count + 0.04, 0.86, 0.4], angle);
          box(
            scene,
            p.stone,
            point.clone().add(new T.Vector3(0, 0.46, 0)),
            [len / count + 0.06, 0.12, 0.55],
            angle,
          );
        }
      }
    }
  const leafMatrices: T.Matrix4[] = [],
    leafColors: T.Color[] = [],
    grassMatrices: T.Matrix4[] = [],
    grassColors: T.Color[] = [],
    dummy = new T.Object3D();
  for (
    let ix = Math.floor((s.center[0] - 145) / 5.5);
    ix < Math.ceil((s.center[0] + 145) / 5.5);
    ix++
  )
    for (
      let iz = Math.floor((s.center[1] - 145) / 5.5);
      iz < Math.ceil((s.center[1] + 145) / 5.5);
      iz++
    ) {
      const seed = Math.imul(ix, 73856093) ^ Math.imul(iz, 19349663),
        r = rngFor(seed),
        pt: Point = [ix * 5.5 + r() * 3.8, iz * 5.5 + r() * 3.8];
      const habitat = s.patches.find(
        (f) => ["wood", "scrub"].includes(f.kind) && inside(pt, f.rings[0]),
      );
      if (!habitat || (habitat.kind === "scrub" && r() < 0.5)) continue;
      if (
        s.roads.some(
          (road) => nearest(pt, road.points).distance < road.width / 2 + 1.8,
        ) ||
        s.buildings.some((b) => inside(pt, b.ring)) ||
        s.waters.some((r) => inside(pt, r[0]))
      )
        continue;
      const ground = terrain(s, ...pt),
        height = habitat.kind === "wood" ? 8 + r() * 6 : 3.8 + r() * 3,
        tree = new T.Group();
      scene.add(tree);
      const base = new T.Vector3(pt[0], ground, pt[1]),
        top = base
          .clone()
          .add(
            new T.Vector3((r() - 0.5) * 0.7, height * 0.73, (r() - 0.5) * 0.7),
          );
      branch(tree, p.bark, base, top, 0.22 + r() * 0.13, 0.09);
      for (let b = 0; b < 6; b++) {
        const angle = b * Math.PI * 0.39 + r(),
          tip = base
            .clone()
            .add(
              new T.Vector3(
                Math.cos(angle) * height * 0.28,
                height * (0.62 + r() * 0.25),
                Math.sin(angle) * height * 0.28,
              ),
            );
        branch(
          tree,
          p.bark,
          base.clone().lerp(top, 0.5 + r() * 0.35),
          tip,
          0.09,
          0.025,
        );
      }
      for (let n = 0; n < 150; n++) {
        const phi = r() * Math.PI * 2,
          theta = Math.acos(2 * r() - 1),
          radius = Math.cbrt(r()),
          x = pt[0] + Math.cos(phi) * Math.sin(theta) * radius * height * 0.35,
          y = ground + height * 0.76 + Math.cos(theta) * radius * height * 0.29,
          z = pt[1] + Math.sin(phi) * Math.sin(theta) * radius * height * 0.35;
        dummy.position.set(x, y, z);
        dummy.rotation.set(r() * Math.PI, r() * Math.PI, r() * Math.PI);
        dummy.scale.setScalar(0.9 + r() * 1.4);
        dummy.updateMatrix();
        leafMatrices.push(dummy.matrix.clone());
        leafColors.push(
          new T.Color().setHSL(
            0.23 + r() * 0.09,
            0.2 + r() * 0.18,
            0.38 + r() * 0.18,
          ),
        );
      }
      const topPoint: Point = [pt[0] - 0.8, pt[1] - 0.8],
        screen = P.project(topPoint, ground + height * 0.88);
      if (
        screen[0] > 0 &&
        screen[0] < 2048 &&
        screen[1] > 0 &&
        screen[1] < 1280 &&
        leaves.length < 65
      )
        leaves.push({
          p: screen,
          depth: depth(topPoint) - height * 0.12,
          r: height * 3,
          seed,
        });
    }
  // Low riparian clusters, derived from mapped shore edges, leave routes clear.
  for (const rings of s.waters)
    for (const ring of rings.slice(0, 1))
      for (let edge = 1; edge < ring.length; edge++) {
        const a = ring[edge - 1],
          b = ring[edge],
          length = Math.hypot(b[0] - a[0], b[1] - a[1]);
        if (length < 0.2) continue;
        for (let k = 0; k < length; k += 2.4) {
          const t = k / length,
            center: Point = [
              a[0] + (b[0] - a[0]) * t,
              a[1] + (b[1] - a[1]) * t,
            ];
          if (
            Math.hypot(center[0] - s.center[0], center[1] - s.center[1]) > 150
          )
            continue;
          const rr = rngFor(
            (Math.round(center[0] * 10) * 191) ^ Math.round(center[1] * 10),
          );
          for (const side of [-1, 1]) {
            const pt: Point = [
              center[0] - ((b[1] - a[1]) / length) * side * 0.8,
              center[1] + ((b[0] - a[0]) / length) * side * 0.8,
            ];
            if (
              inside(pt, ring) ||
              s.roads.some(
                (r) => nearest(pt, r.points).distance < r.width / 2 + 0.7,
              ) ||
              s.buildings.some((b) => inside(pt, b.ring))
            )
              continue;
            for (let n = 0; n < 6; n++) {
              dummy.position.set(
                pt[0] + (rr() - 0.5) * 1.1,
                terrain(s, ...pt) + 0.35,
                pt[1] + (rr() - 0.5) * 1.1,
              );
              dummy.rotation.set(0, rr() * 6, 0.1);
              dummy.scale.set(0.55, 0.7 + rr() * 0.7, 0.6);
              dummy.updateMatrix();
              leafMatrices.push(dummy.matrix.clone());
              leafColors.push(new T.Color("#82905c"));
            }
          }
        }
      }
  const leafGeometry = new T.PlaneGeometry(1, 1),
    canopy = new T.InstancedMesh(leafGeometry, p.leaf, leafMatrices.length);
  leafMatrices.forEach((m, i) => {
    canopy.setMatrixAt(i, m);
    canopy.setColorAt(i, leafColors[i]);
  });
  canopy.castShadow = true;
  canopy.receiveShadow = true;
  scene.add(canopy);
  // Ground detail remains decoration: stones, ferns and grass do not create paths.
  const rockG = new T.IcosahedronGeometry(1, 1),
    rocks: T.Matrix4[] = [];
  for (let i = 0; i < 6500; i++) {
    const r = rngFor(i * 19191 + 37),
      pt: Point = [
        s.center[0] + (r() - 0.5) * 250,
        s.center[1] + (r() - 0.5) * 250,
      ];
    if (
      s.buildings.some((b) => inside(pt, b.ring)) ||
      s.waters.some((q) => inside(pt, q[0])) ||
      s.roads.some(
        (road) => nearest(pt, road.points).distance < road.width / 2 + 0.4,
      )
    )
      continue;
    const y = terrain(s, ...pt);
    if (i % 8 === 0) {
      dummy.position.set(pt[0], y + 0.1, pt[1]);
      dummy.rotation.set(r(), r() * 6, r());
      dummy.scale.set(0.12 + r() * 0.3, 0.08 + r() * 0.18, 0.1 + r() * 0.25);
      dummy.updateMatrix();
      rocks.push(dummy.matrix.clone());
    } else {
      dummy.position.set(pt[0], y + 0.28, pt[1]);
      dummy.rotation.set(0, r() * 6, 0);
      dummy.scale.set(0.35 + r() * 0.4, 0.5 + r() * 0.35, 0.5);
      dummy.updateMatrix();
      grassMatrices.push(dummy.matrix.clone());
      grassColors.push(
        new T.Color().setHSL(0.19 + r() * 0.12, 0.28, 0.4 + r() * 0.2),
      );
    }
  }
  for (const [geometry, material, matrices, colors] of [
    [rockG, p.rock, rocks, []],
    [leafGeometry, p.leaf, grassMatrices, grassColors],
  ] as [T.BufferGeometry, T.Material, T.Matrix4[], T.Color[]][]) {
    const inst = new T.InstancedMesh(geometry, material, matrices.length);
    matrices.forEach((m, i) => {
      inst.setMatrixAt(i, m);
      if (colors[i]) inst.setColorAt(i, colors[i]);
    });
    inst.castShadow = true;
    inst.receiveShadow = true;
    scene.add(inst);
  }
  // Batch static solids per material after the geometry has been authored.
  const groups = new Map<T.Material, T.Mesh[]>();
  scene.updateMatrixWorld(true);
  scene.traverse((o) => {
    if (
      o instanceof T.Mesh &&
      !(o instanceof T.InstancedMesh) &&
      o.geometry.index !== undefined
    ) {
      const m = o.material as T.Material;
      if (!groups.has(m)) groups.set(m, []);
      groups.get(m)!.push(o);
    }
  });
  for (const [m, objects] of groups) {
    if (objects.length < 4) continue;
    const geos = objects.map((o) => {
      let g = o.geometry.clone();
      if (g.index) g = g.toNonIndexed();
      g.applyMatrix4(o.matrixWorld);
      return g;
    });
    const merged = mergeGeometries(geos, false);
    if (!merged) continue;
    for (const o of objects) o.removeFromParent();
    mesh(scene, merged, m);
    geos.forEach((g) => g.dispose());
  }
  return { scene, leaves };
}
