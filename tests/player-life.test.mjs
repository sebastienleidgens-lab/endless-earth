import test from 'node:test';import assert from 'node:assert/strict';import * as THREE from 'three';
import {createPlayerWorld} from '../src/player/world.mjs';
import {PlayerActivity} from '../src/player/activity.mjs';
import {createFootprints} from '../src/player/footprints.mjs';
import {createCamp} from '../src/player/camp.mjs';
import {createWalker} from '../src/character/walker.mjs';
import {heatingAnchors,hearthStrength} from '../src/life/heating.mjs';
import {WorldLifeBudget,lifeProfile} from '../src/earthlife/budget.mjs';
const support=(x,z)=>({id:'face:flat',height:0,normal:{x:0,y:1,z:0},slope:0,visible:true,walkable:true,category:'terrain'}),world=extra=>createPlayerWorld({support,clear:()=>true,collision:()=>({obstacle:null}),...extra}),snow={snow:{cover:1},groundSnowAt:()=>({cover:1,depthM:.065,temperature:-3,phase:'covered'})},contact=(id,x=0,z=0)=>({id,position:{x,y:0,z},heading:0,side:id%2?1:-1,confirmed:true,run:0});
test('impressions require a confirmed post-IK contact, meaningful coating and exact continuous visible support',()=>{
 const w=world();assert.ok(w.footprint(contact(1),snow).ok);for(const c of [{...contact(1),confirmed:false},{...contact(1),side:0},{...contact(1),heading:NaN},{...contact(1),position:{x:0,y:1,z:0}}])assert.equal(w.footprint(c,snow).ok,false);
 for(const s of [{cover:.1,depthM:.065},{cover:1,depthM:.002}])assert.equal(w.footprint(contact(1),{groundSnowAt:()=>s}).ok,false);
 for(const s of [()=>null,(x,z)=>({...support(x,z),category:'water'}),(x,z)=>({...support(x,z),visible:false}),(x,z)=>x>.05?null:support(x,z)])assert.equal(world({support:s}).footprint(contact(1),snow).ok,false);
 const slope=world({support:(x,z)=>({...support(x,z),height:x*.2,normal:{x:-.196116,y:.980581,z:0},slope:.2})});const result=slope.footprint(contact(1),snow);assert.ok(result.ok);assert.equal(result.points.length,15);for(const p of result.points)assert.ok(Math.abs(p.y-p.x*.2)<1e-12);
});
test('snow traces persist behind the traveler, stay bounded, stop on teleports and fade out with melt/age',()=>{
 const scene=new THREE.Scene(),f=createFootprints(scene),w=world(),p={x:0,z:0};f.update(.016,p,snow,[contact(1)],w);assert.equal(f.metrics.total,1);f.update(1,{x:2,z:0},snow,[],w);assert.equal(f.metrics.active,1);
 f.update(.016,{x:100,z:0},snow,[contact(2,100)],w);assert.equal(f.metrics.total,1,'diagnostic teleport may not stamp a contact');
 for(let i=3;i<450;i++)f.update(.016,{x:100,z:0},snow,[contact(i,100)],w,'eco');assert.ok(f.metrics.active<=96);assert.equal(f.mesh.geometry.drawRange.count,96*48);
 f.update(1,{x:100,z:0},{...snow,snow:{cover:0}},[],w);assert.equal(f.metrics.active,0);assert.equal(f.mesh.visible,false);f.dispose();assert.equal(scene.children.length,0);
});
test('camp spatial validation refuses roads, banks, trees, holes, restrictions and steep or obstructed ground',()=>{
 const safe=world().camp({x:0,z:0},.4);assert.ok(safe.ok);assert.equal(safe.layout.pegs.length,4);for(const p of safe.layout.pegs)assert.equal(p.y,0);
 const cases=[{roads:[{points:[{x:-20,z:0},{x:20,z:0}],tags:{highway:'residential'}}]},{banks:[[{x:-20,z:2},{x:20,z:2}]]},{trees:[{x:-1.8,z:0}]},{support:()=>null},{restricted:[[{x:-4,z:-4},{x:4,z:-4},{x:4,z:4},{x:-4,z:4}]]},{support:(x,z)=>({...support(x,z),slope:.5})},{clear:(x,z)=>x<-.5},{support:(x,z)=>({...support(x,z),category:'water'})}];
 for(const c of cases)assert.equal(world(c).camp({x:0,z:0},0).ok,false);
});
test('ten complete transactional camp cycles commit once, ignore repeated clicks and release all smoke leases',()=>{
 const scene=new THREE.Scene(),walker=createWalker(),c=createCamp(scene,()=>walker.packGeometry()),a=new PlayerActivity(),w=world(),budget=new WorldLifeBudget(lifeProfile('balanced'));scene.userData.lifeBudget=budget;const original=walker.avatar.children[0].geometry.attributes.position.array.slice(),site=w.camp({x:0,z:0},0);
 const step=()=>a.update(.25,()=>site,(state,layout)=>state==='camping'?c.install(layout,w.query):c.clear());
 for(let n=0;n<10;n++){
  assert.ok(a.toggleCamp(()=>site).ok);for(let j=0;j<4;j++)assert.equal(a.toggleCamp(()=>site).ok,false);for(let j=0;j<4;j++)step();assert.equal(a.state,'camping');c.update({elapsedSeconds:n,wind:{x:.3,z:-.2}},'balanced');assert.equal(c.metrics.objects,3);assert.equal(c.root.children.length,4);assert.equal(budget.allocated.particles,1);
  assert.ok(a.toggleCamp(()=>site).ok);for(let j=0;j<4;j++)step();assert.equal(a.state,'walking');assert.equal(c.metrics.active,false);assert.equal(budget.allocated.particles,0);
 }
 assert.equal(c.metrics.installations,10);assert.equal(c.metrics.removals,10);assert.deepEqual(walker.avatar.children[0].geometry.attributes.position.array,original);c.dispose();walker.dispose();assert.equal(scene.children.length,0);
});
test('invalidated camp placement rolls back, while a lost-focus sized dt cannot duplicate or strand a transition',()=>{
 const a=new PlayerActivity(),site=world().camp({x:0,z:0},0),commits=[];a.toggleCamp(()=>site);a.update(.25,()=>({ok:false,reason:'obstacle'}),s=>commits.push(s));a.update(90,()=>({ok:false,reason:'obstacle'}),s=>commits.push(s));for(let i=0;i<4;i++)a.update(.25,()=>site,s=>commits.push(s));assert.equal(a.state,'walking');assert.deepEqual(commits,['walking']);assert.equal(a.camp,null);
});
test('heating belongs only to a matched eligible building; cold deterministic occupancy is high and summer sparse',()=>{
 const ring=[{x:-2,z:-2},{x:2,z:-2},{x:2,z:2},{x:-2,z:2}],caps=[{id:'cap',x:0,y:8,z:0},{id:'outside',x:10,y:8,z:0}],a=heatingAnchors(caps,[{id:1,ring,height:8,tags:{building:'house'}}]);assert.equal(a.length,1);assert.equal(heatingAnchors(caps,[{id:1,ring,height:8,tags:{building:'church'}}]).length,0);
 const anchors=Array.from({length:400},(_,i)=>({...a[0],buildingId:String(i),phase:i/400})),winter={localHour:20,elapsedSeconds:77,season:'winter',metrics:{temperatureC:-3}},summer={...winter,season:'summer',metrics:{temperatureC:24}};const active=anchors.filter(a=>hearthStrength(a,winter)>.1).length;assert.ok(active>260&&active<395);assert.equal(anchors.filter(a=>hearthStrength(a,summer)>.1).length,0);for(const a of anchors)assert.equal(hearthStrength(a,winter),hearthStrength(a,{...winter}));
});
test('traveler pack remains one draw and ground gait publishes confirmed alternating contacts after low-FPS IK',()=>{
 const w=createWalker(),scene=new THREE.Scene();scene.add(w.avatar);assert.equal(w.metrics.drawCalls,1);assert.ok(w.metrics.triangles===w.metrics.lodTriangles[0]&&w.metrics.lodTriangles[1]<w.metrics.lodTriangles[0]&&w.metrics.bones===31);const source=w.avatar.children[0].geometry,pack=w.packGeometry();assert.ok(pack.index.count>300);let previous=0,count=0;
 for(let i=0;i<60;i++){w.avatar.position.z+=.35;const m=w.update(.35,.25,()=>0);for(const c of m.footContacts){assert.ok(c.id>previous);assert.ok(c.confirmed);assert.ok(Number.isFinite(c.heading));previous=c.id;count++;}}assert.ok(count>20);w.avatar.position.x+=100;assert.equal(w.update(100,.25,()=>0).footContacts.length,0);
 w.update(0,.25,()=>0,{kind:'camping'});assert.equal(w.metrics.mode,'camping');assert.ok(w.hips.position.y<.6);for(let i=0;i<30;i++)w.update(0,1/60,()=>0);assert.ok(w.hips.position.y>=.72);pack.dispose();w.dispose();
});

test('near GPU wind uses the shared tested flexibility limit; coarse cached wind keeps its CPU equation',async()=>{
 const {readFile}=await import('node:fs/promises'),shader=await readFile('src/nature/forest-material.ts','utf8'),cpu=await readFile('src/nature/forest-life.mjs','utf8');
 const coarse=shader.split('#if LIFE_WIND_MODE == 1')[1].split('#elif LIFE_WIND_MODE == 2')[0],near=shader.split('#elif LIFE_WIND_MODE == 2')[1];
 assert.ok(coarse.includes('float gain=forestData.y*forestForm.w*lifeVegetation;'));assert.ok(near.includes('float gain=min(forestData.y,${FOREST_BRANCH_FLEX_LIMIT})*forestForm.w*lifeVegetation;'));assert.ok(cpu.includes('Math.min(flex,FOREST_BRANCH_FLEX_LIMIT)'));
});

test('a narrow unsupported tent peg is rejected even when the surrounding site grid is valid',()=>{
 const w=world({support:(x,z)=>Math.hypot(x+2.65,z+.9)<.02?null:support(x,z)});assert.equal(w.camp({x:0,z:0},0).ok,false);
});
