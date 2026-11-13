// Index the exact rendered Float32 triangles. No second height approximation.
import {barycentric} from './terrain-refinement.mjs';
export function surfaceSupport(tiles,bounds,cellSize=10){
 const cells=new Map();let triangles=0;
 for(const tile of tiles){const p=tile.attributes.position.array,ids=tile.fine.array;
  for(let i=0;i<ids.length;i+=3){const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3,x0=Math.min(p[a],p[b],p[c]),x1=Math.max(p[a],p[b],p[c]),z0=Math.min(p[a+2],p[b+2],p[c+2]),z1=Math.max(p[a+2],p[b+2],p[c+2]);
   if(x1<bounds[0]||x0>bounds[2]||z1<bounds[1]||z0>bounds[3])continue;
   const triangle=[{x:p[a],y:p[a+1],z:p[a+2]},{x:p[b],y:p[b+1],z:p[b+2]},{x:p[c],y:p[c+1],z:p[c+2]}];triangles++;
   for(let x=Math.floor(x0/cellSize);x<=Math.floor(x1/cellSize);x++)for(let z=Math.floor(z0/cellSize);z<=Math.floor(z1/cellSize);z++){const key=x+':'+z;if(!cells.has(key))cells.set(key,[]);cells.get(key).push(triangle)}
  }
 }
 return {triangles,cells:cells.size,sample(x,z){if(x<bounds[0]||x>bounds[2]||z<bounds[1]||z>bounds[3])return undefined;for(const t of cells.get(Math.floor(x/cellSize)+':'+Math.floor(z/cellSize))??[]){const w=barycentric(t,x,z);if(w.every(v=>v>=-1e-7))return w.reduce((s,v,i)=>s+v*t[i].y,0)}return undefined}};
}
