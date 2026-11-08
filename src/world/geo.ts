export const ANGLES = { name: "Angles-sur-l'Anglin", lat: 46.6953, lon: 0.8844 } as const;
export type GeoPoint = { lat: number; lon: number };
// Approximate local tangent plane in metres; suitable for a small village tile.
export function toLocal(p: GeoPoint, origin: GeoPoint = ANGLES) {
  const metresPerDegree = 111_320;
  return { x: (p.lon - origin.lon) * metresPerDegree * Math.cos(origin.lat * Math.PI / 180), z: -(p.lat - origin.lat) * metresPerDegree };
}
