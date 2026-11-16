/** Same area-weighted normals as BufferGeometry.computeVertexNormals, sliced
 * before upload. Returns CPU mirrors and conservative finite bounds. */
export function* prepareGeometry(positions,indices){
 const normals=new Float32Array(positions.length),min=[Infinity,Infinity,Infinity],max=[-Infinity,-Infinity,-Infinity];
 for(let i=0;i<indices.length;i+=3){
  if(i%768===0)yield;
  const a=indices[i]*3,b=indices[i+1]*3,c=indices[i+2]*3;
  const ux=positions[c]-positions[b],uy=positions[c+1]-positions[b+1],uz=positions[c+2]-positions[b+2];
  const vx=positions[a]-positions[b],vy=positions[a+1]-positions[b+1],vz=positions[a+2]-positions[b+2];
  const nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx;
  for(const v of [a,b,c]){normals[v]+=nx;normals[v+1]+=ny;normals[v+2]+=nz;}
 }
 for(let i=0;i<positions.length;i+=3){
  if(i%3072===0)yield;
  const n=Math.hypot(normals[i],normals[i+1],normals[i+2])||1;
  for(let k=0;k<3;k++){normals[i+k]/=n;min[k]=Math.min(min[k],positions[i+k]);max[k]=Math.max(max[k],positions[i+k]);}
 }
 if(!positions.length)return {normals,min:[0,0,0],max:[0,0,0],center:[0,0,0],radius:0};
 const center=min.map((v,k)=>(v+max[k])/2);let radius2=0;
 for(let i=0;i<positions.length;i+=3){if(i%3072===0)yield;radius2=Math.max(radius2,(positions[i]-center[0])**2+(positions[i+1]-center[1])**2+(positions[i+2]-center[2])**2);}
 return {normals,min,max,center,radius:Math.sqrt(radius2)};
}
