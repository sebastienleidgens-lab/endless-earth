import test from 'node:test';
import assert from 'node:assert/strict';
import {attachEnrichmentManifest} from '../src/enrichment/manifest.mjs';

const source = {id:'a',sha256:'a'.repeat(64),decodedBytes:100,residentBytes:200};
const entry = {id:'a',sourceSHA256:source.sha256,sha256:'b'.repeat(64),url:'a.pack',bytes:30,decodedBytes:50};
const response = tiles => async () => new Response(JSON.stringify({schema:'world-enrichment-manifest-v1',tiles}));
test('artistic sidecars bind exact geographic bytes, account for residency, and preserve source entries', async () => {
  const result = await attachEnrichmentManifest([source], 'https://example.org/enrichment/manifest.json', response([entry]));
  assert.equal(result[0].residentBytes,250);
  assert.equal(result[0].enrichment.baseURL,'https://example.org/enrichment/manifest.json');
  assert.equal(source.enrichment,undefined);
  assert.equal(result[0].sha256,source.sha256);
});
test('missing, duplicate, stale, cross-origin and oversized sidecars fail explicitly', async () => {
  for (const entries of [[],[entry,entry],[{...entry,sourceSHA256:'c'.repeat(64)}],[{...entry,url:'https://other.org/a.pack'}],[{...entry,decodedBytes:30*1024*1024}]])
    await assert.rejects(attachEnrichmentManifest([source], 'https://example.org/enrichment/manifest.json', response(entries)));
  await assert.rejects(attachEnrichmentManifest([source], 'https://example.org/enrichment/manifest.json', async()=>new Response('',{status:503})),/503/);
});
