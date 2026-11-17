import * as T from "three";
import { canvasTexture } from "./art-materials";
export function bakeTraveller(renderer: T.WebGLRenderer) {
  const W = 128,
    H = 160,
    cols = 8,
    rows = 10,
    scene = new T.Scene(),
    body = new T.Group();
  scene.add(body);
  scene.add(new T.HemisphereLight("#e0e8dc", "#524635", 1.3));
  const sun = new T.DirectionalLight("#ffe4bc", 3);
  sun.position.set(-6, 6, -5);
  scene.add(sun);
  const cloth = canvasTexture(
      128,
      (c, r) => {
        c.fillStyle = "#a49166";
        c.fillRect(0, 0, 128, 128);
        for (let i = 0; i < 12000; i++) {
          c.fillStyle = r() < 0.5 ? "#e7d9ac22" : "#342c2322";
          c.fillRect(r() * 128, r() * 128, 1, 1);
        }
      },
      39,
    ),
    coat = new T.MeshStandardMaterial({ map: cloth, roughness: 1 }),
    pants = new T.MeshStandardMaterial({ color: "#4e5045", roughness: 1 }),
    leather = new T.MeshStandardMaterial({ color: "#59452e", roughness: 0.8 }),
    skin = new T.MeshStandardMaterial({ color: "#ba8e68", roughness: 0.8 }),
    hair = new T.MeshStandardMaterial({ color: "#443b2c", roughness: 1 }),
    scarf = new T.MeshStandardMaterial({ color: "#366560", roughness: 1 }),
    eye = new T.MeshStandardMaterial({ color: "#252820", roughness: 0.8 });
  function add(
    g: T.BufferGeometry,
    m: T.Material,
    p: [number, number, number],
    parent: T.Object3D = body,
  ) {
    const mesh = new T.Mesh(g, m);
    mesh.position.set(...p);
    parent.add(mesh);
    return mesh;
  }
  function box(
    m: T.Material,
    p: [number, number, number],
    size: [number, number, number],
    parent: T.Object3D = body,
  ) {
    return add(new T.BoxGeometry(...size), m, p, parent);
  }
  const torso = new T.Group();
  body.add(torso);
  add(
    new T.CapsuleGeometry(0.2, 0.34, 6, 12),
    coat,
    [0, 1.11, 0],
    torso,
  ).scale.z = 0.7;
  add(new T.CylinderGeometry(0.2, 0.28, 0.25, 10), coat, [0, 0.87, 0], torso);
  box(leather, [0, 0.91, 0.01], [0.47, 0.055, 0.32], torso);
  add(new T.SphereGeometry(0.13, 16, 14), skin, [0, 1.62, 0], torso).scale.y =
    1.02;
  add(
    new T.SphereGeometry(0.137, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48),
    hair,
    [0, 1.63, -0.005],
    torso,
  );
  const nose = add(
    new T.SphereGeometry(0.026, 7, 6),
    skin,
    [0, 1.615, 0.125],
    torso,
  );
  nose.scale.set(0.7, 1, 1.2);
  const eyes = [-0.046, 0.046].map((x) =>
    add(new T.SphereGeometry(0.01, 6, 6), eye, [x, 1.652, 0.116], torso),
  );
  const collar = add(
    new T.TorusGeometry(0.13, 0.038, 6, 16),
    scarf,
    [0, 1.465, 0],
    torso,
  );
  collar.rotation.x = Math.PI / 2;
  box(scarf, [0.09, 1.29, 0.155], [0.065, 0.3, 0.025], torso);
  box(leather, [0, 1.15, -0.19], [0.31, 0.35, 0.16], torso);
  const blanket = add(
    new T.CylinderGeometry(0.075, 0.075, 0.35, 10),
    scarf,
    [0, 1.4, -0.2],
    torso,
  );
  blanket.rotation.z = Math.PI / 2;
  for (const x of [-0.12, 0.12])
    box(leather, [x, 1.23, 0.135], [0.035, 0.4, 0.025], torso);
  const legs: T.Group[] = [],
    knees: T.Group[] = [],
    arms: T.Group[] = [];
  for (const sign of [-1, 1]) {
    const leg = new T.Group();
    leg.position.set(sign * 0.11, 0.79, 0);
    body.add(leg);
    legs.push(leg);
    add(new T.CapsuleGeometry(0.074, 0.28, 5, 8), pants, [0, -0.18, 0], leg);
    const knee = new T.Group();
    knee.position.y = -0.39;
    leg.add(knee);
    knees.push(knee);
    add(new T.CapsuleGeometry(0.063, 0.22, 5, 8), pants, [0, -0.15, 0], knee);
    box(leather, [0, -0.31, 0.055], [0.14, 0.14, 0.25], knee);
    const arm = new T.Group();
    arm.position.set(sign * 0.23, 1.34, 0);
    torso.add(arm);
    arms.push(arm);
    add(new T.CapsuleGeometry(0.061, 0.3, 5, 8), coat, [0, -0.19, 0], arm);
    add(new T.SphereGeometry(0.061, 8, 7), skin, [0, -0.42, 0.015], arm);
  }
  const camera = new T.OrthographicCamera(
      -1.25,
      1.25,
      1.5625,
      -1.5625,
      0.1,
      40,
    ),
    target = new T.Vector3(0, 0.85, 0);
  camera.position
    .copy(target)
    .add(new T.Vector3(-0.76, 0.85, -0.65).multiplyScalar(5));
  camera.lookAt(target);
  camera.updateMatrixWorld();
  const foot = new T.Vector3(0, 0, 0).project(camera),
    footPixels: [number, number] = [
      ((foot.x + 1) * W) / 2,
      ((1 - foot.y) * H) / 2,
    ],
    atlas = document.createElement("canvas");
  atlas.width = W * cols;
  atlas.height = H * rows;
  const ctx = atlas.getContext("2d")!,
    tile = document.createElement("canvas");
  tile.width = W;
  tile.height = H;
  const tc = tile.getContext("2d")!,
    targetRT = new T.WebGLRenderTarget(W, H, {
      format: T.RGBAFormat,
      type: T.UnsignedByteType,
    });
  renderer.shadowMap.enabled = false;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.setClearColor("#000000", 0);
  for (let row = 0; row < rows; row++)
    for (let dir = 0; dir < cols; dir++) {
      const phase = row > 0 && row < 9 ? ((row - 1) / 8) * Math.PI * 2 : 0;
      body.rotation.y = (dir * Math.PI) / 4;
      legs.forEach((l, i) => {
        const sign = i ? 1 : -1;
        l.rotation.x = Math.sin(phase) * sign * 0.4;
        knees[i].rotation.x = Math.max(0, -Math.sin(phase) * sign) * 0.48;
        arms[i].rotation.x = -Math.sin(phase) * sign * 0.27;
      });
      torso.position.y =
        row > 0 && row < 9
          ? Math.abs(Math.sin(phase * 2)) * 0.018
          : row === 9
            ? 0.006
            : 0;
      eyes.forEach((e) => (e.visible = row !== 9));
      renderer.setRenderTarget(targetRT);
      renderer.clear();
      renderer.render(scene, camera);
      const data = new Uint8Array(W * H * 4);
      renderer.readRenderTargetPixels(targetRT, 0, 0, W, H, data);
      const pixels = tc.createImageData(W, H);
      for (let y = 0; y < H; y++)
        pixels.data.set(
          data.subarray((H - y - 1) * W * 4, (H - y) * W * 4),
          y * W * 4,
        );
      for (let k = 0; k < pixels.data.length; k += 4)
        for (let c = 0; c < 3; c++) {
          const linear = pixels.data[k + c] / 255;
          pixels.data[k + c] = Math.round(
            (linear <= 0.0031308
              ? linear * 12.92
              : 1.055 * Math.pow(linear, 1 / 2.4) - 0.055) * 255,
          );
        }
      tc.putImageData(pixels, 0, 0);
      ctx.drawImage(tile, dir * W, row * H);
    }
  targetRT.dispose();
  renderer.setRenderTarget(null);
  return {
    image: atlas.toDataURL("image/png"),
    meta: {
      tileWidth: W,
      tileHeight: H,
      columns: cols,
      rows,
      foot: footPixels,
      pixelsPerMetre: W / 2.5,
      logicalHeightMetres: 1.75,
      directions: "clockwise world yaw from +Z, 8 directions",
      frames: "row 0 idle; rows 1..8 gait; row 9 blink",
    },
  };
}
