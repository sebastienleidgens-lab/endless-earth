import {admitFeature} from '../src/planet/network.mjs';
import {terrainLayout} from '../src/planet/terrain-lod.mjs';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {ContactQueryCache} from '../src/planet/query-cache.mjs';
import {vehiclesOverlap,pedestrianNearVehicle} from '../src/planet/vehicle-space.mjs';
import {trafficLanePoint,trafficRenderHeight} from '../src/planet/traffic.mjs';
import {measureLine} from '../src/planet/transport-motion.mjs';
import {RouteIndex} from '../src/planet/route-index.mjs';
test('source-route avoidance finds a real alternative without editing coordinates or opening a forbidden edge',()=>{
 const nodes=[[0,0],[10,5],[20,0]],edges=[[0,1,Math.hypot(10,5),0,1],[0,2,20,1,1],[1,2,Math.hypot(10,5),0,1]],buffer=new ArrayBuffer(16+3*16+3*24+2*8),v=new DataView(buffer);v.setUint32(0,0x45455254);v.setUint32(4,3,true);v.setUint32(8,3,true);v.setUint32(12,2,true);let o=16;
 for(const [x,y]of nodes){v.setFloat64(o,x,true);v.setFloat64(o+8,y,true);o+=16;}for(const [a,b,d,s,m]of edges){v.setUint32(o,a,true);v.setUint32(o+4,b,true);v.setFloat64(o+8,d,true);v.setUint32(o+16,s,true);v.setUint32(o+20,m,true);o+=24;}v.setFloat64(o,123,true);v.setFloat64(o+8,456,true);
 const graph=new RouteIndex(new Uint8Array(buffer)),a={x:0,y:0},b={x:20,y:0};assert.deepEqual(graph.route(a,b).features,['osm:way:456']);const alternative=graph.route(a,b,'foot',{avoidSources:['osm:way:456']});assert.equal(alternative.complete,true);assert.equal(alternative.distance,2*Math.hypot(10,5));assert.deepEqual(alternative.features,['osm:way:123','osm:way:123']);assert.equal(graph.route(a,b,'foot',{avoidSources:['osm:way:123','osm:way:456']}).complete,false);
});
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
test('traffic uses an actual rendered support even while access waits; missing support never becomes NaN or a zero floor',()=>{
 assert.equal(trafficRenderHeight({ok:false,renderHeightRelative:true,renderedHeight:5,height:106},100),5);
 assert.equal(trafficRenderHeight({ok:false,renderHeightRelative:true,height:106},100),null);
 assert.equal(trafficRenderHeight({height:106},100),6);assert.equal(trafficRenderHeight(null,100),null);
});
test('contact caching cannot carry an unloaded floor or an old LOD across ownership revisions',()=>{
 const cache=new ContactQueryCache(2);let support=null;
 assert.equal(cache.get('p','loading',()=>support),null);support={height:10,face:2};
 assert.equal(cache.get('p','installed',()=>support).face,2);
 support={height:11,face:5};assert.equal(cache.get('p','refined',()=>support).height,11);
 support=null;assert.equal(cache.get('p','evicted',()=>support),null);
 for(let i=0;i<100;i++)cache.get(String(i),'evicted',()=>({height:i}));assert.ok(cache.values.size<=2);
 cache.invalidate();assert.equal(cache.values.size,0);
});
test('complete vehicle hulls let opposing lanes pass and retain front, crossing and pedestrian collisions',()=>{
 const a={x:1.2,z:0,heading:0},opposite={x:-1.2,z:0,heading:Math.PI};assert.equal(vehiclesOverlap(a,opposite),false);
 assert.equal(vehiclesOverlap(a,{x:1.2,z:3,heading:0}),true);assert.equal(vehiclesOverlap(a,{x:1.2,z:0,heading:Math.PI/2}),true);
 assert.equal(pedestrianNearVehicle({x:1.2,z:0},a),true);assert.equal(pedestrianNearVehicle({x:-1.2,z:0},a),false);
});
test('scenic lane positions keep the source direction, use the right side and stay centred on narrow roads',()=>{
 const north=measureLine([{x:0,y:0},{x:0,y:100}]),south=measureLine([{x:0,y:100},{x:0,y:0}]);
 assert.ok(Math.abs(trafficLanePoint(north,50,4.8).x-1.2)<1e-9);assert.ok(Math.abs(trafficLanePoint(south,50,4.8).x+1.2)<1e-9);
 assert.equal(trafficLanePoint(north,50,3.5).x,0);
 const before=trafficLanePoint(north,49.999,4.8),after=trafficLanePoint(north,50.001,4.8);assert.ok(Math.hypot(after.x-before.x,after.y-before.y)<.00201);
});
test('outside-France fixture declares its actual tile hash and the runtime elevation/optional-source contract',async()=>{
 const manifest=JSON.parse(await readFile('public/planet/validation-other-frame/manifest.json'));
 assert.equal(manifest.projection.origin.lon,-71);assert.equal(manifest.verticalDatum,'WGS84-ellipsoid');
 assert.ok(manifest.sources.elevation.source.includes('synthetic'));assert.equal(manifest.sources.elevation.inferred,true);
 assert.equal(manifest.sources.elevation.sha256,createHash('sha256').update(manifest.tiles.map(t=>t.sha256).join('')).digest('hex'));
 assert.equal(manifest.navigation,null);assert.equal(manifest.stations,null);assert.equal(manifest.overview,null);
});
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
