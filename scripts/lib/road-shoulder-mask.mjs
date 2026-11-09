// Conservative per-vertex support for a fragment lookup, not an interpolated
// distance. Every incident face whose bounding box meets the padded SDF band
// gets three 255 vertices, in BOTH LODs. It cannot invent a distance or a surface.
export function shoulderMasks(surface,data,config,paddingM=4){
 const {size,origin,extent}=config,stride=size+1,integral=new Uint32Array(stride*stride);
 for(let z=0;z<size;z++){let row=0;for(let x=0;x<size;x++){const v=data[z*size+x];row+=v>0&&v<255?1:0;integral[(z+1)*stride+x+1]=integral[z*stride+x+1]+row;}}
 const bound=(v,axis)=>Math.max(0,Math.min(size,v*size/extent[axis]));
 const intersects=(minX,minZ,maxX,maxZ)=>{
  const x0=Math.floor(bound(minX-origin[0]-paddingM,0)),z0=Math.floor(bound(minZ-origin[1]-paddingM,1));
  const x1=Math.ceil(bound(maxX-origin[0]+paddingM,0)),z1=Math.ceil(bound(maxZ-origin[1]+paddingM,1));
  return integral[z1*stride+x1]-integral[z0*stride+x1]-integral[z1*stride+x0]+integral[z0*stride+x0]>0;
 };
 return surface.tiles.map(tile=>{
  const p=tile.attributes.position.array,mask=new Uint8Array(p.length/3);
  for(const index of [tile.fine.array,tile.far.array])for(let i=0;i<index.length;i+=3){
   const a=index[i],b=index[i+1],c=index[i+2];
   if(intersects(Math.min(p[a*3],p[b*3],p[c*3]),Math.min(p[a*3+2],p[b*3+2],p[c*3+2]),Math.max(p[a*3],p[b*3],p[c*3]),Math.max(p[a*3+2],p[b*3+2],p[c*3+2])))mask[a]=mask[b]=mask[c]=255;
  }
  return mask;
 });
}
