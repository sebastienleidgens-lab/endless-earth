const smooth=t=>t*t*(3-2*t);
/** Deliberately limited to verified rendered ground. Unknown collider heights
 * never become vaultable; walls, water and gaps remain blocking. */
export class GroundInteractions{
 constructor(activity){this.activity=activity;this.sit=0;this.jump=0;this.reason='';}
 seatAt(p,world){const base=world?.query(p.x,p.z);if(!base?.ok||base.slope>.12)return null;for(const [x,z]of [[.45,0],[-.45,0],[0,.55],[0,-.55]]){const s=world.query(p.x+x,p.z+z);if(!s.ok||Math.abs(s.height-base.height)>.07)return null;}return {kind:'ground',position:{x:p.x,y:base.height,z:p.z},provenance:base.provenance};}
 toggleSeat(p,world){const a=this.activity;if(a.state==='sitting'){a.begin('stand','walking',1.1);return {ok:true};}if(!['walking','running'].includes(a.state))return {ok:false,reason:'busy'};const site=this.seatAt(p,world);if(!site)return {ok:false,reason:'unstable-seat'};this.seat=site;a.begin('sit','sitting',1.1,site);return {ok:true};}
 requestJump(p,heading,world){
  if(!['walking','running'].includes(this.activity.state))return {ok:false,reason:'busy'};
  const start=world?.query(p.x,p.z);if(!start?.ok)return {ok:false,reason:'unknown-support'};
  const length=.95,end={x:p.x+Math.sin(heading)*length,z:p.z+Math.cos(heading)*length},landing=world.query(end.x,end.z);if(!landing?.ok||landing.slope>.6||Math.abs(landing.height-p.y)>.3)return {ok:false,reason:'unsafe-landing'};
  const duration=.56,gravity=9.81,up=(landing.height-p.y+.5*gravity*duration**2)/duration;let maxLedge=0;
  for(let i=0;i<=20;i++){const t=i/20,x=p.x+(end.x-p.x)*t,z=p.z+(end.z-p.z)*t,s=world.query(x,z),arc=p.y+up*t*duration-.5*gravity*(t*duration)**2;if(!s.ok||s.height>arc+.04||s.height<p.y-.42)return {ok:false,reason:'obstacle'};maxLedge=Math.max(maxLedge,s.height-p.y);}
  this.flight={start:{...p},end:{...end,y:landing.height},duration,gravity,up,time:0};this.activity.state='jumping';this.activity.kind=maxLedge>.18?'step-over':'jump';this.activity.event(this.activity.kind);return {ok:true};
 }
 update(dt,p){const a=this.activity;
  if(a.state==='transition'&&a.owner==='traveler'&&['sit','stand'].includes(a.kind)){a.advance(dt);const t=smooth(Math.min(1,a.phase/a.duration));this.sit=a.kind==='sit'?t:1-t;return true;}
  if(a.state==='jumping'&&this.flight){const f=this.flight;f.time=Math.min(f.duration,f.time+Math.max(0,Math.min(.25,dt)));const t=f.time/f.duration;p.x=f.start.x+(f.end.x-f.start.x)*t;p.z=f.start.z+(f.end.z-f.start.z)*t;p.y=f.start.y+f.up*f.time-.5*f.gravity*f.time*f.time;this.jump=Math.sin(Math.PI*t);if(t===1){p.y=f.end.y;a.state='walking';a.event('land');this.flight=null;this.jump=0;}return true;}
  return a.state==='sitting';
 }
}
