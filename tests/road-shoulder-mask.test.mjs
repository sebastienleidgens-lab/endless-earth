// Coverage tests for the rejected, reproducible offline support-mask experiment.
import test from 'node:test';import assert from 'node:assert/strict';
import {shoulderMasks} from '../scripts/lib/road-shoulder-mask.mjs';
function fixture(){
 const p=[],fine=[],far=[];for(let z=0;z<=8;z++)for(let x=0;x<=8;x++)p.push(x*5-20,0,z*5-20);
 for(const [step,index]of [[1,fine],[2,far]])for(let z=0;z<8;z+=step)for(let x=0;x<8;x+=step){const a=z*9+x,b=a+step,c=a+step*9,d=c+step;index.push(a,d,b,a,c,d)}
 const tile={attributes:{position:{array:new Float32Array(p)}},fine:{array:new Uint16Array(fine)},far:{array:new Uint16Array(far)}};
 const config={size:80,origin:[-20,-20],extent:[40,40]},data=new Uint8Array(6400);
 for(let z=0;z<80;z++)for(let x=0;x<80;x++)data[z*80+x]=Math.round(127.5+Math.max(-1,Math.min(1,(x*.5-19.75-.37)/3))*127.5);
 return {tile,surface:{tiles:[tile]},config,data};
}
test('experimental support mask is deterministic, byte-sized and never alters positions or LOD topology',()=>{
 const {surface,tile,config,data}=fixture(),before=structuredClone(tile),a=shoulderMasks(surface,data,config,4)[0],b=shoulderMasks(surface,data,config,4)[0];
 assert.deepEqual(a,b);assert.equal(a.length,81);assert.ok(a.every(v=>v===0||v===255));assert.ok(a.some(v=>v===0));assert.ok(a.some(v=>v===255));assert.deepEqual(tile,before);
});
test('experimental mask covers crossing face interiors even when vertices alone miss the signed band',()=>{
 const {surface,tile,config,data}=fixture(),mask=shoulderMasks(surface,data,config,4)[0],p=tile.attributes.position.array;
 let checked=0;for(const index of [tile.fine.array,tile.far.array])for(let i=0;i<index.length;i+=3){const ids=[...index.slice(i,i+3)];for(const w of [[1/3,1/3,1/3],[.1,.1,.8],[.8,.1,.1],[.1,.8,.1]]){const x=ids.reduce((n,id,k)=>n+p[id*3]*w[k],0);if(Math.abs(x-.37)<1.15){assert.ok(ids.every(id=>mask[id]===255));checked++;}}}assert.ok(checked>10);
});
