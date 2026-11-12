// Conservative preservation of existing walkable OSM corridors. These cells
// retain the documented Mission 13 approximation pending road-level surveys.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {cpuModules} from './lib/cpu-modules.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {allowed} from '../src/living/walk.mjs';
const g=JSON.parse(await readFile('public/data/angles-terrain.json')),data=JSON.parse(await readFile('public/data/angles-osm.geojson'));
const load=await cpuModules(process.cwd(),'work/mission-14/protection-modules'),{setBuildingFootprints,canWalk}=await load('src/world/collisions.ts');setBuildingFootprints(data.features);
const local=([lon,lat])=>({x:(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(lat-46.6953)*111320}),cells=new Set();let samples=0;
for(const f of data.features.filter(f=>f.geometry?.type==='LineString'&&allowed(f.properties))){
 const points=f.geometry.coordinates.map(local);
 for(let i=1;i<points.length;i++){
  const a=points[i-1],b=points[i],steps=Math.ceil(Math.hypot(b.x-a.x,b.z-a.z)/.25);
  for(let j=0;j<=steps;j++){
   const p={x:a.x+(b.x-a.x)*j/steps,z:a.z+(b.z-a.z)*j/steps},h=sampleGrid(g,p.x,p.z);
   if(!canWalk(p.x,p.z)||h===null||![[.5,0],[-.5,0],[0,.5],[0,-.5]].every(([dx,dz])=>{const y=sampleGrid(g,p.x+dx,p.z+dz);return y!==null&&Math.abs(y-h)<.3}))continue;
   samples++;
   for(let z=Math.floor((p.z-1.25-g.origin_z_m)/g.step_m);z<=Math.floor((p.z+1.25-g.origin_z_m)/g.step_m);z++)for(let x=Math.floor((p.x-1.25-g.origin_x_m)/g.step_m);x<=Math.floor((p.x+1.25-g.origin_x_m)/g.step_m);x++)if(x>=0&&z>=0&&x<g.width-1&&z<g.height-1)cells.add(z*g.width+x);
  }
 }
}
await mkdir('work/mission-14',{recursive:true});await writeFile('work/mission-14/protected-cells.json',JSON.stringify({method:'Original validPoint/collision predicate along allowed OSM axes every <=0.25 m; preserve whole 10 m cells within 1.25 m. No new roads or access rights.',samples,keys:[...cells].sort((a,b)=>a-b)})+'\n');
console.log('Protected road corridor cells',cells.size);
