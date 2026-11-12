// One shared, bounded library for the pilot. No per-building textures or geometry.
import * as THREE from 'three';
import {loadAuthenticLibrary,filterAuthenticLibrary} from './authentic';
import {loadFrenchPack,filterFrenchPacks,frenchPackStatus,disposeFrenchPacks} from './france';
// @ts-ignore Pure appearance policy, used by Node verification.
import {worldMaterialMode} from './world-policy.mjs';
const empty=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);empty.needsUpdate=true;
export const worldMaterialUniforms={m13Mode:{value:0},m13Data:{value:empty as THREE.Texture},m13Photo:{value:empty as THREE.Texture},m13AtlasInvSize:{value:new THREE.Vector2(1/432,1/288)},m13Scale:{value:new THREE.Vector4(2,2.3,1.5,2.7)},m13Relief:{value:new THREE.Vector4(.009,.003,.014,.025)},m13GraniteScale:{value:1.9}};
let library:Awaited<ReturnType<typeof loadAuthenticLibrary>>|null=null,pending:Promise<void>|null=null;
let filteringEco=false,generation=0,controller:AbortController|null=null;
type WorldMaterial=THREE.Material&{defines?:Record<string,string|number|boolean>};
const owners=new Set<WorldMaterial>();
export function registerWorldMaterial(material:THREE.Material){
 const m=material as WorldMaterial;owners.add(m);m.defines??={};m.defines.M13_MODE=worldMaterialUniforms.m13Mode.value;
 material.addEventListener('dispose',()=>owners.delete(m));
}
function activate(mode:number){
 worldMaterialUniforms.m13Mode.value=mode;
 for(const m of owners){m.defines??={};if(m.defines.M13_MODE!==mode){m.defines.M13_MODE=mode;m.needsUpdate=true}}
}
let status={requested:'mission12',active:'mission12',state:'idle',bytes:0,textureCount:0,region:'poitou'};
export function worldMaterialStatus(){return {...status,cache:frenchPackStatus()}}
export function configureWorldFiltering(renderer:THREE.WebGLRenderer,eco=filteringEco){filteringEco=eco;filterFrenchPacks(renderer,eco);if(library)filterAuthenticLibrary(library,renderer,eco)}
export function initializeWorldMaterials(renderer:THREE.WebGLRenderer){return pending??=selectWorldRegion(renderer)}
export async function selectWorldRegion(renderer:THREE.WebGLRenderer,region='poitou'){
  controller?.abort();controller=new AbortController();
  const current=++generation;
  const mode=worldMaterialMode(new URLSearchParams(location.search).get('materials'));status.requested=mode;status.region=region;
  if(mode==='mission12'){status.state='ready';return}
  status.state='loading';
  try{
   const signal=AbortSignal.any([controller.signal,AbortSignal.timeout(15000)]);
   if(mode==='hybrid'){
    const pack=await loadFrenchPack(region,signal);if(current!==generation)return;
    library?.dispose();library=null;
    worldMaterialUniforms.m13Data.value=worldMaterialUniforms.m13Photo.value=pack.texture;
    worldMaterialUniforms.m13AtlasInvSize.value.set(1/pack.descriptor.dimensions[0],1/pack.descriptor.dimensions[1]);
    const e=pack.descriptor.entries;
    worldMaterialUniforms.m13Scale.value.set(e[0].metres[0],e[1].metres[0],e[2].metres[0],e[5].metres[0]);
    worldMaterialUniforms.m13Relief.value.set(e[0].reliefM,e[1].reliefM,e[2].reliefM,e[5].reliefM);
    worldMaterialUniforms.m13GraniteScale.value=e[6]?.metres[0]??1.9;
    activate(3);configureWorldFiltering(renderer);status={requested:mode,active:mode,state:'ready',bytes:pack.descriptor.bytes,textureCount:1,region};return;
   }
   const loaded=await loadAuthenticLibrary(mode,{signal});
   if(current!==generation){loaded.dispose();return}library?.dispose();library=loaded;
   worldMaterialUniforms.m13Data.value=library.textures.get('photographic-data.png')!;
   worldMaterialUniforms.m13Photo.value=library.textures.get('photographic-color.jpg')??worldMaterialUniforms.m13Data.value;
   activate(2);
   configureWorldFiltering(renderer);status={requested:mode,active:mode,state:'ready',bytes:library.catalog.files.filter(f=>library!.textures.has(f.file)).reduce((n,f)=>n+f.bytes,0),textureCount:library.textures.size,region};
  }catch(error){if(current!==generation)return;activate(0);status.active='mission12';status.state='fallback';status.bytes=0;status.textureCount=0;console.warn('Authentic materials unavailable; Mission 12 appearance retained',error)}
}
export function disposeWorldMaterials(){generation++;controller?.abort();controller=null;activate(0);worldMaterialUniforms.m13Data.value=empty;worldMaterialUniforms.m13Photo.value=empty;library?.dispose();library=null;disposeFrenchPacks();pending=null;status={requested:'mission12',active:'mission12',state:'idle',bytes:0,textureCount:0,region:'poitou'}}
export const worldMaterialPrelude=`
#if M13_MODE == 3
#define m13Mode 1.
#define m13RockScale m13Scale.w
#else
#define m13Mode float(M13_MODE)
#define m13RockScale 2.7
#endif
uniform sampler2D m13Data,m13Photo;
uniform vec2 m13AtlasInvSize;uniform vec4 m13Scale,m13Relief;uniform float m13GraniteScale;
vec4 m13Sample(sampler2D tex,vec2 uv,float slot){
 #if M13_MODE == 3
 vec2 cell=vec2(mod(slot,3.),floor(slot/3.));return vec4(textureGrad(tex,(cell*144.+8.+fract(uv)*128.)*m13AtlasInvSize,dFdx(uv)*128.*m13AtlasInvSize,dFdy(uv)*128.*m13AtlasInvSize).rg,.5,1.);
 #else
 vec2 cell=vec2(mod(slot,4.),floor(slot/4.));return textureGrad(tex,(cell*288.+16.+fract(uv)*256.)/vec2(1152.,864.),dFdx(uv)*vec2(256./1152.,256./864.),dFdy(uv)*vec2(256./1152.,256./864.));
 #endif
}
vec2 m13Grain(vec2 uv,float slot){
 #if M13_MODE == 3
 return m13Sample(m13Data,uv,slot<6.5?3.:slot<7.5?4.:5.).rg;
 #else
 vec4 a=m13Sample(m13Data,uv,slot);
 if(m13Mode<1.5)return a.rg;
 return vec2(clamp(dot(m13Sample(m13Photo,uv,slot).rgb,vec3(.2126,.7152,.0722))*1.8,0.,1.),a.r);
 #endif
}
`;
export const worldArchitectureColor=`
   if(m13Mode>.5&&architectureKind<2.5&&architectureFade>.001){
    vec2 metres=architectureKind<.5?vec2(2.):architectureKind<1.5?vec2(2.3):vec2(1.5);
    float slot=architectureKind<.5?0.:architectureKind<1.5?3.:4.;
    float relief=architectureKind<.5?.009:architectureKind<1.5?.003:.014;
    #if M13_MODE == 3
    slot=architectureKind;
    metres=vec2(architectureKind<.5?m13Scale.x:architectureKind<1.5?m13Scale.y:m13Scale.z);
    relief=architectureKind<.5?m13Relief.x:architectureKind<1.5?m13Relief.y:m13Relief.z;
    if(architectureSource>7.5){slot=6.;metres=vec2(m13GraniteScale);}
    #endif
    vec2 metricUV=architectureKind<1.5?m13WallUV:m13ArchitectureUV*4.;
    vec2 uv=metricUV/metres;
    vec4 packed=m13Sample(m13Data,uv,slot);
    if(m13Mode<1.5){
     vec3 tone=vec3(min(1.06,.78+packed.r*.36))*(vec3(1.)+vec3(.06,0.,-.045)*(packed.b-.5));
     float macro=sin(metricUV.x*.19+metricUV.y*.071)*sin(metricUV.y*.14+.7)*.035;
     diffuseColor.rgb*=mix(vec3(.88),tone,architectureFade)*(1.+macro*architectureFade);
     architectureHeight=(packed.g-.5)*relief;
    }else{
     diffuseColor.rgb=mix(diffuseColor.rgb*.88,m13Sample(m13Photo,uv,slot).rgb,architectureFade);
     architectureHeight=(packed.r-.5)*relief;
    }
    architectureHeight*=1.-smoothstep(12.,85.,length(vViewPosition));
   }else`;
