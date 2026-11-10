import * as THREE from 'three';
import {windToInstance} from './wind.mjs';
// Static metadata only: prepared once from unchanged instance matrices. Base
// geometry attributes are shared by reference, not duplicated or simplified.
export function instanceWindGeometry(mesh,root=new THREE.Matrix4()){
 const basis=new Float32Array(mesh.count*4),anchors=new Float32Array(mesh.count*2),matrix=new THREE.Matrix4(),world=new THREE.Matrix4(),x=new THREE.Vector3(),z=new THREE.Vector3();
 for(let i=0;i<mesh.count;i++){mesh.getMatrixAt(i,matrix);world.multiplyMatrices(root,matrix);x.setFromMatrixColumn(world,0);z.setFromMatrixColumn(world,2);const east=windToInstance({x:1,z:0},x,z),south=windToInstance({x:0,z:1},x,z);basis.set([east.x,south.x,east.z,south.z],i*4);anchors.set([world.elements[12],world.elements[14]],i*2)}
 const b=new THREE.InstancedBufferAttribute(basis,4),a=new THREE.InstancedBufferAttribute(anchors,2);
 return base=>{const g=new THREE.BufferGeometry();g.name=base.name;for(const [k,v] of Object.entries(base.attributes))g.setAttribute(k,v);g.setIndex(base.index);g.setAttribute('lifeBasis',b);g.setAttribute('lifeAnchor',a);if(base.boundingSphere)g.boundingSphere=base.boundingSphere.clone();if(base.boundingBox)g.boundingBox=base.boundingBox.clone();return g};
}
