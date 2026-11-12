import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {cpuModules} from './lib/cpu-modules.mjs';
const read=async f=>JSON.parse(await readFile(f,'utf8')),g=await read('public/data/angles-terrain.json'),raw=await read('public/data/angles-relief.json'),fine={...g,refinement:validateRefinement(g,raw)};
const load=await cpuModules(process.cwd(),'work/mission-14/audit-modules'),collisions=await load('src/world/collisions.ts');
const osm=await read('public/data/angles-osm.geojson');collisions.setBuildingFootprints(osm.features);
const {buildingPlan}=await import('../src/architecture/plan.mjs'),{allowed}=await import('../src/living/walk.mjs');
const local=([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320});
const valid=(grid,p)=>collisions.canWalk(p.x,p.z)&&[[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([dx,dz])=>Math.abs(sampleGrid(grid,p.x+dx,p.z+dz)-sampleGrid(grid,p.x,p.z))<.3);
const changed=[],roads=[];
const {buildGraph,graphRoute}=await import('../src/living/graph.mjs');
const paths=osm.features.filter(f=>f.geometry?.type==='LineString'&&allowed(f.properties)).map(f=>({points:f.geometry.coordinates.map(local),tags:f.properties}));
const graphs={};for(const [id,grid] of [['before',g],['after',fine]]){
 const graph=buildGraph(paths,p=>valid(grid,p)),route=graphRoute(graph,{x:-12.277392682727118,z:-32.416383999943434},p=>valid(grid,p));
 graphs[id]={nodes:graph.nodes.length,edges:graph.edges.length,routeLengthM:route?.length,routePoints:route?.points};
}
for(const f of osm.features.filter(f=>f.geometry?.type==='LineString'&&allowed(f.properties))){
 const points=f.geometry.coordinates.map(local);let n=0,oldValid=0,newValid=0;
 for(let j=1;j<points.length;j++){
  const a=points[j-1],b=points[j],length=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.ceil(length);
  for(let i=0;i<steps;i++){
   const p={x:a.x+(b.x-a.x)*i/steps,z:a.z+(b.z-a.z)*i/steps};if(p.x<raw.boundsM[0]||p.x>raw.boundsM[2]||p.z<raw.boundsM[1]||p.z>raw.boundsM[3])continue;
   const before=valid(g,p),after=valid(fine,p);n++;oldValid+=before;newValid+=after;
   if(before!==after)changed.push({id:f.id,name:f.properties.name??null,...p,before,after,baseHeightM:sampleGrid(g,p.x,p.z),refinedHeightM:sampleGrid(fine,p.x,p.z)});
  }
 }
 if(n)roads.push({id:f.id,name:f.properties.name??null,samples:n,oldValid,newValid});
}
const anchors=[];
for(const f of osm.features.filter(f=>f.geometry?.type==='Polygon'&&f.properties.building&&!f.properties.historic)){
 const ring=f.geometry.coordinates[0].map(local),a=buildingPlan(ring,f.properties,undefined,undefined,(x,z)=>sampleGrid(g,x,z)),b=buildingPlan(ring,f.properties,undefined,undefined,(x,z)=>sampleGrid(fine,x,z));
 if(a&&b&&(a.base!==b.base||a.top!==b.top||a.openings.length!==b.openings.length))anchors.push({id:f.id,baseDeltaM:b.base-a.base,topDeltaM:b.top-a.top,openingsBefore:a.openings.length,openingsAfter:b.openings.length,footprintUnchanged:JSON.stringify(a.ring)===JSON.stringify(b.ring)});
}
const high=[];
for(let z=-20;z<=90;z+=5)for(let x=-150;x<=80;x+=5)if(valid(fine,{x,z}))high.push({x,z,h:sampleGrid(fine,x,z)});
high.sort((a,b)=>b.h-a.h);
const original=await read('public/data/angles-decorations/manifest.json'),current=await read('public/data/angles-relief-decorations/manifest.json');
const treeChanges=current.trees.flatMap((p,i)=>p.y===original.trees[i].y?[]:[{x:p.x,z:p.z,mapped:p.mapped,deltaY:p.y-original.trees[i].y}]);
const protectedFiles=execFileSync('git',['ls-tree','-r','--name-only','03d963f','public/data','public/materials','public/audio','src/living','src/audio','.github'],{encoding:'utf8'}).trim().split('\n').filter(f=>f!=='public/data/angles-decorations/manifest.json'),preserved=[];
for(const file of protectedFiles){const current=await readFile(file),previous=execFileSync('git',['show',`03d963f:${file}`],{maxBuffer:40*1024*1024});if(!current.equals(previous))throw Error('Protected data changed: '+file);preserved.push({file,sha256:createHash('sha256').update(current).digest('hex')})}
await writeFile('docs/mission-14-evidence/collision-audit.json',JSON.stringify({sampling:'Existing allowed OSM axes, approximately every metre within refinement bounds. validPoint rules unchanged. Counts are conservative point eligibility, not connectivity or permission to enter water/bridges.',graphs,roads,changed,treeChanges,architectureAnchors:anchors,accessibleHighCandidates:high.slice(0,8),limitations:'Existing uncalibrated bridge remains non-navigable. Openings are illustrative: their previous ground-exclusion rule is reevaluated on the new terrain; no heritage reconstruction.'},null,2)+'\n');
await writeFile('docs/mission-14-evidence/preservation.json',JSON.stringify({base:'03d963fb1afeea9e2f209800748bfde5d1fab5f8',filesChecked:preserved.length,sha256:preserved,coarseDecorationManifest:'Only three generator fingerprints updated; original trees and all original packs retained.'},null,2)+'\n');
console.log({roads:roads.length,samples:roads.reduce((n,r)=>n+r.samples,0),lost:changed.filter(p=>p.before&&!p.after).length,gained:changed.filter(p=>!p.before&&p.after).length,changedTrees:treeChanges.length,changedBuildings:anchors.length,high:high.slice(0,3),preserved:preserved.length});
