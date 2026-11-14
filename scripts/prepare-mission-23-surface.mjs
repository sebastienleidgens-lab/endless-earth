import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {gzipSync,gunzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {packSurface} from './prepare-road-surface.mjs';
const base=process.env.M23_SURFACE_OUT??'public/data/',sha=b=>createHash('sha256').update(b).digest('hex'),load=async p=>JSON.parse(await readFile(p));
const g=await load('public/data/angles-terrain.json'),patchBytes=await readFile('work/mission-23/terrain-repairs.json'),patches=validateRefinement(g,JSON.parse(patchBytes)),original=await load('public/data/angles-walk-surface.json'),raw=gunzipSync(await readFile('public/data/angles-walk-surface.pack')),surface=decodeSurface(original,raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),baseline=sampleGrid(g,0,0),reports=[];
const tiles=[];let removedInvalid=0,removedArea=0;
for(const [ti,t]of surface.tiles.entries()){
 const d=t.descriptor,old=t.attributes.position.array,positions=Array.from(old),colors=Array.from(t.attributes.color.array),roads=Array.from(t.attributes.earthRoad.array),water=Array.from(t.attributes.earthWater.array),indices=[],replaced=new Set(),map=new Map();
 const localPatches=[...patches.cells.entries()].filter(([,c])=>c.x>=d.x&&c.x<d.x+d.size&&c.z>=d.z&&c.z<d.z+d.size);
 for(let i=0;i<old.length;i+=3)if(!roads[i/3]&&!water[i/3])map.set(old[i]+':'+old[i+2],i/3);
 for(let i=0;i<t.fine.count;i+=3){
  const a=t.fine.array[i]*3,b=t.fine.array[i+1]*3,c=t.fine.array[i+2]*3,ny=(old[b+2]-old[a+2])*(old[c]-old[a])-(old[b]-old[a])*(old[c+2]-old[a+2]);
  if(ny<=1e-10){if(Math.abs(ny)>.001)throw Error('Unexpected inverted large face');removedInvalid++;removedArea+=Math.abs(ny)/2;continue}
  const x=(old[a]+old[b]+old[c])/3,z=(old[a+2]+old[b+2]+old[c+2])/3,key=Math.floor((z-g.origin_z_m)/g.step_m)*g.width+Math.floor((x-g.origin_x_m)/g.step_m);
  if(patches.cells.has(key)){
   if([a,b,c].some(k=>roads[k/3]||water[k/3]))throw Error('Repair intersects protected road/water');
   replaced.add(key);continue;
  }
  indices.push(t.fine.array[i],t.fine.array[i+1],t.fine.array[i+2]);
 }
 for(const [key,cell]of localPatches){
  if(!replaced.has(key))throw Error('Repair cell not found in active fine surface');
  const sourceColor=((cell.z-d.z)*(d.size+1)+cell.x-d.x)*3;
  const ids=[];
  for(let i=0;i<cell.vertices.length;i+=3){
   const x=Math.fround(cell.vertices[i]),z=Math.fround(cell.vertices[i+2]),h=Math.fround(cell.vertices[i+1]-baseline),key=x+':'+z;let id=map.get(key);
   if(id===undefined){id=positions.length/3;map.set(key,id);positions.push(x,h,z);colors.push(...t.attributes.color.array.slice(sourceColor,sourceColor+3));roads.push(0);water.push(0)}
   else if(Math.abs(positions[id*3+1]-h)>.0001){
    // An unused old lattice vertex can lie inside the repair. Shared boundary
    // vertices are locked to source heights by the TIN preparation.
    positions[id*3+1]=h;
   }
   ids.push(id);
  }
  for(let i=0;i<cell.indices.length;i+=3)indices.push(ids[cell.indices[i]],ids[cell.indices[i+2]],ids[cell.indices[i+1]]);
 }
 const changed=localPatches.length>0||indices.length!==t.fine.count,far=changed?indices:Array.from(t.far.array),used=[...new Set([...indices,...far])].sort((a,b)=>a-b),remap=new Map(used.map((id,i)=>[id,i])),p=Float32Array.from(used.flatMap(id=>positions.slice(id*3,id*3+3))),color=Uint8Array.from(used.flatMap(id=>colors.slice(id*3,id*3+3))),r=Uint8Array.from(used.map(id=>roads[id])),w=Uint8Array.from(used.map(id=>water[id])),Type=used.length<65536?Uint16Array:Uint32Array,fine=Type.from(indices,id=>remap.get(id)),farIds=Type.from(far,id=>remap.get(id));
 const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(p,3));geom.setIndex(new THREE.BufferAttribute(fine,1));geom.computeVertexNormals();
 tiles.push({x:d.x,z:d.z,size:d.size,cover:d.cover,protectedCells:d.protectedCells,positions:p,normals:geom.attributes.normal.array,colors:Float32Array.from(color,v=>v/255),roads:r,water:w,fine,far:farIds});geom.dispose();reports.push({tile:ti,repairedCells:localPatches.length,trianglesBefore:t.fine.count/3,trianglesAfter:fine.length/3,exactFar:changed});
}
const stats={...original.stats,vertices:tiles.reduce((s,t)=>s+t.positions.length/3,0),fineTriangles:tiles.reduce((s,t)=>s+t.fine.length/3,0),farTriangles:tiles.reduce((s,t)=>s+t.far.length/3,0)};
const {tiles:_,binaryBytes:__,binarySha256:___,stats:____,...metadata}=original;
const result=packSurface({tiles,stats},{...metadata,groundTruth:{schema:'endless-earth-ground-truth-v1',baseSurfaceSha256:original.binarySha256,repairsSha256:sha(patchBytes),cells:patches.cells.size,source:'IGN LiDAR HD MNT; pinned 0.5m source tiles, IGN69, Licence Ouverte 2.0',method:'Replace only source-confronted unprotected natural-ground cells; original roads, buildings, water and landmarks retained. Same indices for repaired fine/far tiles. Quantization-degenerate and tiny inverted faces removed; no slope threshold deletion.'}}),packed=gzipSync(result.binary,{level:9,mtime:0});result.manifest.compressedBytes=packed.length;
await writeFile(base+'angles-ground-truth.json',JSON.stringify(result.manifest)+'\n');await writeFile(base+'angles-ground-truth.pack',packed);await writeFile(base+'angles-ground-truth-repairs.json',patchBytes);
await writeFile('docs/mission-23-evidence/surface-preparation.json',JSON.stringify({removedInvalid,removedAreaM2:removedArea,repairedCells:patches.cells.size,stats,bytes:result.binary.length,packedBytes:packed.length,reports,baseSurfaceSha256:original.binarySha256,binarySha256:result.manifest.binarySha256},null,2)+'\n');console.log(stats,'invalid',removedInvalid,'bytes',packed.length);
