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
export function moveGrounded(position, displacement, clear, height) {
  const steps=Math.max(1,Math.ceil(Math.hypot(displacement.x,displacement.z)/.1));
  const dx=displacement.x/steps,dz=displacement.z/steps;
  const attempt=(x,z)=>{
    if(!clear(x,z))return false;
    const h=height(x,z),old=height(position.x,position.z),distance=Math.hypot(x-position.x,z-position.z);
    // Both ascent and descent are bounded: no snapping down cliffs, no unknown DEM.
    if(h===null||old===null||Math.abs(h-old)>distance*.7+.001)return false;
    position.x=x;position.z=z;position.y=h;return true;
  };
  for(let i=0;i<steps;i++) {
    if(!attempt(position.x+dx,position.z+dz)) {
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
