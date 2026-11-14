import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import assert from 'node:assert/strict';
import {cpuModules} from './lib/cpu-modules.mjs';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {surfaceSupport} from '../src/world/surface-support.mjs';
import {prepareLandmarks} from '../src/world/landmark-model.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
const out='docs/mission-23-evidence',json=async n=>JSON.parse(await readFile('public/data/'+n)),osm=await json('angles-osm.geojson'),grid=await json('angles-terrain.json');
grid.refinement=validateRefinement(grid,await json('angles-relief.json'));
const baseline=sampleGrid(grid,0,0),lm=await json('angles-landmarks.json'),landmarks=prepareLandmarks(lm,baseline,lm.bindings),manifest=await json('angles-ground-truth.json'),raw=gunzipSync(await readFile('public/data/angles-ground-truth.pack')),surface=decodeSurface(manifest,raw.buffer.slice(raw.byteOffset,raw.byteOffset+raw.byteLength)),index=surfaceSupport(surface.tiles,[-1000,-1000,1000,1000]),height=(x,z)=>index.sample(x,z)??null,load=await cpuModules(process.cwd(),'work/mission-23/free-native-modules'),physical=await load('src/world/collisions.ts');
physical.setBuildingFootprints([...osm.features,...landmarks.collisionFeatures],undefined,(f,x,z)=>landmarks.support(`osm-way-${f.properties?.osm_id}`,x,z),index);
const local=p=>({x:(p[0]-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(p[1]-46.6953)*111320}),inside=(p,poly)=>{let yes=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const a=poly[i],b=poly[j];if((a.z>p.z)!==(b.z>p.z)&&p.x<(b.x-a.x)*(p.z-a.z)/(b.z-a.z)+a.x)yes=!yes}return yes};
const water=osm.features.filter(f=>f.geometry.type==='Polygon'&&f.properties.natural==='water').map(f=>f.geometry.coordinates[0].map(local)),woods=osm.features.filter(f=>f.geometry.type==='Polygon'&&f.properties.landuse==='forest').map(f=>f.geometry.coordinates[0].map(local));
function bankDistance(p){let d=Infinity;for(const poly of water)for(let i=1;i<poly.length;i++){const a=poly[i-1],b=poly[i],dx=b.x-a.x,dz=b.z-a.z,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));d=Math.min(d,Math.hypot(p.x-a.x-dx*t,p.z-a.z-dz*t))}return d}
const rows=JSON.parse(gunzipSync(await readFile(out+'/network-trace.json.gz'))).filter(r=>r.after.passed&&r.direction==='forward'&&r.length>=8&&r.length<=35&&r.tags.bridge!=='yes'&&physical.canTraverse(r.from,r.to,height)&&physical.canTraverse(r.to,r.from,height)),middle=r=>({x:(r.from.x+r.to.x)/2,z:(r.from.z+r.to.z)/2}),reports=[];
const bank=rows.filter(r=>bankDistance(middle(r))>=3&&bankDistance(middle(r))<=20).sort((a,b)=>bankDistance(middle(a))-bankDistance(middle(b)))[0];
if(bank)reports.push({name:'berge-admissible',category:'bank',case:bank,bankDistanceM:bankDistance(middle(bank)),provenance:'Existing mapped pedestrian axis beside a mapped water polygon; actual production sweep remains clear in both directions.'});
const forest=rows.find(r=>woods.some(poly=>inside(r.from,poly)&&inside(r.to,poly)));
if(forest)reports.push({name:'foret-aller-retour',category:'forest',case:forest,provenance:'Existing admitted OSM axis inside an OSM forest polygon; no new path or tree placement.'});
const cells=(await json('angles-ground-truth-repairs.json')).cells.sort((a,b)=>Math.hypot(a.x-100,a.z-100)-Math.hypot(b.x-100,b.z-100));let natural=null;
for(const cell of cells){const x=-1000+cell.x*10+5,z=-1000+cell.z*10+5;if(Math.abs(x)>850||Math.abs(z)>850)continue;for(const [dx,dz]of [[3.3,0],[0,3.3],[2.8,2.8],[2.8,-2.8]]){const from={x:x-dx,z:z-dz},to={x:x+dx,z:z+dz};if(Math.abs(height(from.x,from.z)-height(to.x,to.z))<.5)continue;let valid=true;for(let k=0;k<=24;k++){const px=from.x+(to.x-from.x)*k/24,pz=from.z+(to.z-from.z)*k/24,hit=index.inspect(px,pz);if(!hit||hit.category!=='terrain'||!physical.canWalk(px,pz)){valid=false;break}}if(valid&&physical.canTraverse(from,to,height)&&physical.canTraverse(to,from,height)){natural={name:'terrain-naturel-repare',category:'natural',case:{id:`ign-repair-cell-${cell.x}-${cell.z}`,from,to,length:Math.hypot(2*dx,2*dz),tags:{source:'IGN LiDAR HD MNT',surface:'natural terrain; no mapped route added'}},provenance:'Free movement test inside one source-refined natural cell, with rendered support and unchanged access/collision rules. This test segment is not an invented public path or a graph edge.'};break}}if(natural)break}
if(natural)reports.push(natural);
assert.ok(bank,'No admissible mapped bank case');assert.ok(forest,'No admitted forest case');assert.ok(natural,'No safe natural repaired cell case');
await writeFile(out+'/additional-native-cases.json',JSON.stringify({method:'Deterministic extra native test locations selected from unchanged mapped axes and the active rendered terrain; no edits to geography, access, collisions or route graph.',cases:reports},null,2)+'\n');console.log(reports.map(r=>({name:r.name,source:r.case.id,metres:r.case.length,from:r.case.from,to:r.case.to})));
