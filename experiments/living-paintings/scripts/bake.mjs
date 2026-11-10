import { chromium } from "playwright";
import { writeFile } from "node:fs/promises";
const root = new URL("../", import.meta.url).pathname,
  url = process.env.LP_ART_URL ?? "http://localhost:5181/";
const browser = await chromium.launch({
  executablePath: "/usr/bin/chromium",
  args: [
    "--no-sandbox",
    "--use-angle=swiftshader",
    "--enable-unsafe-swiftshader",
  ],
});
try {
  const page = await browser.newPage();
  page.setDefaultTimeout(180000);
  page.on("pageerror", (e) => console.error(e));
  page.on("response", (r) => {
    if (r.status() >= 400) console.error(r.status(), r.url());
  });
  page.on("console", (m) => {
    if (m.type() === "error") console.error(m.text());
  });
  await page.goto(new URL("bake.html", url).href);
  await page.waitForFunction(() => window.bakeScene);
  for (let i = 0; i < 3; i++) {
    const result = await page.evaluate((i) => window.bakeScene(i), i);
    for (const key of ["image", "depth", "water"])
      await writeFile(
        root + `public/scene-${i}-${key}.${key === "image" ? "webp" : "png"}`,
        Buffer.from(result[key].split(",")[1], "base64"),
      );
    await writeFile(
      root + `public/scene-${i}-leaves.json`,
      JSON.stringify(result.leaves),
    );
    console.log("Baked volumetric painting", i);
  }
  const actor = await page.evaluate(() => window.bakeTraveller());
  await writeFile(
    root + "public/traveller.png",
    Buffer.from(actor.image.split(",")[1], "base64"),
  );
  await writeFile(root + "public/traveller.json", JSON.stringify(actor.meta));
  console.log("Baked eight-direction traveller");
} finally {
  await browser.close();
}
