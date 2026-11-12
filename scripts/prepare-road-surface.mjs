import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {gzipSync} from 'node:zlib';
import {sourceGeometry} from '../src/world/source-geometry.mjs';
import {cellIndices,sampleGrid} from '../src/world/terrain-grid.mjs';
import {barycentric,refinedCell} from '../src/world/terrain-refinement.mjs';
import {ROAD_STYLES} from '../src/world/road-style.mjs';
import {farIndices,ERROR} from './prepare-earth.mjs';
import {roadSegments,segmentCells,partitionRoads,rectangle,area,pc,capsule} from './lib/road-topology.mjs';
const digest=data=>createHash('sha256').update(data).digest('hex');
const faceKey=ids=>[...ids].sort((a,b)=>a-b).join(':');
function interpolation(g,x,z,source){
 const refined=refinedCell(g,x,z);
 if(refined){
  const ids=source.userData.refinedCells.get(refined.z*g.width+refined.x),p=source.attributes.position;
  for(let i=0;i<ids.length;i+=3){const tri=ids.slice(i,i+3),w=barycentric(tri.map(id=>({x:p.getX(id),z:p.getZ(id)})),x,z);if(w.every(v=>v>=-1e-7))return tri.map((id,j)=>[id,w[j]])}
  throw Error('Uncovered refined attribute');
 }
 const fx=(x-g.origin_x_m)/g.step_m,fz=(z-g.origin_z_m)/g.step_m,col=Math.min(g.width-2,Math.floor(fx)),row=Math.min(g.height-2,Math.floor(fz)),tx=fx-col,tz=fz-row;
 const a=row*g.width+col,b=a+1,c=a+g.width,d=c+1,h=g.elevations_m;
 if(Math.abs(h[a]-h[d])<Math.abs(h[b]-h[c]))return tx>=tz?[[a,1-tx],[b,tx-tz],[d,tz]]:[[a,1-tz],[c,tz-tx],[d,tx]];
 return tx+tz<=1?[[a,1-tx-tz],[b,tx],[c,tz]]:[[d,tx+tz-1],[c,1-tx],[b,1-tz]];
}
export function buildSurface(g,segments,{tileCells=40,coverTiles=[],auditLegacy=false,waterAreas=[]}={}){
 if((g.width-1)%tileCells||(g.height-1)%tileCells)throw new Error('Grid extent must fit the offline tile size');
 const source=sourceGeometry(g),positions=source.attributes.position,normals=source.attributes.normal,colors=source.attributes.color;
 const cells=segmentCells(segments,g),baseline=sampleGrid(g,0,0)??g.elevations_m[0],tiles=[];
 const water=waterAreas.length?pc.union(...waterAreas):[];
 const waterBounds=water.map(p=>{const q=p.flat();return {polygon:p,x0:Math.min(...q.map(p=>p[0])),x1:Math.max(...q.map(p=>p[0])),z0:Math.min(...q.map(p=>p[1])),z1:Math.max(...q.map(p=>p[1]))}});
 const stats={roadCells:0,roadAreaM2:0,waterCells:0,waterAreaM2:0,legacyOverlapExcessM2:0,legacyConflictCells:0,sliversDiscarded:0,sliverAreaM2:0,fineTriangles:0,farTriangles:0,vertices:0,materialAreasM2:{}};
 const palette=Object.fromEntries(Object.entries(ROAD_STYLES).map(([id,s])=>[id,new THREE.Color(s.color)]));
 for(let oz=0;oz<g.height-1;oz+=tileCells)for(let ox=0;ox<g.width-1;ox+=tileCells){
  const p=[],raw=[],n=[],c=[],r=[],w=[],index=[],map=new Map(),faces=new Map(),blocked=new Set();
  const vertex=(xx,zz,style=0,wet=0)=>{
   // Canonical Float32 positions are shared by all incident faces, including
   // different materials and adjacent tiles. No separate depth layer exists.
   const x=Math.fround(Math.max(g.origin_x_m,Math.min(g.origin_x_m+(g.width-1)*g.step_m,Math.round(xx*1e6)/1e6)));
   const z=Math.fround(Math.max(g.origin_z_m,Math.min(g.origin_z_m+(g.height-1)*g.step_m,Math.round(zz*1e6)/1e6)));
   const key=`${x}:${z}:${style}:${wet}`;if(map.has(key))return map.get(key);
   const id=r.length,weights=interpolation(g,x,z,source);map.set(key,id);
   raw.push(xx,zz);p.push(x,sampleGrid(g,x,z)-baseline,z);
   for(let axis=0;axis<3;axis++)n.push(weights.reduce((s,[v,w])=>s+w*normals.array[v*3+axis],0));
   if(style){const col=palette[style];c.push(col.r,col.g,col.b)}else for(let axis=0;axis<3;axis++)c.push(weights.reduce((s,[v,w])=>s+w*colors.array[v*3+axis],0));
   r.push(style);w.push(wet);return id;
  };
  // Insert every collinear boundary node on both incident faces before storage.
  // Otherwise Float32 rounding turns a T-junction into a tiny overlap/crack.
  const nodeFaces=emitted=>{
   const candidates=[...new Set(emitted)],out=[];
   const split=tri=>{
    for(let e=0;e<3;e++){
     const a=tri[e],b=tri[(e+1)%3],opposite=tri[(e+2)%3],dx=raw[b*2]-raw[a*2],dz=raw[b*2+1]-raw[a*2+1],length2=dx*dx+dz*dz;
     if(length2<1e-16)continue;
     for(const v of candidates){
      const vx=raw[v*2]-raw[a*2],vz=raw[v*2+1]-raw[a*2+1],t=(vx*dx+vz*dz)/length2;
      if(t<=1e-7||t>=1.-1e-7||Math.abs(dx*vz-dz*vx)>1e-8*Math.sqrt(length2))continue;
      const mid=vertex(raw[v*2],raw[v*2+1],r[a],w[a]);if(mid===a||mid===b)continue;
      // No need to split an edge that remains exactly collinear after packing.
      const cross=(p[b*3]-p[a*3])*(p[mid*3+2]-p[a*3+2])-(p[b*3+2]-p[a*3+2])*(p[mid*3]-p[a*3]);
      if(cross===0)continue;
      split([a,mid,opposite]);split([mid,b,opposite]);return;
     }
    }
    const [a,b,c]=tri,cross=(p[b*3]-p[a*3])*(p[c*3+2]-p[a*3+2])-(p[b*3+2]-p[a*3+2])*(p[c*3]-p[a*3]);
    if(cross< -1e-9)out.push(...tri);
   };
   for(let i=0;i<emitted.length;i+=3)split(emitted.slice(i,i+3));return out;
  };
  const gridVertex=id=>vertex(positions.getX(id),positions.getZ(id));
  // Stable first vertices retain the entire source lattice for diagnostics/LOD.
  for(let z=oz;z<=oz+tileCells;z++)for(let x=ox;x<=ox+tileCells;x++)gridVertex(z*g.width+x);
  for(let z=oz;z<oz+tileCells;z++)for(let x=ox;x<ox+tileCells;x++){
   const key=z*g.width+x,candidates=cells.get(key),domain=rectangle(g.origin_x_m+x*g.step_m,g.origin_z_m+z*g.step_m,g.step_m);
   let parts=candidates?partitionRoads(candidates,domain):null;
   const roadArea=parts?.filter(v=>v.style).reduce((s,v)=>s+area(v.polygons),0)??0;
   const px=g.origin_x_m+x*g.step_m,pz=g.origin_z_m+z*g.step_m;
   const localWater=waterBounds.filter(b=>b.x0<px+g.step_m&&b.x1>px&&b.z0<pz+g.step_m&&b.z1>pz);
   let waterArea=0;
   if(localWater.length){
    const cut=pc.intersection(localWater.map(b=>b.polygon),domain);
    if(cut.length){
     // Split only natural ground. Roads, including mapped bridge crossings,
     // retain their original material and exact shared DEM surface.
     parts=(parts??[{style:0,polygons:domain}]).flatMap(part=>{
      if(part.style)return [part];
      const wet=pc.intersection(part.polygons,cut),dry=pc.difference(part.polygons,cut);
      waterArea+=area(wet);
      return [{style:0,polygons:dry},{style:0,wet:1,polygons:wet}].filter(p=>p.polygons.length);
     });
    }
   }
   if(waterArea>1e-9){blocked.add(key);stats.waterCells++;stats.waterAreaM2+=waterArea;}
   if(roadArea>1e-9){blocked.add(key);stats.roadCells++;stats.roadAreaM2+=roadArea;for(const v of parts)if(v.style)stats.materialAreasM2[v.style]=(stats.materialAreasM2[v.style]??0)+area(v.polygons)}
   if(auditLegacy&&candidates){
    const shapes=candidates.map(s=>capsule(s.a,s.b,s.width,false)).filter(Boolean).map(poly=>pc.intersection(poly,domain)).filter(p=>p.length);
    if(shapes.length){const excess=shapes.reduce((sum,v)=>sum+area(v),0)-area(pc.union(...shapes));stats.legacyOverlapExcessM2+=Math.max(0,excess);if(excess>1e-6)stats.legacyConflictCells++}
   }
   const original=cellIndices(g,x,z,g.width,key),refined=source.userData.refinedCells.get(key),ids=refined??original,cellStart=index.length;
   if(refined)blocked.add(key);
   for(let triangle=0;triangle<ids.length;triangle+=3){
    const base=ids.slice(triangle,triangle+3),emitted=[];
    if(roadArea<=1e-9&&waterArea<=1e-9){emitted.push(...base.map(gridVertex))}
    else {
     const clip=[base.map(id=>[positions.getX(id),positions.getZ(id)])];clip[0].push([...clip[0][0]]);
     for(const part of parts){
      for(const polygon of pc.intersection(part.polygons,clip)){
       const rings=polygon.map(ring=>ring.slice(0,-1).map(([px,pz])=>new THREE.Vector2(px,pz))).filter(ring=>ring.length>=3);
       if(!rings.length)continue;const flattened=rings.flat();
       for(const tri of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1))){
        const q=tri.map(i=>flattened[i]),cross=(q[1].x-q[0].x)*(q[2].y-q[0].y)-(q[1].y-q[0].y)*(q[2].x-q[0].x);
        if(Math.abs(cross)<1e-9){stats.sliversDiscarded++;stats.sliverAreaM2+=Math.abs(cross)/2;continue}
        const vi=q.map(v=>vertex(v.x,v.y,part.style,part.wet??0));if(cross>0)[vi[1],vi[2]]=[vi[2],vi[1]];
        const ax=p[vi[1]*3]-p[vi[0]*3],az=p[vi[1]*3+2]-p[vi[0]*3+2],bx=p[vi[2]*3]-p[vi[0]*3],bz=p[vi[2]*3+2]-p[vi[0]*3+2];
        if(ax*bz-az*bx>=-1e-9){stats.sliversDiscarded++;stats.sliverAreaM2+=Math.abs(cross)/2;continue}emitted.push(...vi);
       }
      }
     }
    }
    const noded=roadArea>1e-9||waterArea>1e-9?nodeFaces(emitted):emitted;faces.set(faceKey(base),noded);index.push(...noded);
   }
   // Keep the documented detail in both LODs: no distant cliff collapse or
   // collision/render discrepancy. Other cells retain the existing LOD.
   if(refined){faces.set(faceKey(original.slice(0,3)),index.slice(cellStart));faces.set(faceKey(original.slice(3,6)),[]);}
  }
  const rawFar=tileCells%8===0?farIndices(g,ox,oz,tileCells,ERROR,blocked):null,far=[];
  if(rawFar){
   const globalId=id=>(oz+Math.floor(id/(tileCells+1)))*g.width+ox+id%(tileCells+1);
   for(let i=0;i<rawFar.length;i+=3){const ids=rawFar.slice(i,i+3).map(globalId),parts=faces.get(faceKey(ids));if(parts)far.push(...parts);else far.push(...ids.map(gridVertex))}
  }else far.push(...index);
  stats.fineTriangles+=index.length/3;stats.farTriangles+=far.length/3;stats.vertices+=r.length;
  tiles.push({x:ox,z:oz,size:tileCells,cover:coverTiles.find(t=>t.x===ox&&t.z===oz)?.cover??true,positions:new Float32Array(p),normals:new Float32Array(n),colors:new Float32Array(c),roads:new Uint8Array(r),water:new Uint8Array(w),fine:r.length<65536?new Uint16Array(index):new Uint32Array(index),far:r.length<65536?new Uint16Array(far):new Uint32Array(far),protectedCells:blocked.size});
 }
 source.dispose();return {tiles,stats};
}
export function packSurface(surface,metadata){
 const chunks=[],tiles=[];let length=0;
 const append=array=>{const pad=(4-length%4)%4;if(pad){chunks.push(Buffer.alloc(pad));length+=pad}const offset=length,bytes=Buffer.from(array.buffer,array.byteOffset,array.byteLength);chunks.push(bytes);length+=bytes.length;return {offset,length:array.length,type:array instanceof Float32Array?'f32':array instanceof Int16Array?'i16':array instanceof Uint8Array?'u8':array instanceof Uint16Array?'u16':'u32'}};
 for(const t of surface.tiles)tiles.push({x:t.x,z:t.z,size:t.size,cover:t.cover,protectedCells:t.protectedCells,position:append(t.positions),normal:append(Int16Array.from(t.normals,v=>Math.round(Math.max(-1,Math.min(1,v))*32767))),color:append(Uint8Array.from(t.colors,v=>Math.round(Math.max(0,Math.min(1,v))*255))),earthRoad:append(t.roads),earthWater:append(t.water),fine:append(t.fine),far:append(t.far)});
 const binary=Buffer.concat(chunks),manifest={schema:'endless-earth-single-surface-v1',...metadata,maxFarErrorM:ERROR,positionPrecision:'Float32; clipping coordinates canonicalized to 1 µm before Float32 storage',styles:ROAD_STYLES,stats:surface.stats,tiles,binaryBytes:binary.length,binarySha256:digest(binary)};
 return {binary,manifest};
}
export async function prepareRoadSurface(dir='public/data'){
 const [terrainText,osmText,earthText]=await Promise.all(['angles-terrain.json','angles-osm.geojson','angles-earth.json'].map(f=>readFile(`${dir}/${f}`,'utf8')));
 const g=JSON.parse(terrainText),data=JSON.parse(osmText),earth=JSON.parse(earthText);
 const local=([lon,lat])=>[(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(lat-46.6953)*111320];
 const waterAreas=data.features.filter(f=>f.geometry?.type==='Polygon'&&(f.properties.natural==='water'||f.properties.water)).map(f=>f.geometry.coordinates.map(r=>r.map(local)));
 const segments=roadSegments(data.features,local),surface=buildSurface(g,segments,{tileCells:earth.tileCells,coverTiles:earth.tiles,auditLegacy:true,waterAreas});
 const result=packSurface(surface,{terrainSha256:digest(terrainText),osmSha256:digest(osmText),terrainSource:g.source,osmSource:data.metadata,sourceSpacingM:g.step_m,segments:segments.length,estimatedWidthSegments:segments.filter(s=>s.estimated).length,roadOffsetM:0,polygonOffset:false});
 result.manifest.water={mode:'mapped-outline-dem-drape-v1',polygons:waterAreas.length,source:'OSM water polygons; source DEM heights unchanged',interpretation:'Terrain-draped visual water, not measured level, flow or bathymetry. Roads take priority. No separate water depth layer.'};
 const packed=gzipSync(result.binary,{level:9,mtime:0});result.manifest.compressedBytes=packed.length;
 await writeFile(`${dir}/angles-surface.pack`,packed);await writeFile(`${dir}/angles-surface.json`,JSON.stringify(result.manifest,null,2)+'\n');return result.manifest;
}
if(process.argv[1]===fileURLToPath(import.meta.url)){const start=performance.now(),m=await prepareRoadSurface();console.log(JSON.stringify({ms:performance.now()-start,bytes:m.binaryBytes,...m.stats},null,2))}
