// Index the renderer's Float32/index buffers without copying triangle vertices.
export function surfaceSupport(tiles,bounds,cellSize=10){
 if(!Array.isArray(bounds)||bounds.length!==4||!bounds.every(Number.isFinite)||bounds[2]<=bounds[0]||bounds[3]<=bounds[1]||!Number.isFinite(cellSize)||cellSize<=0)throw Error('Invalid support extent');
 const width=Math.ceil((bounds[2]-bounds[0])/cellSize),rows=Math.ceil((bounds[3]-bounds[1])/cellSize),buckets=new Map();let triangles=0;
 const column=x=>Math.max(0,Math.min(width-1,Math.floor((x-bounds[0])/cellSize))),row=z=>Math.max(0,Math.min(rows-1,Math.floor((z-bounds[1])/cellSize)));
 for(let ti=0;ti<tiles.length;ti++){
  const tile=tiles[ti],p=tile.attributes.position.array,ids=tile.fine.array;
  for(let i=0;i<ids.length;i+=3){
   const a=ids[i]*3,b=ids[i+1]*3,c=ids[i+2]*3,x0=Math.min(p[a],p[b],p[c]),x1=Math.max(p[a],p[b],p[c]),z0=Math.min(p[a+2],p[b+2],p[c+2]),z1=Math.max(p[a+2],p[b+2],p[c+2]);
   const ny=(p[b+2]-p[a+2])*(p[c]-p[a])-(p[b]-p[a])*(p[c+2]-p[a+2]);
   if(ny<=1e-10||x1<bounds[0]||x0>bounds[2]||z1<bounds[1]||z0>bounds[3])continue;
   triangles++;
   for(let z=row(z0);z<=row(z1);z++)for(let x=column(x0);x<=column(x1);x++){const key=z*width+x;let list=buckets.get(key);if(!list)buckets.set(key,list=[]);list.push(ti,i)}
  }
 }
 // Dense 1m TINs need finer buckets than a coarse 10m lattice. Subdivide only
 // dense bins; globally shrinking every bin would duplicate coarse-face
 // references across the entire pilot and waste memory.
 let bytes=0;
 for(const [key,list]of buckets){
  if(list.length<=64){const packed=Uint32Array.from(list);bytes+=packed.byteLength;buckets.set(key,packed);continue}
  const sub=Array.from({length:25},()=>[]),x0=bounds[0]+key%width*cellSize,z0=bounds[1]+Math.floor(key/width)*cellSize,step=cellSize/5,at=(p,o)=>Math.max(0,Math.min(4,Math.floor((p-o)/step)));
  for(let j=0;j<list.length;j+=2){const ti=list[j],face=list[j+1],t=tiles[ti],p=t.attributes.position.array,ids=t.fine.array,a=ids[face]*3,b=ids[face+1]*3,c=ids[face+2]*3;
   const minX=at(Math.min(p[a],p[b],p[c]),x0),maxX=at(Math.max(p[a],p[b],p[c]),x0),minZ=at(Math.min(p[a+2],p[b+2],p[c+2]),z0),maxZ=at(Math.max(p[a+2],p[b+2],p[c+2]),z0);
   for(let z=minZ;z<=maxZ;z++)for(let x=minX;x<=maxX;x++)sub[z*5+x].push(ti,face);
  }
  buckets.set(key,{sub:sub.map(list=>{const packed=Uint32Array.from(list);bytes+=packed.byteLength;return packed})});
 }
 function find(x,z,details=false){
  if(!Number.isFinite(x)||!Number.isFinite(z)||x<bounds[0]||x>bounds[2]||z<bounds[1]||z>bounds[3])return undefined;
  const bx=column(x),bz=row(z),bucket=buckets.get(bz*width+bx);if(!bucket)return undefined;
  const list=bucket.sub?bucket.sub[Math.min(4,Math.max(0,Math.floor(((z-bounds[1])/cellSize-bz)*5)))*5+Math.min(4,Math.max(0,Math.floor(((x-bounds[0])/cellSize-bx)*5)))]:bucket;
  let result;
  for(let j=0;j<list.length;j+=2){
   const ti=list[j],face=list[j+1],tile=tiles[ti],ids=tile.fine.array,p=tile.attributes.position.array,ai=ids[face],bi=ids[face+1],ci=ids[face+2],a=ai*3,b=bi*3,c=ci*3;
   const d=(p[b+2]-p[c+2])*(p[a]-p[c])+(p[c]-p[b])*(p[a+2]-p[c+2]);
   const u=((p[b+2]-p[c+2])*(x-p[c])+(p[c]-p[b])*(z-p[c+2]))/d,v=((p[c+2]-p[a+2])*(x-p[c])+(p[a]-p[c])*(z-p[c+2]))/d,w=1-u-v;
   if(u< -1e-7||v< -1e-7||w< -1e-7)continue;
   const height=u*p[a+1]+v*p[b+1]+w*p[c+1];
   if(result!==undefined&&(details?result.height:result)>=height)continue;
   if(!details){result=height;continue}
   const ux=p[b]-p[a],uy=p[b+1]-p[a+1],uz=p[b+2]-p[a+2],vx=p[c]-p[a],vy=p[c+1]-p[a+1],vz=p[c+2]-p[a+2],nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,length=Math.hypot(nx,ny,nz),wet=!!tile.attributes.earthWater?.array[ai],road=tile.attributes.earthRoad?.array[ai]??0;
   result={id:`surface:${ti}:${face/3}`,tile:ti,face:face/3,height,normal:{x:nx/length,y:ny/length,z:nz/length},slope:Math.hypot(nx,nz)/ny,category:wet?'water':road?'road':'terrain',road,visible:true,walkable:!wet,restriction:wet?'mapped-water':null,priority:road?20:10,confidence:'mesh-exact/source-resolution-limited',provenance:tile.descriptor?.provenance??null,vertices:[a,b,c].map(k=>({x:p[k],y:p[k+1],z:p[k+2]}))};
  }
  return result;
 }
 return {triangles,cells:buckets.size,indexBytes:bytes,bounds:[...bounds],sample:(x,z)=>find(x,z),inspect:(x,z)=>find(x,z,true)};
}
