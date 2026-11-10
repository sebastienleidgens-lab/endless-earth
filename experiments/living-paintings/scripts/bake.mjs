import { chromium } from "playwright";
import { createServer } from "vite";
import { writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url).pathname;
const server = await createServer({
  configFile: root + "vite.config.ts",
  root,
  server: { port: 5182, strictPort: true, host: "127.0.0.1" },
});
await server.listen();
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: ["--no-sandbox"],
});
try {
  const page = await browser.newPage();
  page.on("pageerror", (e) => console.error(e));
  await page.goto("http://127.0.0.1:5182/bake.html");
  await page.waitForFunction(() => window.bakeAll);
  const results = await page.evaluate(() => window.bakeAll());
  for (const [i, result] of results.entries()) {
    for (const key of ["image", "depth", "water"])
      await writeFile(
        root + `public/scene-${i}-${key}.${key === "image" ? "webp" : "png"}`,
        Buffer.from(result[key].split(",")[1], "base64"),
      );
    await writeFile(
      root + `public/scene-${i}-leaves.json`,
      JSON.stringify(result.leaves),
    );
    console.log("Baked", i);
  }
} finally {
  await browser.close();
  await server.close();
}
