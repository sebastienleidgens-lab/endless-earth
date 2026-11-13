// The depth image stores ground-plane depth in centimetres, relative to scene centre.
// The camera sits on the negative-depth side: greater depth is farther away.
// 65535 is the transparent/no-occluder sentinel, not an infinitely near wall.
export function occluded(data, width, height, x, y, actorDepth, centerDepth) {
  x = Math.round(x);
  y = Math.round(y);
  if (x < 0 || y < 0 || x >= width || y >= height) return true;
  const raw = data[y * width + x];
  return raw !== 65535 && actorDepth > raw / 100 - 300 + centerDepth + 0.18;
}
