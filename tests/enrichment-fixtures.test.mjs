import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {gunzipSync} from 'node:zlib';
import {WorldTileManager,tileLoader} from '../src/planet/tile-manager.mjs';
import {PlanetSurface,sampleTile} from '../src/planet/surface.mjs';
import {JourneyStorage} from '../src/planet/save.mjs';
import {attachEnrichmentManifest} from '../src/enrichment/manifest.mjs';
import {enrichTile} from '../src/enrichment/load.mjs';

const fetchLocal=async url=>{
 const path=resolve('public','.'+new URL(url).pathname);
 try{return new Response(await readFile(path));}
 catch{return new Response('',{status:404});}
};
async function settle(manager){
 const start=performance.now();
 while(manager.pending.size){
  if(performance.now()-start>5000)throw Error('Fixture load timeout');
  await new Promise(resolve=>setTimeout(resolve,2));
 }
 assert.equal(manager.failed.size,0,JSON.stringify([...manager.failed]));
}

for(const kind of ['mountain','tropical'])test(`${kind} fixture keeps source support, building collision, identity and save across real sidecar eviction`,async()=>{
 const base=new URL(`https://fixture.invalid/planet/validation-m27-${kind}/manifest.json`),manifest=await(await fetchLocal(base)).json();
 assert.equal(manifest.fixture.synthetic,true);
 assert.equal(manifest.fixture.realGeography,false);
 assert.equal(manifest.verticalDatum,'WGS84-ellipsoid');
 const entries=await attachEnrichmentManifest(manifest.tiles,new URL(manifest.enrichmentManifest,base),fetchLocal);
 const loader=tileLoader(base,fetchLocal),surface=new PlanetSurface(manifest),identities=new Map(),first=new Map();
 const manager=new WorldTileManager({...manifest,tiles:entries},{capacity:2,concurrency:2,byteBudget:8*1024*1024,
  load:async(entry,signal)=>enrichTile(await loader(entry,signal),entry.enrichment,base,signal,fetchLocal),
  onLoad(tile){
   assert.equal(tile.enrichmentStatus.state,'verified');
   assert.equal(tile.enrichment.pack.fixture,true);
   const ids=[...tile.features.filter(f=>f.enrichmentPlan).map(f=>f.enrichmentPlan.worldObjectId),...tile.enrichment.details.map(d=>d.id)].sort();
   if(first.has(tile.id))assert.deepEqual(ids,first.get(tile.id));else first.set(tile.id,ids);
   identities.set(tile.id,ids);surface.add(tile);
  },
  onUnload(tile){surface.remove(tile);identities.delete(tile.id);}
 });
 try{
  manager.demand(entries.slice(0,2).map((e,i)=>({id:e.id,priority:i})));await settle(manager);
  assert.equal(manager.resident.size,2);
  assert.equal(surface.admission(manifest.fixture.spawnCanonical).ok,true);
  assert.equal(surface.admission(manifest.fixture.buildingCanonical).reason,'mapped-obstacle');
  const snapshot=structuredClone(first.get('0:0'));
  manager.demand(entries.slice(2).map((e,i)=>({id:e.id,priority:i})));await settle(manager);
  assert.equal(manager.resident.size,2);
  assert.equal(surface.admission(manifest.fixture.spawnCanonical).reason,'tile-loading');
  manager.demand(entries.slice(0,2).map((e,i)=>({id:e.id,priority:i})));await settle(manager);
  assert.deepEqual(identities.get('0:0'),snapshot);
  assert.equal(manager.metrics.loaded,6);assert.equal(manager.metrics.unloaded,4);
  assert.equal(surface.admission(manifest.fixture.buildingCanonical).reason,'mapped-obstacle');
  const memory=new Map(),storage=new JourneyStorage({getItem:key=>memory.get(key),setItem:(key,value)=>memory.set(key,value)});
  const saved={schema:'planet-journey-v2',region:manifest.id,position:manifest.fixture.spawn,heading:0,activity:'walking',vehicle:null,extensions:{},map:{center:manifest.fixture.spawnCanonical},route:null};
  assert.equal(storage.write(saved),true);
  const result=await storage.resume(async()=>{},()=>surface.admission(manifest.fixture.spawnCanonical).ok);
  assert.equal(result.ok,true);assert.deepEqual(result.value,saved);
  const left=JSON.parse(gunzipSync(await readFile(`public/planet/validation-m27-${kind}/tiles/0-0.tile`))),right=JSON.parse(gunzipSync(await readFile(`public/planet/validation-m27-${kind}/tiles/1-0.tile`)));
  for(const y of [0,32,192,384,512])assert.ok(Math.abs(sampleTile(left,{x:512,y}).height-sampleTile(right,{x:512,y}).height)<1e-7);
 }finally{manager.dispose();}
});
