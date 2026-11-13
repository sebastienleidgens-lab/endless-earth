import {windAtWorld} from '../earthlife/wind.mjs';
export const FOREST_LIFE_VERSION='hierarchical-shoot-life-v1';
export const FOREST_MOTION_PADDING=3.2;
// Generic interpreted phenology, not local species observations. Day on a 365-day year.
export const FOREST_PHENOLOGY=Object.freeze({spreading:[103,136,280,325],high:[94,126,274,317],slender:[88,119,268,311],riverside:[78,111,280,325],pendant:[79,113,281,327],young:[91,124,274,318],asymmetric:[101,134,278,324],small:[88,120,270,314],dense:[96,128,268,312],needle:[1,2,364,365],orchard:[87,119,271,315]});
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export function forestDay(date,latitude=46){const d=new Date(date??'2026-06-21T12:00:00Z');if(!Number.isFinite(+d))return 172;const y=d.getUTCFullYear(),start=Date.UTC(y,0,1),end=Date.UTC(y+1,0,1);let day=(+d-start)/(end-start)*365+1;if(latitude<0)day=(day+182.5)%365;return day}
export function forestPhenology(id,phase,age){const p=FOREST_PHENOLOGY[id];if(!p)throw Error('Unknown phenology');const shift=(phase-.5)*16+(age-.5)*4,fall=(age-.5)*14+(phase-.5)*8;return [p[0]+shift,p[1]+shift,p[2]+fall,p[3]+fall]}
export function forestSeason(day,range,evergreen=false){if(evergreen)return {spring:1,retention:1,autumn:0,bud:0};const spring=smooth(range[0],range[1],day),fall=smooth(range[2],range[3],day),bud=smooth(range[0]-9,range[0]+2,day)*(1-smooth(range[0]+2,range[0]+15,day));return {spring,retention:spring*(1-fall),autumn:smooth(range[2]-24,range[3]-8,day),bud}}
// A bounded spatial bank of driven damped responses. It samples the ONE M11 field.
// It is not a weather simulator and has no clock: update takes the owner's time.
export function createForestWindField({size=16,origin=[-1100,-1100],extent=2200}={}){
 if(!Number.isInteger(size)||size<2||size>32)throw Error('Forest response field size');
 const count=size*size,state=new Float64Array(count*12),data=new Float32Array(count*8),target={};let lastTime=null,updates=0,maxCpuMs=0;
 const frequencies=[1.7,3.4,7.5],damping=[1,.85,.72];
 function update(time,mean){if(!Number.isFinite(time)||!Number.isFinite(mean))return false;if(time===lastTime)return false;const started=performance.now(),reset=lastTime===null||time<lastTime||time-lastTime>2,dt=reset?0:Math.max(0,time-lastTime),steps=Math.max(1,Math.ceil(dt/(1/60))),step=dt/steps;
  for(let i=0;i<count;i++){const x=origin[0]+(i%size)/(size-1)*extent,z=origin[1]+Math.floor(i/size)/(size-1)*extent;windAtWorld(x,z,time,Math.max(0,mean),9,target);const mag=Math.hypot(target.x,target.z),limit=mag>1.7?1.7/mag:1,tx=target.x*limit,tz=target.z*limit;
   for(let k=0;k<3;k++){const at=i*12+k*4;if(reset){state[at]=tx;state[at+1]=tz;state[at+2]=state[at+3]=0}else for(let s=0;s<steps;s++)for(let c=0;c<2;c++){const w=frequencies[k],v=at+2+c;state[v]+=(w*w*((c?tz:tx)-state[at+c])-2*damping[k]*w*state[v])*step;state[at+c]+=state[v]*step}}
   const base=i*4,other=(count+i)*4;data[base]=state[i*12];data[base+1]=state[i*12+1];data[base+2]=state[i*12+4];data[base+3]=state[i*12+5];data[other]=state[i*12+8];data[other+1]=state[i*12+9];data[other+2]=tx;data[other+3]=tz;
  }lastTime=time;updates++;maxCpuMs=Math.max(maxCpuMs,performance.now()-started);return true;
 }
 function sample(x,z){const u=clamp((x-origin[0])/extent)*(size-1),v=clamp((z-origin[1])/extent)*(size-1),a=Math.min(size-2,Math.floor(u)),b=Math.min(size-2,Math.floor(v)),fx=u-a,fz=v-b,out=new Float64Array(8);for(let band=0;band<2;band++)for(let c=0;c<4;c++){const at=(i,j)=>data[((band*size+j)*size+i)*4+c];out[band*4+c]=(at(a,b)*(1-fx)+at(a+1,b)*fx)*(1-fz)+(at(a,b+1)*(1-fx)+at(a+1,b+1)*fx)*fz}return out}
 return {size,origin,extent,data,state,update,sample,get metrics(){return {size,cells:count,updates,maxCpuMs,cpuBytes:state.byteLength+data.byteLength,lastTime}}};
}
export const forestSeasonGLSL=`
vec4 forestSeasonAt(float day,vec4 dates,float evergreen){
 float spring=smoothstep(dates.x,dates.y,day),fall=smoothstep(dates.z,dates.w,day);
 float bud=smoothstep(dates.x-9.,dates.x+2.,day)*(1.-smoothstep(dates.x+2.,dates.x+15.,day));
 return mix(vec4(spring,spring*(1.-fall),smoothstep(dates.z-24.,dates.w-8.,day),bud),vec4(1.,1.,0.,0.),evergreen);
}
// G encodes stable individual leaf rank (>0); B its normalized edge distance.
float forestLeafAlpha(vec4 art,vec4 season,float shoot,float evergreen,float density){
 float leaf=step(.025,art.g),rank=fract(art.g*.91+shoot*.27);
 float growth=smoothstep(rank*.70,rank*.70+.30,season.x);
 float drop=smoothstep(rank*.80,rank*.80+.20,1.-season.y/max(.001,season.x));
 float edge=1.-smoothstep(max(.005,growth-.12),max(.015,growth),art.b);
 float live=leaf*edge*(1.-drop)+(1.-leaf)*smoothstep(.015,.12,season.y);
 live=max(live,leaf*season.w*(1.-smoothstep(.03,.12,art.b)));
 float individual=1.-smoothstep(density-.035,density+.035,rank);
 return art.a*mix(live*individual,1.,evergreen);
}
`;
// CPU evaluator for attachment/bounds checks. Same ordered small-angle kinematics
// as the shader; no per-individual CPU animation uses this evaluator at runtime.
export function forestPosePoint(raw,{traits,form,data,joints,root=[0,0,0],axis=[0,1,0]},bank,time,season={spring:1},mode=2){
 const v=raw.slice(),hRef=data[0],flex=data[1],leaf=data[2],phase=traits[0],age=traits[1];
 const shape=raw=>{let [x,y,z]=raw;y+=form[0]*hRef*smooth(.8,hRef*.45,y)*(1-smooth(hRef*.65,hRef,y));const g=form[1]+(1-form[1])*smooth(.36,4,x*x+z*z);x*=g;z*=g;const h=clamp(y/Math.max(1,hRef)),turn=form[2]*h,ox=x; x-=turn*z;z+=turn*ox;const gain=clamp(raw[1]/3);x+=(age-.5)*.7*h*h*gain;z+=(phase-.5)*.6*h*(1.2-h)*gain;return [x,y,z]};
 if(leaf&&season.spring<.999){const g=Math.max(.035,season.spring);for(let c=0;c<3;c++)v[c]=root[c]+(v[c]-root[c])*g}
 let p=shape(v);const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]],rotate=(pivot,axis,gain)=>{const r=p.map((v,c)=>v-pivot[c]),c=cross(axis,r),d=cross(axis,c);p=pivot.map((v,i)=>v+r[i]+gain*c[i]+.5*gain*gain*d[i])};
 const joint=(j,w,g)=>{if(j)rotate(shape(j.pivot),[w[1],0,-w[0]],g)};
 if(mode>0){const gain=flex*form[3],a=joints[0]?.phase??0,b=joints[1]?.phase??0,c=joints[2]?.phase??0,mix=(a,b,t)=>a.map((v,i)=>v*(1-t)+b[i]*t),rootWind=bank.slice(0,2),branchWind=mix(rootWind,bank.slice(2,4),clamp(.52+flex*.20+a*.12));
  if(mode===2){const secondaryWind=mix(bank.slice(2,4),bank.slice(4,6),clamp(.60+flex*.14+b*.12)),twigWind=mix(bank.slice(2,4),bank.slice(4,6),clamp(.64+flex*.14+c*.12));if(leaf){const rate=(4.1+flex)*(.88+phase*.26),q=data[3]??.5,wave=Math.sin(time*rate+q*37+phase*19)+.38*Math.sin(time*rate*1.618+(q*37+phase*19)*1.37),angle=wave*Math.min(.12,Math.hypot(bank[6],bank[7])*.14*flex)*form[3];rotate(shape(root),axis,angle)}
   joint(joints[2],twigWind,.05*gain*(.91+.09*Math.sin(time*2.4*(.88+phase*.26)+c*29)));joint(joints[1],secondaryWind,.035*gain*(.92+.08*Math.sin(time*1.3*(.88+phase*.26)+b*41)));
  }joint(joints[0],branchWind,.018*gain*(.86+a*.14));rotate([0,0,0],[rootWind[1],0,-rootWind[0]],.006*gain/(1+hRef*.08+age*.3+form[1]*.4));
 }return p;
}
