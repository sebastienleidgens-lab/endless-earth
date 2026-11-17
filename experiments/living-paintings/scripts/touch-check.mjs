import { chromium } from "playwright";
import assert from "node:assert/strict";
import { writeFile } from "node:fs/promises";
const evidence=process.env.LP_EVIDENCE_DIR?new URL('file://'+process.env.LP_EVIDENCE_DIR+'/'):new URL('../../../docs/living-paintings-evidence/',import.meta.url);
const b = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const c = await b.newContext({
      viewport: { width: 390, height: 844 },
      deviceScaleFactor: 2,
      isMobile: true,
      hasTouch: true,
    }),
    p = await c.newPage(),
    errors = [];
  p.on("pageerror", (e) => errors.push(String(e)));
  await p.goto("http://localhost:5183/");
  await p.waitForFunction(() => window.lp01?.state().ready);
  const pad = await p.locator('[data-key="ArrowRight"]').boundingBox(),
    cdp = await c.newCDPSession(p);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: pad.x + pad.width / 2, y: pad.y + pad.height / 2 }],
  });
  await p.waitForTimeout(2000);
  await cdp.send("Input.dispatchTouchEvent", {
    type: "touchEnd",
    touchPoints: [],
  });
  const state = await p.evaluate(() => window.lp01.state());
  assert.ok(state.travelled > 1.5 && state.travelled < 3);
  assert.deepEqual(errors, []);
  assert.ok(
    await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
  );
  await p.screenshot({
    path: new URL("touch-390.png", evidence).pathname,
    fullPage: true,
  });
  delete state.frames;
  await writeFile(
    new URL("touch.json", evidence),
    JSON.stringify(
      {
        method:
          "Chromium 390x844 DPR2 mobile/hasTouch context, real emulated touchStart held for 2 seconds then touchEnd via CDP. Not a physical Android test.",
        state,
        errors,
      },
      null,
      2,
    ),
  );
  console.log("PASS emulated touch", state.travelled);
} finally {
  await b.close();
}
