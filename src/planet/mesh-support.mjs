/** Exact support from the displayed Float32 buffers. Each triangle is indexed
 * at its own power-of-two scale; coarse faces never fill fine-grid buckets. */
export function* meshSupportSteps(positions,indices,origin={x:0,z:0}){
 const levels=new Map();let count=0;
 for(let i=0;i<indices.length;i+=3){if((i&767)===0)yield;const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3,minX=Math.min(positions[a],positions[b],positions[c]),maxX=Math.max(positions[a],positions[b],positions[c]),minZ=Math.min(positions[a+2],positions[b+2],positions[c+2]),maxZ=Math.max(positions[a+2],positions[b+2],positions[c+2]),size=2**Math.ceil(Math.log2(Math.max(2,maxX-minX,maxZ-minZ)));if(!levels.has(size))levels.set(size,new Map());const bins=levels.get(size);
  for(let z=Math.floor(minZ/size);z<=Math.floor(maxZ/size);z++)for(let x=Math.floor(minX/size);x<=Math.floor(maxX/size);x++){const key=x+','+z;if(!bins.has(key))bins.set(key,[]);bins.get(key).push(i);}count++;
 }
 for(const bins of levels.values())for(const [key,list]of bins){yield;bins.set(key,Uint32Array.from(list));}
 return {triangles:count,sample(worldX,worldZ){const x=worldX-origin.x,z=worldZ-origin.z;let best=null;
  for(const [size,bins]of levels){const faces=bins.get(Math.floor(x/size)+','+Math.floor(z/size));if(!faces)continue;for(const i of faces){const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3,d=(positions[b+2]-positions[c+2])*(positions[a]-positions[c])+(positions[c]-positions[b])*(positions[a+2]-positions[c+2]);if(Math.abs(d)<1e-12)continue;const u=((positions[b+2]-positions[c+2])*(x-positions[c])+(positions[c]-positions[b])*(z-positions[c+2]))/d,v=((positions[c+2]-positions[a+2])*(x-positions[c])+(positions[a]-positions[c])*(z-positions[c+2]))/d,w=1-u-v;if(u< -1e-7||v< -1e-7||w< -1e-7)continue;const height=u*positions[a+1]+v*positions[b+1]+w*positions[c+1];if(best&&best.height>=height)continue;const ux=positions[b]-positions[a],uy=positions[b+1]-positions[a+1],uz=positions[b+2]-positions[a+2],vx=positions[c]-positions[a],vy=positions[c+1]-positions[a+1],vz=positions[c+2]-positions[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.hypot(nx,ny,nz);if(ny<=0)continue;best={height,normal:{x:nx/l,y:ny/l,z:nz/l},slope:Math.hypot(nx,nz)/ny,face:i/3};}}
  return best;
 }};
}
