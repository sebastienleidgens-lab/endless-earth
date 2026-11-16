import {admitFeature} from '../src/planet/network.mjs';
import {terrainLayout} from '../src/planet/terrain-lod.mjs';
import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {prepareGeometry} from '../src/planet/geometry-preparation.mjs';
import {PlanetSurface} from '../src/planet/surface.mjs';
import {areaAccess} from '../src/planet/access.mjs';
import {cyclicCurve} from '../src/character/cyclic-curve.mjs';
import {perchFlightAt} from '../src/earthlife/fauna.mjs';
import {createWalker} from '../src/character/walker.mjs';
const finish=g=>{let s;do{s=g.next();}while(!s.done);return s.value;};
test('LOD identity stays stable at rest, skips distant rebuilds and includes remote parked support',()=>{
 const tile={bounds:[0,0,4096,4096],grid:{size:33},contact:{step:2}},local=(x,y)=>({x,z:-y});
 const at=focus=>terrainLayout(tile,{local,focus,profile:'eco'});
 const a=at({x:20000,z:20000}),b=at({x:21000,z:21000});assert.equal(a.key,b.key);
 const near=at({x:100,z:-100});assert.notEqual(a.key,near.key);
 const two=terrainLayout(tile,{local,focus:{x:100,z:-100},goal:{x:100,z:-100,extra:[{x:3900,z:-3900}]},profile:'eco'});
 assert.equal(two.strides.get('30,30'),2);assert.notEqual(two.key,near.key);
});
test('all unverified bridge/tunnel types stay closed, public primary foot links follow declared policy',()=>{
 for(const bridge of ['yes','viaduct','boardwalk','low_water_crossing'])assert.equal(admitFeature({highway:'primary',bridge},'foot').ok,false);
 assert.equal(admitFeature({highway:'primary',tunnel:'building_passage'},'car').ok,false);
 assert.equal(admitFeature({highway:'primary'},'foot',{publicRoadClasses:true}).ok,true);
 assert.equal(admitFeature({highway:'primary'},'foot',{publicRoadClasses:false}).ok,false);
});
test('a nearby narrow path cannot block a position inside another public road corridor',()=>{
 const s=new PlanetSurface({tileSize:100,accessDefaults:{publicRoadClasses:true}}),tile={id:'0:0',bounds:[0,0,100,100],grid:{size:2,heights:[0,0,0,0]},features:[{id:'narrow',kind:'road',tags:{highway:'footway',width:'1'},points:[[0,48],[100,48]]},{id:'wide',kind:'road',tags:{highway:'residential',width:'8'},points:[[0,52],[100,52]]}]};s.add(tile);
 const result=s.admission({x:50,y:49});assert.equal(result.ok,true);assert.equal(result.road,'wide');
});
test('named structures and uncertain access never silently become at-grade public roads',()=>{
 for(const bridge of ['yes','viaduct','boardwalk','movable','low_water_crossing'])assert.equal(admitFeature({highway:'primary',bridge},'car').ok,false);
 assert.equal(admitFeature({highway:'path',tunnel:'culvert'},'foot').ok,false);
 assert.equal(admitFeature({highway:'path',access:'unknown'},'foot').ok,false);
 assert.equal(admitFeature({highway:'path','foot:conditional':'no @ (sunset-sunrise)'},'foot').ok,false);
 assert.equal(admitFeature({highway:'primary'},'foot',{publicRoadClasses:true}).ok,true);
 assert.equal(admitFeature({highway:'primary'},'foot',{publicRoadClasses:false}).ok,false);
});
test('sliced geometry retains Three.js area-weighted normals, finite bounds and all vertices',()=>{
 const g=new THREE.PlaneGeometry(20,20,8,8);g.rotateX(-Math.PI/2);
 const p=g.attributes.position;for(let i=0;i<p.count;i++)p.setY(i,Math.sin(p.getX(i))*.4+p.getZ(i)*.2);
 g.computeVertexNormals();g.computeBoundingSphere();const before=Array.from(p.array);
 const prepared=finish(prepareGeometry(p.array,g.index.array));
 assert.deepEqual(Array.from(p.array),before);for(let i=0;i<prepared.normals.length;i++)assert.ok(Math.abs(prepared.normals[i]-g.attributes.normal.array[i])<1e-6);
 assert.ok(Math.abs(prepared.radius-g.boundingSphere.radius)<1e-7);g.dispose();
});
test('documented area access opens off-road ground but never private, unknown, rail or motorway',()=>{
 const s=new PlanetSurface({tileSize:100,accessDefaults:{publicRoadClasses:true}});
 const area={id:'public-park',kind:'landcover',polygon:true,points:[[0,0],[100,0],[100,100],[0,100],[0,0]],tags:{leisure:'park',access:'yes'}};
 const tile={id:'0:0',bounds:[0,0,100,100],grid:{size:2,heights:[0,0,0,0],datum:'IGN69'},features:[area]};s.add(tile);
 assert.equal(s.admission({x:50,y:50}).ok,true);assert.equal(s.admission({x:50,y:50},'car').ok,false);
 assert.equal(s.admission({x:.1,y:50}).ok,false);assert.equal(areaAccess({...area,tags:{natural:'wood'}}).state,'unknown');
 assert.equal(areaAccess({...area,tags:{access:'private',foot:'yes'}}).state,'known-disallowed');
 assert.equal(areaAccess({...area,tags:{access:'yes','foot:conditional':'no @ sunset'}}).state,'unknown');
 const rail={id:'rail',kind:'rail',points:[[0,40],[100,40]],tags:{railway:'rail'}};
 const motorway={id:'motorway',kind:'road',points:[[0,20],[100,20]],tags:{highway:'motorway'}};
 s.add({...tile,id:'1:0',features:[rail,motorway]});
 assert.equal(s.admission({x:50,y:40}).reason,'unverified-rail-crossing');assert.equal(s.admission({x:50,y:20}).reason,'pedestrian-access');
 s.add({...tile,id:'2:0',features:[{...area,id:'private',tags:{access:'private'}}]});assert.equal(s.admission({x:50,y:50}).ok,false);
});
test('periodic authored keys share their tangent across internal keys and cycle wrap',()=>{
 const k=[[0,0],[.2,1],[.6,-1],[1,0]],eps=1e-6;
 for(const q of [0,.2,.6]){const left=(cyclicCurve(k,q,1)-cyclicCurve(k,q-eps,1))/eps,right=(cyclicCurve(k,q+eps,1)-cyclicCurve(k,q,1))/eps;assert.ok(Math.abs(left-right)<.001);}
});
test('branch flight reaches both source perches with zero endpoint velocity',()=>{
 const a={x:1,y:5,z:2},b={x:15,y:8,z:-6};for(const [time,p]of [[0,a],[12,b]]){const s=perchFlightAt(time,a,b);for(const k of ['x','y','z'])assert.ok(Math.abs(s[k]-p[k])<1e-10);assert.ok(Math.hypot(s.vx,s.vy,s.vz)<1e-10);assert.equal(Math.abs(s.pitch),0);}
 const s=perchFlightAt(6,a,b);assert.ok(s.y>Math.max(a.y,b.y));assert.ok(s.vx>0&&s.vz<0);
});
test('periodic gait preserves planted contacts on flat ground and continuous slopes',()=>{
 for(const speed of [1.45,3.2])for(const grade of [0,.15]){const w=createWalker(),h=(x,z)=>z*grade;w.update(0,1/60,h);for(let i=0;i<720;i++){w.avatar.position.z+=speed/60;w.avatar.position.y=h(0,w.avatar.position.z);w.update(speed/60,1/60,h);assert.ok(w.metrics.plantError<.035);assert.ok(w.metrics.plantSlideM<.035);}w.dispose();}
});
