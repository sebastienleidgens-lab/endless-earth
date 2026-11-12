import * as THREE from 'three';
import {heritageMaterial,architectureMaterials} from '../architecture/material';
// @ts-ignore Shared source road palette.
import {ROAD_STYLES} from './road-style.mjs';
export function addLandmarks(scene:THREE.Object3D,landmarks:any){
 if(!landmarks)return;
 let roadMaterial:THREE.Material|undefined,roadCallback:any;
 scene.traverse(o=>{if(!roadMaterial&&o.userData.earthTile){roadMaterial=(o as THREE.Mesh).material as THREE.Material;roadCallback=o.onBeforeRender}});
 const group=new THREE.Group();group.name='Documented local landmarks';
 const tint=new THREE.Color(ROAD_STYLES[1].color);
 for(const object of landmarks.objects)for(const part of object.parts){
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(part.position,3));geometry.setAttribute('normal',new THREE.BufferAttribute(part.normal,3,true));geometry.setIndex(new THREE.BufferAttribute(part.index,1));
  geometry.setAttribute('uv',new THREE.BufferAttribute(new Float32Array(part.position.length/3*2),2));
  if(part.kind==='road'){
   const count=part.position.length/3,color=new Float32Array(count*3);for(let i=0;i<count;i++)color.set([tint.r,tint.g,tint.b],i*3);
   geometry.setAttribute('color',new THREE.BufferAttribute(color,3));geometry.setAttribute('earthRoad',new THREE.Uint8BufferAttribute(Array(count).fill(1),1));geometry.setAttribute('earthWater',new THREE.Uint8BufferAttribute(Array(count).fill(0),1));
  }
  if(part.kind==='metal'){
   const count=part.position.length/3,c=new THREE.Color(0x414b44),color=new Float32Array(count*3);for(let i=0;i<count;i++)color.set([c.r,c.g,c.b],i*3);geometry.setAttribute('color',new THREE.BufferAttribute(color,3));geometry.setAttribute('architectureMaterial',new THREE.Uint8BufferAttribute(Array(count).fill(6),1));
  }
  geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,part.kind==='road'&&roadMaterial?roadMaterial:part.kind==='metal'?architectureMaterials.plain:heritageMaterial);mesh.name=`landmark-${object.id}-${part.kind}`;mesh.receiveShadow=true;
  if(part.kind==='road'&&roadCallback)mesh.onBeforeRender=roadCallback;group.add(mesh);
 }
 group.userData.landmarkMetrics={objects:landmarks.objects.length,triangles:landmarks.objects.reduce((n:number,o:any)=>n+o.parts.reduce((n:number,p:any)=>n+p.index.length/3,0),0)};
 scene.add(group);
}
