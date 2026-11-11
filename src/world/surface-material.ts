import * as THREE from 'three';
// @ts-ignore Provider-neutral source binding shared with offline tests.
import {validateSurfaceArt} from './surface-art.mjs';
export type SurfaceAppearance={field:THREE.Texture;atlas:THREE.Texture;manifest:any};
export function configureSurfaceFiltering(renderer:THREE.WebGLRenderer,appearance:SurfaceAppearance|null,detail=1){
 if(!appearance)return;const anisotropy=Math.min(detail===0?1:2,renderer.capabilities.getMaxAnisotropy());
 if(appearance.atlas.anisotropy!==anisotropy){appearance.atlas.anisotropy=anisotropy;appearance.atlas.needsUpdate=true;}
}
const digest=async(b:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(n=>n.toString(16).padStart(2,'0')).join('');
export async function fetchSurfaceAppearance(sources:Record<string,string|null>,origin:number[],extent:number[]):Promise<SurfaceAppearance|null>{
 const bitmaps:ImageBitmap[]=[],textures:THREE.Texture[]=[];
 try{
  const base=import.meta.env.BASE_URL+'materials/earth/',r=await fetch(base+'surface-art.json');if(!r.ok)throw Error('Appearance manifest unavailable');
  const manifest=validateSurfaceArt(await r.json(),sources);
  if(manifest.origin.some((v:number,i:number)=>v!==origin[i])||manifest.extent.some((v:number,i:number)=>v!==extent[i]))throw Error('Appearance chart mismatch');
  for(const [key,file,size] of [['field','surface-field.png',1024],['atlas','surface-atlas.png',576]] as const){
   const response=await fetch(base+file);if(!response.ok)throw Error('Appearance texture unavailable');const bytes=await response.arrayBuffer();
   if(bytes.byteLength>2*1024*1024||await digest(bytes)!==manifest.hashes[key])throw Error('Appearance checksum mismatch');
   const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});bitmaps.push(bitmap);
   if(bitmap.width!==size||bitmap.height!==size)throw Error('Appearance image dimensions');
   const texture=new THREE.Texture(bitmap);texture.name='earth-surface-'+key;texture.flipY=false;texture.generateMipmaps=true;
   texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;textures.push(texture);
  }
  return {field:textures[0],atlas:textures[1],manifest};
 }catch(error){textures.forEach(t=>t.dispose());bitmaps.forEach(b=>b.close());console.warn('Surface appearance unavailable; source terrain and existing mineral atlas retained',error);return null;}
}
export const surfacePrelude=`
uniform sampler2D surfaceAtlas,surfaceField;
uniform vec2 surfaceOrigin,surfaceExtent;
varying vec3 surfaceNormal;
vec2 surfaceSample(vec2 uv,vec2 quadrant){
 return textureGrad(surfaceAtlas,quadrant*.5+(fract(uv)*256.+16.)/576.,dFdx(uv)*(256./576.),dFdy(uv)*(256./576.)).rg;
}
`;
// No time dependency or LOD-dependent UVs. Only the contribution fades smoothly.
export const surfaceColor=`
if(earthRoadType<.5){
 vec3 n=normalize(surfaceNormal);
 float rock=max(surfaceClass.b,smoothstep(.124,.405,1.-abs(n.y))*(1.-surfaceClass.g*.45));
 float forest=surfaceClass.g*(1.-rock),grass=surfaceClass.r*(1.-rock);
 float detail=1.-smoothstep(18.,100.,length(vViewPosition));
 vec2 grain=vec2(.5);
 if(detail>.001){
  vec2 quadrant=forest>.5?vec2(0.,1.):grass>.5?vec2(1.,0.):vec2(0.);
  float metres=forest>.5?3.:grass>.5?4.:2.;
  vec2 materialUV=p/metres;
  #if LIFE_SURFACE_MODE == 2
  // Continuous world noise perturbs the repeat without a second texture read.
  materialUV+=vec2(groundPatch*.11,groundMineral*.012)*grass;
  #endif
  grain=surfaceSample(materialUV,quadrant);
 }
 float rockFade=1.-smoothstep(55.,260.,length(vViewPosition));
 vec2 stone=vec2(.5);
 if(rock*rockFade>.005){
  // Dominant world plane, with a narrow blended lateral seam in Quality.
  vec2 rockUV=abs(n.y)>.7?p:abs(n.x)>abs(n.z)?naturePosition.zy:naturePosition.xy;
  stone=surfaceSample(rockUV/27.,vec2(1.));
  #if LIFE_SURFACE_MODE == 2
  float seam=abs(abs(n.x)-abs(n.z));
  float blend=(1.-smoothstep(.0,.25,seam))*(1.-smoothstep(30.,65.,length(vViewPosition)))*.5;
  if(abs(n.y)<.7&&blend>.01){vec2 otherUV=abs(n.x)>abs(n.z)?naturePosition.xy:naturePosition.zy;stone=mix(stone,surfaceSample(otherUV/27.,vec2(1.)),blend);}
  #endif
 }
 vec3 mineral=vec3(.42,.395,.335)*(1.+groundPatch*.22+(stone.r-.5)*1.05*rockFade);
 diffuseColor.rgb=mix(diffuseColor.rgb,mineral,rock*.82);
 diffuseColor.rgb*=1.+(grain.r-.5)*.70*detail*(1.-rock)+groundPatch*.17;
 // Damp/mineral tint on the existing bank; no added strip mesh.
 float bank=(1.-smoothstep(.45,3.2+groundPatch*1.8,waterShore))*(1.-rock*.45);
 vec3 bankTone=mix(diffuseColor.rgb,vec3(.19,.18,.135)*(1.+groundPatch*.15),.42);
 diffuseColor.rgb=mix(diffuseColor.rgb,bankTone,bank);
 artHeight=(grain.g-.5)*(.006+forest*.004)*detail*(1.-rock)+(stone.g-.5)*.20*rock*rockFade;
 artDetail=max(detail,rock*rockFade);
}
`;
export const surfaceNormalShader=`
#if LIFE_SURFACE_MODE > 0
if(earthRoadType<.5&&artDetail>.001)normal=mineralNormal(normal,-vViewPosition,artHeight);
#endif
`;
