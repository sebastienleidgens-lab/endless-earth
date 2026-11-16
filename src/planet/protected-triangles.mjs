import {clipExterior} from './pilot-clip.mjs';
/** Subtract the protected owner and insert its real boundary breakpoints.
 * A centre fan keeps the boundary samples; a corner fan would drop them as
 * collinear X/Z vertices and silently bridge their height changes. */
export function protectedTriangles(triangle,bounds,height,breaks){
 const result=[],onEdge=p=>(p.z>=bounds[1]-1e-6&&p.z<=bounds[3]+1e-6&&[bounds[0],bounds[2]].some(v=>Math.abs(p.x-v)<1e-6))||(p.x>=bounds[0]-1e-6&&p.x<=bounds[2]+1e-6&&[bounds[1],bounds[3]].some(v=>Math.abs(p.z-v)<1e-6));
 const push=(a,b,c)=>{if((b.z-a.z)*(c.x-a.x)-(b.x-a.x)*(c.z-a.z)>1e-10)result.push([a,b,c]);};
 for(const polygon of clipExterior(triangle,bounds)){
  if(!height||!polygon.some(onEdge)){for(let j=1;j<polygon.length-1;j++)push(polygon[0],polygon[j],polygon[j+1]);continue;}
  const p=[];
  for(let i=0;i<polygon.length;i++){const a=polygon[i],b=polygon[(i+1)%polygon.length];p.push({...a,y:onEdge(a)?height(a.x,a.z)??a.y:a.y});for(const [axis,other,lo,hi]of [['x','z',bounds[0],bounds[2]],['z','x',bounds[1],bounds[3]]]){if(![lo,hi].some(v=>Math.abs(a[axis]-v)<1e-6&&Math.abs(b[axis]-v)<1e-6))continue;const low=Math.min(a[other],b[other]),high=Math.max(a[other],b[other]),extra=[];const side=axis==='x'?(a.x>0?0:1):(a.z>0?2:3),values=breaks?.[side]??Array.from({length:Math.max(0,Math.ceil((high-low)/2))},(_,i)=>(Math.floor(low/2)+1+i)*2);for(const value of values){if(value<=low+1e-6||value>=high-1e-6)continue;const t=(value-a[other])/(b[other]-a[other]),v={x:a.x+(b.x-a.x)*t,y:a.y+(b.y-a.y)*t,z:a.z+(b.z-a.z)*t};v.y=height(v.x,v.z)??v.y;extra.push(v);}if(a[other]>b[other])extra.reverse();p.push(...extra);}}
  const center={x:p.reduce((n,v)=>n+v.x,0)/p.length,z:p.reduce((n,v)=>n+v.z,0)/p.length,y:0},[a,b,c]=triangle,d=(b.z-c.z)*(a.x-c.x)+(c.x-b.x)*(a.z-c.z),u=((b.z-c.z)*(center.x-c.x)+(c.x-b.x)*(center.z-c.z))/d,v=((c.z-a.z)*(center.x-c.x)+(a.x-c.x)*(center.z-c.z))/d;center.y=u*a.y+v*b.y+(1-u-v)*c.y;
  for(let j=0;j<p.length;j++)push(center,p[j],p[(j+1)%p.length]);
 }
 return result;
}
