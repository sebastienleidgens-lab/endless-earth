// Provider-neutral, bounded local TINs. Heights are absolute metres in the
// grid's existing datum; X/Z retain the geographic engine's metric frame.
export function validateRefinement(g,raw){
 if(raw?.schema!=='endless-earth-terrain-refinement-v1'||raw.verticalDatum!==g.vertical_datum||
    raw.baseSpacingM!==g.step_m||!Array.isArray(raw.cells)||raw.cells.length>2048||
    !raw.provenance?.license||!raw.provenance?.sourceUrl)throw Error('Invalid terrain refinement metadata');
 const cells=new Map();let total=0;
 for(const cell of raw.cells){
  const {x,z,vertices,indices}=cell,key=z*g.width+x;
  if(!Number.isInteger(x)||!Number.isInteger(z)||x<0||z<0||x>=g.width-1||z>=g.height-1||cells.has(key)||
     !Array.isArray(vertices)||vertices.length<12||vertices.length%3||vertices.length>2048||!vertices.every(Number.isFinite)||
     !Array.isArray(indices)||!indices.length||indices.length%3||!indices.every(i=>Number.isInteger(i)&&i>=0&&i<vertices.length/3))throw Error('Invalid refinement topology');
  const x0=g.origin_x_m+x*g.step_m,z0=g.origin_z_m+z*g.step_m,s=g.step_m;
  for(let i=0;i<vertices.length;i+=3)if(vertices[i]<x0||vertices[i]>x0+s||vertices[i+2]<z0||vertices[i+2]>z0+s||vertices[i+1]<-500||vertices[i+1]>9000)throw Error('Refinement vertex outside cell');
  const triangles=[],buckets=Array.from({length:100},()=>[]);let area=0;
  for(let i=0;i<indices.length;i+=3){
   const t=indices.slice(i,i+3).map(v=>({x:vertices[v*3],y:vertices[v*3+1],z:vertices[v*3+2]}));
   const [a,b,c]=t,cross=(b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x);
   if(cross<=1e-9)throw Error('Invalid refinement winding');area+=cross/2;triangles.push(t);
   const minX=Math.max(0,Math.floor((Math.min(...t.map(p=>p.x))-x0)/s*10)),maxX=Math.min(9,Math.floor((Math.max(...t.map(p=>p.x))-x0)/s*10));
   const minZ=Math.max(0,Math.floor((Math.min(...t.map(p=>p.z))-z0)/s*10)),maxZ=Math.min(9,Math.floor((Math.max(...t.map(p=>p.z))-z0)/s*10));
   for(let zz=minZ;zz<=maxZ;zz++)for(let xx=minX;xx<=maxX;xx++)buckets[zz*10+xx].push(t);
  }
  if(Math.abs(area-s*s)>1e-5)throw Error('Incomplete refinement cell');
  total+=indices.length;if(total>600000)throw Error('Refinement budget exceeded');
  cells.set(key,{...cell,triangles,buckets,x0,z0});
 }
 return {cells,metadata:raw};
}
export function barycentric(t,x,z){
 const [a,b,c]=t,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z);
 const u=((b.z-c.z)*(x-c.x)+(c.x-b.x)*(z-c.z))/d,v=((c.z-a.z)*(x-c.x)+(a.x-c.x)*(z-c.z))/d;
 return [u,v,1-u-v];
}
export function refinedCell(g,x,z){
 const col=Math.min(g.width-2,Math.floor((x-g.origin_x_m)/g.step_m)),row=Math.min(g.height-2,Math.floor((z-g.origin_z_m)/g.step_m));
 return g.refinement?.cells.get(row*g.width+col);
}
export function sampleRefinement(g,x,z){
 const c=refinedCell(g,x,z);if(!c)return undefined;
 const bx=Math.max(0,Math.min(9,Math.floor((x-c.x0)/g.step_m*10))),bz=Math.max(0,Math.min(9,Math.floor((z-c.z0)/g.step_m*10)));
 for(const t of c.buckets[bz*10+bx]){const w=barycentric(t,x,z);if(w.every(v=>v>=-1e-8))return w.reduce((h,v,i)=>h+v*t[i].y,0)}
 throw Error('Refinement contains an uncovered point');
}
