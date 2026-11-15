/** A single contact journal feeds both graphics and audio. It observes the
 * animated joints/paddle against the actual loaded surface, never a timer. */
export class WaterContacts {
  constructor(){this.previous=new Map();this.events=[];this.sequence=0;this.state='walking';this.travel=0;this.last=null;}
  update(state,position,hands,tip,provider,feet=[],boat=null){
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
    if(state==='boating'&&this.travel>.4){const s=provider.sample(position.x,position.z);if(s?.reliable){const heading=boat?.heading??(this.last?Math.atan2(position.x-this.last.x,position.z-this.last.z):0),c=Math.cos(heading),sn=Math.sin(heading);for(const side of [-1,1]){const p={x:position.x+c*side*.32-sn*.9,y:s.surfaceY,z:position.z-sn*side*.32-c*.9};add('wake',p);Object.assign(this.events.at(-1),{heading,side,speed:Math.abs(boat?.speed??.8)});}}this.travel%=.4;}
    this.last={x:position.x,z:position.z};return this.events;
  }
}
