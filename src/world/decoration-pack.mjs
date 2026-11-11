import * as THREE from 'three';
export const DECORATION_VERSION='static-decorations-v1';
const types={f32:Float32Array,u32:Uint32Array,u16:Uint16Array,u8:Uint8Array};
export function decodeDecoration(buffer){
 if(!(buffer instanceof ArrayBuffer)||buffer.byteLength<8||buffer.byteLength>64*1024*1024)throw Error('Invalid decoration pack size');
 const n=new DataView(buffer).getUint32(0,true);if(n<2||n>2*1024*1024||n+4>buffer.byteLength)throw Error('Invalid decoration header');
 const meta=JSON.parse(new TextDecoder().decode(new Uint8Array(buffer,4,n))),base=(n+7)&~3;
 if(meta.version!==DECORATION_VERSION||!Array.isArray(meta.meshes)||meta.meshes.length>1024)throw Error('Invalid decoration schema');
 const geometries=[];
 try{for(const mesh of meta.meshes){const g=new THREE.BufferGeometry();geometries.push(g);const array=d=>{const T=types[d.type];if(!T||!Number.isInteger(d.offset)||d.offset<0||d.offset%T.BYTES_PER_ELEMENT||!Number.isInteger(d.length)||d.length<0||base+d.offset+d.length*T.BYTES_PER_ELEMENT>buffer.byteLength)throw Error('Invalid decoration range');return new T(buffer,base+d.offset,d.length)};
  if(!mesh.attributes?.position||!mesh.sphere?.every(Number.isFinite)||mesh.sphere.length!==4||mesh.sphere[3]<0)throw Error('Invalid decoration geometry');
  for(const [name,d] of Object.entries(mesh.attributes)){if(!['position','normal','color','uv','natureBend','architectureMaterial'].includes(name)||![1,2,3,4].includes(d.itemSize)||d.length%d.itemSize)throw Error('Invalid attribute');g.setAttribute(name,new THREE.BufferAttribute(array(d),d.itemSize,!!d.normalized))}
  const kind=g.attributes.architectureMaterial;if(kind&&(kind.itemSize!==1||kind.count!==g.attributes.position.count||!(kind.array instanceof Uint8Array)||!kind.array.every(v=>v<=7)))throw Error('Invalid architecture material classes');
  if(mesh.index)g.setIndex(new THREE.BufferAttribute(array(mesh.index),1));g.boundingSphere=new THREE.Sphere(new THREE.Vector3(...mesh.sphere.slice(0,3)),mesh.sphere[3]);mesh.geometry=g;
 }}catch(e){geometries.forEach(g=>g.dispose());throw e}return meta;
}
