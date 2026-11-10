import test from 'node:test';import assert from 'node:assert/strict';
import * as THREE from 'three';
import {windAtWorld,windToInstance} from '../src/earthlife/wind.mjs';
import {cloudField,cloudRawField,cloudShadow,CLOUD_HEIGHT} from '../src/earthlife/clouds.mjs';
import {flockAt,birdPosition} from '../src/earthlife/fauna.mjs';
import {eventAt,eligibleLeaves} from '../src/earthlife/events.mjs';
import {lifeProfile,WorldLifeBudget} from '../src/earthlife/budget.mjs';
import {cloudReceiver,lifeUniforms} from '../src/earthlife/state.mjs';
import {habitatIndex} from '../src/earthlife/habitat.mjs';
import {cpuModules} from '../scripts/lib/cpu-modules.mjs';
const load=await cpuModules(process.cwd(),'work/earthlife-test-modules');
const {createFauna}=await load('src/earthlife/fauna-render.ts'),{createMicroEvents}=await load('src/earthlife/micro-events.ts');
const conditions={habitat:'wood',day:1,rain:0,wind:.35,month:10,latitude:46};
test('wind is seeded, bounded and continuous through cell boundaries and time',()=>{
 let gusts=0;for(let t=0;t<2000;t+=.7){const w=windAtWorld(128,256,t);assert.deepEqual(w,windAtWorld(128,256,t));assert.ok(w.speed>=0&&w.speed<.7);const neighbor=windAtWorld(128.001,256,t+.001);assert.ok(Math.hypot(w.x-neighbor.x,w.z-neighbor.z)<.001);if(w.gust>.5)gusts++}assert.ok(gusts>0&&gusts<500);assert.notDeepEqual(windAtWorld(1,1,1,.35,9),windAtWorld(1,1,1,.35,10));assert.equal(windAtWorld(1,1,1,0).speed,0);
});
test('cloud shadow is precisely the visible field projected along the sun, continuous and absent at night',()=>{
 for(let t=0;t<500;t+=7){const sun={x:.4,y:.7,z:-.5},x=128,z=256,y=25;assert.equal(cloudShadow(x,z,y,t,.8,sun),cloudField(x-(CLOUD_HEIGHT-y)*sun.x/sun.y,z-(CLOUD_HEIGHT-y)*sun.z/sun.y,t,.8));assert.ok(Math.abs(cloudShadow(x,z,y,t,.8,sun)-cloudShadow(x+.001,z,y,t+.001,.8,sun))<.001);assert.equal(cloudShadow(x,z,y,t,.8,{x:1,y:-.1,z:0}),0)}
});
test('analytic flocks contain silence, solo/pair/groups, varied durations and safe altitude',()=>{
 const sizes=new Set(),durations=new Set();let active=0,silent=0;
 for(let t=0;t<12000;t+=2){const f=flockAt(t,17,conditions);assert.deepEqual(f,flockAt(t,17,conditions));if(!f.active){silent++;continue}active++;sizes.add(f.count);durations.add(f.duration);for(let i=0;i<f.count;i++){const p=birdPosition(f,i,{x:10,z:20},125);assert.ok(p.y>=137&&Number.isFinite(p.x+p.y+p.z))}}
 assert.ok(active>0&&silent>active*2);assert.ok(sizes.has(1)&&sizes.has(2)&&sizes.size>2);assert.ok(durations.size>3);
 for(const c of [{...conditions,habitat:'unknown'},{...conditions,day:0},{...conditions,rain:1}])for(let t=0;t<1000;t+=5)assert.equal(flockAt(t,17,c).active,false);
});
test('rare micro-events have deterministic jitter, gaps and seasonal habitat constraints',()=>{
 let active=0;const starts=new Set();for(let t=0;t<3000;t++){const e=eventAt(t,14);assert.deepEqual(e,eventAt(t,14));assert.ok(e.envelope>=0&&e.envelope<=1);if(e.active){active++;starts.add(e.id)}}assert.ok(active>0&&active<400&&starts.size>5);
 assert.equal(eligibleLeaves(10,46,'wood'),true);assert.equal(eligibleLeaves(4,-35,'wood'),true);assert.equal(eligibleLeaves(4,46,'wood'),false);assert.equal(eligibleLeaves(10,46,'unknown'),false);
});
test('one world budget stays bounded over hundreds of cells and releases every claim',()=>{
 const b=new WorldLifeBudget(lifeProfile('quality'));for(let i=0;i<500;i++)b.claim(String(i),'birds',1);assert.equal(b.allocated.birds,9);assert.equal(b.claim('invalid','birds',-1),false);assert.equal(b.claim('invalid','texture',1),false);for(let i=0;i<500;i++)b.release(String(i));assert.equal(b.cells.size,0);assert.deepEqual(b.allocated,{birds:0,particles:0,events:0});b.claim('x','events',3);b.setProfile(lifeProfile('eco'));assert.equal(b.allocated.events,0);assert.equal(b.profile.shadows,0);assert.equal(lifeProfile('custom',{birds:200,water:-1,shadows:NaN}).birds,9);
});
test('mapped habitat query preserves holes and unknown areas across cells',()=>{
 const ring=[{x:0,z:0},{x:300,z:0},{x:300,z:300},{x:0,z:300}],hole=ring.map(p=>({x:p.x*.1+20,z:p.z*.1+20}));const at=habitatIndex([{tags:{natural:'wood'},rings:[ring,hole]}]);assert.equal(at(10,10),'wood');assert.equal(at(270,270),'wood');assert.equal(at(30,30),'unknown');assert.equal(at(500,500),'unknown');
});
test('cloud receiver composes with owners, handles clones and reuses uniform references',()=>{
 const m=new THREE.MeshLambertMaterial();m.onBeforeCompile=s=>{s.fragmentShader+='\n// owner';};cloudReceiver(m);cloudReceiver(m);
 const clone=m.clone();cloudReceiver(clone);for(const material of [m,clone]){const shader={uniforms:{},vertexShader:THREE.ShaderLib.lambert.vertexShader,fragmentShader:THREE.ShaderLib.lambert.fragmentShader};material.onBeforeCompile(shader,{});assert.equal(shader.uniforms.lifeTime,lifeUniforms.lifeTime);assert.ok(shader.vertexShader.includes('lifeWorldPosition=(modelMatrix*lifeWorld).xyz'));assert.equal(shader.fragmentShader.match(/float lifeCloud\(/g).length,1);assert.ok(shader.fragmentShader.includes('outgoingLight*='))}m.dispose();clone.dispose();
});
test('actual fauna/events respect profile changes and dispose after repeated cell visits',()=>{
 const scene=new THREE.Scene();scene.userData.lifeCeiling=145;let disposed=0;
 const budget=new WorldLifeBudget(lifeProfile('quality')),fauna=createFauna(scene,budget,()=>0),events=createMicroEvents(scene,budget),p=new THREE.Vector3(10,0,10);
 for(let t=0;t<2200;t+=.5){if(t===1100)budget.setProfile(lifeProfile('eco'));if(t%200===0)p.x+=260;fauna.update(t,p,conditions);events.update(t,p,conditions);assert.ok(budget.allocated.birds<=budget.profile.birds);assert.ok(budget.allocated.events<=budget.profile.events);assert.ok(budget.allocated.particles<=budget.profile.particles);scene.traverse(o=>{if(o.isLine&&o.visible)assert.ok(o.position.y>=157)})}
 const resources=new Set();scene.traverse(o=>{if(o.geometry)resources.add(o.geometry);if(o.material)resources.add(o.material)});for(const r of resources)r.addEventListener('dispose',()=>disposed++);fauna.dispose();events.dispose();assert.equal(disposed,resources.size);assert.equal(scene.children.length,0);assert.equal(budget.cells.size,0);
});

test('vertex cloud-field interpolation keeps 40 m terrain LOD shadow changes below 2.5 percent',()=>{
 const step=40,smooth=f=>{const v=Math.max(0,Math.min(1,(f-(.84-.7*.53))/.16));return v*v*(3-2*v)*.15};
 for(let i=0;i<4000;i++){const x=Math.sin(i*17.1)*1000,z=Math.cos(i*13.7)*1000,t=i*.13,bx=Math.floor(x/step)*step,bz=Math.floor(z/step)*step,u=(x-bx)/step,v=(z-bz)/step,f=(x,z)=>cloudRawField(x,z,t);const value=u+v<=1?f(bx,bz)*(1-u-v)+f(bx+step,bz)*u+f(bx,bz+step)*v:f(bx+step,bz+step)*(u+v-1)+f(bx+step,bz)*(1-v)+f(bx,bz+step)*(1-u);assert.ok(Math.abs(smooth(value)-smooth(f(x,z)))<.025)}
});

test('world wind direction survives every tree orientation and anisotropic scale',()=>{
 const w={x:.88,z:-.475},expected=new THREE.Vector3(w.x,0,w.z).normalize();
 for(let i=0;i<64;i++)for(const [sx,sz] of [[.5,1.4],[1.8,.7],[1,1]]){const m=new THREE.Matrix4().compose(new THREE.Vector3(),new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0,1,0),i*Math.PI/32),new THREE.Vector3(sx,1,sz)),x=new THREE.Vector3().setFromMatrixColumn(m,0),z=new THREE.Vector3().setFromMatrixColumn(m,2),local=windToInstance(w,x,z),world=new THREE.Vector3(local.x,0,local.z).applyMatrix4(m);assert.ok(world.clone().normalize().dot(expected)>1-1e-12);assert.ok(Math.abs(world.length()/Math.hypot(w.x,w.z)-Math.sqrt(sx*sz))<1e-12)}
});
