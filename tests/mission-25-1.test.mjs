import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWaterNetwork} from '../src/player/water-network.mjs';
test('water graph waits for bank discovery and does not scan a finished sector without any return bank',()=>{let ready=false,samples=0;const network=createWaterNetwork({areas:[{rings:[[{x:0,z:0},{x:100000,z:0},{x:100000,z:100000},{x:0,z:100000}]]}],contains:()=>true,clear:()=>true,sample:()=>{samples++;return {reliable:true,allowed:true,depth:2}},accesses:[],accessesReady:()=>ready});network.build();assert.equal(network.metrics.ready,false);ready=true;network.build();assert.equal(network.metrics.ready,true);assert.equal(network.metrics.nodes,0);assert.equal(network.metrics.reason,'no-verified-bank-access');assert.equal(samples,0);assert.equal(network.route({x:8,z:8}),null);network.dispose();});
import {WaterContacts} from '../src/player/water-contacts.mjs';
import {InteractableSurfaces} from '../src/player/interactable-surfaces.mjs';
import {windAtWorld,windTemporal} from '../src/earthlife/wind.mjs';
import {sampleLocomotion} from '../src/character/clips.mjs';
import {createWalker} from '../src/character/walker.mjs';
import {createPackraft} from '../src/player/packraft-render.mjs';
import {perchedBirdAt} from '../src/earthlife/fauna.mjs';
import {PlayerActivity} from '../src/player/activity.mjs';
import {PackraftController} from '../src/player/packraft.mjs';

test('paddle grips solve in the clavicle frame after shoulder extension, with translated and rotated avatars',()=>{
 const scene=new THREE.Scene(),boat=createPackraft(scene),w=createWalker();scene.add(w.avatar);w.avatar.position.set(4,.3,-3);w.avatar.rotation.y=.6;
 for(const stroke of [0,.7,1.4,3.4]){
  boat.update({visible:true,scale:1,position:{x:4,y:.2,z:-3},heading:.6,stroke,pose:1},2);
  for(let i=0;i<60;i++)w.update(0,1/60,()=>0,{kind:'boating',boatPose:1,stroke,handTargets:boat.hands});
  for(let i=0;i<2;i++){const hand=w.avatar.getObjectByName('hand'+(i===0?-1:1));const error=hand.getWorldPosition(new THREE.Vector3()).distanceTo(boat.hands[i]);assert.ok(error<.035,JSON.stringify({stroke,i,error}));}
 }
 w.dispose();boat.dispose();
});

test('off-axis docking follows the inspected water then bank corridor instead of cutting an obstructed diagonal',()=>{
 const activity=new PlayerActivity();activity.state='boating';const boat=new PackraftController(activity),position={x:9.8,y:.1,z:20.5};
 const clear=(x,z)=>!(x>11.1&&x<11.7&&z>18.8&&z<19.5);
 const site={water:{x:9.8,z:18},entry:{x:12.7,z:18},dry:{x:13.05,y:0,z:18}};
 const provider={accesses:[site],contains:(x,z)=>x<=12,sample:()=>({reliable:true,surfaceY:0,depth:2}),exitWalkable:()=>true};
 assert.ok(boat.dock(position,provider,clear).ok);
 for(let i=0;i<60;i++){boat.update(.1,position,{forward:0,strafe:0},provider,clear);assert.ok(clear(position.x,position.z));}
 assert.equal(activity.state,'walking');assert.deepEqual(position,site.dry);
});

test('water network follows a bent corridor, preserves a hole and refuses disconnected water without an exit',()=>{
 const areas=[{rings:[[{x:0,z:0},{x:100,z:0},{x:100,z:100},{x:0,z:100}]]}];
 const contains=(x,z)=>x>=0&&x<=100&&z>=0&&z<=100;
 const clear=(x,z)=>!(x>24&&x<76&&z<75);
 const access={id:'SYNTHETIC',water:{x:8,z:8},entry:{x:8,z:2}};
 const network=createWaterNetwork({areas,contains,clear,sample:()=>({reliable:true,allowed:true,depth:2}),accesses:[access]});
 network.build();const route=network.route({x:90,z:8},true);assert.ok(route?.length>200);
 assert.ok(route.some(p=>p.z>76));for(const p of route)assert.ok(clear(p.x,p.z)&&contains(p.x,p.z));
 const builds=network.metrics.builds;for(let i=0;i<50;i++)assert.ok(network.connected(90,8));assert.equal(network.metrics.builds,builds);network.dispose();
 const closed=createWaterNetwork({areas,contains,clear:()=>true,sample:()=>({reliable:false}),accesses:[]});closed.build();assert.equal(closed.route({x:8,z:8}),null);closed.dispose();
});
test('water contacts share one ID per true joint crossing and never repeat an immersed hand or paddle',()=>{
 const contacts=new WaterContacts(),provider={sample:(x,z)=>x<10?{reliable:true,surfaceY:0}:null},p={x:0,y:0,z:0};
 const hands=[{side:-1,position:{x:-.3,y:.1,z:0}},{side:1,position:{x:.3,y:.1,z:0}}];
 contacts.update('swimming',p,hands,null,provider);hands[0].position.y=-.1;
 const event=contacts.update('swimming',p,hands,null,provider);assert.equal(event.length,1);assert.equal(event[0].kind,'stroke');const id=event[0].id;
 assert.equal(contacts.update('swimming',p,hands,null,provider).length,0);
 hands[0].position.y=.1;contacts.update('swimming',p,hands,null,provider);hands[0].position.y=-.1;
 assert.ok(contacts.update('swimming',p,hands,null,provider)[0].id>id);
 assert.equal(contacts.update('walking',p,hands,null,provider)[0].kind,'exit');
});
test('interaction surfaces require actual semantic geometry, permission, collider and a body sweep; removal invalidates a seat',()=>{
 const lib=new InteractableSurfaces(),world={query:()=>({ok:true,height:0,slope:0})},p={x:0,y:0,z:0};
 assert.equal(lib.register({id:'decorative-box',kind:'bench'}),false);
 const s={id:'SYNTHETIC-SEAT',kind:'bench',loaded:true,permission:true,provenance:'synthetic unit-test geometry',colliderId:'TEST',height:.45,normal:{y:1},width:1.2,depth:.5,position:{x:0,z:0},heading:0,actions:['sit'],validate:()=>true};
 assert.ok(lib.register(s));assert.equal(lib.seatAt(p,world),null);world.sweepBody=()=>true;const seat=lib.seatAt(p,world);assert.ok(seat?.validate());lib.remove(s.id);assert.equal(seat.validate(),false);
});
test('authored locomotion keys are periodic and continuous in speed; extended rig and boat retain bounded shared draws',()=>{
 for(const speed of [0,.25,.5,.75,1]){const first=sampleLocomotion(0,speed),end=sampleLocomotion(1-1e-7,speed);for(const key of ['back','lift','arm','elbow','pitch'])assert.ok(Math.abs(first[key]-end[key])<1e-4);}
 const w=createWalker();assert.ok(w.metrics.bones>=30);assert.equal(w.metrics.drawCalls,1);for(const q of [0,.2,.5,.8]){const a=sampleLocomotion(q,.5),b=sampleLocomotion(q,.500001);assert.ok(Math.abs(a.lift-b.lift)<.00001)}w.dispose();
 const scene=new THREE.Scene(),boat=createPackraft(scene);let draws=0;boat.group.traverse(o=>{if(o.isMesh)draws++});assert.equal(draws,2);assert.ok(boat.metrics.triangles<744);boat.dispose();assert.equal(scene.children.length,0);
});
test('wind CPU/GPU carriers agree across seconds/minutes/hours, deterministic seeds and temporal boundaries',()=>{
 const samples=[];for(let t=0;t<=10800;t+=.5){const a=windAtWorld(128,256,t,.35,9),b=windAtWorld(128,256,t+.001,.35,9),temporal=windTemporal(t);
  assert.deepEqual(a,windAtWorld(128,256,t,.35,9));assert.ok(Math.hypot(a.x-b.x,a.z-b.z)<.001);
  const front=Math.max(0,Math.sin(128*.0031+256*.0023-t*.11+9)),gust=front**12*temporal.gust,turn=temporal.turn+.035*Math.sin(128*.007-256*.005+t*.18),speed=.35*(temporal.slow+gust*.65);
  assert.ok(Math.abs(a.x-(.88+.475*turn)*speed)<1e-12);if(t%60===0)samples.push(a.speed);
 }assert.ok(Math.max(...samples)-Math.min(...samples)>.15);
});
test('perched individuals stay deterministic and quiet during unsuitable weather/night',()=>{
 const c={day:1,rain:0,wind:.2};let visible=0,flights=0;for(let t=0;t<600;t++){const a=perchedBirdAt(t,31,c,30);assert.deepEqual(a,perchedBirdAt(t,31,c,30));visible+=Number(a.visible);flights+=Number(a.visible&&a.flying);assert.equal(perchedBirdAt(t,31,{...c,day:0},30).visible,false);}assert.ok(visible>0&&visible<240&&flights>0);
});
