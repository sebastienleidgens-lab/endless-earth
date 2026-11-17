import { readFile, writeFile, stat, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
const out = new URL(
    "../../../docs/living-paintings-evidence/",
    import.meta.url,
  ),
  root = new URL("../", import.meta.url);
const read = async (name) =>
  JSON.parse(await readFile(new URL(name, out), "utf8"));
const [desktop, mobile, comparison, visual] = await Promise.all(
  ["desktop.json", "mobile.json", "comparison.json", "visual-check.json"].map(
    read,
  ),
);
const percentile = (a, p) => {
  const v = [...a].sort((a, b) => a - b);
  return v[Math.min(v.length - 1, Math.floor(p * v.length))];
};
const size = async (path) => (await stat(new URL(path, root))).size;
const buildAssets = await readdir(new URL("dist/assets/", root));
const initialFiles = [
  "dist/index.html",
  "dist/world.json",
  ...buildAssets.map((p) => "dist/assets/" + p),
  ...["image.webp", "depth.png", "water.png", "leaves.json"].map(
    (p) => "dist/scene-0-" + p,
  ),
];
const initialBytes = (await Promise.all(initialFiles.map(size))).reduce(
  (a, b) => a + b,
  0,
);
const allFiles = [
  "dist/index.html",
  "dist/world.json",
  ...buildAssets.map((p) => "dist/assets/" + p),
  ...[0, 1, 2].flatMap((i) =>
    ["image.webp", "depth.png", "water.png", "leaves.json"].map(
      (p) => `dist/scene-${i}-${p}`,
    ),
  ),
];
const allBytes = (await Promise.all(allFiles.map(size))).reduce(
  (a, b) => a + b,
  0,
);
const frames = (await read("walk-progress.json")).samples.flatMap(
  (s) => s.frames,
);
const rows = comparison.results.map((r) => ({
  name: r.name,
  readyMs: r.readyMs,
  heapBytes: r.heap,
  p50Ms: percentile(r.frames, 0.5),
  p95Ms: percentile(r.frames, 0.95),
  encodedResourceBytes: r.resources.reduce((a, b) => a + b.encodedBodySize, 0),
  errors: r.errors,
}));
const hashes = {};
for (let i = 0; i < 3; i++) {
  const data = await readFile(new URL(`public/scene-${i}-image.webp`, root));
  hashes[`scene-${i}`] = createHash("sha256").update(data).digest("hex");
}
const metrics = {
  initialBytes,
  initialDefinition:
    "Exact uncompressed file sum needed for first painting: HTML, JS/CSS, all world geometry, image0/depth0/water0/leaves0. No HTTP or TLS overhead; preloads can overlap initial display.",
  allBytes,
  decodedCacheEstimateBytes: desktop.finish.decodedBytes,
  decodedDefinition:
    "3*(2048*1280)*(4 RGBA image + 2 depth + 1 water) = 52.5 MiB. Lower bound excluding browser, canvases, decoder peaks and compositor. JS heap is separate and must not be naively added.",
  walk: {
    metres: desktop.finish.travelled,
    observedCompletionSeconds: desktop.realWalkSeconds,
    completionResolutionSeconds: 10,
    visits: desktop.finish.visits,
    transitionsMs: desktop.finish.transitions.map((t) => t.ms),
    p50FrameMs: percentile(frames, 0.5),
    p95FrameMs: percentile(frames, 0.95),
    heapAtEnd: desktop.finish.heap,
  },
  mobile: {
    readyMs: mobile.mobileReadyMs,
    p50FrameMs: percentile(mobile.state.frames, 0.5),
    p95FrameMs: percentile(mobile.state.frames, 0.95),
    heap: mobile.state.heap,
    physicalDevice: false,
  },
  comparison: rows,
  visibleAnimationPixels: visual.animation,
  hashes,
};
await writeFile(new URL("metrics.json", out), JSON.stringify(metrics, null, 2));
const mib = (n) => (n / 1048576).toFixed(2),
  fmt = (n) => n.toFixed(2);
const text = `# Mesures LP-01\n\nMesures locales Chromium, 10 novembre 2026. Le test mobile utilise l'émulation tactile ; aucun appareil physique testé. Les mesures 3D utilisent SwiftShader logiciel.\n\n| Mesure | Résultat |\n|---|---:|\n| Fichiers nécessaires au premier tableau, sans compression HTTP | ${mib(initialBytes)} Mio (${initialBytes} octets) |\n| Tous les tableaux et code, préchargement inclus | ${mib(allBytes)} Mio (${allBytes} octets) |\n| Cache décodé estimé, trois tableaux | ${mib(metrics.decodedCacheEstimateBytes)} Mio |\n| Marche réelle aller-retour | ${fmt(metrics.walk.metres)} m |\n| Détection de fin, sondage toutes les 10 s | ${fmt(metrics.walk.observedCompletionSeconds)} s |\n| Intervalles de frames en marche, médiane / p95 | ${fmt(metrics.walk.p50FrameMs)} / ${fmt(metrics.walk.p95FrameMs)} ms |\n| Transitions préchargées | ${metrics.walk.transitionsMs.map(fmt).join(" / ")} ms |\n| Heap JS en fin de marche | ${mib(metrics.walk.heapAtEnd)} Mio |\n| Mobile émulé, ouverture incluant 1,5 s de stabilisation | ${fmt(metrics.mobile.readyMs)} ms |\n| Mobile émulé, médiane / p95 | ${fmt(metrics.mobile.p50FrameMs)} / ${fmt(metrics.mobile.p95FrameMs)} ms |\n\nLe poids initial est une somme de fichiers, pas un forfait réseau. Le cache décodé est une borne basse ; il exclut les buffers du navigateur et les pointes de décodage. La heap Chromium est une mesure JS, pas la mémoire totale du processus ni celle d'un téléphone. La fin de marche est détectée à la prochaine interrogation de 10 s : ne pas traiter cette durée comme un chronométrage précis à la milliseconde.\n\n## Comparaison locale à la 3D\n\n| Build | Prêt | Intervalles médiane / p95 au repos | Heap JS | Corps de ressources chargées |\n|---|---:|---:|---:|---:|\n${rows.map((r) => `| ${r.name} | ${fmt(r.readyMs)} ms | ${fmt(r.p50Ms)} / ${fmt(r.p95Ms)} ms | ${mib(r.heapBytes)} Mio | ${mib(r.encodedResourceBytes)} Mio |`).join("\n")}\n\nPages fraîches successives à 1440 × 1080, DPR 1 ; 180 intervalles requestAnimationFrame au repos. Le build 3D provient d'un worktree détaché propre au commit 0f699fa (Mission 10.1) ; aucun code de production modifié. Les lieux/caméras et les périmètres rendus diffèrent. La mesure n'est pas un gain universel ni un test apparié sur GPU matériel. Les préchargements locaux et la charge de l'environnement peuvent modifier les résultats.\n\nAnimation : sur 1,2 seconde, ${visual.animation.water} pixels changés dans la région d'eau et ${visual.animation.foliage} dans les régions de feuillage, avec seuil RGB > 9. L'arrêt des animations produit ${visual.stillPixels} octet de pixel différent après 0,5 seconde. Le passage secondaire a été atteint dans le navigateur par clic et marche normale.\n\nSources : [desktop.json](desktop.json), [walk-progress.json](walk-progress.json), [mobile.json](mobile.json), [comparison.json](comparison.json), [visual-check.json](visual-check.json), [metrics.json](metrics.json).\n`;
await writeFile(new URL("metrics.md", out), text);
console.log(metrics);
