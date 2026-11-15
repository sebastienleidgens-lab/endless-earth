/** Explicit semantic surfaces, supplied by the geometry/collision owner.
 * A box, an OSM point or an attractive rock is not enough to invent a seat.
 * The library is intentionally empty when the world cannot prove a surface.
 */
export class InteractableSurfaces {
  constructor(){this.items=new Map();this.revision=0;this.lastReason='unidentified-surface';}
  register(surface){
    if(!surface?.id||!surface.provenance||surface.loaded!==true||surface.permission!==true||
       typeof surface.validate!=='function'||!surface.colliderId||!Number.isFinite(surface.height)||
       !Number.isFinite(surface.normal?.y)||surface.normal.y<.94||
       !Number.isFinite(surface.width)||!Number.isFinite(surface.depth))return false;
    this.items.set(surface.id,surface);this.revision++;return true;
  }
  remove(id){if(this.items.delete(id))this.revision++;}
  seatAt(p,world){
    this.lastReason='unidentified-surface';
    for(const s of this.items.values()){
      if(!['bench','rock'].includes(s.kind)||!s.actions?.includes('sit')||!s.validate())continue;
      if(s.width<.52||s.depth<.42||Math.hypot(p.x-s.position.x,p.z-s.position.z)>.65)continue;
      // An existing 3D body sweep must prove approach, legs, head and pack.
      // No collider is disabled to make the animation pass.
      if(typeof world.sweepBody!=='function'){this.lastReason='unknown-body-clearance';continue;}
      const front={x:s.position.x+Math.sin(s.heading)*.65,z:s.position.z+Math.cos(s.heading)*.65};
      const support=world.query(front.x,front.z);
      if(!support.ok||s.height-support.height<.3||s.height-support.height>.62)continue;
      const target={x:s.position.x,y:s.height,z:s.position.z};
      if(!world.sweepBody(p,target,{kind:'seat',colliderId:s.colliderId,heading:s.heading}))continue;
      return {kind:s.kind,id:s.id,position:target,heading:s.heading,provenance:s.provenance,revision:this.revision,validate:()=>this.items.get(s.id)===s&&s.validate()};
    }
    return null;
  }
  stepOver(p,heading,world){
    if(typeof world.sweepBody!=='function')return {ok:false,reason:'unknown-body-clearance'};
    for(const s of this.items.values()){
      if(!s.actions?.includes('step-over')||!s.validate()||s.width<.6||s.depth>.45)continue;
      const dx=Math.sin(heading),dz=Math.cos(heading),along=(s.position.x-p.x)*dx+(s.position.z-p.z)*dz;
      if(along<.25||along>.8||Math.abs((s.position.x-p.x)*dz-(s.position.z-p.z)*dx)>.2)continue;
      const top=s.height-p.y;if(top<.12||top>.42)continue;
      const end={x:s.position.x+dx*(s.depth/2+.6),z:s.position.z+dz*(s.depth/2+.6)},landing=world.query(end.x,end.z);
      if(!landing.ok||Math.abs(landing.height-p.y)>.15||landing.slope>.2)continue;
      const target={...end,y:landing.height};
      if(!world.sweepBody(p,target,{kind:'step-over',colliderId:s.colliderId,height:s.height+.12}))continue;
      return {ok:true,id:s.id,start:{...p},end:target,top:s.height,provenance:s.provenance,validate:()=>this.items.get(s.id)===s&&s.validate()};
    }
    return {ok:false,reason:'unidentified-surface'};
  }
  clear(){this.items.clear();this.revision++;}
}
