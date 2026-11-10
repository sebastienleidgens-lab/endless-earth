// REJECTED runtime prototype; retained only to reproduce the signed-field/mask study.
// Distance to the OUTER union boundary: internal segment/intersection edges
// never become shoulders. The geometric road surface itself is untouched.
import {readFile,writeFile,mkdir,copyFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gunzipSync,gzipSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {shoulderMasks} from './lib/road-shoulder-mask.mjs';
import {pc,roadSegments} from './lib/road-topology.mjs';
export function boundaryDistanceField(rings,{size=2048,origin=[-1000,-1000],extent=[2000,2000],range=3}={}){
 const data=new Uint8Array(size*size).fill(255),sx=extent[0]/size,sz=extent[1]/size;
 for(const ring of rings)for(let i=1;i<ring.length;i++){
  const a=ring[i-1],b=ring[i],dx=b[0]-a[0],dz=b[1]-a[1],l2=dx*dx+dz*dz;if(l2<1e-16)continue;
  const x0=Math.max(0,Math.floor((Math.min(a[0],b[0])-range-origin[0])/sx)),x1=Math.min(size-1,Math.ceil((Math.max(a[0],b[0])+range-origin[0])/sx));
  const z0=Math.max(0,Math.floor((Math.min(a[1],b[1])-range-origin[1])/sz)),z1=Math.min(size-1,Math.ceil((Math.max(a[1],b[1])+range-origin[1])/sz));
  for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++){
   const px=origin[0]+(x+.5)*sx-a[0],pz=origin[1]+(z+.5)*sz-a[1],t=Math.max(0,Math.min(1,(px*dx+pz*dz)/l2));
   const distance=Math.hypot(px-t*dx,pz-t*dz),at=z*size+x;
   data[at]=Math.min(data[at],Math.round(Math.min(1,distance/range)*255));
  }
 }
 return data;
}
// Scanline even/odd fill also handles holes and disjoint union components.
// Encode signed metres in R8. Bilinear interpolation of a signed field preserves
// a straight subpixel boundary; an unsigned V-shaped field cannot do that.
export function signedBoundaryField(rings,config){
 const distance=boundaryDistanceField(rings,config),{size,origin,extent}=config;
 const inside=new Uint8Array(size*size),sx=extent[0]/size,sz=extent[1]/size;
 for(let z=0;z<size;z++){
  const pz=origin[1]+(z+.5)*sz,crossings=[];
  for(const ring of rings)for(let i=1;i<ring.length;i++){
   const a=ring[i-1],b=ring[i];if((a[1]>pz)===(b[1]>pz))continue;
   crossings.push(a[0]+(pz-a[1])*(b[0]-a[0])/(b[1]-a[1]));
  }
  crossings.sort((a,b)=>a-b);
  for(let i=0;i+1<crossings.length;i+=2){
   const from=Math.min(size,Math.max(0,Math.ceil((crossings[i]-origin[0])/sx-.5))),to=Math.min(size,Math.max(0,Math.ceil((crossings[i+1]-origin[0])/sx-.5)));
   inside.fill(1,z*size+from,z*size+to);
  }
 }
 return Uint8Array.from(distance,(d,i)=>Math.round(127.5+(inside[i]?1:-1)*d*.5));
}

const sha=b=>createHash('sha256').update(b).digest('hex');
export async function prepareRoadEdges(dir='work/road-finish-prototype',{size=1536}={}){
 const osm=await readFile(`${dir}/angles-osm.geojson`),terrain=await readFile(`${dir}/angles-terrain.json`),g=JSON.parse(terrain);
 const local=([lon,lat])=>[(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(lat-46.6953)*111320];
 const segments=roadSegments(JSON.parse(osm).features,local),union=pc.union(...segments.map(s=>s.polygon));
 const config={size,origin:[g.origin_x_m,g.origin_z_m],extent:[(g.width-1)*g.step_m,(g.height-1)*g.step_m],range:3};
 const data=signedBoundaryField(union.flat(),config);
 const geometryManifest=JSON.parse(await readFile(`${dir}/angles-surface.json`,'utf8'));
 const geometry=gunzipSync(await readFile(`${dir}/angles-surface.pack`));
 if(sha(geometry)!==geometryManifest.binarySha256||geometryManifest.osmSha256!==sha(osm)||geometryManifest.terrainSha256!==sha(terrain))throw new Error('Stale geometry for shoulder mask');
 const surface=decodeSurface(geometryManifest,geometry.buffer.slice(geometry.byteOffset,geometry.byteOffset+geometry.byteLength));
 const masks=shoulderMasks(surface,data,config),tiles=[];let offset=data.length;
 for(let i=0;i<masks.length;i++){tiles.push({x:surface.tiles[i].descriptor.x,z:surface.tiles[i].descriptor.z,offset,length:masks[i].length});offset+=masks[i].length;}
 const payload=Buffer.concat([data,...masks]),packed=gzipSync(payload,{level:9,mtime:0});
 const manifest={schema:'endless-earth-road-edge-v3',...config,encoding:'signed metres: (R / 255 * 2 - 1) * range; inside positive',osmSha256:sha(osm),terrainSha256:sha(terrain),sha256:sha(payload),distanceBytes:data.length,bytes:payload.length,surfaceSha256:geometryManifest.binarySha256,maskPaddingM:4,maskBytes:masks.reduce((n,a)=>n+a.length,0),tiles,compressedBytes:packed.length,interpretation:'Distance to estimated OSM road union boundary; not surveyed shoulders.'};
 await writeFile(`${dir}/angles-road-edge.pack`,packed);await writeFile(`${dir}/angles-road-edge.json`,JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const dir=process.argv[2]??'work/road-finish-prototype';
 if(!dir.startsWith('work/')||dir.split('/').includes('..'))throw new Error('Prototype output must stay under work/');
 await mkdir(dir,{recursive:true});for(const name of ['angles-terrain.json','angles-osm.geojson','angles-surface.json','angles-surface.pack'])await copyFile('public/data/'+name,dir+'/'+name);
 const start=performance.now(),m=await prepareRoadEdges(dir);console.log(m,{ms:performance.now()-start});
}
