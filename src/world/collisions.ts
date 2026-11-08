import * as THREE from 'three';
// Placeholder collision footprints match the illustrative demo houses.
// Replace with real building footprints when geodata is imported.
export function canWalk(x: number, z: number): boolean {
  if (Math.abs(x)>205 || Math.abs(z)>205) return false;
  for (let i=0;i<12;i++) {
    const hx=(i%2 ? 1:-1)*(20+(i%3)*7), hz=Math.floor(i/2)*35-90;
    if (Math.abs(x-hx)<7.6 && Math.abs(z-hz)<7.1) return false;
  }
  return true;
}
export function moveWithCollision(position: THREE.Vector3, displacement: THREE.Vector3) {
  const length=displacement.length();
  const steps=Math.max(1,Math.ceil(length/0.7));
  const dx=displacement.x/steps,dz=displacement.z/steps;
  for(let i=0;i<steps;i++){
    if(canWalk(position.x+dx,position.z+dz)) { position.x+=dx; position.z+=dz; }
    else {
      if(canWalk(position.x+dx,position.z)) position.x+=dx;
      if(canWalk(position.x,position.z+dz)) position.z+=dz;
    }
  }
}
