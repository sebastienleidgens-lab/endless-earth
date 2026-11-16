import {protectedTriangles} from './protected-triangles.mjs';
import {sampleTile} from './surface.mjs';
import {sampleFine,fineVertex} from './fine-grid.mjs';
/** Same sampled vertices/diagonal at contact; coarser cells retain all edge
 * vertices required by their finer neighbour. No skirt or hidden floor. */
export function* terrainLOD(tile,{local,heightBase,focus,goal,profile='balanced',pilotBounds,pilotHeight,pilotBreaks,habitatColor}){
 const [x0,y0,x1,y1]=tile.bounds,fine=tile.contact,baseStep=(x1-x0)/(tile.grid.size-1),fineStep=fine?.step??baseStep,cellCount=tile.grid.size-1,positions=[],colors=[],indices=[],vertices=new Map(),detail=new Set(),seam=[];
 const first=local(x0,y0),origin={x:first.x,z:first.z},strides=new Map(),near=profile==='eco'?220:profile==='quality'?380:300,middle=profile==='eco'?500:profile==='quality'?850:650;
 const at=(e,n)=>{const p=local(e,n),s=fine&&sampleFine(fine,{x:e,y:n})||sampleTile(tile,{x:e,y:n});return {x:p.x,y:s.height-heightBase(),z:p.z};};
 for(let y=0;y<cellCount;y++)for(let x=0;x<cellCount;x++){const p=local(x0+(x+.5)*baseStep,y0+(y+.5)*baseStep),d=Math.min(Math.hypot(p.x-focus.x,p.z-focus.z),goal?Math.hypot(p.x-goal.x,p.z-goal.z):Infinity);strides.set(x+','+y,fine?(d<near?fineStep:d<middle?16:baseStep):baseStep);}
 const stride=(x,y)=>strides.get(x+','+y)??fineStep;
 function vertex(p,color){const key=p.x.toFixed(6)+':'+p.z.toFixed(6)+':'+p.y.toFixed(6);if(vertices.has(key))return vertices.get(key);const id=positions.length/3;vertices.set(key,id);positions.push(p.x-origin.x,p.y,p.z-origin.z);colors.push(...color);return id;}
 function emit(a,b,c,color){for(const triangle of protectedTriangles([a,b,c],pilotBounds,pilotHeight,pilotBreaks)){indices.push(...triangle.map(p=>vertex(p,color)));if(pilotHeight&&triangle.some(p=>Math.abs(Math.abs(p.x)-Math.abs(pilotBounds[2]))<.001||Math.abs(Math.abs(p.z)-Math.abs(pilotBounds[3]))<.001))for(const p of triangle)seam.push(p.x,p.y,p.z);}}
 for(let cy=0;cy<cellCount;cy++)for(let cx=0;cx<cellCount;cx++){yield;const q=stride(cx,cy),ex=x0+cx*baseStep,ny=y0+cy*baseStep,color=habitatColor({x:ex+baseStep/2,y:ny+baseStep/2});if(q===fineStep)detail.add(cx+','+cy);
  for(let y=0;y<baseStep;y+=q){yield;for(let x=0;x<baseStep;x+=q){
   const a=at(ex+x,ny+y),b=at(ex+x+q,ny+y),c=at(ex+x,ny+y+q),d=at(ex+x+q,ny+y+q);
   if(q===fineStep){emit(a,b,c,color);emit(b,d,c,color);continue;}
   // Coordinates are projected east/north, whose local X/Z conversion reverses winding.
   const ring=[];const edge=(e0,n0,e1,n1,step)=>{const length=Math.hypot(e1-e0,n1-n0),n=Math.max(1,Math.round(length/step));for(let j=0;j<n;j++)ring.push(at(e0+(e1-e0)*j/n,n0+(n1-n0)*j/n));};
   edge(ex+x,ny+y,ex+x+q,ny+y,y===0?Math.min(q,stride(cx,cy-1)):q);
   edge(ex+x+q,ny+y,ex+x+q,ny+y+q,x+q===baseStep?Math.min(q,stride(cx+1,cy)):q);
   edge(ex+x+q,ny+y+q,ex+x,ny+y+q,y+q===baseStep?Math.min(q,stride(cx,cy+1)):q);
   edge(ex+x,ny+y+q,ex+x,ny+y,x===0?Math.min(q,stride(cx-1,cy)):q);
   const center=at(ex+x+q/2,ny+y+q/2);for(let j=0;j<ring.length;j++)emit(center,ring[j],ring[(j+1)%ring.length],color);
  }}
 }
 return {positions:new Float32Array(positions),colors:new Float32Array(colors),indices:positions.length/3>65535?new Uint32Array(indices):new Uint16Array(indices),origin,detail,seam:new Float32Array(seam)};
}
