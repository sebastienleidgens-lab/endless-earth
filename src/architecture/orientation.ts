import * as THREE from 'three';
import {facadeOutward} from './window-seeds';
// Legacy wall/pane quads were wound inward. DoubleSide hid the error in colour
// rendering, but AO rays and the solar receiver bias used the inverted normals.
export function orientArchitectureGeometry(g:THREE.BufferGeometry){
 if(g.userData.outwardArchitecture)return;const p=g.attributes.position,n=g.attributes.normal,a=g.attributes.architectureMaterial,index=g.index;if(!p||!n||!a||!index)return;
 const flipped=new Set<number>(),u=new THREE.Vector3(),v=new THREE.Vector3(),origin=new THREE.Vector3();let faces=0;
 for(let k=0;k<index.count;k+=3){const ids=[index.getX(k),index.getX(k+1),index.getX(k+2)],i=ids[0],kind=a.getX(i),face=u.fromBufferAttribute(p,ids[1]).sub(origin.fromBufferAttribute(p,i)).cross(v.fromBufferAttribute(p,ids[2]).sub(origin)).normalize(),ny=face.y;let flip=(kind===0||kind===1||kind===4||kind===7)&&Math.abs(ny)<.01||(kind===2||kind===3)&&ny<0;
  if(Math.abs(ny)<.01){const x=ids.reduce((s,i)=>s+p.getX(i)/3,0),z=ids.reduce((s,i)=>s+p.getZ(i)/3,0),out=facadeOutward(x,z);if(out&&(kind===0||kind===1||kind===4||kind===7||kind===6&&out.distance<.3))flip=out.x*face.x+out.z*face.z<-.9;}
  if(!flip)continue;index.setX(k+1,ids[2]);index.setX(k+2,ids[1]);faces++;for(const id of ids)if(!flipped.has(id)){n.setXYZ(id,-n.getX(id),-n.getY(id),-n.getZ(id));flipped.add(id)}
 }
 index.needsUpdate=n.needsUpdate=true;g.userData.outwardArchitecture={faces,vertices:flipped.size};
}
