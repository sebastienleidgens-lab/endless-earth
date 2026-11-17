import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const output = new URL(
    "../../../docs/living-paintings-evidence/",
    import.meta.url,
  ),
  b = await chromium.launch({
    executablePath: "/usr/bin/chromium",
    args: [
      "--no-sandbox",
      "--use-angle=swiftshader",
      "--enable-unsafe-swiftshader",
    ],
  });
try {
  const results = [];
  for (const [name, url, ready] of [
    ["lp01", "http://localhost:5183/", () => window.lp01?.state().ready],
    [
      "3d-main",
      "http://localhost:5175/endless-earth/?perf=1&date=2026-05-10T13:00:00Z",
      () => window.endlessDiagnostics?.ready,
    ],
  ]) {
    const p = await b.newPage({
        viewport: { width: 1440, height: 1080 },
        deviceScaleFactor: 1,
      }),
      errors = [];
    p.on("pageerror", (e) => errors.push(String(e)));
    const started = performance.now();
    await p.goto(url);
    await p.waitForFunction(ready, null, { timeout: 180000 });
    const readyMs = performance.now() - started;
    if (name === "3d-main") {
      await p.keyboard.press("v");
      await p.keyboard.press("v");
    }
    await p.waitForTimeout(2000);
    const frames = await p.evaluate(
      () =>
        new Promise((resolve) => {
          const a = [];
          let last = performance.now();
          function frame(t) {
            a.push(t - last);
            last = t;
            if (a.length < 180) requestAnimationFrame(frame);
            else resolve(a);
          }
          requestAnimationFrame(frame);
        }),
    );
    await p.screenshot({
      path: new URL(`comparison-${name}.png`, output).pathname,
      fullPage: true,
    });
    const metrics = await p.evaluate(() => ({
      heap: performance.memory?.usedJSHeapSize,
      diagnostics: window.endlessDiagnostics ?? window.lp01?.state(),
      resources: performance.getEntriesByType("resource").map((r) => ({
        url: r.name,
        encodedBodySize: r.encodedBodySize,
        transferSize: r.transferSize,
        duration: r.duration,
      })),
    }));
    if (metrics.diagnostics?.frames) delete metrics.diagnostics.frames;
    results.push({ name, url, readyMs, frames, ...metrics, errors });
    await p.close();
    console.log(name, readyMs);
  }
  await writeFile(
    new URL("comparison.json", output),
    JSON.stringify(
      {
        method:
          "Two sequential fresh Chromium pages, identical 1440x1080 DPR1, 180 requestAnimationFrame intervals at rest. Software SwiftShader for the 3D page; no hardware GPU or matched journey claim. LP01 limited to three paintings; 3D loads broader world. Localhost, no mobile network throttling. Final comparison run after other test browsers closed; 3D daylight fixed to 2026-05-10T13:00:00Z for a legible visual reference. LP01 uses one baked lighting state.",
        results,
      },
      null,
      2,
    ),
  );
} finally {
  await b.close();
}
