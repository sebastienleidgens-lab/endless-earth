/** Centimetre quantization is a storage error bound, not survey accuracy. */
export function decodeFineGrid(bytes,descriptor,bounds){
 const n=descriptor.size;if(!Number.isInteger(n)||n<2||n>2049||bytes.length!==n*n*2||!Number.isFinite(descriptor.offsetM)||descriptor.nodata!==65535||descriptor.step!==(bounds[2]-bounds[0])/(n-1)||bounds[3]-bounds[1]!==bounds[2]-bounds[0])throw Error('Invalid fine raster contract');if(descriptor.schema!=='planet-contact-tile-v1'||descriptor.component!=='u16-centimetre-row-delta'||!Number.isInteger(n)||n<2||n>4097||bytes.byteLength!==n*n*2||!Number.isFinite(descriptor.offsetM))throw Error('Invalid contact raster');
 const values=new Uint16Array(bytes.buffer,bytes.byteOffset,n*n);for(let row=0;row<n;row++)for(let x=1;x<n;x++){const i=row*n+x;values[i]=(values[i]+values[i-1])&65535;}
 return {...descriptor,bounds,values};
}
export function fineVertex(grid,x,y){const value=grid.values[y*grid.size+x];return value===grid.nodata?null:grid.offsetM+value*.01;}
export function sampleFine(grid,p){
 const [x0,y0,x1,y1]=grid.bounds;if(p.x<x0||p.x>x1||p.y<y0||p.y>y1)return null;
 const n=grid.size,step=(x1-x0)/(n-1),fx=Math.min(n-1-1e-10,(p.x-x0)/step),fy=Math.min(n-1-1e-10,(p.y-y0)/step),x=Math.floor(fx),y=Math.floor(fy),u=fx-x,v=fy-y,a=fineVertex(grid,x,y),b=fineVertex(grid,x+1,y),c=fineVertex(grid,x,y+1),d=fineVertex(grid,x+1,y+1);if([a,b,c,d].some(v=>v===null))return null;
 let height,dx,dy;if(u+v<=1){height=a+u*(b-a)+v*(c-a);dx=(b-a)/step;dy=(c-a)/step;}else{height=d+(1-u)*(c-d)+(1-v)*(b-d);dx=(d-c)/step;dy=(d-b)/step;}const length=Math.hypot(dx,1,dy);return {height,normal:{x:-dx/length,y:1/length,z:dy/length},slope:Math.hypot(dx,dy),datum:'IGN69',resolutionM:step,source:'IGN LHD numeric MNT; 2 m derivative',quantizationMaxErrorM:.005};
}
