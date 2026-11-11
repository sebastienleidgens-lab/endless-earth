// One shared, bounded library for the pilot. No per-building textures or geometry.
import * as THREE from 'three';
import {loadAuthenticLibrary,filterAuthenticLibrary} from './authentic';
// @ts-ignore Pure appearance policy, used by Node verification.
import {worldMaterialMode} from './world-policy.mjs';
const empty=new THREE.DataTexture(new Uint8Array([128,128,128,255]),1,1);empty.needsUpdate=true;
export const worldMaterialUniforms={m13Mode:{value:0},m13Data:{value:empty as THREE.Texture},m13Photo:{value:empty as THREE.Texture}};
let library:Awaited<ReturnType<typeof loadAuthenticLibrary>>|null=null,pending:Promise<void>|null=null;
let filteringEco=false,generation=0;
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
let status={requested:'mission12',active:'mission12',state:'idle',bytes:0,textureCount:0};
export function worldMaterialStatus(){return {...status}}
export function configureWorldFiltering(renderer:THREE.WebGLRenderer,eco=filteringEco){filteringEco=eco;if(library)filterAuthenticLibrary(library,renderer,eco)}
export function initializeWorldMaterials(renderer:THREE.WebGLRenderer){
 return pending??=(async()=>{
  const current=++generation;
  const mode=worldMaterialMode(new URLSearchParams(location.search).get('materials'));status.requested=mode;
  if(mode==='mission12'){status.state='ready';return}
  status.state='loading';
  try{
   const loaded=await loadAuthenticLibrary(mode,{signal:AbortSignal.timeout(15000)});
   if(current!==generation){loaded.dispose();return}library=loaded;
   worldMaterialUniforms.m13Data.value=library.textures.get(mode==='hybrid'?'hybrid.png':'photographic-data.png')!;
   worldMaterialUniforms.m13Photo.value=library.textures.get('photographic-color.jpg')??worldMaterialUniforms.m13Data.value;
   activate(mode==='hybrid'?1:2);
   configureWorldFiltering(renderer);status={requested:mode,active:mode,state:'ready',bytes:library.catalog.files.filter(f=>library!.textures.has(f.file)).reduce((n,f)=>n+f.bytes,0),textureCount:library.textures.size};
  }catch(error){if(current!==generation)return;status.active='mission12';status.state='fallback';console.warn('Authentic materials unavailable; Mission 12 appearance retained',error)}
 })();
}
export function disposeWorldMaterials(){generation++;activate(0);worldMaterialUniforms.m13Data.value=empty;worldMaterialUniforms.m13Photo.value=empty;library?.dispose();library=null;pending=null;status={requested:'mission12',active:'mission12',state:'idle',bytes:0,textureCount:0}}
export const worldMaterialPrelude=`
#define m13Mode float(M13_MODE)
uniform sampler2D m13Data,m13Photo;
vec4 m13Sample(sampler2D tex,vec2 uv,float slot){vec2 cell=vec2(mod(slot,4.),floor(slot/4.));return textureGrad(tex,(cell*288.+16.+fract(uv)*256.)/vec2(1152.,864.),dFdx(uv)*vec2(256./1152.,256./864.),dFdy(uv)*vec2(256./1152.,256./864.));}
vec2 m13Grain(vec2 uv,float slot){
 vec4 a=m13Sample(m13Data,uv,slot);
 if(m13Mode<1.5)return a.rg;
 return vec2(clamp(dot(m13Sample(m13Photo,uv,slot).rgb,vec3(.2126,.7152,.0722))*1.8,0.,1.),a.r);
}
`;
export const worldArchitectureColor=`
   if(m13Mode>.5&&architectureKind<2.5&&architectureFade>.001){
    vec2 metres=architectureKind<.5?vec2(2.):architectureKind<1.5?vec2(2.3):vec2(1.5);
    float slot=architectureKind<.5?0.:architectureKind<1.5?3.:4.;
    vec2 metricUV=architectureKind<1.5?m13WallUV:m13ArchitectureUV*4.;
    vec2 uv=metricUV/metres;
    vec4 packed=m13Sample(m13Data,uv,slot);
    float relief=architectureKind<.5?.009:architectureKind<1.5?.003:.014;
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
