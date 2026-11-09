import {readFileSync,writeFileSync} from 'node:fs';
import {roadSegments} from './lib/road-topology.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';
const g=JSON.parse(readFileSync('public/data/angles-terrain.json')),m=JSON.parse(readFileSync('public/data/angles-earth.json')),osm=JSON.parse(readFileSync('public/data/angles-osm.geojson')),bytes=readFileSync('public/data/angles-terrain-lod.bin'),index=new Uint16Array(bytes.buffer,bytes.byteOffset,bytes.byteLength/2);
const local=([lon,lat])=>[(lon-.8844)*111320*Math.cos(46.6953*Math.PI/180),-(lat-46.6953)*111320];
let samples=0,buried=0,minDelta=Infinity,maxDelta=-Infinity;
for(const s of roadSegments(osm.features,local))for(let f=0;f<=1;f+=.25){const x=s.a[0]+(s.b[0]-s.a[0])*f,z=s.a[1]+(s.b[1]-s.a[1])*f,raw=sampleGrid(g,x,z);if(raw===null)continue;
 const gx=(x-g.origin_x_m)/g.step_m,gz=(z-g.origin_z_m)/g.step_m,t=m.tiles.find(t=>gx>=t.x&&gx<=t.x+t.size&&gz>=t.z&&gz<=t.z+t.size);if(!t)continue;
 let height;
 for(let i=t.offset;i<t.offset+t.count;i+=3){const p=Array.from(index.slice(i,i+3),id=>{const xx=t.x+id%41,zz=t.z+Math.floor(id/41);return {x:xx,z:zz,h:g.elevations_m[zz*g.width+xx]}}),[a,b,c]=p,dx=b.x-a.x,dz=b.z-a.z,ex=c.x-a.x,ez=c.z-a.z,det=dx*ez-dz*ex,u=((gx-a.x)*ez-(gz-a.z)*ex)/det,v=(dx*(gz-a.z)-dz*(gx-a.x))/det;if(u>=-1e-8&&v>=-1e-8&&u+v<=1+1e-8){height=a.h+u*(b.h-a.h)+v*(c.h-a.h);break}}
 if(height===undefined)continue;samples++;const d=height-raw;minDelta=Math.min(d,minDelta);maxDelta=Math.max(d,maxDelta);if(d>.045)buried++;
}
const r={samples,oldRoadCentreSamplesBuriedByFarLOD:buried,minFarMinusSourceM:minDelta,maxFarMinusSourceM:maxDelta,method:'5 centre-line samples per nonzero OSM segment, compared to old far-LOD triangle planes; duplicate endpoints retained. This is not a road area measurement.'};console.log(r);writeFileSync('docs/mission-07-1-captures/legacy-lod-audit.json',JSON.stringify(r,null,2));
