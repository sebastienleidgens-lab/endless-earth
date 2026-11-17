import {readFile,writeFile} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {RouteIndex} from '../src/planet/route-index.mjs';
import {inverseLambert93,legacyAdapter} from '../src/planet/coordinates.mjs';
const s=JSON.parse(await readFile('docs/mission-26-2-evidence/routes-selection.json')),r=new RouteIndex(gunzipSync(await readFile('public/planet/fr-86/navigation/land.pack'))),legacy=legacyAdapter({lat:46.6953,lon:.8844});
const loop=s.cases.find(c=>c.to==='Vicq-return').route,exit=loop.points.reduce((best,p,i)=>p.y>loop.points[best].y?i:best,0),at=loop.points[exit],start=r.nearest(at,1,25);
if(!start)throw Error('No source node at the historically walked departure');
const offsets=r.offsets,g=new Float64Array(r.count);g.fill(Infinity);const previous=new Int32Array(r.count);previous.fill(-1);const queue=[start.id];g[start.id]=0;let far=start.id;
for(let q=0;q<queue.length;q++){const n=queue[q];for(let e=offsets[n];e<offsets[n+1];e++){const o=r.edgeOffset+e*24;if(!(r.view.getUint32(o+20,true)&1))continue;const k=r.view.getUint32(o+4,true);if(Number.isFinite(g[k]))continue;g[k]=g[n]+r.view.getFloat64(o+8,true);previous[k]=n;queue.push(k);if(g[k]>g[far])far=k;}}
const route=r.route(start.point,r.point(far),'foot');const limit=18000,points=loop.points.slice(0,exit+1);let distance=0;for(let i=1;i<points.length;i++)distance+=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
// The bridge between this prior physical path and source nodes is a steering
// target only: its <25 m gap MUST itself be walked under normal collisions.
for(const p of route.points){if(distance>limit)break;const last=points.at(-1);distance+=Math.hypot(p.x-last.x,p.y-last.y);points.push(p);}
const chosen={from:'spawn',to:'north-multitile',mode:'foot',sourceApproach:'Previously completed true-spawn walk up to northern pilot exit, then exact admitted OSM graph. Snap gap is an unproven steering target until actual controller passes it.',sourceApproachGapM:start.distance,route:{complete:true,mode:'foot',distance,points,localPoints:points.map(p=>legacy.fromGeo(inverseLambert93(p))),features:route.features}};s.cases.push(chosen);
const car=s.cases.find(c=>c.from==='Vallee'&&c.to==='furthest-connected-source').route,reverse=r.route(car.points.at(-1),car.points[0],'car');if(reverse.complete){const points=[...car.points,...reverse.points.slice(1)],full={complete:true,mode:'car',distance:car.distance+reverse.distance,points,features:[...car.features,...reverse.features],localPoints:points.map(p=>legacy.fromGeo(inverseLambert93(p)))};s.cases.push({from:'Vallee',to:'car-80km',mode:'car',route:full});}
s.method+=' M26.3 additional steering routes only; no physical traversal implied.';await writeFile('docs/mission-26-3-evidence/routes-selection.json',JSON.stringify(s,null,2));console.log({exit,at,start,distance,reachable:queue.length,carReturn:reverse.complete,carTotal:car.distance+(reverse.distance??0)});
