import "./style.css";
import { occluded } from "./occlusion.mjs";
import {
  type Scene,
  type Point,
  WIDTH,
  HEIGHT,
  projector,
  depth,
  surfaceHeight,
  pickRoad,
} from "./world";
import {
  SPEED,
  move,
  distance,
  pathTo,
  routeLength,
  extraExits,
} from "./navigation.mjs";
const $ = <T extends HTMLElement>(id: string) =>
  document.getElementById(id) as T;
const canvas = $<HTMLCanvasElement>("view"),
  ctx = canvas.getContext("2d", { alpha: false })!,
  keys = new Set<string>(),
  frames: number[] = [],
  transitions: any[] = [],
  visits = [0];
let scenes: Scene[],
  index = 0,
  position: Point,
  orientation: Point = [0, 1],
  started = false,
  paused = false,
  animations = !matchMedia("(prefers-reduced-motion: reduce)").matches,
  last = performance.now(),
  elapsed = 0,
  travelled = 0,
  moving = false,
  busy = false,
  lock = false,
  targets: Point[] = [],
  auto = false,
  direction = 1,
  toastUntil = 0;
let lockPosition: Point | undefined;
let crop = { x: 0, y: 0, w: WIDTH, h: HEIGHT };
const sprite = document.createElement("canvas"),
  buffer = document.createElement("canvas");
sprite.width = 64;
sprite.height = 80;
const sc = sprite.getContext("2d")!;
type Art = {
  image: HTMLImageElement;
  depth: Uint16Array;
  water: Uint8Array;
  leaves: { p: Point; depth: number; r: number; seed: number }[];
};
const cache = new Map<number, Promise<Art>>();
let art: Art;
function image(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const i = new Image();
    i.onload = () => resolve(i);
    i.onerror = () => reject(Error("Chargement impossible : " + url));
    i.src = url;
  });
}
function pixels(i: HTMLImageElement) {
  const c = document.createElement("canvas");
  c.width = WIDTH;
  c.height = HEIGHT;
  const x = c.getContext("2d", { willReadFrequently: true })!;
  x.drawImage(i, 0, 0);
  return x.getImageData(0, 0, WIDTH, HEIGHT).data;
}
function load(i: number) {
  if (!cache.has(i))
    cache.set(
      i,
      (async () => {
        const [a, d, w, l] = await Promise.all([
          image(`./scene-${i}-image.webp`),
          image(`./scene-${i}-depth.png`),
          image(`./scene-${i}-water.png`),
          fetch(`./scene-${i}-leaves.json`).then((r) => {
            if (!r.ok) throw Error("Feuillage manquant");
            return r.json();
          }),
        ]);
        const dp = pixels(d),
          wp = pixels(w),
          depthMap = new Uint16Array(WIDTH * HEIGHT),
          waterMap = new Uint8Array(WIDTH * HEIGHT);
        for (let k = 0; k < depthMap.length; k++) {
          depthMap[k] = dp[k * 4] * 256 + dp[k * 4 + 1];
          waterMap[k] = wp[k * 4 + 3] && wp[k * 4] > 100 ? 1 : 0;
        }
        return { image: a, depth: depthMap, water: waterMap, leaves: l };
      })(),
    );
  return cache.get(i)!;
}
function tell(s: string) {
  $("toast").textContent = s;
  toastUntil = performance.now() + 3500;
}
function hud() {
  const s = scenes[index];
  $("chapter").textContent = `0${index + 1} / 03`;
  $("title").textContent = s.title;
  $("description").textContent = s.description;
  document
    .querySelectorAll("[data-scene]")
    .forEach((el, i) => el.classList.toggle("active", i === index));
  $("walk").innerHTML = auto
    ? "Arrêter la promenade <span>Ⅱ</span>"
    : started
      ? "Suivre le chemin <span>→</span>"
      : "Commencer la promenade <span>→</span>";
  $("walk").classList.toggle("running", auto);
}
function setRoute() {
  const r =
    direction > 0 ? scenes[index].route : [...scenes[index].route].reverse();
  let best = 0,
    d = Infinity;
  for (let i = 0; i < r.length; i++) {
    const n = distance(position, r[i]);
    if (n < d) {
      best = i;
      d = n;
    }
  }
  targets = r.slice(best).map((p) => [...p] as Point);
  if (targets.length && distance(position, targets[0]) < 0.35) targets.shift();
}
async function change(next: number) {
  if (busy) return;
  busy = true;
  const begin = performance.now();
  try {
    art = await load(next);
    index = next;
    visits.push(index);
    targets = [];
    if (auto) setRoute();
    transitions.push({
      from: visits.at(-2),
      to: index,
      ms: performance.now() - begin,
      position: [...position],
      orientation: [...orientation],
    });
    lock = true;
    lockPosition = [...position];
    hud();
    tell(scenes[next].title);
  } catch (e) {
    tell(String(e));
    auto = false;
  } finally {
    busy = false;
  }
}
$("walk").onclick = () => {
  started = true;
  auto = !auto;
  if (auto) {
    if (index === 2 && distance(position, scenes[2].route.at(-1)!) < 1)
      direction = -1;
    setRoute();
  } else targets = [];
  hud();
  canvas.focus();
};
$("pause").onclick = () => {
  paused = !paused;
  $("pause").textContent = paused ? "Reprendre" : "Pause";
  last = performance.now();
};
function motionLabel() {
  $("motion").textContent = `Animations : ${animations ? "oui" : "non"}`;
  $("motion").setAttribute("aria-pressed", String(!animations));
}
motionLabel();
$("motion").onclick = () => {
  animations = !animations;
  motionLabel();
};
$("about").onclick = () => {
  keys.clear();
  $<HTMLDialogElement>("info").showModal();
};
$("close").onclick = () => $<HTMLDialogElement>("info").close();
window.addEventListener("keydown", (e) => {
  if ($<HTMLDialogElement>("info").open) return;
  const k = e.key.toLowerCase();
  if (
    [
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
      "w",
      "a",
      "s",
      "d",
      "z",
      "q",
    ].includes(k)
  ) {
    e.preventDefault();
    started = true;
    auto = false;
    targets = [];
    keys.add(k);
    hud();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  keys.clear();
  last = performance.now();
});
for (const b of document.querySelectorAll<HTMLButtonElement>("[data-key]")) {
  b.onpointerdown = (e) => {
    e.preventDefault();
    b.setPointerCapture(e.pointerId);
    started = true;
    auto = false;
    targets = [];
    keys.add(b.dataset.key!.toLowerCase());
    hud();
  };
  for (const event of ["pointerup", "pointercancel", "lostpointercapture"])
    b.addEventListener(event, () => keys.delete(b.dataset.key!.toLowerCase()));
}
canvas.onpointerdown = (e) => {
  if (!scenes || busy) return;
  const r = canvas.getBoundingClientRect(),
    p: Point = [
      crop.x + ((e.clientX - r.left) / r.width) * crop.w,
      crop.y + ((e.clientY - r.top) / r.height) * crop.h,
    ];
  const selected = pickRoad(scenes[index], p);
  targets = selected
    ? (pathTo(scenes[index], position, selected) as Point[])
    : [];
  auto = false;
  started = true;
  if (!targets.length) tell("Touchez une voie visible pour y marcher.");
  hud();
  canvas.focus();
};
function hidden(x: number, y: number, dep: number) {
  return occluded(
    art.depth,
    WIDTH,
    HEIGHT,
    x,
    y,
    dep,
    depth(scenes[index].center),
  );
}
function character(p: Point) {
  const s = scenes[index],
    P = projector(s),
    top = P.project(position, surfaceHeight(s, position) + 1.75),
    scale = Math.abs(top[1] - p[1]) / 48;
  sc.clearRect(0, 0, 64, 80);
  sc.save();
  sc.translate(32, 68);
  const phase = moving
    ? Math.sin(elapsed * 11)
    : animations
      ? Math.sin(elapsed * 2) * 0.08
      : 0;
  sc.scale(orientation[0] * -0.65 + orientation[1] * 0.76 < 0 ? -1 : 1, 1);
  sc.fillStyle = "#102e3270";
  sc.beginPath();
  sc.ellipse(0, 1, 12, 4, 0, 0, Math.PI * 2);
  sc.fill();
  sc.lineCap = "round";
  sc.strokeStyle = "#303a37";
  sc.lineWidth = 5;
  for (const side of [-1, 1]) {
    sc.beginPath();
    sc.moveTo(side * 3, -20);
    sc.lineTo(side * 4 + phase * side * 5, -10);
    sc.lineTo(side * 4 - phase * side * 7, 0);
    sc.stroke();
  }
  sc.fillStyle = "#c3aa70";
  sc.beginPath();
  sc.moveTo(-8, -34);
  sc.lineTo(7, -34);
  sc.lineTo(10, -17);
  sc.lineTo(-10, -17);
  sc.closePath();
  sc.fill();
  sc.strokeStyle = "#a58b57";
  sc.lineWidth = 4;
  sc.beginPath();
  sc.moveTo(6, -31);
  sc.lineTo(10 + phase * 4, -20);
  sc.stroke();
  sc.fillStyle = "#2c5b56";
  sc.fillRect(-7, -33, 13, 7);
  sc.fillStyle = "#d1aa80";
  sc.beginPath();
  sc.ellipse(0, -41, 5, 6, 0, 0, Math.PI * 2);
  sc.fill();
  sc.fillStyle = "#493e30";
  sc.beginPath();
  sc.ellipse(-1, -45, 6, 3, 0, 0, Math.PI * 2);
  sc.fill();
  sc.fillStyle = "#614b35";
  sc.fillRect(-9, -31, 6, 13);
  sc.restore();
  const sw = Math.max(1, Math.round(64 * scale)),
    sh = Math.max(1, Math.round(80 * scale)),
    left = Math.round(p[0] - 32 * scale),
    up = Math.round(p[1] - 68 * scale);
  if (buffer.width !== sw || buffer.height !== sh) {
    buffer.width = sw;
    buffer.height = sh;
  }
  const bc = buffer.getContext("2d", { willReadFrequently: true })!;
  bc.clearRect(0, 0, sw, sh);
  bc.drawImage(sprite, 0, 0, sw, sh);
  const data = bc.getImageData(0, 0, sw, sh),
    dep = depth(position);
  for (let y = 0; y < sh; y++)
    for (let x = 0; x < sw; x++)
      if (hidden(left + x, up + y, dep)) data.data[(y * sw + x) * 4 + 3] = 0;
  bc.putImageData(data, 0, 0);
  ctx.drawImage(buffer, left, up);
}
function render() {
  const s = scenes[index],
    P = projector(s),
    p = P.project(position, surfaceHeight(s, position)),
    r = canvas.getBoundingClientRect(),
    ratio = r.width / r.height,
    dpr = Math.min(2, devicePixelRatio),
    w = Math.round(r.width * dpr),
    h = Math.round(r.height * dpr);
  if (canvas.width !== w || canvas.height !== h) {
    canvas.width = w;
    canvas.height = h;
  }
  crop =
    r.width < 650
      ? {
          w: Math.min(WIDTH, HEIGHT * ratio),
          h: HEIGHT,
          x: Math.max(
            0,
            Math.min(WIDTH - HEIGHT * ratio, p[0] - (HEIGHT * ratio) / 2),
          ),
          y: 0,
        }
      : { x: 0, y: (HEIGHT - WIDTH / ratio) / 2, w: WIDTH, h: WIDTH / ratio };
  ctx.setTransform(
    w / crop.w,
    0,
    0,
    h / crop.h,
    (-crop.x * w) / crop.w,
    (-crop.y * h) / crop.h,
  );
  ctx.drawImage(art.image, 0, 0);
  if (animations) {
    for (let i = 0; i < 150; i++) {
      const x = (i * 731 + Math.sin(elapsed * 0.5 + i) * 9) % WIDTH,
        y = (i * 157) % HEIGHT,
        k = Math.round(y) * WIDTH + Math.round(x);
      if (art.water[k]) {
        ctx.strokeStyle = `rgba(224,230,190,${0.25 + 0.18 * Math.sin(elapsed * 1.7 + i)})`;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + 9 + Math.sin(elapsed + i) * 6, y);
        ctx.stroke();
      }
    }
  }
  if (started) character(p);
  else {
    ctx.strokeStyle = "#f3d294";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(
      p[0],
      p[1],
      12 + (animations ? Math.sin(elapsed * 2) * 2 : 0),
      0,
      Math.PI * 2,
    );
    ctx.stroke();
  }
  if (animations) {
    for (const leaf of art.leaves)
      for (let i = 0; i < 7; i++) {
        const x =
            leaf.p[0] +
            Math.sin(i * 19 + leaf.seed) * leaf.r * 0.7 +
            Math.sin(elapsed * 2 + i) * 4,
          y = leaf.p[1] + Math.cos(i * 7 + leaf.seed) * leaf.r * 0.4;
        if (!hidden(x, y, leaf.depth - 0.2)) {
          ctx.fillStyle = "#c4c38288";
          ctx.beginPath();
          ctx.ellipse(
            x,
            y,
            3 + Math.sin(elapsed * 2 + i),
            1.5,
            -0.5,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
      }
    const t = elapsed % 23;
    if (t > 12 && t < 17)
      for (let i = 0; i < 3; i++) {
        const x = (t - 12) * 500 - 90 * i,
          y = 230 + Math.sin(i * 2 + t) * 35,
          f = Math.sin(t * 11 + i) * 5;
        ctx.strokeStyle = "#263e37";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x - 7, y - f);
        ctx.lineTo(x, y);
        ctx.lineTo(x + 7, y - f);
        ctx.stroke();
      }
    ctx.fillStyle = `rgba(245,218,158,${0.012 + 0.012 * Math.sin(elapsed * 0.35)})`;
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
  }
  for (const [end, enabled, label] of [
    [s.route[0], index > 0, "←"],
    [s.route.at(-1)!, index < 2, "→"],
  ] as [Point, boolean, string][]) {
    if (!enabled) continue;
    const q = P.project(end, surfaceHeight(s, end));
    ctx.strokeStyle = "#f4d296";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], 12, 6, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#fff0b8";
    ctx.font = "21px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(label, q[0], q[1] - 13);
  }
  for (const gate of extraExits(s)) {
    const q = P.project(gate.point, surfaceHeight(s, gate.point));
    ctx.strokeStyle = "#dac69a99";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], 9, 5, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#ebd9b3";
    ctx.font = "14px Georgia";
    ctx.textAlign = "center";
    ctx.fillText(gate.label, q[0], q[1] - 11);
  }
  if (targets.length) {
    const q = P.project(targets.at(-1)!, surfaceHeight(s, targets.at(-1)!));
    ctx.strokeStyle = "#e9d19a99";
    ctx.beginPath();
    ctx.ellipse(q[0], q[1], 6, 3, 0, 0, Math.PI * 2);
    ctx.stroke();
  }
}
function frame(now: number) {
  requestAnimationFrame(frame);
  const real = (now - last) / 1000;
  last = now;
  if (!scenes || !art || paused || document.hidden) return;
  const dt = Math.min(0.05, real);
  elapsed += dt;
  frames.push(real * 1000);
  if (frames.length > 6000) frames.shift();
  moving = false;
  if (started && !busy && !$<HTMLDialogElement>("info").open) {
    const old = position;
    let delta: Point = [0, 0];
    if (targets.length) {
      const t = targets[0],
        d = distance(position, t);
      if (d < 0.16) targets.shift();
      else
        delta = [
          ((t[0] - position[0]) / d) * Math.min(d, SPEED * dt),
          ((t[1] - position[1]) / d) * Math.min(d, SPEED * dt),
        ];
    } else if (keys.size) {
      const x =
          Number(keys.has("arrowright") || keys.has("d")) -
          Number(keys.has("arrowleft") || keys.has("a") || keys.has("q")),
        y =
          Number(keys.has("arrowdown") || keys.has("s")) -
          Number(keys.has("arrowup") || keys.has("w") || keys.has("z")),
        P = projector(scenes[index]),
        a = P.project(position),
        q = P.unproject([a[0] + x * 10, a[1] + y * 10], position),
        len = distance(q, position);
      if (len > 0)
        delta = [
          ((q[0] - position[0]) / len) * SPEED * dt,
          ((q[1] - position[1]) / len) * SPEED * dt,
        ];
    }
    if (delta[0] || delta[1]) {
      position = move(scenes[index], position, delta) as Point;
      const projected = projector(scenes[index]).project(
        position,
        surfaceHeight(scenes[index], position),
      );
      if (
        projected[0] < 20 ||
        projected[0] > WIDTH - 20 ||
        projected[1] < 45 ||
        projected[1] > HEIGHT - 20
      )
        position = old;
      const d = distance(old, position);
      moving = d > 0.0001;
      if (moving) {
        travelled += d;
        orientation = [
          delta[0] / Math.hypot(...delta),
          delta[1] / Math.hypot(...delta),
        ];
      } else if (targets.length) {
        targets = [];
        auto = false;
        tell("Passage bloqué. Choisissez une autre voie.");
        hud();
      }
    }
    const s = scenes[index],
      a = distance(position, s.route[0]),
      b = distance(position, s.route.at(-1)!);
    if (lock && lockPosition && distance(position, lockPosition) > 1.6)
      lock = false;
    if (!lock && !auto && moving) {
      const gate = extraExits(s).find(
        (g) => distance(position, g.point) < 0.65,
      );
      if (gate) void change(gate.to);
    }
    if (!lock) {
      if (b < 0.65 && index < 2 && (auto ? direction > 0 : moving))
        void change(index + 1);
      else if (a < 0.65 && index > 0 && (auto ? direction < 0 : moving))
        void change(index - 1);
    }
    if (auto && !targets.length && !busy) {
      if (index === 2 && b < 0.65 && direction > 0) {
        direction = -1;
        setRoute();
        tell("Le coteau est atteint. Retour vers le village.");
      } else if (index === 0 && a < 0.65 && direction < 0) {
        auto = false;
        tell("Promenade aller-retour terminée.");
        hud();
      }
    }
  }
  if (now > toastUntil) $("toast").textContent = "";
  $("distance").textContent = `${Math.round(travelled)} m parcourus`;
  render();
}
async function boot() {
  try {
    const r = await fetch("./world.json");
    if (!r.ok) throw Error("Données absentes");
    scenes = (await r.json()).scenes;
    position = [...scenes[0].route[0]];
    art = await load(0);
    $("loading").style.display = "none";
    hud();
    for (let i = 1; i < 3; i++) void load(i).catch((e) => tell(String(e)));
    requestAnimationFrame(frame);
    (window as any).lp01 = {
      state: () => ({
        index,
        position: [...position],
        orientation: [...orientation],
        geo: {
          lon:
            0.8844 +
            position[0] / (111320 * Math.cos((46.6953 * Math.PI) / 180)),
          lat: 46.6953 - position[1] / 111320,
        },
        moving,
        auto,
        started,
        travelled,
        visits: [...visits],
        transitions: [...transitions],
        frames: [...frames],
        speed: SPEED,
        routeMetres: scenes.map((s) => routeLength(s.route)),
        ready: true,
        animations,
        decodedBytes: cache.size * WIDTH * HEIGHT * 7,
        heap: (performance as any).memory?.usedJSHeapSize,
      }),
      project: (p: Point) => projector(scenes[index]).project(p),
      screen: () => ({ crop, ...canvas.getBoundingClientRect().toJSON() }),
      scenes,
    };
  } catch (e) {
    $("loading").textContent =
      `Le carnet ne peut pas s’ouvrir. ${e}. Rechargez la page.`;
  }
}
void boot();
