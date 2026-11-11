// Reproducible offline appearance derivative; source geometry is never written.
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import polygonClipping from 'polygon-clipping';
import {mergeEnvironment} from '../src/world/environment.mjs';
import {coverAt,coverClass} from '../src/world/landcover.mjs';
import {segmentDistance} from '../src/nature/ecology.mjs';
import {SURFACE_ART_VERSION,SHORE_RANGE,habitatWeights,makeGroundAtlas,ART_METRES} from '../src/world/surface-art.mjs';
import {png} from './prepare-earth.mjs';
import {cpuModules} from './lib/cpu-modules.mjs';
const sha=b=>createHash('sha256').update(b).digest('hex');
export async function prepareSurfaceArt(dir='public/data',out='public/materials/earth',cache='work/mission-12/assets',frame=null){
 const [terrain,osm,environment]=await Promise.all(['terrain.json','osm.geojson','environment.json'].map(p=>readFile(`${dir}/angles-${p}`)));
 const g=JSON.parse(terrain),geo=JSON.parse(osm),env=JSON.parse(environment),size=1024;
 const origin=[g.origin_x_m,g.origin_z_m],extent=[(g.width-1)*g.step_m,(g.height-1)*g.step_m];
 const load=await cpuModules(process.cwd(),'work/surface-preparation-modules'),{toLocal,ANGLES}=await load('src/world/geo.ts');
 const local=p=>toLocal({lon:p[0],lat:p[1]},frame??ANGLES);
 const box=ring=>[Math.min(...ring.map(p=>p.x)),Math.min(...ring.map(p=>p.z)),Math.max(...ring.map(p=>p.x)),Math.max(...ring.map(p=>p.z))];
 const covers=mergeEnvironment(geo.features,env).filter(f=>f.geometry?.type==='Polygon'&&coverClass(f.properties??{})).map(f=>{const rings=f.geometry.coordinates.map(r=>r.map(local));return {tags:f.properties,rings,box:box(rings[0])}});
 const waters=geo.features.filter(f=>f.geometry?.type==='Polygon'&&(f.properties.natural==='water'||f.properties.water)).map(f=>f.geometry.coordinates.map(r=>r.map(p=>{const q=local(p);return [q.x,q.z]})));
 const union=waters.length?polygonClipping.union(...waters):[];
 // Use the union's exterior AND island boundaries. No false shore at overlaps.
 const segments=union.flatMap(poly=>poly.flatMap(r=>r.slice(1).map((b,i)=>({a:{x:r[i][0],z:r[i][1]},b:{x:b[0],z:b[1]}}))));
 const cells=new Map(),near=(x,z)=>{const cx=Math.floor(x/64),cz=Math.floor(z/64),key=`${cx}:${cz}`;let q=cells.get(key);if(!q){q={covers:covers.filter(f=>f.box[0]<=(cx+1)*64&&f.box[2]>=cx*64&&f.box[1]<=(cz+1)*64&&f.box[3]>=cz*64),segments:segments.filter(s=>Math.min(s.a.x,s.b.x)<=(cx+1)*64+SHORE_RANGE&&Math.max(s.a.x,s.b.x)>=cx*64-SHORE_RANGE&&Math.min(s.a.z,s.b.z)<=(cz+1)*64+SHORE_RANGE&&Math.max(s.a.z,s.b.z)>=cz*64-SHORE_RANGE)};cells.set(key,q)}return q};
 const pixels=new Uint8Array(size*size*4),counts={};
 for(let z=0;z<size;z++)for(let x=0;x<size;x++){
  const p={x:origin[0]+(x+.5)*extent[0]/size,z:origin[1]+(z+.5)*extent[1]/size},q=near(p.x,p.z),type=coverAt(p.x,p.z,q.covers),w=habitatWeights(type);
  const d=q.segments.reduce((d,s)=>Math.min(d,segmentDistance(p,s.a,s.b)),SHORE_RANGE),i=(z*size+x)*4;
  pixels[i]=w[0]*255;pixels[i+1]=w[1]*255;pixels[i+2]=w[2]*255;pixels[i+3]=Math.round(d/SHORE_RANGE*255);
  counts[type??'unknown']=(counts[type??'unknown']??0)+1;
 }
 const field=png(size,size,pixels),rock=new Uint8Array(await readFile(`${cache}/rock-rg.bin`)),atlas=makeGroundAtlas(rock),atlasPNG=png(atlas.width,atlas.height,atlas.data),procedural=makeGroundAtlas();
 await mkdir(out,{recursive:true});
 const source=JSON.parse(await readFile(`${cache}/source.json`,'utf8'));
 const manifest={schema:SURFACE_ART_VERSION,sources:{terrain:sha(terrain),osm:sha(osm),environment:sha(environment)},origin,extent,size,range:SHORE_RANGE,atlasSize:atlas.width,hashes:{field:sha(field),atlas:sha(atlasPNG)},counts,bytes:{field:field.length,atlas:atlasPNG.length},interpretation:{weights:'Mapped habitat classes only; unknown remains generic. RGB = meadow/open/garden/scrub, wood, explicit rock. Bilinear transitions affect appearance only.',shore:'Distance to the union of existing OSM water outlines, including islands. Unsigned, capped at 16 m. No water depth or flow measurement.',slope:'Existing IGN normals only; exposed mineral colouring is an artistic interpretation, not a geological survey.'}};
 const catalog={schema:'endless-earth-material-catalog-v1',checked:'2026-11-11',budgetEUR:0,atlas:{file:'surface-atlas.png',sha256:sha(atlasPNG),dimensions:[atlas.width,atlas.height],format:'PNG RGBA8, data texture, mipmapped',gpuBytesWithMipmaps:atlas.width*atlas.height*4*4/3},families:[{name:'terre générique',author:'Endless Earth',source:'scripts/prepare-surface-art.mjs + src/world/surface-art.mjs',license:'Original project code',metres:ART_METRES[0]},{name:'herbe / prairie documentée',author:'Endless Earth',source:'src/world/surface-art.mjs',license:'Original project code',metres:ART_METRES[1]},{name:'sol forestier interprété',author:'Endless Earth',source:'src/world/surface-art.mjs',license:'Original project code',metres:ART_METRES[2]},{...source,metres:ART_METRES[3]}],existing:'Road mineral RG atlas and OSM material classes retained, with more legible shading. No new paving assignment.',usage:'Shared ground and river-bank material; no runtime third-party request, no geometry displacement.'};
 await Promise.all([writeFile(`${out}/surface-field.png`,field),writeFile(`${out}/surface-atlas.png`,atlasPNG),writeFile(`${out}/surface-art.json`,JSON.stringify(manifest,null,2)+'\n'),writeFile(`${out}/catalog.json`,JSON.stringify(catalog,null,2)+'\n'),writeFile(`${cache}/procedural-atlas.png`,png(procedural.width,procedural.height,procedural.data))]);
 return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await prepareSurfaceArt(),null,2));
