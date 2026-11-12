// Geographic data contract shared by offline preparation, rendering and physics.
import {barycentric} from './terrain-refinement.mjs';
export function prepareLandmarks(raw,baseline,bindings,verticalDatum='IGN69'){
 if(raw?.schema!=='endless-earth-landmarks-v1'||raw.verticalDatum!==verticalDatum||!Array.isArray(raw.objects)||raw.objects.length>32||
    Object.entries(bindings).some(([k,v])=>raw.bindings?.[k]!==v))throw Error('Stale or invalid local landmarks');
 let vertices=0;const objects=raw.objects.map(object=>{
  if(typeof object.featureId!=='string'||!Array.isArray(object.parts)||object.parts.length>16)throw Error('Invalid landmark object');
  const parts=object.parts.map(part=>{
   if(!['stone','road','metal'].includes(part.kind)||!Array.isArray(part.position)||part.position.length%3||!part.position.every(Number.isFinite)||!Array.isArray(part.index)||part.index.length%3||!part.index.every(i=>Number.isInteger(i)&&i>=0&&i<part.position.length/3))throw Error('Invalid landmark mesh');
   vertices+=part.position.length/3;if(vertices>150000||part.position.some((v,i)=>i%3===1?(v<-500||v>9000):Math.abs(v)>1050))throw Error('Landmark budget or extent exceeded');
   const position=Float32Array.from(part.position,(v,i)=>i%3===1?v-baseline:v);
   if(!Array.isArray(part.normal)||part.normal.length!==part.position.length||!part.normal.every(v=>Number.isInteger(v)&&Math.abs(v)<=32767))throw Error('Invalid landmark normals');
   return {...part,position,index:new Uint32Array(part.index),normal:new Int16Array(part.normal)};
  });
  return {...object,parts};
 });
 if(!Array.isArray(raw.collisionFeatures)||raw.collisionFeatures.length>128||raw.collisionFeatures.some(f=>f?.geometry?.type!=='LineString'||!Array.isArray(f.geometry.coordinates)||f.geometry.coordinates.length<2||f.geometry.coordinates.length>512||f.geometry.coordinates.some(p=>!Array.isArray(p)||p.length!==2||!p.every(Number.isFinite)||Math.abs(p[0])>180||Math.abs(p[1])>90)))throw Error('Invalid landmark collisions');
 const surfaces=new Map();
 for(const object of objects)if(object.supportPart!==undefined){
  const mesh=object.parts[object.supportPart];if(mesh?.kind!=='road')throw Error('Invalid landmark support');
  const cells=new Map(),p=mesh.position,ids=mesh.index;
  for(let i=0;i<ids.length;i+=3){
   const triangle=Array.from(ids.subarray(i,i+3),v=>({x:p[v*3],y:p[v*3+1],z:p[v*3+2]}));
   const xs=triangle.map(p=>p.x),zs=triangle.map(p=>p.z);
   for(let z=Math.floor(Math.min(...zs)/8);z<=Math.floor(Math.max(...zs)/8);z++)for(let x=Math.floor(Math.min(...xs)/8);x<=Math.floor(Math.max(...xs)/8);x++){const key=`${x}:${z}`;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle)}
  }
  surfaces.set(object.featureId,cells);
 }
 return {raw,objects,collisionFeatures:raw.collisionFeatures??[],support(featureId,x,z){
  const triangles=surfaces.get(featureId)?.get(`${Math.floor(x/8)}:${Math.floor(z/8)}`)??[];
  for(const t of triangles){const w=barycentric(t,x,z);if(w.every(v=>v>=-1e-4))return w.reduce((h,v,i)=>h+v*t[i].y,0)}
  return null;
 }};
}
