import * as THREE from "three";
export const rngFor = (value: number) => () => {
  value |= 0;
  value = (value + 0x6d2b79f5) | 0;
  let t = Math.imul(value ^ (value >>> 15), 1 | value);
  t ^= t + Math.imul(t ^ (t >>> 7), 61 | t);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
export function canvasTexture(
  size: number,
  paint: (c: CanvasRenderingContext2D, r: () => number) => void,
  seed = 17,
) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  paint(c.getContext("2d")!, rngFor(seed));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}
const source = {
  limestone: [
    new URL(
      "../art/materials/plaster_stone_wall_01-Diffuse.jpg",
      import.meta.url,
    ).href,
    new URL(
      "../art/materials/plaster_stone_wall_01-nor_gl.jpg",
      import.meta.url,
    ).href,
  ],
  forest: [
    new URL("../art/materials/forest_floor-Diffuse.jpg", import.meta.url).href,
    new URL("../art/materials/forest_floor-nor_gl.jpg", import.meta.url).href,
  ],
  grass: [
    new URL("../art/materials/grass_ground-Diffuse.jpg", import.meta.url).href,
    new URL("../art/materials/grass_ground-nor_gl.jpg", import.meta.url).href,
  ],
  stone: [
    new URL("../art/materials/medieval_wall_02-Diffuse.jpg", import.meta.url)
      .href,
    new URL("../art/materials/medieval_wall_02-nor_gl.jpg", import.meta.url)
      .href,
  ],
  cobble: [
    new URL("../art/materials/mossy_cobblestone-Diffuse.jpg", import.meta.url)
      .href,
    new URL("../art/materials/mossy_cobblestone-nor_gl.jpg", import.meta.url)
      .href,
  ],
  slate: [
    new URL("../art/materials/roof_slates_02-Diffuse.jpg", import.meta.url)
      .href,
    new URL("../art/materials/roof_slates_02-nor_gl.jpg", import.meta.url).href,
  ],
  clay: [
    new URL("../art/materials/clay_roof_tiles_02-Diffuse.jpg", import.meta.url)
      .href,
    new URL("../art/materials/clay_roof_tiles_02-nor_gl.jpg", import.meta.url)
      .href,
  ],
};
export async function materials() {
  const loader = new THREE.TextureLoader();
  const result: Record<string, THREE.MeshStandardMaterial> = {};
  for (const [key, urls] of Object.entries(source)) {
    const [map, normalMap] = await Promise.all(
      urls.map((u) => loader.loadAsync(u)),
    );
    map.colorSpace = THREE.SRGBColorSpace;
    for (const t of [map, normalMap]) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.anisotropy = 8;
    }
    result[key] = new THREE.MeshStandardMaterial({
      map,
      normalMap,
      normalScale: new THREE.Vector2(0.65, 0.65),
      roughness: 0.92,
      side: THREE.DoubleSide,
      color: key === "stone" ? 0xd7cdb6 : 0xffffff,
    });
  }
  result.plaster = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      512,
      (c, r) => {
        c.fillStyle = "#b9af94";
        c.fillRect(0, 0, 512, 512);
        for (let n = 0; n < 45000; n++) {
          const g = 80 + r() * 140;
          c.fillStyle = `rgba(${g + 20},${g + 13},${g},${0.02 + r() * 0.08})`;
          c.fillRect(r() * 512, r() * 512, 1 + r() * 5, 1 + r() * 5);
        }
        for (let n = 0; n < 60; n++) {
          c.strokeStyle = "#625c4222";
          c.lineWidth = 0.5;
          c.beginPath();
          const x = r() * 512,
            y = r() * 512;
          c.moveTo(x, y);
          c.lineTo(x + r() * 10, y + 20 + r() * 30);
          c.stroke();
        }
      },
      81,
    ),
    roughness: 1,
    side: THREE.DoubleSide,
  });
  result.plaster.map = result.limestone.map;
  result.plaster.normalMap = result.limestone.normalMap;
  result.plaster.normalScale = new THREE.Vector2(0.5, 0.5);
  result.plaster.color.set("#d7cfbd");
  result.stone.color.set("#d7c8ab");
  result.clay.color.set("#a89585");
  result.slate.color.set("#606462");
  result.wood = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      256,
      (c, r) => {
        c.fillStyle = "#504532";
        c.fillRect(0, 0, 256, 256);
        for (let n = 0; n < 1500; n++) {
          c.strokeStyle = r() < 0.4 ? "#b49b6340" : "#171e183f";
          c.beginPath();
          const x = r() * 256,
            y = r() * 256;
          c.moveTo(x, y);
          c.bezierCurveTo(x + 3, y + 20, x - 2, y + 50, x + r() * 3, y + 90);
          c.stroke();
        }
        for (let n = 0; n < 8; n++) {
          c.fillStyle = "#171e1860";
          c.fillRect(n * 32, 0, 1.5, 256);
        }
      },
      27,
    ),
    roughness: 1,
  });
  result.bark = result.wood.clone();
  result.bark.color.set("#817464");
  result.leaf = new THREE.MeshStandardMaterial({
    map: canvasTexture(
      128,
      (c, r) => {
        c.clearRect(0, 0, 128, 128);
        c.strokeStyle = "#37432b";
        c.lineWidth = 2;
        c.beginPath();
        c.moveTo(60, 124);
        c.quadraticCurveTo(77, 68, 58, 8);
        c.stroke();
        for (let n = 0; n < 34; n++) {
          const y = 8 + r() * 105,
            side = n % 2 ? -1 : 1,
            x = 63 + side * (6 + r() * 30),
            length = 7 + r() * 13;
          c.save();
          c.translate(x, y);
          c.rotate(side * 0.6 + r());
          const col = new THREE.Color("#7f9250");
          col.offsetHSL(
            (r() - 0.5) * 0.03,
            (r() - 0.5) * 0.15,
            (r() - 0.5) * 0.16,
          );
          c.fillStyle = "#" + col.getHexString();
          c.beginPath();
          c.ellipse(0, 0, length * 0.47, length, 0, 0, Math.PI * 2);
          c.fill();
          c.strokeStyle = "#ccd69055";
          c.lineWidth = 0.55;
          c.beginPath();
          c.moveTo(0, -length * 0.7);
          c.lineTo(0, length * 0.8);
          c.stroke();
          c.restore();
        }
      },
      503,
    ),
    alphaTest: 0.42,
    side: THREE.DoubleSide,
    roughness: 1,
  });
  result.rock = new THREE.MeshStandardMaterial({
    map: result.stone.map,
    normalMap: result.stone.normalMap,
    color: "#858272",
    roughness: 1,
  });
  result.water = new THREE.MeshStandardMaterial({
    color: "#42675c",
    roughness: 0.29,
    metalness: 0.25,
    map: canvasTexture(
      512,
      (c, r) => {
        c.fillStyle = "#789e8c";
        c.fillRect(0, 0, 512, 512);
        for (let i = 0; i < 1800; i++) {
          const y = r() * 512,
            x = r() * 512;
          c.strokeStyle = r() < 0.5 ? "#c7d1ac1c" : "#153d3c1e";
          c.lineWidth = 0.4 + r() * 1.3;
          c.beginPath();
          c.moveTo(x, y);
          c.bezierCurveTo(x + 20, y - 2, x + 30, y + 2, x + 60, y);
          c.stroke();
        }
      },
      290,
    ),
  });
  return result;
}
