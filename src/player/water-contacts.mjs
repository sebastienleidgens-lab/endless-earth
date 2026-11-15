/** A single contact journal feeds both graphics and audio. It observes the
 * animated joints/paddle against the actual loaded surface, never a timer. */
export class WaterContacts {
  constructor(){this.previous=new Map();this.events=[];this.sequence=0;this.state='walking';this.travel=0;this.last=null;}
  update(state,position,hands,tip,provider,feet=[]){
    this.events.length=0;
    const add=(kind,p)=>this.events.push({id:++this.sequence,kind,position:{x:p.x,y:p.y,z:p.z}});
    const water=['wading','swimming','boating'].includes(state);
    if(state!==this.state){
      const s=provider?.sample(position.x,position.z);
      if(s?.reliable&&water&&['walking','running'].includes(this.state))add('entry',{...position,y:s.surfaceY});
      if(!water&&['wading','swimming'].includes(this.state))add('exit',position);
      this.previous.clear();this.state=state;this.travel=0;this.last=null;
    }
    if(!water)return this.events;
    const observe=(id,kind,p)=>{
      const s=provider?.sample(p.x,p.z),wet=!!s?.reliable&&p.y<=s.surfaceY+.015;
      if(wet&&this.previous.get(id)===false)add(kind,{x:p.x,y:s.surfaceY,z:p.z});
      this.previous.set(id,wet);
    };
    if(state==='swimming'&&hands.head){const s=provider?.sample(hands.head.x,hands.head.z);if(hands.breath>.75&&!this.breathing&&s?.reliable&&hands.head.y>s.surfaceY+.025){add('breath',hands.head);this.breathing=true;}if(hands.breath<.2)this.breathing=false;}
    if(state==='swimming')for(const h of hands)observe('hand'+h.side,'stroke',h.position);
    if(state==='boating'&&tip)observe('paddle','paddle',tip);
    if(state==='wading')for(const f of feet){const s=provider.sample(f.position.x,f.position.z);if(s?.reliable)add('wade',{...f.position,y:s.surfaceY});}
    if(this.last)this.travel+=Math.hypot(position.x-this.last.x,position.z-this.last.z);
    if(state==='boating'&&this.travel>.65){const s=provider.sample(position.x,position.z);if(s?.reliable)add('wake',{...position,y:s.surfaceY});this.travel%=.65;}
    this.last={x:position.x,z:position.z};return this.events;
  }
}
