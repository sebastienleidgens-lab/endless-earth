import { chromium } from "playwright";
import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
const root = new URL(
  "../../../docs/living-paintings-v2-evidence/",
  import.meta.url,
);
await mkdir(root, { recursive: true });
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await b.newPage({ viewport: { width: 1440, height: 1080 } }),
    errors = [];
  page.on("pageerror", (e) => errors.push(String(e)));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(`${r.status()} ${r.url()}`);
  });
  const begin = performance.now();
  await page.goto("http://localhost:5183/");
  await page.waitForFunction(() => window.lp01?.state().ready);
  const readyMs = performance.now() - begin;
  assert.equal(
    await page.evaluate(() => window.lp01.state().rendererVersion),
    "lp02-volumetric",
  );
  await page.screenshot({
    path: new URL("detail-view.png", root).pathname,
    fullPage: true,
  });
  await page.locator("#zoom").click();
  assert.equal(
    await page.evaluate(() => window.lp01.state().detailView),
    false,
  );
  await page.screenshot({
    path: new URL("wide-view.png", root).pathname,
    fullPage: true,
  });
  await page.locator("#zoom").click();
  assert.equal(await page.evaluate(() => window.lp01.state().detailView), true);
  const atlas = await page.evaluate(async () => {
    const meta = await (await fetch("./traveller.json")).json(),
      im = new Image();
    im.src = "./traveller.png";
    await im.decode();
    const c = document.createElement("canvas");
    c.width = im.width;
    c.height = im.height;
    const x = c.getContext("2d");
    x.drawImage(im, 0, 0);
    const data = x.getImageData(0, 0, c.width, c.height).data,
      counts = [];
    for (let row = 0; row < meta.rows; row++)
      for (let col = 0; col < meta.columns; col++) {
        let count = 0;
        for (let y = 0; y < meta.tileHeight; y++)
          for (let px = 0; px < meta.tileWidth; px++)
            if (
              data[
                ((row * meta.tileHeight + y) * c.width +
                  col * meta.tileWidth +
                  px) *
                  4 +
                  3
              ] > 100
            )
              count++;
        counts.push(count);
      }
    return { meta, width: im.width, height: im.height, counts };
  });
  assert.ok(atlas.counts.every((n) => n > 400));
  assert.equal(atlas.meta.logicalHeightMetres, 1.75);
  await page.locator("#walk").click();
  await page.waitForTimeout(2200);
  await page.locator("#walk").click();
  await page.screenshot({
    path: new URL("traveller-walking.png", root).pathname,
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: new URL("detail-mobile.png", root).pathname,
    fullPage: true,
  });
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  );
  const pad = await page.locator('[data-key="ArrowRight"]').boundingBox();
  await page.mouse.move(pad.x + pad.width / 2, pad.y + pad.height / 2);
  await page.mouse.down();
  await page.waitForTimeout(1800);
  await page.mouse.up();
  const state = await page.evaluate(() => window.lp01.state());
  delete state.frames;
  assert.ok(state.travelled > 3);
  assert.deepEqual(errors, []);
  await writeFile(
    new URL("art-validation.json", root),
    JSON.stringify(
      {
        method:
          "Actual built game in Chromium, desktop and narrow layout. Atlas decoded and every directional/frame tile checked for a nonempty alpha silhouette. Real automatic and pointer input; no injected position.",
        readyMs,
        atlas,
        state,
        errors,
      },
      null,
      2,
    ),
  );
  console.log("PASS art, zoom, traveller, mobile", readyMs);
} finally {
  await b.close();
}
