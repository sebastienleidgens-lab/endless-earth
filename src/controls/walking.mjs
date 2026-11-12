// Shared deterministic movement kernel; metres, seconds, local X/Z.
export const nextView = mode => ({aerial:'third',third:'first',first:'aerial'})[mode];
export function movement(yaw, forward, strafe, seconds, running=false) {
  const length=Math.max(1,Math.hypot(forward,strafe));
  const speed=running?3.2:1.45;
  return {x:(-Math.sin(yaw)*forward+Math.cos(yaw)*strafe)/length*speed*seconds,
    z:(-Math.cos(yaw)*forward-Math.sin(yaw)*strafe)/length*speed*seconds};
}
export function circleHitsPolygon(x,z,poly,radius=.3) {
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++) {
    const a=poly[j],b=poly[i],dx=b.x-a.x,dz=b.z-a.z;
    if((a.z>z)!==(b.z>z)&&x<(b.x-a.x)*(z-a.z)/(b.z-a.z)+a.x)inside=!inside;
    const t=Math.max(0,Math.min(1,((x-a.x)*dx+(z-a.z)*dz)/(dx*dx+dz*dz||1)));
    if(Math.hypot(x-a.x-t*dx,z-a.z-t*dz)<radius)return true;
  }
  return inside;
}
export function moveGrounded(position, displacement, clear, height, slope=()=>.7,slide=true,diagnostic=null) {
  const steps=Math.max(1,Math.ceil(Math.hypot(displacement.x,displacement.z)/.1));
  const dx=displacement.x/steps,dz=displacement.z/steps;
  const attempt=(x,z)=>{
    const h=height(x,z),old=height(position.x,position.z),distance=Math.hypot(x-position.x,z-position.z);
    const report=rule=>{diagnostic?.({position:{x:position.x,y:position.y,z:position.z},requested:{x,z},currentHeight:old,nextHeight:h,horizontalM:distance,riseM:h===null||old===null?null:h-old,slope:distance&&h!==null&&old!==null?(h-old)/distance:null,limit:Math.min(slope(x,z),slope(position.x,position.z)),rule});return false};
    if(!clear(x,z))return report('obstacle');
    // Both ascent and descent are bounded: no snapping down cliffs, no unknown DEM.
    if(h===null||old===null)return report('unknown-support');
    if(Math.abs(h-old)>distance*Math.min(slope(x,z),slope(position.x,position.z))+.001){
      // A small ledge is distinct from a sustained steep slope. Require a clear,
      // nearly level landing beyond it; this cannot ratchet up a cliff/ramp.
      if(distance<1e-9||Math.abs(h-old)>.18)return report('slope');
      const ux=(x-position.x)/distance,uz=(z-position.z)/distance;
      for(const d of [.10,.20,.30]){const xx=x+ux*d,zz=z+uz*d,landing=height(xx,zz);if(!clear(xx,zz)||landing===null||Math.abs(landing-h)>.025)return report('slope');}
    }
    position.x=x;position.z=z;position.y=h;return true;
  };
  for(let i=0;i<steps;i++) {
    if(!attempt(position.x+dx,position.z+dz)) {
      if(!slide)return position;
      attempt(position.x+dx,position.z);
      attempt(position.x,position.z+dz);
    }
  }
  return position;
}
// Conservative camera boom sweep. Buildings are treated as vertical columns.
export function cameraFraction(eye,offset,clear,height) {
  const steps=Math.max(1,Math.ceil(Math.hypot(offset.x,offset.y,offset.z)/.15));
  for(let i=1;i<=steps;i++){
    const t=i/steps,x=eye.x+offset.x*t,z=eye.z+offset.z*t,h=height(x,z);
    if(!clear(x,z)||h===null||eye.y+offset.y*t<h+.25)return Math.max(0,(i-2)/steps);
  }
  return 1;
}

// Exact integral of first-order velocity response: same travel at 30/60/120 Hz.
export function smoothMovement(velocity,target,dt) {
  const tau=Math.hypot(target.x,target.z)>.001?.28:.18;
  const decay=Math.exp(-dt/tau),factor=tau*(1-decay);
  const displacement={x:target.x*dt+(velocity.x-target.x)*factor,z:target.z*dt+(velocity.z-target.z)*factor};
  velocity.x=target.x+(velocity.x-target.x)*decay;velocity.z=target.z+(velocity.z-target.z)*decay;
  if(Math.hypot(velocity.x,velocity.z)<.001){velocity.x=0;velocity.z=0;}
  return displacement;
}
export const transitionWeight=(elapsed,duration=.8)=>{const t=Math.min(1,Math.max(0,elapsed/duration));return t*t*(3-2*t);};
