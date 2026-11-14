import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import {performance} from 'node:perf_hooks';
import * as THREE from 'three';
import {cpuModules} from './lib/cpu-modules.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {surfaceSupport} from '../src/world/surface-support.mjs';
import {prepareLandmarks} from '../src/world/landmark-model.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {pedestrianAccess} from '../src/world/navigation.mjs';
const json=async f=>JSON.parse(await readFile('public/data/'+f+'.json')),grid=await json('angles-terrain');grid.refinement=validateRefinement(grid,await json('angles-relief'));const baseline=sampleGrid(grid,0,0),osm=JSON.parse(await readFile('public/data/angles-osm.geojson')),lmraw=await json('angles-landmarks'),landmarks=prepareLandmarks(lmraw,baseline,lmraw.bindings),load=await cpuModules(process.cwd(),'work/mission-23/traversal-modules'),physical=await load('src/world/collisions.ts');
physical.setBuildingFootprints([...osm.features,...landmarks.collisionFeatures],undefined,(f,x,z)=>landmarks.support(`osm-way-${f.properties?.osm_id}`,x,z));
const manifest=await json('angles-ground-truth'),bytes=gunzipSync(await readFile('public/data/angles-ground-truth.pack')),surface=decodeSurface(manifest,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)),index=surfaceSupport(surface.tiles,[-1000,-1000,1000,1000]),height=(x,z)=>index.sample(x,z)??null;
physical.setBuildingFootprints([...osm.features,...landmarks.collisionFeatures],undefined,(f,x,z)=>landmarks.support(`osm-way-${f.properties?.osm_id}`,x,z),index);
const oldLoad=await cpuModules(process.cwd()+'/work/mission-23/base','work/mission-23/old-traversal-modules'),oldPhysical=await oldLoad('src/world/collisions.ts');oldPhysical.setBuildingFootprints([...osm.features,...landmarks.collisionFeatures],undefined,(f,x,z)=>landmarks.support(`osm-way-${f.properties?.osm_id}`,x,z));
const oldm=await json('angles-walk-surface'),oldbytes=gunzipSync(await readFile('public/data/angles-walk-surface.pack')),oldsurface=decodeSurface(oldm,oldbytes.buffer.slice(oldbytes.byteOffset,oldbytes.byteOffset+oldbytes.byteLength)),oldindex=surfaceSupport(oldsurface.tiles,oldm.walkCorrection.bounds),oldHeight=(x,z)=>oldindex.sample(x,z)??((sampleGrid(grid,x,z)??NaN)-baseline);
const local=p=>({x:(p[0]-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(p[1]-46.6953)*111320}),inside=p=>Math.abs(p.x)<999&&Math.abs(p.z)<999;
function traverse(module,a,b,h){const y=module.walkingHeight(h)(a.x,a.z);if(!Number.isFinite(y)||!module.canWalk(a.x,a.z))return {passed:false,reason:module.inspectCollision(a.x,a.z),position:a};const p=new THREE.Vector3(a.x,y,a.z),n=Math.max(1,Math.ceil(Math.hypot(a.x-b.x,a.z-b.z)/20));for(let i=1;i<=n;i++){const x=a.x+(b.x-a.x)*i/n,z=a.z+(b.z-a.z)*i/n;module.moveWithCollision(p,{x:x-p.x,z:z-p.z},h,false);if(Math.hypot(p.x-x,p.z-z)>1e-5)return {passed:false,reason:module.lastMovementDiagnostic(),position:{x:p.x,y:p.y,z:p.z}}}return {passed:true,position:{x:p.x,y:p.y,z:p.z}}}
const rows=[],counts={},cases=[],started=performance.now();let samples=0;
for(const f of osm.features){const t=f.properties??{};if(f.geometry?.type!=='LineString'||!t.highway||!pedestrianAccess(t)||['motorway','motorway_link','construction','proposed'].includes(t.highway)||t.tunnel&&t.tunnel!=='no')continue;const points=f.geometry.coordinates.map(local);
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.z-a.z);if(!inside(a)||!inside(b)||length<.1)continue;
  const n=Math.ceil(length/.25);for(let k=0;k<=n;k++){const x=a.x+(b.x-a.x)*k/n,z=a.z+(b.z-a.z)*k/n;samples++;const c=physical.inspectCollision(x,z);if(c.obstacle)counts[c.obstacle]=(counts[c.obstacle]??0)+1;else if(!Number.isFinite(physical.walkingHeight(height)(x,z)))counts['support-absent']=(counts['support-absent']??0)+1;}
  for(const [from,to,direction]of [[a,b,'forward'],[b,a,'backward']]){
   const before=traverse(oldPhysical,from,to,oldHeight),after=traverse(physical,from,to,height);const row={id:f.id,tags:t,direction,from,to,length,before,after};rows.push(row);
   if(after.passed&&length>=5&&length<100)cases.push(row);
  }
 }
}
const categories={bridge:r=>r.tags.bridge==='yes',street:r=>['residential','living_street'].includes(r.tags.highway),path:r=>['path','footway'].includes(r.tags.highway),junction:r=>r.length<15,stairs:r=>r.tags.highway==='steps',incline:r=>Math.abs(height(r.to.x,r.to.z)-height(r.from.x,r.from.z))/r.length>.12};
const matrix=Object.entries(categories).map(([category,match])=>({category,available:cases.filter(match).length,case:cases.find(match)??null}));
const summary={surface:manifest.binarySha256,axisSpacingM:.25,segmentsDirected:rows.length,samples,acceptedBefore:rows.filter(r=>r.before.passed).length,acceptedAfter:rows.filter(r=>r.after.passed).length,newlyTraversable:rows.filter(r=>!r.before.passed&&r.after.passed).length,newlyRefused:rows.filter(r=>r.before.passed&&!r.after.passed).length,refusalPointCounts:counts,matrix,changes:rows.filter(r=>r.before.passed!==r.after.passed),seconds:(performance.now()-started)/1000,index:{bytes:index.indexBytes,triangles:index.triangles},method:'Every in-bounds, mapped pedestrian-admissible road segment, both geometric directions (directional access is still enforced by the graph). Axis samples every <=25cm; full segment sweep with the production collision controller, 10cm substeps, no sliding. Reference reproduces M22.1 partial height ownership. Excluded/private/unverified areas are retained as refusals, not automatically repaired.'};
await mkdir('docs/mission-23-evidence',{recursive:true});await writeFile('docs/mission-23-evidence/network-audit.json',JSON.stringify(summary,null,2)+'\n');await writeFile('docs/mission-23-evidence/network-trace.json.gz',gzipSync(JSON.stringify(rows),{level:9}));console.log(JSON.stringify({...summary,matrix:matrix.map(({category,available})=>({category,available})),changes:summary.changes.map(r=>({id:r.id,direction:r.direction,before:r.before.passed,after:r.after.passed,reason:r.after.reason?.rule}))},null,2));
