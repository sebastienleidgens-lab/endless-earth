import {clipSegment} from './feature-clip.mjs';
/** Inferred road width around the UNCHANGED source centreline. Shared mitred
 * sections close the wedges left by independent butt-ended segment quads.
 * Subdivision is phased on the original source segment, not the clipped tile. */
export function* roadRibbonSteps(points,width,bounds,{step=4,crossStep=2,miterLimit=2}={}){
 const half=width/2,sections=[];
 const direction=(a,b)=>{const x=b[0]-a[0],y=b[1]-a[1],d=Math.hypot(x,y);return d>1e-9?{x:x/d,y:y/d}:null;};
 for(let i=0;i<points.length;i++){
  if(i%32===0)yield null;
  const p=points[i],before=i?direction(points[i-1],p):null,after=i+1<points.length?direction(p,points[i+1]):null,a=before??after,b=after??before;
  if(!a||!b){sections.push(null);continue;}
  let x=-a.y-b.y,y=a.x+b.x,length=Math.hypot(x,y);if(length<1e-7){x=-b.y;y=b.x;length=1;}
  x/=length;y/=length;const denominator=Math.max(1/miterLimit,x*(-b.y)+y*b.x),scale=half/denominator;
  sections.push({c:p,l:[p[0]+x*scale,p[1]+y*scale],r:[p[0]-x*scale,p[1]-y*scale]});
 }
 const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
 const expanded=bounds.map((v,i)=>v+(i<2?-width*miterLimit:width*miterLimit));
 for(let i=1;i<points.length;i++){
  const a=sections[i-1],b=sections[i];if(!a||!b)continue;const length=Math.hypot(b.c[0]-a.c[0],b.c[1]-a.c[1]);if(length<1e-7)continue;
  const clipped=clipSegment(a.c,b.c,expanded);if(!clipped)continue;
  const n=Math.max(1,Math.ceil(length/step)),at=p=>((p[0]-a.c[0])*(b.c[0]-a.c[0])+(p[1]-a.c[1])*(b.c[1]-a.c[1]))/(length*length),lo=Math.max(0,Math.floor(at(clipped[0])*n)-1),hi=Math.min(n,Math.ceil(at(clipped[1])*n)+1);
  for(let j=lo;j<hi;j++){
   const t=j/n,u=(j+1)/n,l=lerp(a.l,b.l,t),r=lerp(a.r,b.r,t),c=lerp(a.c,b.c,t),ll=lerp(a.l,b.l,u),rr=lerp(a.r,b.r,u),cc=lerp(a.c,b.c,u);
   // A half-width triangle used to spread a sampled ditch/bank at the outer
   // edge all the way across the lane. Sample the same MNT laterally too;
   // centreline, width, heights and collision thresholds remain unchanged.
   const across=Math.max(1,Math.ceil(half/crossStep));
   for(const [a,b,d,e]of [[l,c,ll,cc],[c,r,cc,rr]])for(let k=0;k<across;k++){
    const u=k/across,v=(k+1)/across,p=lerp(a,b,u),q=lerp(a,b,v),s=lerp(d,e,u),t=lerp(d,e,v);
    yield [p,s,q];yield [q,s,t];
   }
  }
 }
}
