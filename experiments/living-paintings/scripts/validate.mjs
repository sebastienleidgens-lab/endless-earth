import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile, mkdir } from "node:fs/promises";
const url = process.env.LP_URL ?? "http://localhost:5181/";
const output = new URL(
  "../../../docs/living-paintings-evidence/",
  import.meta.url,
);
await mkdir(output, { recursive: true });
const save = (name, value) =>
  writeFile(new URL(name, output), JSON.stringify(value, null, 2));
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
const errors = [],
  requests = [],
  samples = [];
const p = await browser.newPage({
  viewport: { width: 1440, height: 1080 },
  deviceScaleFactor: 1,
});
p.on("pageerror", (e) => errors.push(String(e)));
p.on("response", (r) => {
  if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
});
p.on("request", (r) => requests.push(r.url()));
try {
  const begin = performance.now();
  await p.goto(url);
  await p.waitForFunction(() => window.lp01?.state().ready);
  const readyMs = performance.now() - begin;
  await p.waitForTimeout(1500);
  await p.screenshot({
    path: new URL("desktop-initial.png", output).pathname,
    fullPage: true,
  });
  const state = () =>
    p.evaluate(() => {
      const s = window.lp01.state();
      s.frames = s.frames.slice(-600);
      return s;
    });
  const initial = await state();
  assert.ok(initial.routeMetres.every((d) => d > 80));
  // Real keyboard input: 1.38 m/s is an upper bound even under a slow frame.
  await p.keyboard.down("ArrowRight");
  await p.waitForTimeout(2000);
  await p.keyboard.up("ArrowRight");
  const keyboard = await state();
  assert.ok(keyboard.travelled > 1.9 && keyboard.travelled < 3.1);
  await p.keyboard.down("ArrowUp");
  await p.waitForTimeout(3500);
  await p.keyboard.up("ArrowUp");
  const collision = await state();
  assert.ok(collision.travelled - keyboard.travelled < 4.9);
  // Reload gives an independent source start for pointer and full-walk tests.
  await p.reload();
  await p.waitForFunction(() => window.lp01?.state().ready);
  const target = await p.evaluate(() => {
    const s = window.lp01.scenes[0],
      q = window.lp01.project(s.route[1]),
      r = window.lp01.screen();
    return {
      x: r.x + ((q[0] - r.crop.x) / r.crop.w) * r.width,
      y: r.y + ((q[1] - r.crop.y) / r.crop.h) * r.height,
    };
  });
  await p.mouse.click(target.x, target.y);
  await p.waitForTimeout(1700);
  const click = await state();
  assert.ok(click.travelled > 1.4);
  assert.equal(click.auto, false);
  await p.reload();
  await p.waitForFunction(() => window.lp01?.state().ready);
  await p.locator("#walk").click();
  const walkStart = performance.now();
  let lastScene = -1,
    completed = false;
  while (performance.now() - walkStart < 480000) {
    await p.waitForTimeout(10000);
    const s = await state();
    samples.push({ seconds: (performance.now() - walkStart) / 1000, ...s });
    console.log(
      "WALK",
      Math.round(samples.at(-1).seconds),
      s.index,
      Math.round(s.travelled),
      s.auto,
      s.visits.join(","),
    );
    if (s.index !== lastScene) {
      lastScene = s.index;
      await p.screenshot({
        path: new URL(`walk-${s.visits.length}-${s.index}.png`, output)
          .pathname,
        fullPage: true,
      });
    }
    await save("walk-progress.json", { url, readyMs, samples, errors });
    if (!s.auto) {
      completed = s.index === 0 && s.visits.join(",") === "0,1,2,1,0";
      break;
    }
  }
  assert.ok(
    completed,
    "natural-speed browser round trip completes without teleportation or clock manipulation",
  );
  const finish = await state();
  assert.ok(finish.travelled > 566 && finish.travelled < 578);
  assert.equal(finish.transitions.length, 4);
  assert.ok(distance(finish.position, initial.position) < 0.4);
  assert.ok(finish.transitions.every((t) => t.ms < 200));
  await p.screenshot({
    path: new URL("walk-return.png", output).pathname,
    fullPage: true,
  });
  const resources = await p.evaluate(() =>
    performance.getEntriesByType("resource").map((r) => ({
      url: r.name,
      transferSize: r.transferSize,
      encodedBodySize: r.encodedBodySize,
      decodedBodySize: r.decodedBodySize,
      duration: r.duration,
    })),
  );
  await save("desktop.json", {
    method:
      "Headless Chromium Linux, Canvas2D, 1440x1080 DPR1. Full real-time walk through shipped frame loop, normal 1.38m/s, no clock scaling, teleport or injected movement. Not a physical-device test.",
    url,
    readyMs,
    keyboard,
    collision,
    click,
    finish,
    realWalkSeconds: (performance.now() - walkStart) / 1000,
    resources,
    requests,
    errors,
  });
  assert.deepEqual(errors, []);
  // Mobile is a separate emulated touch context, not an Android hardware claim.
  const mobile = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });
  const m = await mobile.newPage();
  m.on("pageerror", (e) => errors.push(String(e)));
  const start = performance.now();
  await m.goto(url);
  await m.waitForFunction(() => window.lp01?.state().ready);
  await m.waitForTimeout(1500);
  const mobileReadyMs = performance.now() - start;
  await m.screenshot({
    path: new URL("mobile-390.png", output).pathname,
    fullPage: true,
  });
  const pad = m.locator('[data-key="ArrowRight"]');
  const box = await pad.boundingBox();
  await m.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await m.mouse.down();
  await m.waitForTimeout(2000);
  await m.mouse.up();
  const mobileState = await m.evaluate(() => window.lp01.state());
  assert.ok(mobileState.travelled > 1.5);
  assert.ok(
    await m.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  for (const size of [
    { width: 320, height: 568 },
    { width: 844, height: 390 },
  ]) {
    await m.setViewportSize(size);
    await m.screenshot({
      path: new URL(`mobile-${size.width}.png`, output).pathname,
      fullPage: true,
    });
    assert.ok(
      await m.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    );
  }
  await m.emulateMedia({ reducedMotion: "reduce" });
  await m.reload();
  await m.waitForFunction(() => window.lp01?.state().ready);
  assert.equal(await m.evaluate(() => window.lp01.state().animations), false);
  await save("mobile.json", {
    method:
      "Chromium touch/mobile emulation; no physical Android device tested",
    mobileReadyMs,
    state: mobileState,
    reducedMotion: true,
    errors,
  });
  await mobile.close();
  console.log("PASS complete round trip + mobile");
} catch (error) {
  await save("validation-failure.json", {
    error: String(error),
    errors,
    samples,
  });
  throw error;
} finally {
  await browser.close();
}
function distance(a, b) {
  return Math.hypot(a[0] - b[0], a[1] - b[1]);
}
