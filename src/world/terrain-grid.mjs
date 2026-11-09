// Metric source surface shared by offline preparation, rendering and collisions.
export function sampleGrid(g,x,z){
 const fx=(x-g.origin_x_m)/g.step_m,fz=(z-g.origin_z_m)/g.step_m;
 if(fx<0||fz<0||fx>g.width-1||fz>g.height-1)return null;
 const col=Math.min(Math.floor(fx),g.width-2),row=Math.min(Math.floor(fz),g.height-2),tx=fx-col,tz=fz-row;
 const i=row*g.width+col,h=g.elevations_m,a=h[i],b=h[i+1],c=h[i+g.width],d=h[i+g.width+1];
 if(Math.abs(a-d)<Math.abs(b-c))return tx>=tz?a+(b-a)*tx+(d-b)*tz:a+(c-a)*tz+(d-c)*tx;
 return tx+tz<=1?a+(b-a)*tx+(c-a)*tz:d+(c-d)*(1-tx)+(b-d)*(1-tz);
}
export function cellIndices(g,x,z,stride=g.width,offset=0){
 const i=z*g.width+x,h=g.elevations_m,a=offset,b=a+1,c=a+stride,d=c+1;
 return Math.abs(h[i]-h[i+g.width+1])<Math.abs(h[i+1]-h[i+g.width])?[a,c,d,a,d,b]:[a,c,b,b,c,d];
}
// Sutherland–Hodgman: retain the left side of each directed clip edge.
export function clipConvex(subject,clip){
 let out=subject;
 for(let i=0;i<clip.length&&out.length;i++){
  const a=clip[i],b=clip[(i+1)%clip.length],input=out;out=[];
  const side=p=>(b.x-a.x)*(p.z-a.z)-(b.z-a.z)*(p.x-a.x);
  for(let j=0;j<input.length;j++){
   const p=input[j],q=input[(j+1)%input.length],dp=side(p),dq=side(q),pin=dp>=-1e-8,qin=dq>=-1e-8;
   if(pin)out.push(p);
   if(pin!==qin){const t=dp/(dp-dq);out.push({x:p.x+(q.x-p.x)*t,z:p.z+(q.z-p.z)*t})}
  }
 }
 return out;
}
export function sourceTriangles(g,x,z){
 const px=g.origin_x_m+x*g.step_m,pz=g.origin_z_m+z*g.step_m,s=g.step_m;
 const p=[{x:px,z:pz},{x:px+s,z:pz},{x:px,z:pz+s},{x:px+s,z:pz+s}];
 // Clip polygons must be counterclockwise in X/Z (rendering reverses winding).
 const h=g.elevations_m,i=z*g.width+x;
 return Math.abs(h[i]-h[i+g.width+1])<Math.abs(h[i+1]-h[i+g.width])?[[p[0],p[1],p[3]],[p[0],p[3],p[2]]]:[[p[0],p[1],p[2]],[p[1],p[3],p[2]]];
}
export function drapePolygon(polygon,g,offset=.045){
 const result=[],s=g.step_m,baseline=sampleGrid(g,0,0)??g.elevations_m[0];
 const xs=polygon.map(p=>p.x),zs=polygon.map(p=>p.z);
 const x0=Math.max(0,Math.floor((Math.min(...xs)-g.origin_x_m)/s)),x1=Math.min(g.width-2,Math.floor((Math.max(...xs)-g.origin_x_m)/s));
 const z0=Math.max(0,Math.floor((Math.min(...zs)-g.origin_z_m)/s)),z1=Math.min(g.height-2,Math.floor((Math.max(...zs)-g.origin_z_m)/s));
 for(let z=z0;z<=z1;z++)for(let x=x0;x<=x1;x++)for(const t of sourceTriangles(g,x,z)){
  const clipped=clipConvex(polygon,t);
  for(let i=1;i<clipped.length-1;i++){
   const a=clipped[0],b=clipped[i],c=clipped[i+1];
   if(Math.abs((b.x-a.x)*(c.z-a.z)-(b.z-a.z)*(c.x-a.x))<1e-8)continue;
   for(const p of [a,c,b])result.push(p.x,sampleGrid(g,p.x,p.z)-baseline+offset,p.z);
  }
 }
 return result;
}
export function clipLineToGrid(g,a,b){
 let lo=0,hi=1;
 const x1=g.origin_x_m+(g.width-1)*g.step_m,z1=g.origin_z_m+(g.height-1)*g.step_m;
 const dx=b.x-a.x,dz=b.z-a.z;
 for(const [p,q] of [[-dx,a.x-g.origin_x_m],[dx,x1-a.x],[-dz,a.z-g.origin_z_m],[dz,z1-a.z]]){
  if(Math.abs(p)<1e-12){if(q<0)return null;continue}
  const t=q/p;if(p<0)lo=Math.max(lo,t);else hi=Math.min(hi,t);if(lo>hi)return null;
 }
 const point=t=>({x:Math.max(g.origin_x_m,Math.min(x1,a.x+dx*t)),z:Math.max(g.origin_z_m,Math.min(z1,a.z+dz*t))});
 return [point(lo),point(hi)];
}
