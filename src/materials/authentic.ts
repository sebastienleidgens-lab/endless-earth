// Standalone 13B material library. Main game integration requires 13C approval.
import * as THREE from 'three';
// @ts-ignore Pure identity/metric contract shared with Node.
import {validateAuthenticCatalogue,authenticIdentity} from './authentic-model.mjs';
// @ts-ignore Existing artistic contract and scene-wide weather, not a second system.
import {ART_DNA} from '../art/dna.mjs';
// @ts-ignore Existing specialization / shared weather uniforms.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
export type AuthenticApproach='photographic'|'hybrid';
export type AuthenticEntry={id:string;label:string;family:string;slot:number;metres:[number,number];palette:string;reliefM:number;proceduralKind:number;proceduralMetres:[number,number];scaleStatus:string};
type TextureFile={file:string;sha256:string;bytes:number;gpuChannels:number};
export type AuthenticCatalogue={entries:AuthenticEntry[];files:TextureFile[];dimensions:[number,number]};
const sha=async(b:ArrayBuffer)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(v=>v.toString(16).padStart(2,'0')).join('');
export async function loadAuthenticLibrary(approach:AuthenticApproach){
 const base=import.meta.env.BASE_URL+'materials/authentic/';
 const response=await fetch(base+'catalog.json');if(!response.ok)throw Error('Authentic catalogue unavailable');
 const catalog:AuthenticCatalogue=validateAuthenticCatalogue(await response.json()),textures=new Map<string,THREE.Texture>(),materials=new Set<THREE.Material>();
 const dispose=()=>{materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());materials.clear();textures.clear()};
 try{
  for(const name of approach==='hybrid'?['hybrid.png']:['photographic-color.jpg','photographic-data.png']){
   const f=catalog.files.find(f=>f.file===name)!,r=await fetch(base+name);if(!r.ok)throw Error('Authentic texture unavailable: '+name);
   const bytes=await r.arrayBuffer();if(bytes.byteLength!==f.bytes||await sha(bytes)!==f.sha256)throw Error('Authentic texture checksum: '+name);
   const bitmap=await createImageBitmap(new Blob([bytes]),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
   try{
    if(bitmap.width!==1152||bitmap.height!==864)throw Error('Authentic texture dimensions');
    const canvas=new OffscreenCanvas(1152,864),ctx=canvas.getContext('2d')!;ctx.drawImage(bitmap,0,0);const rgba=ctx.getImageData(0,0,1152,864).data;
    let data:Uint8Array,format:THREE.PixelFormat=THREE.RGBAFormat;
    if(f.gpuChannels===2){data=new Uint8Array(1152*864*2);for(let i=0;i<1152*864;i++){data[i*2]=rgba[i*4];data[i*2+1]=rgba[i*4+1]}format=THREE.RGFormat}else data=new Uint8Array(rgba);
    const texture=new THREE.DataTexture(data,1152,864,format);texture.colorSpace=name.endsWith('.jpg')?THREE.SRGBColorSpace:THREE.NoColorSpace;texture.name=name;
    texture.flipY=false;texture.generateMipmaps=true;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;textures.set(name,texture);
   }finally{bitmap.close()}
  }
 }catch(error){dispose();throw error}
 return {catalog,textures,dispose,create(entry:AuthenticEntry,objectId=entry.id){
  const identity=authenticIdentity(entry.id,objectId),hybrid=approach==='hybrid',detail=entry.family==='wall'||entry.family==='roof'?ART_DNA.architecture.detailM:ART_DNA.surfaces.detailM;
  const map=textures.get(hybrid?'hybrid.png':'photographic-color.jpg')!;
  const m=hybrid?new THREE.MeshLambertMaterial({map,color:entry.palette,side:THREE.DoubleSide}):new THREE.MeshStandardMaterial({map,roughness:1,metalness:0,side:THREE.DoubleSide});
  m.onBeforeCompile=s=>{
   Object.assign(s.uniforms,lifeUniforms,{authenticData:{value:textures.get('photographic-data.png')??map},authenticCell:{value:new THREE.Vector2(entry.slot%4,Math.floor(entry.slot/4))},authenticMetres:{value:new THREE.Vector2(...entry.metres)},authenticOffset:{value:new THREE.Vector2(...identity.offset)},authenticRelief:{value:entry.reliefM},authenticPhase:{value:identity.macroPhase}});
   const prelude=`uniform sampler2D authenticData;uniform vec2 authenticCell,authenticMetres,authenticOffset;uniform float authenticRelief,authenticPhase;
   varying vec2 authenticWorld;
   vec4 authenticSample(sampler2D tex,vec2 uv){vec2 d=vec2(256./1152.,256./864.);return textureGrad(tex,(authenticCell*288.+16.+fract(uv)*256.)/vec2(1152.,864.),dFdx(uv)*d,dFdy(uv)*d);}
   vec3 authenticBump(vec3 n,vec3 eye,float h){vec3 dx=dFdx(eye),dy=dFdy(eye),a=cross(dy,n),b=cross(n,dx);float det=dot(dx,a);return normalize(abs(det)*n-sign(det)*(dFdx(h)*a+dFdy(h)*b));}
   float authenticMacro(vec2 p){return (sin(p.x*.19+authenticPhase*6.283)*sin(p.y*.14+.7)+sin(p.x*.073-p.y*.093+1.1))*.5;}`;
   s.vertexShader='varying vec2 authenticWorld;\n'+s.vertexShader;
   s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nauthenticWorld=uv;');
   s.fragmentShader=s.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\n'+prelude);
   s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
    vec2 authenticUV=vMapUv/authenticMetres${hybrid?'+authenticOffset':''};
    float authenticFade=1.-smoothstep(${detail[0]}.,${detail[1]}.,length(vViewPosition));
    vec4 authenticPack=vec4(.5,.5,.5,.9);float authenticHeight=0.;
    ${hybrid?`if(authenticFade>.001)authenticPack=authenticSample(map,authenticUV);
    vec3 authenticTone=vec3(${ART_DNA.architecture.toneFloor}+authenticPack.r*${ART_DNA.architecture.toneRange})*(vec3(1.)+vec3(.06,0.,-.045)*(authenticPack.b-.5));
    diffuseColor.rgb*=mix(vec3(${ART_DNA.architecture.meanTone}),authenticTone,authenticFade)*(1.+authenticMacro(authenticWorld)*.045);
    authenticHeight=(authenticPack.g-.5)*authenticRelief*authenticFade;`:`
    vec4 authenticColor=authenticSample(map,authenticUV);diffuseColor*=authenticColor;
    authenticPack=authenticSample(authenticData,authenticUV);
    authenticHeight=(authenticPack.r-.5)*authenticRelief;`}
    diffuseColor.rgb*=1.-lifeRain*.035;
   `);
   if(!hybrid)s.fragmentShader=s.fragmentShader.replace('#include <roughnessmap_fragment>','float roughnessFactor=clamp(authenticPack.g-lifeRain*.10,.45,.98);');
   s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#if LIFE_ARCH_DETAIL == 1\nnormal=authenticBump(normal,-vViewPosition,authenticHeight);\n#endif');
  };
  m.customProgramCacheKey=()=>`authentic-13B-${approach}`;
  cloudReceiver(m,{architecture:true});materials.add(m);
  m.userData.authentic={id:entry.id,objectId,identity,metres:entry.metres,approach};return m;
 }};
}
export function filterAuthenticLibrary(library:{textures:Map<string,THREE.Texture>},renderer:THREE.WebGLRenderer,eco=false){
 for(const t of library.textures.values()){const n=Math.min(eco?1:4,renderer.capabilities.getMaxAnisotropy());if(t.anisotropy!==n){t.anisotropy=n;t.needsUpdate=true}}
}
