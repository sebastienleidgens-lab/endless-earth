import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {gunzipSync} from 'node:zlib';
import {decodeSurface} from '../src/world/surface-mesh.mjs';
import {validateRefinement} from '../src/world/terrain-refinement.mjs';
import {sampleGrid} from '../src/world/terrain-grid.mjs';

const dir=process.env.M23_DATA??'public/data',out=process.env.M23_AUDIT??'docs/mission-23-evidence/geometry-before.json';
const load=async f=>JSON.parse(await readFile(dir+'/'+f,'utf8'));
const g=await load('angles-terrain.json');g.refinement=validateRefinement(g,await load('angles-relief.json'));
const baseline=sampleGrid(g,0,0),reports=[];
for(const name of (process.env.M23_NAMES?.split(',')??['angles-surface','angles-relief-surface','angles-landmark-surface','angles-walk-surface'])){
 if(name==='angles-ground-truth'){const extra=validateRefinement(g,await load('angles-ground-truth-repairs.json'));g.refinement={cells:new Map([...g.refinement.cells,...extra.cells])};}
 const m=await load(name+'.json'),b=gunzipSync(await readFile(dir+'/'+name+'.pack')),s=decodeSurface(m,b.buffer.slice(b.byteOffset,b.byteOffset+b.byteLength));
 const report={name,hash:m.binarySha256,vertices:0,fine:{},far:{},suspects:[]};
 for(const lod of ['fine','far']){
  const stats=report[lod];Object.assign(stats,{triangles:0,degenerate:0,inverted:0,longestEdgeM:0,maxSpanM:0,maxReferenceResidualM:0,steep:0,stretched:0,outsideTile:0,areaM2:0});
  for(const [ti,t]of s.tiles.entries()){
   const p=t.attributes.position.array,ids=t[lod].array;if(lod==='fine')report.vertices+=p.length/3;
   for(let i=0;i<ids.length;i+=3){
    const v=Array.from(ids.subarray(i,i+3),id=>({x:p[id*3],y:p[id*3+1],z:p[id*3+2]})),[a,b,c]=v;
    const ux=b.x-a.x,uy=b.y-a.y,uz=b.z-a.z,vx=c.x-a.x,vy=c.y-a.y,vz=c.z-a.z;
    const ny=uz*vx-ux*vz,nx=uy*vz-uz*vy,nz=ux*vy-uy*vx,area=Math.abs(ny)/2;
    const edges=[Math.hypot(ux,uy,uz),Math.hypot(vx,vy,vz),Math.hypot(c.x-b.x,c.y-b.y,c.z-b.z)],longest=Math.max(...edges),span=Math.max(...v.map(p=>p.y))-Math.min(...v.map(p=>p.y));
    const slope=Math.hypot(nx,nz)/Math.max(1e-12,Math.abs(ny));
    const x=v.reduce((s,p)=>s+p.x,0)/3,z=v.reduce((s,p)=>s+p.z,0)/3,h=v.reduce((s,p)=>s+p.y,0)/3,reference=sampleGrid(g,x,z)-baseline,residual=Math.abs(h-reference);
    const d=t.descriptor,x0=g.origin_x_m+d.x*g.step_m,z0=g.origin_z_m+d.z*g.step_m,extent=d.size*g.step_m;
    const outside=v.some(p=>p.x<x0-.001||p.x>x0+extent+.001||p.z<z0-.001||p.z>z0+extent+.001);
    stats.triangles++;stats.areaM2+=area;stats.degenerate+=Number(area<1e-10);stats.inverted+=Number(ny< -1e-9);stats.steep+=Number(slope>.7);stats.stretched+=Number(longest*longest/Math.max(area,1e-12)>1000);stats.outsideTile+=Number(outside);stats.longestEdgeM=Math.max(stats.longestEdgeM,longest);stats.maxSpanM=Math.max(stats.maxSpanM,span);stats.maxReferenceResidualM=Math.max(stats.maxReferenceResidualM,residual);
    if(lod==='fine'&&(ny< -1e-9||area<1e-10||span>20||residual>2||outside))report.suspects.push({tile:ti,face:i/3,cell:[Math.floor((x-g.origin_x_m)/g.step_m),Math.floor((z-g.origin_z_m)/g.step_m)],x,z,vertices:v,area,slope,longest,span,referenceResidualM:residual,road:t.attributes.earthRoad.array[ids[i]],water:t.attributes.earthWater?.array[ids[i]],outside,classification:residual>2?'reference-mismatch-to-inspect':span>20?'steep-source-to-inspect':'topology-to-inspect'});
   }
  }
 }
 report.suspects.sort((a,b)=>b.referenceResidualM-a.referenceResidualM);reports.push(report);
}
await mkdir(out.slice(0,out.lastIndexOf('/')),{recursive:true});await writeFile(out,JSON.stringify({method:'All committed fine/far surface triangles. Reference = pinned IGN grid + validated local refinement, not a new independent survey. Steep faces retained as suspicions; source mismatch can be documented road reconstruction. No automatic slope deletion.',reports},null,2)+'\n');
console.log(JSON.stringify(reports.map(({name,fine,far,suspects})=>({name,fine,far,suspects:suspects.length,worst:suspects.slice(0,4)})),null,2));
