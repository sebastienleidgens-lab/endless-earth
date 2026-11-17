import test from 'node:test';
import assert from 'node:assert/strict';
import {gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {enrichTile,loadEnrichment,validateEnrichment} from '../src/enrichment/load.mjs';

const artifact={schema:'world-enrichment-v1',tileId:'a',pack:{id:'test',schema:'regional-enrichment-pack-v1'},buildings:[{id:'building/1',sourceId:'building/1',worldObjectId:'architecture/v1/building/1',version:'world-enrichment-v1',height:5,levels:2,roof:{type:'flat',height:0,color:0x777777},palette:{wall:0xaaaaaa,roof:0x777777,trim:0xffffff,glass:0x555555,wood:0x888888},facadeSpacing:3,windowWidth:1,windowHeight:1.2,doorEdge:0,shutters:false}],details:[{id:'detail/1',kind:'grass',x:1,y:2,scale:1,rotation:0}]};
function fixture(value=artifact){const decoded=Buffer.from(JSON.stringify(value)),packed=gzipSync(decoded);return {entry:{id:'a',url:'a.pack',bytes:packed.length,decodedBytes:decoded.length,sha256:createHash('sha256').update(packed).digest('hex')},fetcher:async()=>new Response(packed),packed};}

test('verified sidecar attaches bounded feature plans and leaves source geometry intact',async()=>{
 const {entry,fetcher}=fixture(),tile={id:'a',features:[{id:'building/1',kind:'building',points:[[1,2],[3,4]],tags:{building:'yes'}}]},source=structuredClone(tile);
 await enrichTile(tile,entry,'https://example.invalid/',new AbortController().signal,fetcher);
 assert.deepEqual(tile.features[0].points,source.features[0].points);assert.deepEqual(tile.features[0].tags,source.features[0].tags);
 assert.equal(tile.features[0].enrichmentPlan.id,'building/1');assert.equal(tile.enrichment.buildingCount,1);assert.equal(tile.enrichment.buildings,undefined);assert.equal(tile.enrichmentStatus.state,'verified');
});

test('corrupt optional art keeps geography but exposes a fallback receipt',async()=>{
 const {entry,fetcher}=fixture(),tile={id:'a',features:[]};entry.sha256='0'.repeat(64);
 await assert.rejects(()=>loadEnrichment(entry,'https://example.invalid/',new AbortController().signal,fetcher),/checksum/);
 await enrichTile(tile,entry,'https://example.invalid/',new AbortController().signal,fetcher);assert.equal(tile.enrichmentStatus.state,'fallback');assert.match(tile.enrichmentStatus.error,/checksum/);assert.equal(tile.enrichment,undefined);
});

test('sidecars reject wrong owners, duplicate identities and oversized decode budgets',async()=>{
 assert.throws(()=>validateEnrichment(artifact,'b'),/artefact/);
 assert.throws(()=>validateEnrichment({...artifact,buildings:[{id:'building/1',height:5}]},'a'),/building/);
 assert.throws(()=>validateEnrichment({...artifact,details:[artifact.details[0],artifact.details[0]]},'a'),/detail/);
 const {entry,fetcher}=fixture();entry.decodedBytes=30*1024*1024;await assert.rejects(()=>loadEnrichment(entry,'https://example.invalid/',new AbortController().signal,fetcher),/budget/);
});

test('abort cannot turn an interrupted sidecar load into successful fallback',async()=>{
 const {entry}=fixture(),controller=new AbortController();controller.abort();
 const fetcher=async()=>{throw controller.signal.reason;};await assert.rejects(()=>enrichTile({features:[]},entry,'https://example.invalid/',controller.signal,fetcher),{name:'AbortError'});
});
