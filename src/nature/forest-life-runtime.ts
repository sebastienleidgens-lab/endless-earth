import * as THREE from 'three';
// @ts-ignore Shared pure responses and phenology; one M11 clock.
import {createForestWindField,forestDay} from './forest-life.mjs';
// @ts-ignore Weather and time owners remain unchanged.
import {lifeUniforms} from '../earthlife/state.mjs';
export const FOREST_MOTION_ATTRIBUTES=['forestPrimary','forestSecondary','forestTwig','forestLeafRoot','forestLeafAxis'];
export function createForestJointAtlas(models:Map<string,any>){
 const geometries:THREE.BufferGeometry[]=[];for(const m of models.values())for(const l of m.levels)geometries.push(l.wood,l.leaves);
 const count=geometries.reduce((n,g)=>n+g.attributes.position.count,0),width=1024,records:number[][]=[],keys=new Map<string,number>(),record=new Uint16Array(20);
 for(const g of geometries){const n=g.attributes.position.count,index=new Float32Array(n);for(let i=0;i<n;i++){record.fill(0);for(let k=0;k<5;k++){const a=g.attributes[FOREST_MOTION_ATTRIBUTES[k]];for(let c=0;c<a.itemSize;c++)record[k*4+c]=(a.array as Uint16Array)[i*a.itemSize+c]}const key=String.fromCharCode(...record);let at=keys.get(key);if(at===undefined){at=records.length;keys.set(key,at);records.push(Array.from(record))}index[i]=at}g.setAttribute('forestJointIndex',new THREE.BufferAttribute(index,1))}
 const height=Math.ceil(records.length*5/width),pixels=new Uint16Array(width*height*4);for(let i=0;i<records.length;i++)pixels.set(records[i],i*20);
 const texture=new THREE.DataTexture(pixels,width,height,THREE.RGBAIntegerFormat,THREE.UnsignedShortType);texture.internalFormat='RGBA16UI';texture.minFilter=texture.magFilter=THREE.NearestFilter;texture.needsUpdate=true;texture.name='Shared quantized branch pivots';return {texture,bytes:pixels.byteLength,vertices:count,records:records.length};
}
export function createForestLife(center:THREE.Vector3,models:Map<string,any>){
 const joints=createForestJointAtlas(models);
 const field=createForestWindField({origin:[center.x-1100,center.z-1100]}),pixels=new Uint16Array(field.data.length),texture=new THREE.DataTexture(pixels,field.size,field.size*2,THREE.RGBAFormat,THREE.HalfFloatType);texture.name='M11-driven damped forest responses';texture.minFilter=texture.magFilter=THREE.LinearFilter;
 const uniforms={forestJoints:{value:joints.texture},forestWindField:{value:texture},forestWindRect:{value:new THREE.Vector4(...field.origin,field.extent,field.size)},forestDay:{value:172}};
 return {uniforms,texture,field,joints,update(date:string|Date|undefined,latitude=46){uniforms.forestDay.value=forestDay(date,latitude);if(field.update(lifeUniforms.lifeTime.value,lifeUniforms.lifeMeanWind.value)){for(let i=0;i<pixels.length;i++)pixels[i]=THREE.DataUtils.toHalfFloat(field.data[i]);texture.needsUpdate=true}},dispose(){texture.dispose();joints.texture.dispose()}};
}

// @ts-ignore Pure typed-array mip generation, shared by workshop and world.
import {forestAtlasMipmaps} from './forest-lod.mjs';
export function createForestAtlasTexture(pixels:any){const t=new THREE.DataTexture(pixels.data,pixels.width,pixels.height);t.mipmaps=forestAtlasMipmaps(pixels);t.generateMipmaps=false;t.minFilter=THREE.LinearMipmapLinearFilter;t.magFilter=THREE.LinearFilter;t.needsUpdate=true;return t}
