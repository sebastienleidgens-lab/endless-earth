/** Provenance-gated gameplay water, including explicitly estimated beds.
 * Every admitted point keeps a checked return route; ordinary walking and
 * source geography retain their separate collision ownership. */
export class AquaticController{
 constructor(activity){this.activity=activity;this.provider=null;this.last=null;this.reason='';this.history=[];}
 get active(){return ['wading','swimming'].includes(this.activity.state)}
 record(type,p){this.history.push({type,state:this.activity.state,position:{...p},reason:this.reason});if(this.history.length>64)this.history.shift()}
 valid(s){return s?.reliable===true&&!!s.provenance&&Number.isFinite(s.surfaceY)&&Number.isFinite(s.bedY)&&s.surfaceY>=s.bedY&&s.allowed===true}
 route(provider,p,clear){const route=provider.routeToExit?.(p.x,p.z);if(!Array.isArray(route)||route.length<2||route.length>8192)return false;
  let previous={...p};for(const q of route){if(!Number.isFinite(q.x)||!Number.isFinite(q.z)||Math.hypot(q.x-previous.x,q.z-previous.z)>1)return false;const s=provider.sample(q.x,q.z);if(!this.valid(s)||!clear(q.x,q.z)||Math.abs(s.bedY-previous.y)>.7*Math.max(.2,Math.hypot(q.x-previous.x,q.z-previous.z))+.06)return false;previous={...q,y:s.bedY};}
  const end=route.at(-1),s=provider.sample(end.x,end.z);return s.surfaceY-s.bedY<.08&&provider.exitWalkable?.(end.x,end.z)===true;
 }
 /** Returns handled=false to retain ordinary M23 grounded movement. */
 move(position,delta,dt,{provider,clear,auto=false,landHeight,landClear}){
  const target={x:position.x+delta.x,z:position.z+delta.z};
  if(!this.active){
   if(!provider?.contains?.(target.x,target.z))return {handled:false};
   if(auto||!['walking','running'].includes(this.activity.state)){this.reason=auto?'autowalk-water':'busy';return {handled:true};}
   const s=provider.sample(target.x,target.z);
   if(!this.valid(s)){this.reason='unknown-depth';this.record('refused',position);return {handled:true};}
   const depth=s.surfaceY-s.bedY;
   if(depth>.45||Math.abs(s.bedY-position.y)>.14||!clear(target.x,target.z)||!this.route(provider,{...target,y:s.bedY},clear)){this.reason='inaccessible-bank-or-exit';this.record('refused',position);return {handled:true};}
   this.provider=provider;this.activity.enterWater();this.last={...s};this.reason='';this.record('entry',position);
  }
  const p=this.provider,length=Math.hypot(delta.x,delta.z),speed=this.activity.state==='swimming'?1.1:.85,factor=length>0?Math.min(1,speed*Math.max(0,Math.min(.25,dt))/length):0;
  const dx=delta.x*factor,dz=delta.z*factor,steps=Math.max(1,Math.ceil(Math.hypot(dx,dz)/.08));
  for(let i=0;i<steps;i++){
   const x=position.x+dx/steps,z=position.z+dz/steps;
   if(!p.contains(x,z)){
    const h=landHeight(x,z);if(this.activity.state==='wading'&&landClear(x,z)&&Number.isFinite(h)&&Math.abs(h-position.y)<.12){position.x=x;position.z=z;position.y=h;this.activity.leaveWater();this.provider=null;this.last=null;this.record('exit',position);}else this.reason='inaccessible-bank';break;
   }
   const s=p.sample(x,z);if(!this.valid(s)||!clear(x,z)){this.reason=!this.valid(s)?'unknown-depth':'obstacle';break;}
   if(!(p.returnRouteVerified?p.returnRouteVerified(x,z):this.route(p,{x,y:s.bedY,z},clear))){this.reason='unverified-exit';break;}
   const depth=s.surfaceY-s.bedY;
   if(this.activity.state==='wading'&&depth<1.12&&Math.abs(s.bedY-(this.last?.bedY??position.y))>.7*Math.max(.08,Math.hypot(dx,dz)/steps)+.04){this.reason='steep-bed';break;}
   this.activity.swim(depth>(this.activity.state==='swimming'?.92:1.08));
   const height=this.activity.state==='swimming'?s.surfaceY-.85:s.bedY;
   position.x=x;position.z=z;position.y+=Math.max(-.08,Math.min(.08,height-position.y));this.last={...s};this.reason='';
  }
  return {handled:true,depth:this.last?this.last.surfaceY-this.last.bedY:null,state:this.activity.state};
 }
}
