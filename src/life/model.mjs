export const SIGNS_VERSION='quiet-life-v1';
export function hash(value){let s=2166136261;for(const c of String(value))s=Math.imul(s^c.charCodeAt(0),16777619);return s>>>0}
export function random(seed){let s=hash(seed);return ()=>{s+=0x6d2b79f5;let n=Math.imul(s^s>>>15,1|s);n^=n+Math.imul(n^n>>>7,61|n);return ((n^n>>>14)>>>0)/4294967296}}
const exp=(r,mean)=>-Math.log(Math.max(1e-9,1-r()))*mean;
export function heating(climate){const t=climate?.snow?.temperature;if(Number.isFinite(t))return Math.max(.02,Math.min(1,(18-t)/20));return climate?.season==='winter'?1:climate?.season==='summer'?.035:.5}
/** Ephemeral session events. No visibility/frustum input and no occupied-house claim. */
export class QuietLife{
 constructor(seed){this.seed=String(seed);this.airRandom=random(seed+':air');this.smokeRandom=random(seed+':hearth');this.time=0;this.flight=null;this.hearths=[];this.nextFlight=180+exp(this.airRandom,1200);this.nextSmoke=45+exp(this.smokeRandom,90);this.flights=0;this.smokes=0;this.history=[]}
 log(type,id,t){this.history.push({type,id,time:t});if(this.history.length>32)this.history.shift()}
 startFlight(t,p,ceiling=100){const r=this.airRandom,angle=r()*Math.PI*2,speed=32+r()*12,offset=420+r()*400,dx=Math.cos(angle),dz=Math.sin(angle),cx=p.x-dz*offset,cz=p.z+dx*offset,y=Math.max(ceiling+140,p.y+260)+r()*90;this.flight={id:'flight:'+this.flights++,start:t,duration:4400/speed,origin:{x:cx-dx*2200,y,z:cz-dz*2200},velocity:{x:dx*speed,y:0,z:dz*speed},heading:Math.atan2(dx,dz)};this.log('flight',this.flight.id,t);return this.flight}
 update(dt,climate,p,anchors=[],ceiling=100){this.time+=Math.max(0,Math.min(1,dt));const t=this.time;
  if(this.flight&&t>this.flight.start+this.flight.duration){const end=this.flight.start+this.flight.duration;this.flight=null;this.nextFlight=end+300+exp(this.airRandom,1200)}
  if(!this.flight&&t>=this.nextFlight){const due=this.nextFlight;this.nextFlight=Infinity;if((climate?.weather?.rain??0)<.6&&(climate?.weather?.mist??0)<.7)this.startFlight(due,p,ceiling);else this.nextFlight=t+300+exp(this.airRandom,1200)}
  this.hearths=this.hearths.filter(e=>t<e.end);
  if(t>=this.nextSmoke){const due=this.nextSmoke,r=this.smokeRandom;this.nextSmoke=due+45+exp(r,110);const chance=r(),choice=r(),duration=100+r()*150;if(anchors.length&&this.hearths.length<2&&chance<heating(climate)){const anchor=anchors[Math.floor(choice*anchors.length)];if(!this.hearths.some(e=>e.anchor.id===anchor.id)){const e={id:'hearth:'+this.smokes++,anchor,start:due,end:due+duration,nextPuff:due};this.hearths.push(e);this.log('hearth',e.id,due)}}}
  return this;
 }
}
export function flightAt(f,t,out={}){const age=t-f.start,q=Math.max(0,Math.min(1,age/f.duration)),fade=Math.min(1,q*8,(1-q)*8);out.x=f.origin.x+f.velocity.x*age;out.y=f.origin.y;out.z=f.origin.z+f.velocity.z*age;out.alpha=Math.max(0,fade);out.audioWindow=Math.abs(age-f.duration/2)<12;return out}
/** Match the actual indexed 50cm cap and its four stem walls; never invent a roof point. */
export function chimneyCaps(geometry){const p=geometry.attributes.position,c=geometry.attributes.color,index=geometry.index;if(!p||!c||!index)return [];const out=[];
 for(let i=0;i+5<index.count;i++){const a=index.getX(i);if(a<16||index.getX(i+1)!==a+1||index.getX(i+2)!==a+2||index.getX(i+3)!==a||index.getX(i+4)!==a+2||index.getX(i+5)!==a+3)continue;
  const x=[0,1,2,3].map(j=>p.getX(a+j)),y=[0,1,2,3].map(j=>p.getY(a+j)),z=[0,1,2,3].map(j=>p.getZ(a+j));if(Math.max(...y)-Math.min(...y)>1e-5||Math.abs(Math.max(...x)-Math.min(...x)-.5)>.001||Math.abs(Math.max(...z)-Math.min(...z)-.5)>.001)continue;
  const bottom=Math.min(...Array.from({length:16},(_,j)=>p.getY(a-16+j)));if(y[0]-bottom<.08||y[0]-bottom>2)continue;
  // Original chimney-cap colour, in linear RGB. Flat roof panels are not flues.
  if(Math.abs(c.getX(a)-.13286832)>.00001||Math.abs(c.getY(a)-.09530747)>.00001||Math.abs(c.getZ(a)-.06301002)>.00001)continue;
  const center={x:(Math.min(...x)+Math.max(...x))/2,y:y[0],z:(Math.min(...z)+Math.max(...z))/2};out.push({...center,id:'chimney:'+hash(x.join(',')+':'+z.join(',')),vertex:a,bottom,interpretation:'Existing procedural roof chimney, not a surveyed flue or occupancy observation'});i+=5;
 }return out;
}
