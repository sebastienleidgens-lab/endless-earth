import test from 'node:test';
import assert from 'node:assert/strict';
import {TileStream} from '../src/world/tile-stream.mjs';
import {tileKey,tileForLocation} from '../src/world/tiles.mjs';
test('stream keeps a bounded number of visible tiles',async()=>{
 const removed=[];
 const stream=new TileStream({
  loader:{load:async tile=>({key:tileKey(tile),features:[]})},
  create:data=>({id:data.key}),dispose:(obj)=>removed.push(obj.id),
  zoom:12,radius:1,maxVisible:4
 });
 await stream.update(46.6953,.8844);
 assert.equal(stream.visible.size,4);
 await stream.update(48.8566,2.3522);
 assert.equal(stream.visible.size,4);
 assert.equal(removed.length,4);
 stream.destroy();
 assert.equal(stream.visible.size,0);
 assert.equal(removed.length,8);
});
test('outdated responses never mount after moving',async()=>{
 const pending=[];
 const stream=new TileStream({
  loader:{load:tile=>new Promise(resolve=>pending.push({key:tileKey(tile),resolve}))},
  create:data=>data,dispose:()=>{},zoom:12,radius:0
 });
 const first=stream.update(46.6953,.8844);
 const second=stream.update(48.8566,2.3522);
 pending[0].resolve({key:pending[0].key});
 pending[1].resolve({key:pending[1].key});
 await Promise.all([first,second]);
 assert.equal(stream.visible.size,1);
 assert.ok(stream.visible.has(tileKey(tileForLocation(48.8566,2.3522,12))));
 stream.destroy();
});
test('missing tiles do not create objects',async()=>{
 let created=0;
 const stream=new TileStream({loader:{load:async()=>null},create:()=>{created++;return{}},dispose:()=>{},radius:0});
 await stream.update(46.6953,.8844);
 assert.equal(created,0);
 stream.destroy();
});
