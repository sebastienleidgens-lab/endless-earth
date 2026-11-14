import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {surfaceSupport} from '../src/world/surface-support.mjs';
const reports=[],key=(x,z)=>x+':'+z;
for(const stem of ['angles-walk-surface','angles-ground-truth']){
 const manifest=JSON.parse(await readFile('public/data/'+stem+'.json')),raw=gunzipSync(await readFile('public/data/'+stem+'.pack')),surface=decodeSurface(manifest,raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),index=surfaceSupport(surface.tiles,[-1000,-1000,1000,1000]),edges=new Map(),faces=new Map();
 let mixedRoad=0,mixedWater=0,zeroNormals=0,nonUnitNormals=0,vertices=0,duplicateProjectedFaces=0;
 const overlaps=[];
 for(const [ti,tile]of surface.tiles.entries()){
  const p=tile.attributes.position.array,n=tile.attributes.normal.array,ids=tile.fine.array,road=tile.attributes.earthRoad.array,water=tile.attributes.earthWater.array;
  for(let i=0;i<n.length;i+=3){vertices++;const length=Math.hypot(n[i],n[i+1],n[i+2])/32767;if(length<.001)zeroNormals++;else if(Math.abs(length-1)>.002)nonUnitNormals++}
  for(let i=0;i<ids.length;i+=3){const v=Array.from(ids.subarray(i,i+3),id=>({x:p[id*3],y:p[id*3+1],z:p[id*3+2],id})),keys=v.map(v=>key(v.x,v.z)),faceKey=keys.slice().sort().join('|'),prior=faces.get(faceKey);if(prior){duplicateProjectedFaces++;if(overlaps.length<50)overlaps.push({first:prior,second:{tile:ti,face:i/3,vertices:v}})}else faces.set(faceKey,{tile:ti,face:i/3});
   mixedRoad+=Number(new Set(v.map(v=>road[v.id])).size>1);mixedWater+=Number(new Set(v.map(v=>water[v.id])).size>1);
   for(let k=0;k<3;k++){const a=v[k],b=v[(k+1)%3],ka=keys[k],kb=keys[(k+1)%3],forward=ka<kb,kedge=forward?ka+'|'+kb:kb+'|'+ka,list=edges.get(kedge)??[];list.push({tile:ti,face:i/3,a:forward?a:b,b:forward?b:a});edges.set(kedge,list)}
  }
 }
 let singleEdges=0,worldBoundary=0,continuousSplits=0,missingAcross=0,jumps=0,coincidentMismatches=0,nonmanifold=0,maxJumpM=0;
 const suspects=[];
 for(const list of edges.values()){
  if(list.length>2)nonmanifold++;
  if(list.length>1){const first=list[0];for(const other of list.slice(1)){const delta=Math.max(Math.abs(first.a.y-other.a.y),Math.abs(first.b.y-other.b.y));if(delta>.001){coincidentMismatches++;if(suspects.length<1000)suspects.push({kind:'coincident-edge-height-mismatch',deltaM:delta,edges:list})}}continue}
  singleEdges++;const e=list[0],{a,b}=e;
  if((Math.abs(a.x)===1000&&a.x===b.x)||(Math.abs(a.z)===1000&&a.z===b.z)){worldBoundary++;continue}
  const x=(a.x+b.x)/2,z=(a.z+b.z)/2,dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)continue;
  const epsilon=.001,left=index.inspect(x-dz/len*epsilon,z+dx/len*epsilon),right=index.inspect(x+dz/len*epsilon,z-dx/len*epsilon);
  if(!left||!right){missingAcross++;if(suspects.length<1000)suspects.push({kind:'missing-support-beside-open-edge',edge:e,left:left?.id??null,right:right?.id??null});continue}
  // Project each sampled face's plane back to the common edge midpoint.
  const planeHeight=(face,sx,sz)=>face.height-(face.normal.x*(x-sx)+face.normal.z*(z-sz))/face.normal.y;
  const gap=Math.abs(planeHeight(left,x-dz/len*epsilon,z+dx/len*epsilon)-planeHeight(right,x+dz/len*epsilon,z-dx/len*epsilon));maxJumpM=Math.max(maxJumpM,gap);
  if(gap>.02){jumps++;if(suspects.length<1000)suspects.push({kind:'projected-height-discontinuity',gapM:gap,edge:e,left:left.id,right:right.id})}else continuousSplits++;
 }
 for(const s of suspects){const e=s.edge??s.edges[0],x=(e.a.x+e.b.x)/2,z=(e.a.z+e.b.z)/2,b=manifest.bridgeOcclusion?.bounds;s.midpoint={x,z};s.insideInheritedBridgeApproachBounds=!!b&&x>=b[0]-.002&&x<=b[2]+.002&&z>=b[1]-.002&&z<=b[3]+.002;}
 reports.push({stem,hash:manifest.binarySha256,vertices,zeroNormals,nonUnitNormals,mixedRoadTriangles:mixedRoad,mixedWaterTriangles:mixedWater,duplicateProjectedFaces,overlaps,edgeKeys:edges.size,nonmanifoldExactEdges:nonmanifold,singleEdges,worldBoundary,continuousSplits,missingAcross,jumps,coincidentMismatches,maxJumpM,suspects});
 console.log(stem,{zeroNormals,nonUnitNormals,duplicateProjectedFaces,singleEdges,worldBoundary,continuousSplits,missingAcross,jumps,coincidentMismatches,maxJumpM});
}
await writeFile('docs/mission-23-evidence/seam-audit.json',JSON.stringify({method:'Every fine terrain/road/water triangle. Exact Float32 projected edge and face keys; unmatched interior edges sampled on both sides at 1mm then planes projected to their common midpoint. Open edges include valid T-junction partitions and are not automatically holes. Missing support and >2cm plane gaps remain explicit suspicions; no automatic face removal. Separate bridge/building meshes, ray occlusion and arbitrary partial triangle overlaps are not an exhaustive part of this edge audit. Atlas coordinates remain the original metric world-plane shader; no new UV buffer.',reports},null,2)+'\n');
