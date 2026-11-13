import * as T from "three";
import { type Scene, WIDTH, HEIGHT, projector, depth } from "./world";
import { materials, canvasTexture } from "./art-materials";
import { buildWorld } from "./art-geometry";
const renderer = new T.WebGLRenderer({
  antialias: true,
  alpha: false,
  preserveDrawingBuffer: true,
});
renderer.setSize(WIDTH, HEIGHT);
renderer.setPixelRatio(1);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = T.PCFSoftShadowMap;
renderer.outputColorSpace = T.SRGBColorSpace;
renderer.toneMapping = T.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.02;
const palette = await materials();
const sky = canvasTexture(512, (c) => {
  const g = c.createLinearGradient(0, 0, 0, 512);
  g.addColorStop(0, "#7193ae");
  g.addColorStop(0.42, "#b8c8bd");
  g.addColorStop(0.54, "#d6ccb0");
  g.addColorStop(0.7, "#5b6a48");
  g.addColorStop(1, "#23372b");
  c.fillStyle = g;
  c.fillRect(0, 0, 512, 512);
});
sky.mapping = T.EquirectangularReflectionMapping;
const env = new T.PMREMGenerator(renderer).fromEquirectangular(sky).texture;
const vertex =
  `varying vec3 worldPoint;varying vec2 alphaUv;void main(){vec4 point=vec4(position,1.0);#ifdef USE_INSTANCING\npoint=instanceMatrix*point;\n#endif\nworldPoint=(modelMatrix*point).xyz;alphaUv=uv;gl_Position=projectionMatrix*viewMatrix*vec4(worldPoint,1.0);}`.replace(
    ";#ifdef",
    ";\n#ifdef",
  );
function maskMaterial(m: T.Material, s: Scene, water: boolean) {
  const src = m as T.MeshStandardMaterial;
  return new T.ShaderMaterial({
    uniforms: {
      alphaTexture: { value: src.alphaTest ? src.map : null },
      useAlpha: { value: src.alphaTest ? 1 : 0 },
      centerDepth: { value: depth(s.center) },
      waterPass: { value: water ? 1 : 0 },
      isWater: { value: m === palette.water ? 1 : 0 },
    },
    vertexShader: vertex,
    fragmentShader: `precision highp float;varying vec3 worldPoint;varying vec2 alphaUv;uniform sampler2D alphaTexture;uniform float useAlpha,centerDepth,waterPass,isWater;void main(){if(useAlpha>.5&&texture2D(alphaTexture,alphaUv).a<.42)discard;if(waterPass>.5){gl_FragColor=vec4(vec3(isWater),1.0);return;}float d=clamp(floor((.76*worldPoint.x+.65*worldPoint.z-centerDepth+300.0)*100.0+.5),0.0,65534.0);gl_FragColor=vec4(floor(d/256.0)/255.0,mod(d,256.0)/255.0,0.,1.);}`,
    side: T.DoubleSide,
    toneMapped: false,
  });
}
function pixelsToPng(data: Uint8Array) {
  const c = document.createElement("canvas");
  c.width = WIDTH;
  c.height = HEIGHT;
  const x = c.getContext("2d")!,
    image = x.createImageData(WIDTH, HEIGHT);
  for (let y = 0; y < HEIGHT; y++)
    image.data.set(
      data.subarray((HEIGHT - y - 1) * WIDTH * 4, (HEIGHT - y) * WIDTH * 4),
      y * WIDTH * 4,
    );
  x.putImageData(image, 0, 0);
  return c.toDataURL("image/png");
}
async function bake(s: Scene) {
  const { scene, leaves } = buildWorld(s, palette),
    camera = projector(s).camera;
  scene.environment = env;
  scene.environmentIntensity = 0.6;
  renderer.setRenderTarget(null);
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.setClearColor("#b7bca1");
  renderer.render(scene, camera);
  const graded = document.createElement("canvas");
  graded.width = WIDTH;
  graded.height = HEIGHT;
  const gc = graded.getContext("2d")!;
  gc.drawImage(renderer.domElement, 0, 0);
  const color = gc.getImageData(0, 0, WIDTH, HEIGHT);
  for (let k = 0; k < color.data.length; k += 4) {
    const r = color.data[k],
      g = color.data[k + 1],
      b = color.data[k + 2],
      l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    for (let c = 0; c < 3; c++) {
      const v = l + (color.data[k + c] - l) * 0.86;
      const shadow = 1 - v / 255;
      const tint =
        c === 0
          ? 1 + (0.5 - shadow) * 0.025
          : c === 1
            ? 0.994
            : 1 + shadow * 0.025;
      color.data[k + c] =
        Math.max(0, Math.min(255, (v - 128) * 1.035 + 128)) * tint;
    }
  }
  gc.putImageData(color, 0, 0);
  const image = graded.toDataURL("image/webp", 0.94);
  const target = new T.WebGLRenderTarget(WIDTH, HEIGHT, {
    format: T.RGBAFormat,
    type: T.UnsignedByteType,
    depthBuffer: true,
  });
  target.texture.colorSpace = T.NoColorSpace;
  const original = new Map<T.Mesh, T.Material | T.Material[]>();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) original.set(o, o.material);
  });
  const result: any = { image, leaves };
  for (const water of [false, true]) {
    const masks = new Map<T.Material, T.ShaderMaterial>();
    for (const [o, m] of original) {
      const material = m as T.Material;
      if (!masks.has(material))
        masks.set(material, maskMaterial(material, s, water));
      o.material = masks.get(material)!;
    }
    scene.background = null;
    scene.environment = null;
    renderer.shadowMap.enabled = false;
    renderer.toneMapping = T.NoToneMapping;
    renderer.setRenderTarget(target);
    renderer.setClearColor(water ? 0x000000 : 0xffff00, 1);
    renderer.clear();
    renderer.render(scene, camera);
    const pixels = new Uint8Array(WIDTH * HEIGHT * 4);
    renderer.readRenderTargetPixels(target, 0, 0, WIDTH, HEIGHT, pixels);
    result[water ? "water" : "depth"] = pixelsToPng(pixels);
    masks.forEach((m) => m.dispose());
  }
  for (const [o, m] of original) o.material = m;
  target.dispose();
  const geos = new Set<T.BufferGeometry>();
  scene.traverse((o) => {
    if (o instanceof T.Mesh) geos.add(o.geometry);
  });
  geos.forEach((g) => g.dispose());
  renderer.setRenderTarget(null);
  return result;
}
const world = await (await fetch("./world.json")).json();
(window as any).bakeScene = async (i: number) => bake(world.scenes[i]);
(window as any).bakeAll = async () => {
  const output = [];
  for (const scene of world.scenes) output.push(await bake(scene));
  return output;
};
const { bakeTraveller } = await import("./art-traveller");
(window as any).bakeTraveller = () => bakeTraveller(renderer);
