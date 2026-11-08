import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp,readFile,rm,writeFile } from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {buildTileIndex,buildTiles} from '../scripts/build-tiles.mjs';
import {tileForLocation,tileKey} from '../src/world/tiles.mjs';
const point=(lon,lat,id)=>({type:'Feature',id,properties:{source:'fixture'},geometry:{type:'Point',coordinates:[lon,lat]}});
test('assigns verified geographic features to stable tiles',()=>{
 const collection={type:'FeatureCollection',features:[point(.8844,46.6953,'angles'),point(2.3522,48.8566,'paris')]};
 const {tiles,skipped}=buildTileIndex(collection,12);
 assert.equal(skipped,0);assert.equal(tiles.size,2);
 assert.equal(tiles.get(tileKey(tileForLocation(46.6953,.8844,12)))[0].id,'angles');
});
test('writes a versioned manifest and tile files',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'earth-tiles-'));
 try{
  const input=join(dir,'source.geojson'),output=join(dir,'tiles');
  await writeFile(input,JSON.stringify({type:'FeatureCollection',features:[point(.8844,46.6953,'angles')]}));
  const manifest=await buildTiles({input,output,zoom:14});
  assert.equal(manifest.tileCount,1);
  const file=join(output,...manifest.tiles[0].split('/'))+'.json';
  const tile=JSON.parse(await readFile(file,'utf8'));
  assert.equal(tile.features[0].id,'angles');
  assert.equal(tile.key,manifest.tiles[0]);
 }finally{await rm(dir,{recursive:true,force:true});}
});
test('refuses empty data rather than inventing geography',()=>{
 assert.throws(()=>buildTileIndex({type:'FeatureCollection',features:null}),/FeatureCollection/);
});
