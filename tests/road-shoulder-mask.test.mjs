import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {shoulderMasks} from '../scripts/lib/road-shoulder-mask.mjs';
const m=JSON.parse(readFileSync('public/data/angles-road-edge.json')),b=gunzipSync(readFileSync('public/data/angles-road-edge.pack'));
const surfaceManifest=JSON.parse(readFileSync('public/data/angles-surface.json')),s=gunzipSync(readFileSync('public/data/angles-surface.pack'));
const surface=decodeSurface(surfaceManifest,s.buffer.slice(s.byteOffset,s.byteOffset+s.byteLength));
const data=b.subarray(0,m.distanceBytes),masks=m.tiles.map(d=>b.subarray(d.offset,d.offset+d.length));
test('packed shoulder masks bind to exact topology and consume one byte per shared LOD vertex',()=>{
 assert.equal(m.surfaceSha256,createHash('sha256').update(s).digest('hex'));assert.equal(masks.reduce((n,a)=>n+a.length,0),m.maskBytes);assert.equal(m.maskBytes,surfaceManifest.stats.vertices);
 for(let i=0;i<masks.length;i++){assert.equal(masks[i].length,surface.tiles[i].attributes.earthRoad.count);assert.ok(masks[i].every(v=>v===0||v===255));}
 const regenerated=shoulderMasks(surface,data,m,m.maskPaddingM);for(let i=0;i<masks.length;i++)assert.deepEqual(regenerated[i],new Uint8Array(masks[i]));
});
test('both actual LODs retain lookup support at every sampled shoulder, including face interiors',()=>{
 const pixel=(x,z)=>{
  const fx=(x-m.origin[0])/m.extent[0]*m.size-.5,fz=(z-m.origin[1])/m.extent[1]*m.size-.5,ix=Math.floor(fx),iz=Math.floor(fz),u=fx-ix,v=fz-iz;
  const at=(a,c)=>data[Math.max(0,Math.min(m.size-1,c))*m.size+Math.max(0,Math.min(m.size-1,a))];
  return Math.abs(((at(ix,iz)*(1-u)+at(ix+1,iz)*u)*(1-v)+(at(ix,iz+1)*(1-u)+at(ix+1,iz+1)*u)*v)/255*2-1)*m.range;
 };
 let checked=0,skipped=0;
 for(let t=0;t<surface.tiles.length;t++){const tile=surface.tiles[t],p=tile.attributes.position.array,mask=masks[t];
  for(const index of [tile.fine.array,tile.far.array])for(let i=0;i<index.length;i+=3){const ids=[...index.slice(i,i+3)];if(ids.every(id=>mask[id]===0))skipped++;
   for(const weights of [[1,0,0],[0,1,0],[0,0,1],[1/3,1/3,1/3],[.1,.1,.8],[.8,.1,.1],[.1,.8,.1]]){
    const x=ids.reduce((v,id,k)=>v+p[id*3]*weights[k],0),z=ids.reduce((v,id,k)=>v+p[id*3+2]*weights[k],0);
    if(pixel(x,z)<1.15){assert.ok(ids.every(id=>mask[id]===255),'never skip a sampled road/ground shoulder');checked++;}
   }
  }
 }
 assert.ok(checked>10000);assert.ok(skipped>10000,'large unneeded terrain regions must actually be excluded');
});
