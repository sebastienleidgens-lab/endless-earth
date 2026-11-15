import test from 'node:test';import assert from 'node:assert/strict';
import {PlayerActivity} from '../src/player/activity.mjs';import {AquaticController} from '../src/player/aquatic.mjs';
function fixture(x=0){return {contains:(a,z)=>Math.abs(a-x)<1&&z>=0&&z<=8,sample:(a,z)=>({surfaceY:0,bedY:-Math.max(0,Math.min(2,z*.35)),reliable:true,allowed:true,provenance:'SYNTHETIC TEST cross-section, not Anglin'}),exitWalkable:()=>true,routeToExit(a,z){const points=[];for(let p=z;p>0;p-=.25)points.push({x:a,z:p});points.push({x:a,z:0});return points}}}
const host=p=>({provider:p,clear:()=>true,auto:false,landClear:()=>true,landHeight:()=>0});
test('three independent synthetic ramps admit progressive wading, swimming, turns and grounded exit',()=>{
 for(const x of [-4,0,4]){const a=new PlayerActivity(),c=new AquaticController(a),p={x,y:0,z:-.01},provider=fixture(x),states=new Set();
  for(let i=0;i<90;i++){c.move(p,{x:0,z:.085},.1,host(provider));states.add(a.state);assert.ok(Number.isFinite(p.y));}
  assert.ok(states.has('wading'));assert.ok(states.has('swimming'));assert.equal(a.state,'swimming');assert.ok(Math.abs(p.y+.55)<.05);
  const prior={...p};c.move(p,{x:.08,z:0},.1,host(provider));assert.ok(p.x>prior.x);assert.ok(Math.hypot(p.x-prior.x,p.z-prior.z)<=.111);
  for(let i=0;i<100;i++)c.move(p,{x:0,z:-.085},.1,host(provider));assert.equal(a.state,'walking');assert.equal(c.provider,null);assert.equal(p.y,0);assert.deepEqual(c.history.map(h=>h.type),['entry','exit']);
 }
});
test('unknown depths, obstacles, broken exits, steep banks and AutoWalk never gain aquatic admission',()=>{
 for(const mode of ['unknown','obstacle','exit','steep','auto','private']){const a=new PlayerActivity(),c=new AquaticController(a),p={x:0,y:0,z:-.01},provider=fixture(),h=host(provider);
  if(mode==='unknown')provider.sample=()=>({surfaceY:0,bedY:-.1,reliable:false});if(mode==='obstacle')h.clear=()=>false;if(mode==='exit')provider.exitWalkable=()=>false;if(mode==='steep')provider.sample=()=>({surfaceY:0,bedY:-2,reliable:true,allowed:true,provenance:'synthetic'});if(mode==='auto')h.auto=true;if(mode==='private')provider.sample=()=>({surfaceY:0,bedY:-.01,reliable:true,allowed:false,provenance:'synthetic'});
  const start={...p};c.move(p,{x:0,z:.08},.1,h);assert.equal(a.state,'walking',mode);assert.deepEqual(p,start,mode);
 }
});
test('camp and water states exclude each other; missing pilot provider retains ordinary collision ownership',()=>{
 const a=new PlayerActivity(),c=new AquaticController(a),p={x:0,y:0,z:0};assert.equal(c.move(p,{x:0,z:.1},.1,host(null)).handled,false);
 a.toggleCamp(()=>({ok:true,layout:{}}));c.move(p,{x:0,z:.1},.1,host(fixture()));assert.equal(a.state,'transition');a.reset();a.enterWater();assert.equal(a.toggleCamp(()=>({ok:true})).reason,'water');
});

test('aquatic movement cannot leave a position with a verified exit for a disconnected pocket',()=>{
 const a=new PlayerActivity(),c=new AquaticController(a),p={x:0,y:0,z:-.01},provider=fixture(),baseRoute=provider.routeToExit;provider.routeToExit=(x,z)=>x>.1?null:baseRoute(x,z);
 for(let i=0;i<45;i++)c.move(p,{x:0,z:.085},.1,host(provider));assert.equal(a.state,'swimming');
 for(let i=0;i<10;i++)c.move(p,{x:.08,z:0},.1,host(provider));assert.ok(p.x<=.1);assert.equal(c.reason,'unverified-exit');
 for(let i=0;i<60;i++)c.move(p,{x:0,z:-.085},.1,host(provider));assert.equal(a.state,'walking');
});
