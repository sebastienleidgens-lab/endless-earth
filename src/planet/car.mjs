const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
/** Lightweight metric bicycle model. The road/support provider has the final
 * word on every swept hull; a missing streamed surface stops before the gap. */
export class CarController {
 constructor(){this.position={x:0,y:0,z:0};this.heading=0;this.speed=0;this.steering=0;this.active=false;this.reason='';this.odometer=0;this.braking=false;this.metrics={steps:0,refusals:0,maxSpeed:0};}
 place(p,heading=0){this.position={...p};this.heading=heading;this.speed=0;}
 clearAt(x,z,heading,world){const c=Math.cos(heading),s=Math.sin(heading);for(const [u,v]of [[0,0],[-.82,-1.6],[.82,-1.6],[-.82,1.6],[.82,1.6]]){const q=world(x+c*u+s*v,z-s*u+c*v);if(!q?.drivable||!Number.isFinite(q.height))return {ok:false,reason:q?.reason??'tile-loading'};}return {ok:true};}
 update(dt,input,world){if(!this.active)return false;if(!Number.isFinite(dt)||dt<0)return false;const steps=Math.max(1,Math.ceil(Math.min(.25,dt)/.0167)),h=Math.min(.25,dt)/steps;
  for(let i=0;i<steps;i++){
   const ground=world(this.position.x,this.position.z);if(!ground?.drivable){this.speed=0;this.reason=ground?.reason??'tile-loading';break;}
   const limit=Math.min(36,ground.speedLimit??13.9),throttle=clamp(input.forward??0,-1,1),brake=!!input.brake||throttle<0&&this.speed>.4||throttle>0&&this.speed<-.4;
   this.braking=brake;let acceleration=brake?-Math.sign(this.speed)*7.5:throttle*(throttle<0?2:3.2);
   acceleration-=this.speed*.055+this.speed*Math.abs(this.speed)*.0015;
   const speed=clamp(this.speed+acceleration*h,-3.5,limit);this.speed=brake&&Math.sign(speed)!==Math.sign(this.speed)?0:speed;
   const target=-clamp(input.strafe??0,-1,1)*(.48/(1+Math.abs(this.speed)*.055));this.steering+=(target-this.steering)*(1-Math.exp(-h*7));
   const heading=this.heading+this.speed/2.45*Math.tan(this.steering)*h,dx=Math.sin(heading)*this.speed*h,dz=Math.cos(heading)*this.speed*h;
   const substeps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.18));let blocked=null;
   for(let j=1;j<=substeps;j++){const x=this.position.x+dx/substeps,z=this.position.z+dz/substeps,result=this.clearAt(x,z,heading,world);if(!result.ok){blocked=result;break;}const next=world(x,z);if(Math.abs(next.height-this.position.y)>.12+.45*Math.hypot(dx,dz)/substeps){blocked={reason:'road-height-discontinuity'};break;}this.position.x=x;this.position.z=z;this.position.y=next.height;this.odometer+=Math.hypot(dx,dz)/substeps;}
   if(blocked){this.speed=0;this.reason=blocked.reason;this.metrics.refusals++;break;}this.heading=heading;this.reason='';this.metrics.steps++;this.metrics.maxSpeed=Math.max(this.metrics.maxSpeed,Math.abs(this.speed));
  }return true;
 }
 save(){return {position:{...this.position},heading:this.heading,speed:0};}
}
