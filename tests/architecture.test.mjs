import {test} from 'node:test';
import assert from 'node:assert/strict';
import {buildingPlan,edgeKey,detailVisible,metres} from '../src/architecture/plan.mjs';
import {POITOU} from '../src/architecture/style.mjs';
const ring=[{x:0,z:0},{x:12,z:0},{x:12,z:8},{x:0,z:8}];
const serial=p=>JSON.parse(JSON.stringify(p));
test('regional plans are deterministic, order independent and configurable without geography',()=>{
 const a=buildingPlan(ring,{osm_id:42});assert.deepEqual(serial(a),serial(buildingPlan(ring,{osm_id:42})));
 const b=buildingPlan([...ring].reverse(),{osm_id:42});assert.equal(a.seed,b.seed);assert.equal(a.wall,b.wall);assert.equal(a.roof,b.roof);
 assert.deepEqual(a.openings.map(({edge,...o})=>[o.x,o.z,o.kind]),b.openings.map(({edge,...o})=>[o.x,o.z,o.kind]));
 const c=buildingPlan(ring.map(p=>({x:p.x+10000,z:p.z-8000})),{osm_id:42});assert.equal(a.seed,c.seed);assert.equal(a.total,c.total);
 assert.equal(buildingPlan(ring,{}, {...POITOU,id:'future-style',walls:[0xffffff]}).wall,0);
 const variants=new Set(Array.from({length:30},(_,i)=>{const p=buildingPlan(ring,{osm_id:i});return [p.wall,p.roof,p.shutter,p.total].join(':')}));assert.ok(variants.size>20);
});
test('heights respect explicit OSM total and units, levels, slopes and small buildings',()=>{
 assert.equal(metres('8,5 m'),8.5);assert.equal(metres('30 ft'),null);
 const p=buildingPlan(ring,{height:'9 m','roof:height':'2 m'},undefined,undefined,(x,z)=>z*.2);
 assert.equal(p.top,10.6);assert.equal(p.rise,2);assert.equal(p.base,0);assert.equal(p.inferred.height,false);
 assert.equal(buildingPlan(ring,{'building:levels':'3'}).total,3*2.9+1.6);
 assert.ok(buildingPlan(ring,{building:'shed'}).total<4);
 assert.equal(buildingPlan(ring,{'roof:shape':'flat'}).rise,0);
 assert.equal(buildingPlan([{x:0,z:0},{x:NaN,z:0},{x:1,z:1}]),null);
});
test('openings have corner margins, valid headroom and ground attached doors; shared walls stay closed',()=>{
 const p=buildingPlan(ring,{},POITOU,new Set([edgeKey(ring[0],ring[1])]),(x,z)=>z*.12);
 assert.ok(p.openings.length);assert.ok(p.anchors.length);
 for(const o of p.openings){assert.notEqual(o.edge,0);assert.ok(o.s-o.width/2>=.65);assert.ok(o.s+o.width/2<=p.edges[o.edge].length-.65);assert.ok(o.bottom+o.height<=p.eaves-.28+1e-9);if(o.kind==='door')assert.ok(Math.abs(o.bottom-o.z*.12-.025)<1e-8)}
 assert.ok(p.anchors.every(a=>!a.interactive));
});
test('concave footprints have continuous bounded pitched roofs and explicit roof modes',()=>{
 const concave=[{x:0,z:0},{x:12,z:0},{x:12,z:4},{x:5,z:4},{x:5,z:10},{x:0,z:10}];
 for(const shape of ['gabled','flat','hipped','pyramidal','unsupported']){
  const p=buildingPlan(concave,{'roof:shape':shape});for(const q of [...concave,{x:2,z:2}]){const y=p.roofY(q);assert.ok(Number.isFinite(y));assert.ok(y>=p.eaves-1e-8&&y<=p.top+1e-8)}
 }
});
test('detail LOD has quality limits and hysteresis without changing a plan',()=>{
 assert.equal(detailVisible(false,70,true),false);assert.equal(detailVisible(true,70,true),true);assert.equal(detailVisible(true,78,true),false);
 assert.equal(detailVisible(false,110,false),true);assert.equal(detailVisible(false,140,false),false);
});
