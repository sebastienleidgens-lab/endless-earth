// OSM waterway order supplies approximate downstream direction, never velocity.
export function makeRiverField(lines,weirs,bounds=[-1000,-1000,1000,1000],size=256){
 const segments=[];let chain=0;for(const line of lines)for(let i=1;i<line.length;i++){const a=line[i-1],b=line[i],dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(!len)continue;segments.push({a,b,dx,dz,len,chain});chain+=len;}
 const nearby=segments.filter(s=>Math.min(s.a.x,s.b.x)<bounds[2]+200&&Math.max(s.a.x,s.b.x)>bounds[0]-200&&Math.min(s.a.z,s.b.z)<bounds[3]+200&&Math.max(s.a.z,s.b.z)>bounds[1]-200);if(!nearby.length)throw Error('No oriented river evidence');
 const start=Math.min(...nearby.map(s=>s.chain)),extent=Math.max(...nearby.map(s=>s.chain+s.len))-start,angle=Math.atan2(nearby.reduce((v,s)=>v+s.dz,0),nearby.reduce((v,s)=>v+s.dx,0));
 const falls=weirs.flatMap(line=>line.slice(1).map((b,i)=>({a:line[i],b}))),data=new Uint8Array(size*size*4);let minAngle=Infinity,maxAngle=-Infinity;
 const closest=(x,z,s)=>{const dx=s.b.x-s.a.x,dz=s.b.z-s.a.z,t=Math.max(0,Math.min(1,((x-s.a.x)*dx+(z-s.a.z)*dz)/(dx*dx+dz*dz||1)));return {t,d:Math.hypot(x-s.a.x-t*dx,z-s.a.z-t*dz)}};
 for(let j=0;j<size;j++)for(let i=0;i<size;i++){const x=bounds[0]+(i+.5)/size*(bounds[2]-bounds[0]),z=bounds[1]+(j+.5)/size*(bounds[3]-bounds[1]);let best=null,d=Infinity,t=0;for(const s of nearby){const q=closest(x,z,s);if(q.d<d){d=q.d;t=q.t;best=s}}
  const a=Math.atan2(Math.sin(Math.atan2(best.dz,best.dx)-angle),Math.cos(Math.atan2(best.dz,best.dx)-angle));minAngle=Math.min(minAngle,a);maxAngle=Math.max(maxAngle,a);const fall=falls.reduce((d,s)=>Math.min(d,closest(x,z,s).d),Infinity),activity=Math.exp(-fall*fall/180),s=Math.round(Math.max(0,Math.min(1,(best.chain+t*best.len-start)/extent))*65535),k=(j*size+i)*4;
  data[k]=Math.round((a/(2*Math.PI)+.5)*255);data[k+1]=Math.round(activity*255);data[k+2]=s>>>8;data[k+3]=s&255;
 }
 if(maxAngle-minAngle>Math.PI*1.8)throw Error('River direction crosses angle encoding seam');
 return {data,size,bounds,angle,start,extent,segments:nearby.length,weirs:falls.length,angleRange:[minAngle,maxAngle]};
}
