/** 40 m cells; bounded segment/footprint checks, no render-mesh raycasting. */
export function acousticObstacles(buildings=[]){
 const cells=new Map();
 for(const b of buildings){if(!b.ring?.length)continue;const xs=b.ring.map(p=>p.x),zs=b.ring.map(p=>p.z);b.minX=Math.min(...xs);b.maxX=Math.max(...xs);b.minZ=Math.min(...zs);b.maxZ=Math.max(...zs);
  for(let x=Math.floor(b.minX/40);x<=Math.floor(b.maxX/40);x++)for(let z=Math.floor(b.minZ/40);z<=Math.floor(b.maxZ/40);z++){const k=x+':'+z;if(!cells.has(k))cells.set(k,[]);cells.get(k).push(b)}
 }
 let checks=0;
 return {nearestRoof(p,radius=18){const seen=new Set();let best=null;for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)for(const wall of cells.get((Math.floor(p.x/40)+x)+':'+(Math.floor(p.z/40)+z))??[]){if(seen.has(wall)||seen.size>=32)continue;seen.add(wall);const qx=Math.max(wall.minX,Math.min(wall.maxX,p.x)),qz=Math.max(wall.minZ,Math.min(wall.maxZ,p.z)),distanceM=Math.hypot(p.x-qx,p.z-qz,Math.max(0,(wall.top??0)-p.y)*.35);if(distanceM<=radius&&(!best||distanceM<best.distanceM))best={point:{x:qx,y:wall.top,z:qz},distanceM,provenance:'Mapped roof envelope; height inferred where absent; interpreted acoustic projection'};}return best},enclosure(p){const seen=new Set();let walls=0;for(let x=-1;x<=1;x++)for(let z=-1;z<=1;z++)for(const wall of cells.get((Math.floor(p.x/40)+x)+':'+(Math.floor(p.z/40)+z))??[]){if(seen.has(wall)||seen.size>=24)continue;seen.add(wall);const dx=Math.max(0,wall.minX-p.x,p.x-wall.maxX),dz=Math.max(0,wall.minZ-p.z,p.z-wall.maxZ);if(Math.hypot(dx,dz)<8&&p.y<wall.top)walls++}return Math.min(1,walls/3)},roofAt(x,z,fallback){let top=fallback;for(const wall of cells.get(Math.floor(x/40)+':'+Math.floor(z/40))??[]){let inside=false;const r=wall.ring;for(let i=0,j=r.length-1;i<r.length;j=i++){const a=r[i],b=r[j];if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside}if(inside)top=Math.max(top??-10000,wall.top)}return top},get checks(){return checks},between(a,b){
  checks=0;const seen=new Set(),distance=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.min(24,Math.ceil(distance/12));let blocked=0;
  for(let i=0;i<=steps;i++){const t=steps?i/steps:0,x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t;
   for(const wall of cells.get(Math.floor(x/40)+':'+Math.floor(z/40))??[]){if(seen.has(wall)||checks>=64)continue;seen.add(wall);checks++;
    for(let j=0;j<wall.ring.length;j++){const p=wall.ring[j],q=wall.ring[(j+1)%wall.ring.length],dx=b.x-a.x,dz=b.z-a.z,ex=q.x-p.x,ez=q.z-p.z,d=dx*ez-dz*ex;if(Math.abs(d)<1e-8)continue;const u=((p.x-a.x)*ez-(p.z-a.z)*ex)/d,v=((p.x-a.x)*dz-(p.z-a.z)*dx)/d,y=a.y+(b.y-a.y)*u;
     if(u>.015&&u<.985&&v>=0&&v<=1&&y<(wall.top??Infinity)&&y>(wall.base??-Infinity)){blocked++;break}
    }
   }
  }
  return Math.min(.88,blocked*.52);
 }};
}
