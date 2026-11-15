/** Sole owner of the player's mutually exclusive locomotion/interaction state.
 * No wall clock or storage: native dt and spatial validation are supplied. */
export class PlayerActivity{
 constructor(){this.state='walking';this.phase=0;this.camp=null;this.message='';this.revision=0;this.history=[];this.interrupted=false;}
 get locked(){return ['camping','transition','sitting'].includes(this.state)}
 get fade(){return this.state==='transition'?Math.sin(Math.PI*Math.min(1,this.phase/.9)):0}
 event(type){this.history.push({type,state:this.state,phase:this.phase,revision:this.revision});if(this.history.length>48)this.history.shift();}
 toggleCamp(validate){
  if(this.state==='transition')return {ok:false,reason:'busy'};
  if(this.state==='camping'){this.owner='camp';this.state='transition';this.target='walking';this.phase=0;this.committed=false;this.event('pack-request');return {ok:true};}
  if(!['walking','running'].includes(this.state))return {ok:false,reason:'water'};
  const result=validate();if(!result.ok){this.message=result.reason;this.event('camp-refused');return result;}
  this.owner='camp';this.pending=result.layout;this.state='transition';this.target='camping';this.phase=0;this.committed=false;this.message='';this.interrupted=false;this.event('camp-request');return result;
 }
 update(dt,validate,onCommit){
  if(!Number.isFinite(dt)||dt<0)return;
  if(this.state==='transition'){
   if(this.owner==='traveler')return;
   this.phase+=Math.min(dt,.25);
   if(!this.committed&&this.phase>=.45){
    const check=this.target==='camping'?validate(this.pending):{ok:true};
    if(check.ok){this.camp=this.target==='camping'?this.pending:null;this.revision++;onCommit(this.target,this.camp);this.event('commit');}
    else{this.target='walking';this.camp=null;this.message=check.reason;onCommit('walking',null);this.event('rollback');}
    this.committed=true;
   }
   if(this.phase>=.9){this.state=this.target;this.phase=0;this.pending=null;this.event('transition-end');}
  }else if(this.state==='camping'&&!validate(this.camp).ok){this.message='changed-ground';this.interrupted=true;this.toggleCamp(()=>({ok:true}));}
 }
 begin(kind,target,duration,payload=null){if(this.state==='transition')return false;this.from=this.state;this.owner='traveler';this.kind=kind;this.target=target;this.duration=duration;this.phase=0;this.payload=payload;this.state='transition';this.message='';this.event(kind);return true}
 advance(dt){if(this.state!=='transition'||this.owner!=='traveler')return false;this.phase=Math.min(this.duration,this.phase+Math.max(0,Math.min(.25,dt)));if(this.phase<this.duration)return false;this.state=this.target;this.revision++;this.event(this.kind+'-end');return true}
 grounded(speed){if(['walking','running'].includes(this.state))this.state=speed>2?'running':'walking'}
 enterWater(){if(!['walking','running'].includes(this.state))return false;this.state='wading';this.message='';this.event('enter-water');return true}
 swim(swimming){if(!['wading','swimming'].includes(this.state))return false;this.state=swimming?'swimming':'wading';return true}
 leaveWater(){if(!['wading','swimming'].includes(this.state))return false;this.state='walking';this.event('leave-water');return true}
 reset(){this.state='walking';this.camp=this.pending=null;this.phase=0;this.revision++;this.event('reset');}
}
