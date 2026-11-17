import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const out = new URL(
    "../../../docs/living-paintings-evidence/",
    import.meta.url,
  ),
  b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: ["--no-sandbox"],
  });
try {
  const p = await b.newPage({ viewport: { width: 1440, height: 1080 } });
  await p.goto("http://localhost:5183/");
  await p.waitForFunction(() => window.lp01?.state().ready);
  await p.waitForTimeout(1500);
  await p.locator("#walk").click();
  await p.waitForFunction(() => window.lp01.state().index === 1, null, {
    timeout: 130000,
  });
  await p.locator("#walk").click();
  await p.waitForTimeout(300);
  const result = await p.evaluate(async () => {
    const c = document.querySelector("#view"),
      ctx = c.getContext("2d"),
      s = window.lp01.screen(),
      W = 2048,
      H = 1280;
    function read() {
      return ctx.getImageData(0, 0, c.width, c.height).data;
    }
    const before = read();
    await new Promise((r) => setTimeout(r, 1200));
    const after = read();
    const image = await new Promise((resolve) => {
        const i = new Image();
        i.onload = () => resolve(i);
        i.src = "./scene-1-water.png";
      }),
      mask = document.createElement("canvas");
    mask.width = W;
    mask.height = H;
    const mc = mask.getContext("2d");
    mc.drawImage(image, 0, 0);
    const pixels = mc.getImageData(0, 0, W, H).data,
      leaves = await (await fetch("./scene-1-leaves.json")).json();
    let water = 0,
      foliage = 0,
      all = 0;
    for (let y = 0; y < c.height; y++)
      for (let x = 0; x < c.width; x++) {
        const k = (y * c.width + x) * 4,
          d = Math.max(
            ...[0, 1, 2].map((ch) => Math.abs(before[k + ch] - after[k + ch])),
          );
        if (d <= 9) continue;
        all++;
        const px = Math.round(s.crop.x + (x / c.width) * s.crop.w),
          py = Math.round(s.crop.y + (y / c.height) * s.crop.h),
          m = (py * W + px) * 4;
        if (pixels[m] > 100 && pixels[m + 3] > 100) water++;
        if (leaves.some((l) => Math.hypot(l.p[0] - px, l.p[1] - py) < l.r))
          foliage++;
      }
    return {
      water,
      foliage,
      all,
      width: c.width,
      height: c.height,
      seconds: 1.2,
      threshold: 9,
    };
  });
  console.log("ANIMATION", result);
  assert.ok(result.water > 0, "water animation changes visible pixels");
  assert.ok(result.foliage > 0, "foliage animation changes visible pixels");
  await p.locator("#motion").click();
  await p.waitForTimeout(80);
  const still = await p.evaluate(async () => {
    const c = document.querySelector("#view"),
      x = c.getContext("2d"),
      a = x.getImageData(0, 0, c.width, c.height).data;
    await new Promise((r) => setTimeout(r, 500));
    const z = x.getImageData(0, 0, c.width, c.height).data;
    let different = 0;
    for (let i = 0; i < a.length; i++) if (a[i] !== z[i]) different++;
    return different;
  });
  assert.equal(still, 0, "reduced animation mode produces a stable painting");
  await p.reload();
  await p.waitForFunction(() => window.lp01?.state().ready);
  await p.screenshot({
    path: new URL("final-desktop.png", out).pathname,
    fullPage: true,
  });
  // A real source-backed secondary gate, reached by click routing at natural speed.
  const target = await p.evaluate(() => {
    const road = window.lp01.scenes[0].roads.find((r) => r.id === 647696686),
      q = window.lp01.project(road.points[3]),
      r = window.lp01.screen();
    return {
      x: r.x + ((q[0] - r.crop.x) / r.crop.w) * r.width,
      y: r.y + ((q[1] - r.crop.y) / r.crop.h) * r.height,
    };
  });
  await p.mouse.click(target.x, target.y);
  let gate;
  for (let i = 0; i < 35; i++) {
    await p.waitForTimeout(3000);
    gate = await p.evaluate(() => window.lp01.state());
    if (gate.index === 1) break;
    console.log(
      "GATE",
      i,
      gate.index,
      gate.travelled,
      gate.moving,
      gate.position,
    );
  }
  console.log("GATE-END", gate.index, gate.position);
  assert.equal(gate.index, 1);
  delete gate.frames;
  await writeFile(
    new URL("visual-check.json", out),
    JSON.stringify(
      {
        method:
          "Actual built Canvas pixels compared over 1.2s at rest. Pixel threshold >9 excludes tiny global-light drift; local mask/foliage regions classified from shipped data. Animations-off stability and real click navigation to a secondary source gate.",
        animation: result,
        stillPixels: still,
        gate,
      },
      null,
      2,
    ),
  );
  console.log(
    "PASS visible water/foliage, stable off state, click gate",
    result,
  );
} finally {
  await b.close();
}
