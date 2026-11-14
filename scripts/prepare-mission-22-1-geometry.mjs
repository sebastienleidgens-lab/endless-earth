// Repair representation conflicts, never smooth the IGN MNT or move OSM axes.
import * as THREE from 'three';
import clipping from 'polygon-clipping';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync,gzipSync} from 'node:zlib';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {barycentric} from '../src/world/terrain-refinement.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {ROAD_STYLES} from '../src/world/road-style.mjs';
const base=process.env.M221_GEOMETRY_OUT??'public/data/',sourceCommit='9b9beaab43d41840ce6b6e5e5a5ad34e7927361e',sha=b=>createHash('sha256').update(b).digest('hex'),source=f=>execFileSync('git',['show',sourceCommit+':public/data/'+f],{maxBuffer:64*1024*1024}),load=async f=>JSON.parse(source(f));
await mkdir('docs/mission-22-1-evidence',{recursive:true});await mkdir(base,{recursive:true});
const landmark=await load('angles-landmarks.json');
if(landmark.mission221)throw Error('Already repaired; restore the three original surface/landmark packs before regenerating.');
const bridge=landmark.objects.find(o=>o.id==='pont'),road=bridge.parts[bridge.supportPart],oldRoad=[...road.position],rows=[];
const baseline=sampleGrid(await load('angles-terrain.json'),0,0);
for(let i=0;i<oldRoad.length;i+=15)rows.push(oldRoad.slice(i,i+15));
let maxCross=0;for(const row of rows){const center=row[7];for(let j=1;j<row.length;j+=3)maxCross=Math.max(maxCross,Math.abs(row[j]-center));}
// The cross-bank DEM was blended into a road deck. Keep each original centre
// station and observed longitudinal profile; no surveyed camber is available.
for(let i=0;i<road.position.length;i+=15)for(let j=1;j<15;j+=3)road.position[i+j]=oldRoad[i+7];
const oldTriangles=[];for(let i=0;i<road.index.length;i+=3)oldTriangles.push(road.index.slice(i,i+3).map(k=>({x:oldRoad[k*3],y:oldRoad[k*3+1],z:oldRoad[k*3+2],h:road.position[k*3+1]})));
function correction(x,z){for(const t of oldTriangles){const w=barycentric(t,x,z);if(w.every(v=>v>=-.15))return w.reduce((sum,v,i)=>sum+v*(t[i].h-t[i].y),0)}return 0}
let metalVertices=0;for(let i=0;i<bridge.parts[2].position.length;i+=3){const p=bridge.parts[2].position,d=correction(p[i],p[i+2]);if(Math.abs(d)>1e-7){p[i+1]+=d;metalVertices++;}}
// Plinth vertices occur in short quads; match original road-height levels.
const stone=bridge.parts[0];let plinthVertices=0;
for(let i=0;i<stone.position.length;i+=3){const x=stone.position[i],y=stone.position[i+1],z=stone.position[i+2];let best=null;
 for(const row of rows)for(const j of [0,12]){const dx=x-row[j],dz=z-row[j+2],d=Math.hypot(dx,dz);if(d<.41&&(!best||d<best.d))best={d,h:row[j+1],delta:row[7]-row[j+1]};}
 if(best&&[0,.24,.25,.20,.22,.18].some(h=>Math.abs(y-best.h-h)<.002)){stone.position[i+1]+=best.delta;plinthVertices++;}
}
for(const part of bridge.parts){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));g.setIndex(part.index);g.computeVertexNormals();part.normal=Array.from(g.attributes.normal.array,v=>Math.round(THREE.MathUtils.clamp(v,-1,1)*32767));g.dispose();}
bridge.confidence.crossSection='M22.1: transverse road plane at existing centre stations; riverbank crossfall removed. Longitudinal class-17 profile and original centre endpoint elevations preserved. Drainage camber unknown; planar section inferred.';
const footprint=[...rows.map(r=>[r[0],r[2]]),...rows.toReversed().map(r=>[r[12],r[14]])];footprint.push(footprint[0]);
// Reconstruct the already inferred Rue du Pont continuously between its
// original source centre endpoints. Clipping a handful of old large faces and
// moving only their end vertices otherwise produces a short false steep ramp.
const rue=(await load('angles-walk-surface.json')).walkCorrection.profiles[0],rueRows=[],rueCount=Math.ceil(rue.length/.5),rueAxis={x:(rue.b.x-rue.a.x)/rue.length,z:(rue.b.z-rue.a.z)/rue.length},cross=[-2.75,-1.5,0,1.5,2.75];
for(let i=0;i<=rueCount;i++){const t=i/rueCount,row=[];for(let j=0;j<cross.length;j++){const n=cross[j],ax=rue.a.x-rueAxis.z*n,az=rue.a.z+rueAxis.x*n;row.push(ax*(1-t)+rows[0][j*3]*t,(rue.startM*(1-t)+rue.endM*t)-baseline,az*(1-t)+rows[0][j*3+2]*t);}rueRows.push(row);}
const rueRing=[...rueRows.map(r=>[r[0],r[2]]),...rueRows.toReversed().map(r=>[r[12],r[14]])];rueRing.push(rueRing[0]);const cutFootprints=clipping.union([footprint],[rueRing]);
landmark.mission221={method:bridge.confidence.crossSection,maxRemovedCrossfallM:maxCross};
const lmText=JSON.stringify(landmark)+'\n';await writeFile(base+'angles-landmarks.json',lmText);await writeFile(base+'angles-landmarks.pack',gzipSync(lmText,{level:9,mtime:0}));
const cutPoints=[...footprint,...rueRing],bounds=[Math.min(...cutPoints.map(p=>p[0])),Math.min(...cutPoints.map(p=>p[1])),Math.max(...cutPoints.map(p=>p[0])),Math.max(...cutPoints.map(p=>p[1]))],reports=[];
let landmarkHash;
const ends=[0,rows.length-1].map(i=>{const r=rows[i],next=rows[i===0?1:rows.length-2],dx=r[6]-next[6],dz=r[8]-next[8],d=Math.hypot(dx,dz);return {r,ux:dx/d,uz:dz/d};});
function approachHeight(x,z,y,isRoad){if(!isRoad)return y;for(const {r,ux,uz}of ends){const dx=x-r[6],dz=z-r[8],s=dx*ux+dz*uz,n=dx*-uz+dz*ux;if(s<-.0001||s>3||Math.abs(n)>2.751)continue;
 // End cross-section orientation may be reversed; interpolate on the actual
 // original five vertices, then blend over the already mapped carriageway.
 const across=((x-r[0])*(r[12]-r[0])+(z-r[2])*(r[14]-r[2]))/((r[12]-r[0])**2+(r[14]-r[2])**2)*5.5,values=[0,1.25,2.75,4.25,5.5];let j=0;while(j<3&&values[j+1]<across)j++;const t=(across-values[j])/(values[j+1]-values[j]),old=r[j*3+1]*(1-t)+r[(j+1)*3+1]*t;
 return Math.abs(s)<.0001?r[7]-baseline:y+(r[7]-old)*(1-Math.max(0,s)/3);
 }return y;}
for(const name of ['angles-landmark-surface','angles-walk-surface']){
 const m=await load(name+'.json'),bytes=gunzipSync(source(name+'.pack')),surface=decodeSurface(m,bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength));let removedArea=0,changedFaces=0,addedVertices=0;const roadEndInfluence=[];let removedQuantizedSlivers=0;
 for(const tile of surface.tiles){const p=tile.attributes.position.array,ids=tile.fine.array,r=tile.attributes.earthRoad.array,wet=tile.attributes.earthWater.array,colors=tile.attributes.color.array,normals=tile.attributes.normal.array;let changed=false;const endIds=new Set();for(let k=0;k<r.length;k++){const y=approachHeight(p[k*3],p[k*3+2],p[k*3+1],r[k]&&!wet[k]);if(Math.abs(y-p[k*3+1])>1e-6){p[k*3+1]=y;changed=true;endIds.add(k);}}const positions=Array.from(p),normal=Array.from(normals),color=Array.from(colors),roads=Array.from(r),water=Array.from(wet),next=[];
 for(let i=0;i<ids.length;i+=3){const tri=Array.from(ids.subarray(i,i+3)),t=tri.map(k=>({x:p[k*3],y:p[k*3+1],z:p[k*3+2]}));if(tri.some(k=>endIds.has(k)))roadEndInfluence.push(t.map(p=>({x:p.x,z:p.z}))); 
  if(wet[tri[0]]||Math.max(...t.map(p=>p.x))<bounds[0]||Math.min(...t.map(p=>p.x))>bounds[2]||Math.max(...t.map(p=>p.z))<bounds[1]||Math.min(...t.map(p=>p.z))>bounds[3]){next.push(...tri);continue;}
  const ring=t.map(p=>[p.x,p.z]);ring.push(ring[0]);const intersection=clipping.intersection([ring],cutFootprints);
  const area=r=>Math.abs(r.slice(1).reduce((sum,b,j)=>sum+r[j][0]*b[1]-b[0]*r[j][1],0)/2);
  const overlap=intersection.reduce((sum,p)=>sum+area(p[0])-p.slice(1).reduce((s,r)=>s+area(r),0),0);if(overlap<1e-7){next.push(...tri);continue;}
  changed=true;changedFaces++;removedArea+=overlap;
  for(const poly of clipping.difference([ring],cutFootprints)){
   const rings=poly.map(r=>r.slice(0,-1).map(p=>new THREE.Vector2(...p))),flat=rings.flat();
   for(const face of THREE.ShapeUtils.triangulateShape(rings[0],rings.slice(1))){const points=face.map(k=>flat[k]);if((points[1].x-points[0].x)*(points[2].y-points[0].y)-(points[1].y-points[0].y)*(points[2].x-points[0].x)>0)points.reverse();
    for(const pt of points){const w=barycentric(t,pt.x,pt.y),idx=positions.length/3;let y=w.reduce((s,v,j)=>s+v*t[j].y,0);for(const {r:end,ux,uz}of ends)if(r[tri[0]]&&Math.abs((pt.x-end[6])*ux+(pt.y-end[8])*uz)<.0001&&Math.abs((pt.x-end[6])*-uz+(pt.y-end[8])*ux)<=2.751)y=end[7]-baseline;positions.push(pt.x,y,pt.y);for(let c=0;c<3;c++){normal.push(Math.round(w.reduce((s,v,j)=>s+v*normals[tri[j]*3+c],0)));color.push(Math.round(w.reduce((s,v,j)=>s+v*colors[tri[j]*3+c],0)));}roads.push(r[tri[0]]);water.push(0);next.push(idx);addedVertices++;}
   }
  }
 }
 const d=tile.descriptor,grid=await load('angles-terrain.json'),ox=grid.origin_x_m+d.x*grid.step_m,oz=grid.origin_z_m+d.z*grid.step_m,extent=d.size*grid.step_m;
 if(rue.a.x>=ox&&rue.a.x<=ox+extent&&rue.b.x>=ox&&rue.b.x<=ox+extent&&rue.a.z>=oz&&rue.a.z<=oz+extent&&rue.b.z>=oz&&rue.b.z<=oz+extent){changed=true;const start=positions.length/3,tint=new THREE.Color(ROAD_STYLES[1].color);for(const row of rueRows)for(let j=0;j<15;j+=3){positions.push(...row.slice(j,j+3));normal.push(0,32767,0);color.push(Math.round(tint.r*255),Math.round(tint.g*255),Math.round(tint.b*255));roads.push(1);water.push(0);}for(let i=1;i<rueRows.length;i++)for(let j=1;j<5;j++){const a=start+(i-1)*5+j-1,b=a+1,c=start+i*5+j,e=c-1;next.push(a,b,c,a,c,e);}}
 if(changed){const clean=[];for(let i=0;i<next.length;i+=3){const a=next[i]*3,b=next[i+1]*3,c=next[i+2]*3,px=k=>Math.fround(positions[k]),area2=Math.abs((px(b)-px(a))*(px(c+2)-px(a+2))-(px(b+2)-px(a+2))*(px(c)-px(a)));if(!water[next[i]]&&area2<=.00001){removedQuantizedSlivers++;continue;}clean.push(next[i],next[i+1],next[i+2]);}next.length=0;for(const id of clean)next.push(id);tile.attributes={position:new THREE.BufferAttribute(Float32Array.from(positions),3),normal:new THREE.BufferAttribute(Int16Array.from(normal),3,true),color:new THREE.BufferAttribute(Uint8Array.from(color),3,true),earthRoad:new THREE.BufferAttribute(Uint8Array.from(roads),1),earthWater:new THREE.BufferAttribute(Uint8Array.from(water),1)};const Type=positions.length/3<65536?Uint16Array:Uint32Array;tile.fine=new THREE.BufferAttribute(Type.from(next),1);tile.far=tile.fine;const g=new THREE.BufferGeometry();g.setAttribute('position',tile.attributes.position);g.setIndex(tile.fine);g.computeVertexNormals();tile.attributes.normal=new THREE.BufferAttribute(Int16Array.from(g.attributes.normal.array,v=>Math.round(v*32767)),3,true);g.dispose();}
 }
 const chunks=[],tiles=[];let offset=0;const append=(a,type)=>{const pad=(-offset)&3;chunks.push(Buffer.alloc(pad));offset+=pad;const d={offset,length:a.length,type};chunks.push(Buffer.from(a.buffer,a.byteOffset,a.byteLength));offset+=a.byteLength;return d};
 for(const t of surface.tiles){const d={...t.descriptor};for(const k of ['position','normal','color','earthRoad','earthWater'])d[k]=append(t.attributes[k].array,k==='position'?'f32':k==='normal'?'i16':'u8');for(const k of ['fine','far'])d[k]=append(t[k].array,t[k].array instanceof Uint16Array?'u16':'u32');tiles.push(d);}
 const binary=Buffer.concat(chunks),packed=gzipSync(binary,{level:9,mtime:0});m.tiles=tiles;m.binaryBytes=binary.length;m.binarySha256=sha(binary);m.compressedBytes=packed.length;m.landmarksSha256=sha(lmText);m.stats={...m.stats,vertices:surface.tiles.reduce((s,t)=>s+t.attributes.position.count,0),fineTriangles:surface.tiles.reduce((s,t)=>s+t.fine.count/3,0),farTriangles:surface.tiles.reduce((s,t)=>s+t.far.count/3,0)};
 let roadArea=0,waterArea=0;for(const tile of surface.tiles){const p=tile.attributes.position.array,ids=tile.fine.array,r=tile.attributes.earthRoad.array,w=tile.attributes.earthWater.array;for(let i=0;i<ids.length;i+=3){const [a,b,c]=ids.subarray(i,i+3),area=Math.abs((p[b*3]-p[a*3])*(p[c*3+2]-p[a*3+2])-(p[b*3+2]-p[a*3+2])*(p[c*3]-p[a*3]))/2;if(r[a])roadArea+=area;if(w[a])waterArea+=area;}}m.stats.roadAreaM2=roadArea;m.stats.waterAreaM2=waterArea;
 m.bridgeOcclusion={schema:'deck-footprint-cut-v1',bounds,roadEndInfluence,removedQuantizedSlivers,rueReconstruction:{...rue,footprint:rueRing,stations:rueRows.length,method:'Continuous inferred carriageway with 0.5 m stations between original centre endpoint elevations; transverse endpoints match the corrected bridge. Existing OSM axis, original longitudinal grade and width preserved; not a surveyed road section.'},changedFaces,removedLandM2:removedArea,addedVertices,method:'Subtract mapped bridge deck and existing Rue du Pont corridor from old non-water triangles, insert one continuous Rue du Pont carriageway in the same tile. Outside heights interpolated on original faces; river/water vertices and IGN grid unchanged. End vertices blend crossfall over three metres; existing incident faces are enumerated. Changed tiles retain exact near indices at all distances.'};
 if(m.walkCorrection){m.walkCorrection.baseSurfaceSha256=landmarkHash;m.walkCorrection.method='M16 source endpoint profile retained; M22.1 continuous Rue du Pont carriageway and bridge section, exact indexed support shared with rendering. Original vertex-correction counts describe the M16 preparation; M22.1 topology and inference are recorded in bridgeOcclusion.';m.walkCorrection.bounds=[Math.min(bounds[0]-4,m.walkCorrection.bounds[0]),Math.min(bounds[1]-4,m.walkCorrection.bounds[1]),Math.max(bounds[2]+4,m.walkCorrection.bounds[2]),Math.max(bounds[3]+4,m.walkCorrection.bounds[3])];}
 else landmarkHash=m.binarySha256;
 await writeFile(base+name+'.json',JSON.stringify(m)+'\n');await writeFile(base+name+'.pack',packed);reports.push({name,...m.bridgeOcclusion});
}
await writeFile('docs/mission-22-1-evidence/geometry.json',JSON.stringify({sourceCommit,maxRemovedCrossfallM:maxCross,metalVertices,plinthVertices,reports,provenance:landmark.sources,unchanged:'IGN MNT, local refinement vertices, OSM axes, longitudinal deck centre stations, castle'},null,2)+'\n');console.log(reports);
