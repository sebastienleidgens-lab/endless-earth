import * as THREE from 'three';
// @ts-ignore Pure versioned format shared with offline verification.
import {validateFranceCatalogue,frenchRegion} from './france-model.mjs';
type Entry={id:string;slot:number;metres:[number,number];reliefM:number};
type Descriptor={id:string;file:string;sha256:string;bytes:number;dimensions:[number,number];gpuBytesWithMipmapsEstimate:number;entries:Entry[]};
type Catalogue={packs:Descriptor[]};
type Pack={descriptor:Descriptor;texture:THREE.DataTexture};
const cache=new Map<string,Pack>();
let catalogue:Promise<Catalogue>|null=null,downloads=0,downloadBytes=0;
const digest=async(b:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(v=>v.toString(16).padStart(2,'0')).join('');
function manifest():Promise<Catalogue>{return catalogue??=(async()=>{
  try{const r=await fetch(import.meta.env.BASE_URL+'materials/france/catalog.json',{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('French catalogue unavailable');return validateFranceCatalogue(await r.json()) as Catalogue}
 catch(error){catalogue=null;throw error}
})()}
export async function loadFrenchPack(region:string,signal:AbortSignal){
 frenchRegion(region);
 const hit=cache.get(region);if(hit){cache.delete(region);cache.set(region,hit);return hit}
 const c=await manifest();signal.throwIfAborted();const descriptor=c.packs.find(p=>p.id===region)!;
 const response=await fetch(import.meta.env.BASE_URL+'materials/france/'+descriptor.file,{signal});if(!response.ok)throw Error('French pack unavailable');
 const bytes=await response.arrayBuffer();if(bytes.byteLength!==descriptor.bytes||await digest(bytes)!==descriptor.sha256)throw Error('French pack checksum');
 const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
 let texture:THREE.DataTexture|null=null;
 try{
  const [w,h]=descriptor.dimensions;if(bitmap.width!==w||bitmap.height!==h)throw Error('French pack dimensions');
  const canvas=new OffscreenCanvas(w,h),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);const rgba=ctx.getImageData(0,0,w,h).data,data=new Uint8Array(w*h*2);
  for(let i=0;i<w*h;i++){data[i*2]=rgba[i*4];data[i*2+1]=rgba[i*4+1]}
  texture=new THREE.DataTexture(data,w,h,THREE.RGFormat);texture.name='French context / '+region;texture.flipY=false;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
  signal.throwIfAborted();const pack={descriptor,texture};cache.set(region,pack);downloads++;downloadBytes+=bytes.byteLength;
  // One active context and at most one previously used context. Never all France.
  while(cache.size>2){const id=cache.keys().next().value!;cache.get(id)!.texture.dispose();cache.delete(id)}
  return pack;
 }catch(error){texture?.dispose();throw error}finally{bitmap.close()}
}
export function filterFrenchPacks(renderer:THREE.WebGLRenderer,eco:boolean){for(const {texture} of cache.values()){const n=Math.min(eco?1:2,renderer.capabilities.getMaxAnisotropy());if(texture.anisotropy!==n){texture.anisotropy=n;texture.needsUpdate=true}}}
export function frenchPackStatus(){return {resident:cache.size,regions:[...cache.keys()],gpuBytesEstimate:[...cache.values()].reduce((n,p)=>n+p.descriptor.gpuBytesWithMipmapsEstimate,0),downloads,downloadBytes}}
export function disposeFrenchPacks(){for(const p of cache.values())p.texture.dispose();cache.clear();catalogue=null;downloads=0;downloadBytes=0}
