import test from 'node:test';import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';import {gunzipSync} from 'node:zlib';
import {moveGrounded} from '../src/controls/walking.mjs';
import {nightLight} from '../src/nature/night-light.mjs';
import {lunar,lunarVisibility} from '../src/nature/moon.mjs';
import {VillageSoundMemory} from '../src/audio/village-memory.mjs';
import {socialPose} from '../src/life/village-motion.mjs';
import {VillageLifeDirector} from '../src/life/village-director.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {surfaceSupport} from '../src/world/surface-support.mjs';
import {publicRestGraph,restActivity} from '../src/life/public-rest.mjs';
import * as THREE from 'three';
import {createVillageRender} from '../src/life/village-render.mjs';
import {identity,wardrobe} from '../src/life/village-identity.mjs';
const json=async n=>JSON.parse(await readFile('public/data/'+n+'.json'));
test('small seams work on ascending, descending and diagonal slopes, without ratcheting steep ramps or missing support',()=>{
 for(const sign of [-1,1])for(const diagonal of [false,true]){const height=(x,z)=>sign*(x*.35+(x>=.5?.07:0)),p={x:0,y:0,z:0};moveGrounded(p,{x:2,z:diagonal?2:0},()=>true,height,()=>.7,false);assert.ok(p.x>1.99);assert.equal(p.y,height(p.x,p.z));}
 for(const h of [x=>x*.95,x=>-x*.95,x=>x>=.5?.55:0,x=>x>=.5?NaN:0]){const p={x:0,y:0,z:0};moveGrounded(p,{x:2,z:0},()=>true,h,()=>.7,false);assert.ok(p.x<.51);}
});
test('realistic stair treads and descending kerbs remain distinct from walls and voids',()=>{
 for(const sign of [-1,1]){const p={x:.05,y:0,z:0},h=x=>sign*Math.floor((x+.01)/.30)*.15;moveGrounded(p,{x:2,z:0},()=>true,h,()=>.7,false);assert.ok(p.x>2);assert.equal(p.y,h(p.x));}
 const p={x:0,y:0,z:0};moveGrounded(p,{x:1,z:0},x=>x<.45,()=>0,()=>.7,false);assert.ok(p.x<.45);
});
test('the bridge keeps exact centre elevations and a planar cross section; no old land intersects its deck footprint',async()=>{
 const raw=await json('angles-landmarks'),bridge=raw.objects.find(o=>o.id==='pont'),p=bridge.parts[bridge.supportPart].position;
 for(let i=0;i<p.length;i+=15)for(let j=1;j<15;j+=3)assert.equal(p[i+j],p[i+7]);
 const m=await json('angles-walk-surface'),bytes=gunzipSync(await readFile('public/data/angles-walk-surface.pack')),s=decodeSurface(m,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),support=surfaceSupport(s.tiles,[-220,115,-150,200]);
 const grid=await json('angles-terrain');const {sampleGrid}=await import('../src/world/terrain-grid.mjs');const baseline=sampleGrid(grid,0,0);
 for(let i=0;i<p.length;i+=15)for(const j of [4,7,10]){const ground=support.sample(p[i+j-1],p[i+j+1]);if(ground!==undefined)assert.ok(ground<p[i+j]-baseline+.015,`old terrain crosses deck at ${i},${j}`);}
 assert.ok(m.bridgeOcclusion.changedFaces>0);assert.ok(m.bridgeOcclusion.removedLandM2<350);
});
test('the complete Rue du Pont is traversable in both directions on its exact rendered support',async()=>{
 const m=await json('angles-walk-surface'),bytes=gunzipSync(await readFile('public/data/angles-walk-surface.pack')),s=decodeSurface(m,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),support=surfaceSupport(s.tiles,m.walkCorrection.bounds),r=m.bridgeOcclusion.rueReconstruction,h=(x,z)=>support.sample(x,z)??null;
 for(const [a,b]of [[r.a,r.b],[r.b,r.a]]){const p={...a,y:h(a.x,a.z)};moveGrounded(p,{x:b.x-a.x,z:b.z-a.z},()=>true,h,()=>.7,false);assert.ok(Math.hypot(p.x-b.x,p.z-b.z)<.001);}
});
test('albedo has no explicit distance blend in procedural, hybrid and photographic architecture',async()=>{
 const material=await readFile('src/architecture/material.ts','utf8'),world=await readFile('src/materials/world.ts','utf8'),authentic=await readFile('src/materials/authentic.ts','utf8');
 assert.equal(material.includes('architectureFade'),false);assert.equal(world.includes('architectureFade'),false);assert.equal(authentic.includes('authenticTone,authenticFade'),false);assert.ok(world.includes('diffuseColor.rgb=m13Sample(m13Photo,uv,slot).rgb'));
});
test('night diffuse remains legible, lunar light is zero below horizon or under thick cloud, daylight endpoint preserved',()=>{
 const dark=nightLight({cloud:1,rain:1}),clear=nightLight({moonlight:.5});assert.ok(dark.intensity>.4&&dark.intensity<.8);assert.ok(clear.intensity>dark.intensity);assert.equal(nightLight({lightDay:1}).intensity,1.535);
 const moon=lunar('2026-05-31T23:00Z',46.6953,.8844);assert.ok(lunarVisibility({...moon,altitude:-.3},{cloud:0})===0);assert.equal(lunarVisibility(moon,{cloud:1}),0);
});
test('seating lowers and raises continuously; identity and joint lengths are not rescaled',()=>{
 const p={phase:.3},at=t=>socialPose(p,0,t,0,'activity','picnic',t,50);assert.equal(at(0).seat,0);assert.equal(at(10).seat,1);assert.equal(at(50).seat,0);assert.ok(at(.01).seat<.001);assert.ok(at(49.99).seat<.001);assert.ok(Number.isFinite(at(20).gesture));
});
test('public rest is source gated and refuses missing support, obstacles, weather and unsafe seat envelopes',()=>{
 const graph={nodes:[{point:{x:-204,z:25.5},edges:[0]},{point:{x:-199,z:49},edges:[0]}],edges:[{from:0,to:1,length:24,admitted:true,tags:{highway:'service'}}]};
 const admitted=publicRestGraph(graph,()=>0,()=>true);assert.equal(admitted.audit.filter(a=>a.node!==undefined).length,1);assert.equal(graph.nodes.length,2);assert.equal(publicRestGraph(graph,()=>null,()=>true).graph.nodes.length,2);assert.equal(publicRestGraph(graph,()=>0,()=>false).graph.nodes.length,2);
 const g={restSite:'jardin-communal',mode:'walk',members:[{person:{age:'adult'},position:{x:0,z:0}}]},c={hour:12,temperatureC:20,rain:0};assert.equal(restActivity(g,c,()=>0,()=>true),'sit');assert.equal(restActivity(g,{...c,rain:1},()=>0,()=>true),null);assert.equal(restActivity(g,c,x=>x*.8,()=>true),null);
});
test('completed daytime routines continue after a bounded end pause and retain identities',()=>{
 const nodes=Array.from({length:12},(_,i)=>({point:{x:i*10,z:0},edges:[]})),edges=[];for(let i=1;i<12;i++){edges.push({from:i-1,to:i,length:10,forward:true,backward:true,admitted:true,width:4,tags:{highway:'residential'}});nodes[i-1].edges.push(i-1);nodes[i].edges.push(i-1);}
 const d=new VillageLifeDirector({graph:{nodes,edges}}),g=d.create({hour:12},{origin:0,kind:'couple',inspection:true,min:10,max:100});d.nextAttempt=Infinity;const ids=g.members.map(m=>m.person.id);g.state='activity';g.homebound=true;g.stateTime=g.wait;d.update(.1,{hour:12});assert.equal(g.state,'rest');assert.ok(g.restDuration<=30);for(let i=0;i<160;i++)d.update(.25,{hour:12});assert.ok(['depart','walk','pause'].includes(g.state));assert.deepEqual(g.members.map(m=>m.person.id),ids);
});
test('village sound memory avoids immediate repeats, honours silence and stays bounded',()=>{
 const m=new VillageSoundMemory(),a=m.choose('conversation','a',['one','two'],0);assert.equal(m.choose('conversation','a',['one','two'],1),null);assert.notEqual(m.choose('conversation','a',['one','two'],30).asset,a.asset);assert.equal(m.choose('laugh','b',['laugh'],31),null);for(let i=0;i<500;i++)m.choose('step',String(i),['s'],i);assert.ok(m.actors.size<=128);m.clear();assert.equal(m.actors.size,0);
});
test('joint detail recedes without changing the core body transform or persistent identity',()=>{
 const person=identity('joint-lod-person'),member={person,outfit:wardrobe(person),position:{x:0,y:0,z:0},yaw:0,speed:1,phase:0,distance:0},group={id:'joint-lod',members:[member],state:'walk',activity:'observe',stateTime:0,wait:60,kind:'solo'},original=structuredClone(member),r=createVillageRender(new THREE.Scene()),near=new THREE.Matrix4(),far=new THREE.Matrix4();
 r.setObserver({x:0,z:0});r.draw([group],1,()=>0);r.batch.getMatrixAt(0,near);const closeCount=r.stats.instances;r.setObserver({x:10,z:0});r.draw([group],1,()=>0);r.batch.getMatrixAt(0,far);assert.ok(r.stats.instances<closeCount);assert.deepEqual(near.elements,far.elements);assert.deepEqual(member,original);r.dispose();
});
