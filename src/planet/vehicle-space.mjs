/** Rectangles in the common Float64 simulation frame. Tangency counts as
 * occupied; no collider is removed to allow a vehicle to pass. */
export function vehiclesOverlap(a,b,margin=.12){
 const axes=[a.heading,b.heading].flatMap(h=>[{x:Math.cos(h),z:-Math.sin(h)},{x:Math.sin(h),z:Math.cos(h)}]);
 const radius=(v,axis)=>{const c=Math.cos(v.heading),s=Math.sin(v.heading);return (v.halfWidth??.85)*Math.abs(axis.x*c-axis.z*s)+(v.halfLength??1.95)*Math.abs(axis.x*s+axis.z*c);};
 const dx=b.x-a.x,dz=b.z-a.z;
 return axes.every(axis=>Math.abs(dx*axis.x+dz*axis.z)<=radius(a,axis)+radius(b,axis)+margin);
}
export function pedestrianNearVehicle(p,vehicle,radius=.3){
 const dx=p.x-vehicle.x,dz=p.z-vehicle.z,c=Math.cos(vehicle.heading),s=Math.sin(vehicle.heading),x=Math.abs(c*dx-s*dz),z=Math.abs(s*dx+c*dz);
 return Math.hypot(Math.max(0,x-(vehicle.halfWidth??.85)),Math.max(0,z-(vehicle.halfLength??1.95)))<radius;
}
