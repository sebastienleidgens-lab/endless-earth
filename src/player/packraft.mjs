import {paddlePose} from './paddle-motion.mjs';
const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
const smooth=t=>t*t*(3-2*t),clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Outer silhouette of the rendered elliptical tube: centreline .51/.94 m
// plus the .18 m tube radius, sampled around its outward normal.
const HULL_SAMPLES=Object.freeze([[0,0],...Array.from({length:16},(_,i)=>{const a=i/16*Math.PI*2,c=Math.cos(a),s=Math.sin(a),n=Math.hypot(.94*c,.51*s);return [.51*c+.18*.94*c/n,.94*s+.18*.51*s/n];})]);
/** One reusable boat, one transactional activity owner. No inventory spawning. */
export class PackraftController{
 constructor(activity){this.activity=activity;this.position={x:0,y:0,z:0};this.heading=0;this.speed=0;this.stroke=0;this.yawRate=0;this.visible=false;this.scale=0;this.cycles=0;this.recovery=false;this.reason='';this.following=false;this.followMetrics={plans:0,lateralError:0,maxLateralError:0,stops:0};this.paddleState={};}
 get active(){return this.activity.state==='boating'}
 stopFollow(reason=''){this.following=false;this.followRoute=null;this.followReason=reason;if(reason)this.activity.message=reason;this.followMetrics.stops++;}
 toggleFollow(provider){if(this.following){this.stopFollow();return {ok:true};}if(!this.active)return {ok:false,reason:'busy'};const route=provider?.network?.follow?.(this.position,this.heading);if(!route?.ok){this.activity.message=route?.reason??'no-safe-river';return route??{ok:false,reason:'no-safe-river'};}this.recovery=false;this.followRoute=route.points;this.followCursor=1;this.following=true;this.followMetrics.plans++;this.followReason='';this.activity.message='';return route;}
 clearAt(provider,clear,x,z,heading=this.heading){
  const c=Math.cos(heading),sine=Math.sin(heading);
  for(const [a,b]of HULL_SAMPLES){const xx=x+c*a+sine*b,zz=z-sine*a+c*b,s=provider.sample(xx,zz);if(!provider.contains(xx,zz)||!s?.reliable||s.depth<.18||!clear(xx,zz))return false;}
  return true;
 }
 site(p,provider,clear){const a=provider?.nearby(p,2.1);if(!a)return null;const h=Math.atan2(a.water.x-a.dry.x,a.water.z-a.dry.z);return this.clearAt(provider,clear,a.water.x,a.water.z,h)?a:null;}
 launch(p,heading,provider,clear){
  if(!['walking','running'].includes(this.activity.state))return {ok:false,reason:'busy'};
  const site=this.site(p,provider,clear);if(!site)return {ok:false,reason:'inaccessible-bank'};
  const start={...p},n=Math.ceil(distance(start,site.water)/.1);
  for(let i=0;i<=n;i++){const x=start.x+(site.water.x-start.x)*i/n,z=start.z+(site.water.z-start.z)*i/n;if(!clear(x,z))return {ok:false,reason:'obstacle'};}
  this.siteData=site;this.start=start;this.startHeading=heading;this.heading=Math.atan2(site.water.x-start.x,site.water.z-start.z);this.speed=this.yawRate=0;this.stroke=0;this.provider=provider;this.reason='';this.visible=true;this.scale=.02;this.position={x:site.entry.x,y:provider.sample(site.water.x,site.water.z).surfaceY,z:site.entry.z};this.activity.begin('launch','boating',4.8);return {ok:true};
 }
 dock(p,provider,clear){
  if(!this.active)return {ok:false,reason:'busy'};
  const sites=provider.accesses.filter(a=>distance(p,a.water)<3.2).sort((a,b)=>distance(p,a.water)-distance(p,b.water));
  for(const site of sites){let valid=true;const n=Math.max(1,Math.ceil(distance(p,site.water)/.1));for(let i=0;i<=n;i++){const x=p.x+(site.water.x-p.x)*i/n,z=p.z+(site.water.z-p.z)*i/n;if(!this.clearAt(provider,clear,x,z)){valid=false;break;}}if(!valid)continue;
   // The return must use the already inspected bank corridor. A diagonal
   // shortcut from an off-axis boat to dry ground could cut an unchecked bank.
   for(let i=0;i<=34;i++){const t=i/34;if(!clear(site.water.x+(site.dry.x-site.water.x)*t,site.water.z+(site.dry.z-site.water.z)*t)){valid=false;break;}}
   if(!valid||provider.exitWalkable?.(site.dry.x,site.dry.z)===false)continue;
   this.siteData=site;this.start={...p};this.speed=0;this.recovery=false;this.stopFollow();this.activity.begin('dock','walking',4.8);this.reason='';return {ok:true};
  }this.reason='shore-required';return {ok:false,reason:this.reason};
 }
 update(dt,p,controls,provider,clear){
  dt=clamp(dt,0,.25);const a=this.activity;
  if(a.state==='transition'&&a.owner==='traveler'&&['launch','dock'].includes(a.kind)){
   a.advance(dt);const t=clamp(a.phase/a.duration,0,1),site=this.siteData,launch=a.kind==='launch',water=site.water,level=provider.sample(water.x,water.z).surfaceY;
   if(launch){const lower=smooth(clamp((t-.2)/.35,0,1));this.scale=.02+.98*smooth(clamp(t/.35,0,1));this.position.x=site.entry.x+(water.x-site.entry.x)*lower;this.position.z=site.entry.z+(water.z-site.entry.z)*lower;this.position.y=level+.18*(1-lower);const board=smooth(clamp((t-.52)/.48,0,1));p.x=this.start.x+(water.x-this.start.x)*board;p.z=this.start.z+(water.z-this.start.z)*board;p.y=this.start.y+(level+.1-this.start.y)*board;this.pose=board;}
   else{const approach=smooth(clamp(t/.23,0,1)),land=smooth(clamp((t-.23)/.42,0,1));p.x=this.start.x+(water.x-this.start.x)*approach+(site.dry.x-water.x)*land;p.z=this.start.z+(water.z-this.start.z)*approach+(site.dry.z-water.z)*land;p.y=this.start.y+(level+.1-this.start.y)*approach+(site.dry.y-level-.1)*land;this.pose=1-land;this.scale=1-.98*smooth(clamp((t-.65)/.35,0,1));this.position.x=this.start.x+(water.x-this.start.x)*approach+(site.entry.x-water.x)*land;this.position.z=this.start.z+(water.z-this.start.z)*approach+(site.entry.z-water.z)*land;this.position.y=level;}
   if(t===1){if(launch){this.pose=1;this.scale=1;}else{this.visible=false;this.scale=0;this.cycles++;this.pose=0;}}return true;
  }
  if(!this.active)return false;
  if(dt>.026){const count=Math.ceil(dt/.025);for(let i=0;i<count;i++){if(!this.active)break;this.update(dt/count,p,controls,provider,clear);}return true;}
  let forward=controls.forward,turn=controls.strafe;
  if(this.following&&(Math.abs(forward)>.01||Math.abs(turn)>.01||controls.brake||this.recovery)){this.stopFollow('river-manual-control');}
  if(this.following){
   const route=this.followRoute;let cursor=this.followCursor;
   while(cursor<route.length-1&&distance(route[cursor],p)<2)cursor++;
   this.followCursor=cursor;const q=route[cursor],last=route.at(-1),previous=route[Math.max(0,cursor-1)],vx=q.x-previous.x,vz=q.z-previous.z,len=Math.hypot(vx,vz)||1;
   this.followMetrics.lateralError=Math.abs((p.x-previous.x)*vz-(p.z-previous.z)*vx)/len;this.followMetrics.maxLateralError=Math.max(this.followMetrics.maxLateralError,this.followMetrics.lateralError);
   const target=Math.atan2(q.x-p.x,q.z-p.z),error=Math.atan2(Math.sin(target-this.heading),Math.cos(target-this.heading));
   const next=route[Math.min(route.length-1,cursor+1)],bend=Math.abs(Math.atan2(Math.sin(Math.atan2(next.x-q.x,next.z-q.z)-target),Math.cos(Math.atan2(next.x-q.x,next.z-q.z)-target))),desired=clamp(1.05-bend*.38,.45,1.05);
   turn=clamp(error*2.1-this.yawRate*1.3,-1,1);forward=Math.abs(error)<1.1?clamp((desired-this.speed)*1.3+.22,0,1):.12;
   if(cursor===route.length-1&&distance(p,last)<this.speed*this.speed/1.1+2){forward=this.speed>.12?-.6:0;if(distance(p,last)<1.5&&this.speed<.15)this.stopFollow('river-corridor-ended');}
   if(!provider?.network?.metrics.ready){forward=this.speed>.1?-.7:0;this.activity.message='river-loading';}
  }
  if(this.recovery){
   if(this.dock(p,provider,clear).ok)return true;
   if(!this.recoveryRoute||!this.wasRecovering){this.recoveryRoute=provider.routeToBank?.(p.x,p.z)??provider.routeToExit(p.x,p.z);this.routeCursor=0;}
   const route=this.recoveryRoute;
   while(route&&this.routeCursor<route.length-1&&distance(route[this.routeCursor],p)<1.1)this.routeCursor++;
   const q=route?.[this.routeCursor];
   if(!q){this.recovery=false;this.reason='no-connected-bank';}
   else{const target=Math.atan2(q.x-p.x,q.z-p.z),error=Math.atan2(Math.sin(target-this.heading),Math.cos(target-this.heading));turn=clamp(error*2,-1,1);forward=Math.abs(error)<.85?.75:0;}
  }else this.recoveryRoute=null;
  this.wasRecovering=this.recovery;
  const effort=Math.min(1,Math.hypot(forward,turn));this.stroke+=dt*(effort>.01?3.8:0);const pose=paddlePose(this.stroke,this.paddleState),c=Math.cos(this.heading),sn=Math.sin(this.heading),bladeX=p.x+c*pose.tipX+sn*pose.tipZ,bladeZ=p.z-sn*pose.tipX+c*pose.tipZ,bladeWater=provider.sample(bladeX,bladeZ),centerWater=provider.sample(p.x,p.z),bladeY=(centerWater?.surfaceY??this.position.y)+pose.tipY;
  const catchWater=bladeWater?.reliable?clamp((bladeWater.surfaceY-bladeY)/.08,0,1):0,thrust=forward*catchWater*2.4;this.paddleState.waterContact=catchWater;this.paddleState.thrust=thrust;
  this.speed=(this.speed+thrust*dt)*Math.exp(-dt*(forward<0?1.6:.52));this.speed=clamp(this.speed,-.65,1.8);
  this.yawRate+=(turn*catchWater*1.3-this.yawRate)*(1-Math.exp(-dt*3));const heading=this.heading+this.yawRate*dt;
  if(this.clearAt(provider,clear,p.x,p.z,heading))this.heading=heading;
  const steps=Math.max(1,Math.ceil(Math.abs(this.speed*dt)/.08));
  for(let i=0;i<steps;i++){const x=p.x+Math.sin(this.heading)*this.speed*dt/steps,z=p.z+Math.cos(this.heading)*this.speed*dt/steps;if(!this.clearAt(provider,clear,x,z)||!provider.returnRouteVerified(x,z)){this.speed=0;this.reason='obstacle';if(this.following)this.stopFollow('river-obstacle');break;}p.x=x;p.z=z;this.reason='';}
  const level=provider.sample(p.x,p.z)?.surfaceY;if(Number.isFinite(level)){p.y=level+.1;this.position.x=p.x;this.position.z=p.z;this.position.y=level;}
  this.effort=effort;this.pose=1;this.scale=1;return true;
 }
 reset(){this.visible=false;this.scale=0;this.speed=this.yawRate=0;this.pose=0;this.recovery=false;this.recoveryRoute=null;this.wasRecovering=false;this.stopFollow();}
}
