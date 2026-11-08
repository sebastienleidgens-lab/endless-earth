import test from 'node:test';
import assert from 'node:assert/strict';
import {tileForLocation,tileBounds,tileKey,surroundingTiles} from '../src/world/tiles.mjs';
import {TileLoader} from '../src/world/tile-loader.mjs';
test('Angles-sur-l Anglin is within its global tile bounds',()=>{
 const p={lat:46.6953,lon:0.8844};
 const t=tileForLocation(p.lat,p.lon,14),b=tileBounds(t);
 assert.ok(p.lat>=b.south&&p.lat<=b.north&&p.lon>=b.west&&p.lon<=b.east);
 assert.equal(tileKey(t),`14/${t.x}/${t.y}`);
});
test('antimeridian wrapping and polar clamp',()=>{
 assert.deepEqual(tileForLocation(0,180,3),tileForLocation(0,-180,3));
 assert.equal(tileForLocation(90,0,3).y,0);
 assert.equal(new Set(surroundingTiles(0,179.99,2,1).map(tileKey)).size,9);
});
test('deduplicates in-flight requests and caches successful tiles',async()=>{
 let calls=0;const tile=tileForLocation(46.6953,.8844,12);
 const loader=new TileLoader({baseUrl:'/tiles',fetchImpl:async()=>{calls++;return {ok:true,json:async()=>({schema:'endless-earth-tile-v1',key:tileKey(tile),features:[]})}}});
 const [a,b]=await Promise.all([loader.load(tile),loader.load(tile)]);
 assert.deepEqual(a,b);await loader.load(tile);assert.equal(calls,1);
});
test('404 is not cached',async()=>{
 let calls=0;const tile=tileForLocation(0,0,3);
 const loader=new TileLoader({baseUrl:'/tiles',fetchImpl:async()=>{calls++;return {status:404,ok:false}}});
 assert.equal(await loader.load(tile),null);assert.equal(await loader.load(tile),null);assert.equal(calls,2);
});
