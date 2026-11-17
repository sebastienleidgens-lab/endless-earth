import {boundedBytes} from '../planet/tile-manager.mjs';

/** Attach an optional artistic sidecar without changing geographic source data.
 * A stale, corrupt or incomplete sidecar must never become physical authority. */
export async function attachEnrichmentManifest(tiles, url, fetcher = fetch) {
  const response = await fetcher(url);
  if (!response.ok) throw Error('Enrichment manifest unavailable: ' + response.status);
  const bytes = await boundedBytes(response.body, 2 * 1024 * 1024);
  const manifest = JSON.parse(new TextDecoder().decode(bytes));
  if (manifest.schema !== 'world-enrichment-manifest-v1' || !Array.isArray(manifest.tiles) || manifest.tiles.length !== tiles.length)
    throw Error('Incomplete enrichment manifest');
  const sources = new Map(tiles.map(tile => [tile.id, tile])), entries = new Map();
  for (const entry of manifest.tiles) {
    const source = sources.get(entry.id);
    if (!source || entries.has(entry.id) || entry.sourceSHA256 !== source.sha256 ||
        !/^[a-f0-9]{64}$/.test(entry.sha256) || !Number.isInteger(entry.bytes) || entry.bytes <= 0 || entry.bytes > 8 * 1024 * 1024 ||
        !Number.isInteger(entry.decodedBytes) || entry.decodedBytes <= 0 || entry.decodedBytes > 24 * 1024 * 1024 ||
        typeof entry.url !== 'string' || new URL(entry.url, url).origin !== new URL(url).origin)
      throw Error('Invalid or stale enrichment entry: ' + entry.id);
    entries.set(entry.id, entry);
  }
  return tiles.map(tile => {
    const entry = entries.get(tile.id);
    return {...tile, enrichment: {...entry, baseURL: String(url)},
      residentBytes: (tile.residentBytes ?? tile.decodedBytes) + entry.decodedBytes};
  });
}
