import {test} from 'node:test';
import assert from 'node:assert/strict';
import {allowed,planRoute,AutoWalk,windAt,surfaceKind} from '../src/living/walk.mjs';
test('auto walk excludes restricted and unsupported roads',()=>{
 for(const tags of [{highway:'motorway'},{highway:'footway',access:'private'},{highway:'path',bridge:'yes'},{highway:'path',tunnel:'yes'},{highway:'path','foot:conditional':'yes @ Mo'}])assert.equal(allowed(tags),false);
 assert.equal(allowed({highway:'residential'}),true);
});
const line={points:[{x:0,z:0},{x:5,z:0},{x:10,z:0}],name:'Test',surface:'gravel'};
test('planning never connects a remote position and stops before obstacles',()=>{
 assert.equal(planRoute([line],{x:0,z:5},()=>true),null);
 const route=planRoute([line],{x:0,z:0},p=>p.x<7);assert.equal(route.length,5);
});
test('walk accelerates, reaches end without teleport and can be interrupted',()=>{
 const walk=new AutoWalk();walk.start(planRoute([line],{x:0,z:0},()=>true));
 const p={x:0,z:0};let last=0;
 for(let i=0;i<2000&&walk.active;i++){const d=walk.update(p,.02,()=>true);assert.ok(Math.hypot(d.x,d.z)<=1.35*.02+.00001);p.x+=d.x;p.z+=d.z;last=p.x;}
 assert.ok(Math.abs(last-10)<.02);assert.equal(walk.active,false);
 walk.start(planRoute([line],{x:0,z:0},()=>true));walk.stop('manual');assert.deepEqual(walk.update(p,.02,()=>true),{x:0,z:0});
});
test('dynamic obstacle stops safely',()=>{const w=new AutoWalk();w.start(planRoute([line],{x:0,z:0},()=>true));assert.deepEqual(w.update({x:0,z:0},.02,()=>false),{x:0,z:0});assert.match(w.message,/bloqué/);});
test('bounded smooth wind and four surface mappings',()=>{
 for(let t=0;t<100;t+=.1){assert.ok(windAt(t)>.1&&windAt(t)<.8);assert.ok(Math.abs(windAt(t)-windAt(t+.01))<.01);}
 assert.deepEqual(['grass','ground','gravel','asphalt'].map(surfaceKind),['herbe','terre','gravier','route']);
});
