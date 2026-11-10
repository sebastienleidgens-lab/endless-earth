// Offline derivatives only. No network, stochastic heights, or browser processing.
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {deflateSync} from 'node:zlib';
import {fileURLToPath} from 'node:url';
import {sampleGrid,cellIndices,sourceTriangles,clipConvex} from '../src/world/terrain-grid.mjs';
import {COVER,coverClass,coverAt} from '../src/world/landcover.mjs';
export const TILE=40,ERROR=.25;
// Decorative floor tones within an explicit mapped habitat only. This is not
// an observation of litter, species, wetness or a new land-use classification.
export function floorTint(type,x,z,slope){
 const patch=(Math.sin(x*.071+Math.sin(z*.043)*1.8)+Math.sin(z*.097-x*.029))*.5;
 if(type!=='wood')return {color:COVER[type].color,shade:1,alpha:255};
 const warm=(patch+1)*.5,green=[.36,.40,.28],litter=[.43,.385,.285];
 const rgb=green.map((c,i)=>Math.round(255*(c+(litter[i]-c)*warm)));
 const t=Math.max(0,Math.min(1,(slope-.3)/.6));
 return {color:(rgb[0]<<16)|(rgb[1]<<8)|rgb[2],shade:.96+patch*.16,alpha:Math.round(255*(1-t*t*(3-2*t)*.88))};
}
export function farIndices(g,ox,oz,size,tolerance=ERROR,blocked=new Set()){
 const out=[],stride=size+1,id=(x,z)=>(z-oz)*stride+x-ox;
 const point=(x,z)=>({x:g.origin_x_m+x*g.step_m,z:g.origin_z_m+z*g.step_m});
 const block=(x,z,n)=>{
  if(n>=4){
   const ring=[];for(let i=0;i<n;i++)ring.push([x+i,z]);for(let i=0;i<n;i++)ring.push([x+n,z+i]);for(let i=0;i<n;i++)ring.push([x+n-i,z+n]);for(let i=0;i<n;i++)ring.push([x,z+n-i]);
   const center=[x+n/2,z+n/2],fans=ring.map((p,i)=>[center,p,ring[(i+1)%ring.length]]);
   let valid=true;
   for(let zz=z;zz<z+n;zz++)for(let xx=x;xx<x+n;xx++)if(blocked.has(zz*g.width+xx))valid=false;
   for(const f of valid?fans:[]){
    const [a,b,c]=f.map(([xx,zz])=>point(xx,zz)),ha=sampleGrid(g,a.x,a.z),hb=sampleGrid(g,b.x,b.z),hc=sampleGrid(g,c.x,c.z);
    const det=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
    const predicted=p=>ha+((p.x-a.x)*(c.z-a.z)-(p.z-a.z)*(c.x-a.x))/det*(hb-ha)+((b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x))/det*(hc-ha);
    // All extrema of the difference of two piecewise planes occur at
    // vertices of their intersection polygons, not just DEM grid nodes.
    for(let zz=z;zz<z+n&&valid;zz++)for(let xx=x;xx<x+n&&valid;xx++)for(const t of sourceTriangles(g,xx,zz)){
     for(const p of clipConvex(t,[a,b,c]))if(Math.abs(sampleGrid(g,p.x,p.z)-predicted(p))>tolerance-1e-7){valid=false;break}
    }
    if(!valid)break;
   }
   if(valid){for(const f of fans)out.push(id(...f[0]),id(...f[2]),id(...f[1]));return}
   if(n>=8){for(const [dx,dz] of [[0,0],[n/2,0],[0,n/2],[n/2,n/2]])block(x+dx,z+dz,n/2);return}
  }
  for(let zz=z;zz<z+n;zz++)for(let xx=x;xx<x+n;xx++)out.push(...cellIndices(g,xx,zz,stride,id(xx,zz)));
 };
 for(let z=oz;z<oz+size;z+=8)for(let x=ox;x<ox+size;x+=8)block(x,z,8);
 return out;
}
const crcTable=Array.from({length:256},(_,n)=>{for(let k=0;k<8;k++)n=n&1?0xedb88320^(n>>>1):n>>>1;return n>>>0});
function chunk(type,data){const tag=Buffer.from(type),n=Buffer.alloc(4);n.writeUInt32BE(data.length);let crc=0xffffffff;for(const v of Buffer.concat([tag,data]))crc=crcTable[(crc^v)&255]^(crc>>>8);const tail=Buffer.alloc(4);tail.writeUInt32BE((crc^0xffffffff)>>>0);return Buffer.concat([n,tag,data,tail])}
export function png(width,height,rgba){const header=Buffer.alloc(13);header.writeUInt32BE(width);header.writeUInt32BE(height,4);header[8]=8;header[9]=6;const scan=Buffer.alloc((width*4+1)*height);for(let z=0;z<height;z++)Buffer.from(rgba.buffer,rgba.byteOffset+z*width*4,width*4).copy(scan,z*(width*4+1)+1);return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]),chunk('IHDR',header),chunk('IDAT',deflateSync(scan,{level:9})),chunk('IEND',Buffer.alloc(0))])}
const hash=s=>createHash('sha256').update(s).digest('hex');
export async function prepare(dir='public/data'){
 const text=await readFile(`${dir}/angles-terrain.json`,'utf8'),osm=await readFile(`${dir}/angles-osm.geojson`,'utf8'),g=JSON.parse(text),data=JSON.parse(osm);
 if((g.width-1)%TILE||(g.height-1)%TILE)throw new Error('Unsupported tile extent: reconfigure offline tile size');
 const tiles=[],all=[];for(let z=0;z<g.height-1;z+=TILE)for(let x=0;x<g.width-1;x+=TILE){const index=farIndices(g,x,z,TILE);tiles.push({x,z,size:TILE,offset:all.length,count:index.length,cover:false});all.push(...index)}
 const bytes=Buffer.alloc(all.length*2);all.forEach((v,i)=>bytes.writeUInt16LE(v,i*2));
 const features=data.features.filter(f=>f.geometry?.type==='Polygon'&&coverClass(f.properties??{})).map(f=>({tags:f.properties,rings:f.geometry.coordinates.map(r=>r.map(p=>({x:(p[0]-.8844)*111320*Math.cos(46.6953*Math.PI/180),z:-(p[1]-46.6953)*111320})))}));
 const step=2,width=(g.width-1)*g.step_m/step,height=(g.height-1)*g.step_m/step,pixels=new Uint8Array(width*height*4),counts={};
 for(let z=0;z<height;z++)for(let x=0;x<width;x++){
  const type=coverAt(g.origin_x_m+(x+.5)*step,g.origin_z_m+(z+.5)*step,features);if(!type)continue;
  counts[type]=(counts[type]??0)+1;
  // Include a 16 m halo for filtered mask transitions, without imposing an
  // atlas lookup on distant tiles that contain no mapped habitat at all.
  const columns=(g.width-1)/TILE,tilePixels=TILE*g.step_m/step;
  for(const dx of [-8,0,8])for(const dz of [-8,0,8]){const tx=Math.floor((x+dx)/tilePixels),tz=Math.floor((z+dz)/tilePixels);if(tx>=0&&tz>=0&&tx<columns&&tz<(g.height-1)/TILE)tiles[tz*columns+tx].cover=true;}
  const wx=g.origin_x_m+(x+.5)*step,wz=g.origin_z_m+(z+.5)*step;
  const hx0=sampleGrid(g,Math.max(g.origin_x_m,wx-5),wz),hx1=sampleGrid(g,Math.min(g.origin_x_m+(g.width-1)*g.step_m,wx+5),wz);
  const hz0=sampleGrid(g,wx,Math.max(g.origin_z_m,wz-5)),hz1=sampleGrid(g,wx,Math.min(g.origin_z_m+(g.height-1)*g.step_m,wz+5));
  const tint=floorTint(type,wx,wz,Math.hypot(hx1-hx0,hz1-hz0)/10),c=tint.color,i=(z*width+x)*4;
  // Linear RGB premultiplied by an artistic blend weight. Known coverage
  // and source provenance are kept separately; alpha is not confidence.
  const linear=v=>Math.round(255*(v<=.04045?v/12.92:((v+.055)/1.055)**2.4));
  const weight=tint.alpha/255;
  pixels[i]=Math.round(linear(((c>>16)&255)/255)*tint.shade*weight);pixels[i+1]=Math.round(linear(((c>>8)&255)/255)*tint.shade*weight);pixels[i+2]=Math.round(linear((c&255)/255)*tint.shade*weight);pixels[i+3]=tint.alpha;
 }
 const image=png(width,height,pixels);
 const manifest={schema:'endless-earth-prepared-v1',terrainSha256:hash(text),osmSha256:hash(osm),horizontalFrame:'legacy local tangent plane, X east / Z south, metres; see geo.ts',source:g.source,sourceRetrievedAt:g.provenance.retrieved_at,sourceSpacingM:g.step_m,verticalDatum:g.vertical_datum,maxFarErrorM:ERROR,tileCells:TILE,tiles,farTriangles:all.length/3,fineTriangles:2*(g.width-1)*(g.height-1),lodSha256:hash(bytes),coverSha256:hash(image),cover:{origin:[g.origin_x_m,g.origin_z_m],extent:[width*step,height*step],width,height,stepM:step,counts,source:data.metadata,interpretation:'Material palette inferred from explicit OSM land use only; unknown is transparent. Raster spacing is not survey accuracy.'}};
 manifest.cover.sourceFeatures=data.features.filter(f=>f.geometry?.type==='Polygon'&&coverClass(f.properties??{})).map(f=>({id:f.id,source:f.properties.source,year:f.properties['CLC:year']??null,leafType:f.properties.leaf_type??null}));
 manifest.cover.provenanceByAttribute={outline:'OSM polygon; inherited source and year per feature',classification:'Explicit OSM tags only; no use assigned to unknown ground',floorColor:'Original procedural art; litter is illustrative',slopeBlend:'Existing IGN 10 m DEM; changes color only',alpha:'Artistic blend weight, not measurement confidence'};
 await writeFile(`${dir}/angles-terrain-lod.bin`,bytes);await writeFile(`${dir}/angles-landcover.png`,image);await writeFile(`${dir}/angles-earth.json`,JSON.stringify(manifest,null,2)+'\n');return manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url))console.log(JSON.stringify(await prepare(),null,2));
