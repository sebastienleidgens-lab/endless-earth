import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createNavigation,pedestrianAccess} from '../src/world/navigation.mjs';
import {smoothMovement,transitionWeight,moveGrounded} from '../src/controls/walking.mjs';
const line=(tags,y)=>({tags,points:[{x:-5,z:0,y},{x:5,z:0,y}]});
const water={tags:{natural:'water'},polygon:true,points:[{x:-3,z:-3},{x:3,z:-3},{x:3,z:3},{x:-3,z:3}]};
test('water banks block the body; supported real bridge crosses only within deck width',()=>{
 const nav=createNavigation([water,line({highway:'footway',bridge:'yes',width:2},4)]);
 assert.equal(nav(0,0).support,4);assert.equal(nav(0,0).clear,true);
 assert.equal(nav(0,1).clear,false);assert.equal(nav(3.2,2).clear,false);assert.equal(nav(4,2).clear,true);
});
test('layer and unknown bridge height never create a crossing; restrictions win over support',()=>{
 assert.equal(createNavigation([line({highway:'secondary',bridge:'yes',layer:1})])(0,0).clear,false);
 assert.equal(createNavigation([water,line({highway:'footway',bridge:'yes',access:'private'},4)])(0,0).clear,false);
 assert.equal(pedestrianAccess({access:'private',foot:'yes'}),true);
 assert.equal(pedestrianAccess({access:'yes',foot:'no'}),false);
 assert.equal(pedestrianAccess({'access:conditional':'no @ (sunset-sunrise)'}),false);
});
test('mapped steps allow bounded slopes without teleporting over cliffs or missing terrain',()=>{
 const nav=createNavigation([line({highway:'steps',width:2})]);
 const slope=(x,z)=>nav(x,z).slope;
 const p={x:0,y:0,z:0};moveGrounded(p,{x:1,z:0},()=>true,x=>x,slope);assert.ok(p.x>.9);
 const q={x:0,y:0,z:2};moveGrounded(q,{x:1,z:0},()=>true,x=>x,slope);assert.equal(q.x,0);
 moveGrounded(p,{x:1,z:0},()=>true,()=>null,slope);assert.ok(p.x<1.1);
});
test('barriers, forbidden roads and tunnels block independently of building footprints',()=>{
 for(const tags of [{barrier:'wall'},{highway:'path',foot:'no'},{highway:'motorway'},{highway:'path',tunnel:'yes'}])assert.equal(createNavigation([line(tags)])(0,0).clear,false);
});
test('acceleration is frame-rate independent, deceleration settles without drift',()=>{
 const travel=hz=>{const v={x:0,z:0};let x=0;for(let i=0;i<hz;i++)x+=smoothMovement(v,{x:1.45,z:0},1/hz).x;return x;};
 assert.ok(Math.abs(travel(30)-travel(120))<1e-10);assert.ok(travel(60)<1.45);
 const v={x:1.45,z:0};for(let i=0;i<180;i++)smoothMovement(v,{x:0,z:0},1/60);assert.equal(v.x,0);
});
test('view transitions have bounded smooth endpoints and monotonic progress',()=>{
 assert.equal(transitionWeight(-1),0);assert.equal(transitionWeight(.8),1);assert.equal(transitionWeight(9),1);
 let previous=0;for(let t=0;t<=.8;t+=.01){const w=transitionWeight(t);assert.ok(w>=previous);previous=w;}
});
