// Offline meshes: observed ruin profiles and reconstructed bridge section.
import * as THREE from 'three';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {gzipSync} from 'node:zlib';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
const base='public/data/',root='work/mission-14B/',hash=b=>createHash('sha256').update(b).digest('hex'),load=async f=>JSON.parse(await readFile(f,'utf8'));
const observed=await load(root+'observations.json'),g=await load(base+'angles-terrain.json'),osm=await load(base+'angles-osm.geojson'),cover=await load(base+'angles-earth.json'),old=await load(base+'angles-relief-surface.json');
g.refinement=validateRefinement(g,await load(base+'angles-relief.json'));
const bucket=kind=>({kind,position:[],index:[]}),stone=bucket('stone'),road=bucket('road'),collisionFeatures=[];
const triangle=(dest,a,b,c)=>{const i=dest.position.length/3;dest.position.push(...a,...b,...c);dest.index.push(i,i+1,i+2)};
const quad=(dest,a,b,c,d)=>{triangle(dest,a,b,c);triangle(dest,a,c,d)};
const outward=(dest,a,b,c,d,center)=>{const u=new THREE.Vector3(...b).sub(new THREE.Vector3(...a)),v=new THREE.Vector3(...c).sub(new THREE.Vector3(...a)),normal=u.cross(v),mid=new THREE.Vector3(...a).add(new THREE.Vector3(...b)).add(new THREE.Vector3(...c)).add(new THREE.Vector3(...d)).multiplyScalar(.25).sub(new THREE.Vector3(...center));if(normal.dot(mid)<0)quad(dest,a,d,c,b);else quad(dest,a,b,c,d)};
function panel(dest,rings,map,width){
 const rs=rings.map(r=>r.slice(0,-1).map(([s,h])=>new THREE.Vector2(s,h))),flat=rs.flat();
 for(let i=0;i<rs.length;i++)if(THREE.ShapeUtils.isClockWise(rs[i])===(i===0))rs[i].reverse();
 const ordered=rs.flat();
 for(const ids of THREE.ShapeUtils.triangulateShape(rs[0],rs.slice(1))){const p=ids.map(i=>ordered[i]);triangle(dest,...[...p].reverse().map(v=>map(v.x,v.y,-width/2)));triangle(dest,...p.map(v=>map(v.x,v.y,width/2)))}
 for(const ring of rs)for(let i=0;i<ring.length;i++){const a=ring[i],b=ring[(i+1)%ring.length];quad(dest,map(a.x,a.y,-width/2),map(b.x,b.y,-width/2),map(b.x,b.y,width/2),map(a.x,a.y,width/2))}
}
for(const wall of observed.castle.outerWalls){
 const [ax,ay,az,at]=wall.a,[bx,by,bz,bt]=wall.b,length=Math.hypot(bx-ax,bz-az);if(length<.01||Math.max(at-ay,bt-by)<.05)continue;
 const ux=(bx-ax)/length,uz=(bz-az)/length;
 panel(stone,[[[0,ay],[length,by],[length,bt],[0,at],[0,ay]]],(s,h,n)=>[ax+ux*s-uz*n,h,az+uz*s+ux*n],wall.width);
}
const inverse=([x,z])=>[.8844+x/(111320*Math.cos(46.6953*Math.PI/180)),46.6953-z/111320];
const insideRing=(ring,x,y)=>{let inside=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){const a=ring[j],b=ring[i];if((a[1]>y)!==(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])inside=!inside}return inside};
for(const [i,p]of observed.castle.panels.entries()){
 const [ox,oz]=p.originXZ,[ux,uz]=p.axisXZ;panel(stone,p.rings,(s,h,n)=>[ox+ux*s-uz*n,h,oz+uz*s+ux*n],p.width);
 const values=p.rings[0].map(p=>p[0]),a=Math.min(...values),b=Math.max(...values);
 const minimum=Math.min(...p.rings[0].map(p=>p[1]));
 // The LiDAR has no observations below the surviving panel. This conservative
 // ground-contact infill is explicitly inferred; it adds no room or roof.
 for(let lo=a;lo<b;lo+=1){const hi=Math.min(b,lo+1),ha=Math.min(minimum,sampleGrid(g,ox+ux*lo,oz+uz*lo)-.05),hb=Math.min(minimum,sampleGrid(g,ox+ux*hi,oz+uz*hi)-.05);if(ha<minimum-.05||hb<minimum-.05)panel(stone,[[[lo,ha],[hi,hb],[hi,minimum],[lo,minimum],[lo,ha]]],(s,h,n)=>[ox+ux*s-uz*n,h,oz+uz*s+ux*n],p.width)}
 // A high surviving fragment does not create an invisible wall below itself.
 // Only bands intersecting the existing ground-to-head envelope block walking.
 const count=Math.ceil((b-a)/.25);let start=null;
 const emit=end=>{if(start===null||end-start<.05)return;collisionFeatures.push({type:'Feature',id:`local-castle-wall-${i}-${start.toFixed(2)}`,properties:{historic:'ruins',source:'Observed wall intersects body-height envelope; no new passage asserted'},geometry:{type:'LineString',coordinates:[inverse([ox+ux*start,oz+uz*start]),inverse([ox+ux*end,oz+uz*end])]}})};
 for(let j=0;j<count;j++){
  const s=a+(b-a)*(j+.5)/count,h=sampleGrid(g,ox+ux*s,oz+uz*s),solid=h<minimum||[.15,.8,1.6].some(d=>insideRing(p.rings[0],s,h+d)&&!p.rings.slice(1).some(r=>insideRing(r,s,h+d)));
  const lo=a+(b-a)*j/count,hi=a+(b-a)*(j+1)/count;
  if(solid&&start===null)start=lo;
  if(!solid&&start!==null){emit(lo);start=null}if(j===count-1&&start!==null)emit(hi);
 }
}
const castleParts=[stone],bridgeStone=bucket('stone'),metal=bucket('metal'),spec=observed.bridge,axis=spec.axisXZ,cum=[0];for(let i=1;i<axis.length;i++)cum.push(cum.at(-1)+Math.hypot(axis[i][0]-axis[i-1][0],axis[i][1]-axis[i-1][1]));const length=cum.at(-1);
const corners=cum.slice(1,-1).map((s,j)=>{const a=axis[j],b=axis[j+1],c=axis[j+2],u0=new THREE.Vector2(b[0]-a[0],b[1]-a[1]).normalize(),u1=new THREE.Vector2(c[0]-b[0],c[1]-b[1]).normalize(),normal=new THREE.Vector2(-u0.y-u1.y,u0.x+u1.x).normalize(),scale=1/normal.dot(new THREE.Vector2(-u0.y,u0.x));return {s,nx:normal.x*scale,nz:normal.y*scale,clearance:(spec.width/2+spec.parapetWidth)*Math.tan(Math.acos(u0.dot(u1))/2)+.12}});
const at=s=>{let i=0;while(i<axis.length-2&&cum[i+1]<s)i++;const a=axis[i],b=axis[i+1],len=cum[i+1]-cum[i],u=(s-cum[i])/len,ux=(b[0]-a[0])/len,uz=(b[1]-a[1])/len,corner=corners.find(c=>Math.abs(c.s-s)<1e-7);return {x:a[0]+(b[0]-a[0])*u,z:a[1]+(b[1]-a[1])*u,ux,uz,nx:corner?.nx??-uz,nz:corner?.nz??ux}};
const value=s=>{let i=0;while(i<spec.profile.length-2&&spec.profile[i+1][0]<s)i++;const [a,ha]=spec.profile[i],[b,hb]=spec.profile[i+1];return ha+(hb-ha)*(s-a)/(b-a)};
const ground=(x,z)=>sampleGrid(g,x,z);
const deck=(s,n=0)=>{
 const p=at(s),x=p.x+p.nx*n,z=p.z+p.nz*n;
 const startWeight=Math.max(0,1-s/18),endWeight=Math.max(0,1-(length-s)/4),weight=Math.max(startWeight,endWeight);
 const end=s<length/2?at(0):at(length),target=ground(end.x+end.nx*n,end.z+end.nz*n);
 return [x,value(s)*(1-weight)+target*weight,z];
};
// The very same indexed road mesh becomes the collision support.
const safeStation=s=>corners.every(c=>Math.abs(c.s-s)<1e-7||Math.abs(c.s-s)>c.clearance);
const stations=[...new Set([0,...Array.from({length:Math.ceil(length)},(_,i)=>i+1).filter(s=>s<length),...cum,length])].filter(safeStation).sort((a,b)=>a-b),cross=[-2.75,-1.5,0,1.5,2.75];
for(const s of stations)for(const n of cross)road.position.push(...deck(s,n));
for(let i=1;i<stations.length;i++)for(let j=1;j<cross.length;j++){const a=(i-1)*cross.length+j-1,b=a+1,c=i*cross.length+j,d=c-1;road.index.push(a,b,c,a,c,d)}
const bottom=s=>{const arch=spec.arches.find(a=>s>=a.start&&s<=a.end);if(!arch)return spec.bedM;const t=(s-(arch.start+arch.end)/2)/((arch.end-arch.start)/2),crown=value(s)-spec.deckThickness;return arch.springM+(crown-arch.springM)*Math.sqrt(Math.max(0,1-t*t))};
const ss=[...new Set([...stations,...spec.arches.flatMap(a=>[a.start,a.end,...Array.from({length:25},(_,i)=>a.start+(a.end-a.start)*i/24)])])].filter(safeStation).sort((a,b)=>a-b);
const section=[...ss.map(s=>[s,deck(s)[1]-.02]),...ss.toReversed().map(s=>[s,Math.min(deck(s)[1]-.1,bottom(s))])];section.push(section[0]);
panel(bridgeStone,[section],(s,h,n)=>{const p=at(s);return [p.x+p.nx*n,h,p.z+p.nz*n]},spec.width+spec.parapetWidth*2);
function prism(dest,a,b,size){
 const va=new THREE.Vector3(...a),vb=new THREE.Vector3(...b),u=vb.clone().sub(va).normalize(),side=u.clone().cross(Math.abs(u.y)>.9?new THREE.Vector3(1,0,0):new THREE.Vector3(0,1,0)).normalize().multiplyScalar(size/2),v=u.clone().cross(side).normalize().multiplyScalar(size/2),p=[];
 for(const q of [va,vb])for(const [s,t]of [[-1,-1],[1,-1],[1,1],[-1,1]])p.push(q.clone().addScaledVector(side,s).addScaledVector(v,t).toArray());
 const center=va.clone().add(vb).multiplyScalar(.5).toArray();for(const ids of [[0,1,2,3],[4,5,6,7],[0,1,5,4],[1,2,6,5],[2,3,7,6],[3,0,4,7]])outward(dest,...ids.map(i=>p[i]),center);
}
for(const sign of [-1,1]){
 const inner=spec.width/2*sign,outer=(spec.width/2+spec.parapetWidth)*sign,center=(inner+outer)/2;
 for(let i=1;i<stations.length;i++){
  const s0=stations[i-1],s1=stations[i],a=deck(s0,inner),b=deck(s1,inner),c=deck(s1,outer),d=deck(s0,outer),up=p=>[p[0],p[1]+spec.parapetBaseHeight,p[2]];
  const mid=[0,1,2].map(k=>(a[k]+b[k]+c[k]+d[k])/4+(k===1?spec.parapetBaseHeight/2:0));
  for(const [x,y]of [[a,b],[b,c],[c,d],[d,a]])outward(bridgeStone,x,y,up(y),up(x),mid);outward(bridgeStone,up(a),up(b),up(c),up(d),mid);
  for(const h of [spec.parapetHeight,.65]){const x=deck(s0,center),y=deck(s1,center);x[1]+=h;y[1]+=h;prism(metal,x,y,.045)}
 }
 for(let s=0;s<=length;s+=spec.railSpacing){const a=deck(s,center),b=[a[0],a[1]+spec.parapetHeight,a[2]];a[1]+=spec.parapetBaseHeight;prism(metal,a,b,.045)}
 collisionFeatures.push({type:'Feature',id:`local-bridge-parapet-${sign}`,properties:{barrier:'wall',width:spec.parapetWidth,source:'documented bridge; parapet section inferred'},geometry:{type:'LineString',coordinates:stations.map(s=>{const p=at(s);return inverse([p.x+p.nx*center,p.z+p.nz*center])})}});
}
// Pointed cutwaters are documented in the reference photographs. Their small
// section is interpreted, not a measurement of submerged masonry.
for(let i=1;i<spec.arches.length;i++)for(const sign of [-1,1]){
 const s=(spec.arches[i-1].end+spec.arches[i].start)/2,p=at(s),n=(spec.width/2+spec.parapetWidth)*sign,tip=n+sign*1.0,half=(spec.arches[i].start-spec.arches[i-1].end)/2;
 const a=at(s-half),b=at(s+half),low=spec.bedM,high=69.3,points=[[a.x+a.nx*n,low,a.z+a.nz*n],[b.x+b.nx*n,low,b.z+b.nz*n],[p.x+p.nx*tip,low,p.z+p.nz*tip]],top=points.map(q=>[q[0],high,q[2]]),center=[(points[0][0]+points[1][0]+points[2][0])/3,(low+high)/2,(points[0][2]+points[1][2]+points[2][2])/3];
 for(let j=0;j<3;j++)outward(bridgeStone,points[j],points[(j+1)%3],top[(j+1)%3],top[j],center);triangle(bridgeStone,...top);
}
const bindings={terrain:observed.terrainSha256,osm:observed.osmSha256,refinement:observed.refinementSha256};
const result={schema:'endless-earth-landmarks-v1',verticalDatum:'IGN69',bindings,objects:[{id:'chateau',featureId:observed.castle.featureId,parts:castleParts,confidence:observed.castle.confidence},{id:'pont',featureId:spec.featureId,parts:[bridgeStone,road,metal],supportPart:1,confidence:spec.confidence}],collisionFeatures,sources:observed.sources};
for(const o of result.objects)for(const part of o.parts){const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(part.position,3));geometry.setIndex(part.index);geometry.computeVertexNormals();part.normal=Array.from(geometry.attributes.normal.array,v=>Math.round(Math.max(-1,Math.min(1,v))*32767));geometry.dispose();}
const text=JSON.stringify(result)+'\n';await writeFile(base+'angles-landmarks.json',text);const compressed=gzipSync(Buffer.from(text),{level:9,mtime:0});await writeFile(base+'angles-landmarks.pack',compressed);
await writeFile('docs/mission-14-evidence/heritage/preparation.json',JSON.stringify({meshBytes:Buffer.byteLength(text),compressedMeshBytes:compressed.length,objects:result.objects.map(o=>({id:o.id,triangles:o.parts.reduce((n,p)=>n+p.index.length/3,0),vertices:o.parts.reduce((n,p)=>n+p.position.length/3,0)})),bridge:{length,profile:spec.profile,approaches:'Blend only on the mapped OSM axis outside the class-17 observed deck, to the retained terrain endpoints; interpreted transition, not a surveyed ramp.'}},null,2)+'\n');
console.log('Prepared landmarks',result.objects.map(o=>[o.id,o.parts.reduce((n,p)=>n+p.index.length/3,0)]));
