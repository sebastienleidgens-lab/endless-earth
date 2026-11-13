/** Resolution alone changes. Geography, camera FOV, speed and LOD distances do not. */
export class AdaptiveResolution {
 constructor(){this.scale=1;this.slow=0;this.fast=0;this.age=0;this.filtered=16.7;this.changes=0;this.profile='';}
 update(ms,dt,profile='balanced'){
  if(!Number.isFinite(ms)||!Number.isFinite(dt)||dt<=0)return this.scale;
  const minimum=profile==='quality'?.72:profile==='eco'?.6:.66;
  if(this.profile!==profile){this.scale=Math.max(minimum,this.scale);this.profile=profile;this.slow=this.fast=this.age=0;}
  dt=Math.min(1,dt);this.age+=dt;this.filtered+=(Math.min(250,ms)-this.filtered)*(1-Math.exp(-dt/3));
  this.slow=this.filtered>29?this.slow+dt:0;this.fast=this.filtered<19?this.fast+dt:0;
  if(this.age>=8&&(this.slow>=5||this.fast>=24)){
   const next=Math.max(minimum,Math.min(1,this.scale+(this.slow>=5?-.06:.03)));
   if(Math.abs(next-this.scale)>.001){this.scale=next;this.changes++;this.age=0;}
   this.slow=this.fast=0;
  }
  return this.scale;
 }
}
