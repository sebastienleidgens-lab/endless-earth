// @ts-ignore Shared persistent rain/dew state.
import {sensitiveUniforms} from '../earthlife/sensitive-state.mjs';
// @ts-ignore Shared deterministic window schedule.
import {windowFragment} from './windows.mjs';
import {worldMaterialUniforms,worldMaterialPrelude,worldArchitectureColor,registerWorldMaterial} from '../materials/world';
// @ts-ignore Shared artistic contract, static shader literals.
import {ART_DNA,glsl} from '../art/dna.mjs';
import * as THREE from 'three';
// @ts-ignore Shared original offline texture model.
import {createArchitectureAtlas,ARCHITECTURE_ATLAS_VERSION} from './texture.mjs';
// @ts-ignore Existing scene-wide climate and bounded shader capabilities.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
const fallback=createArchitectureAtlas(16,2);
export const architectureAtlas=new THREE.DataTexture(fallback.data,fallback.width,fallback.height);
architectureAtlas.name='Original regional architecture atlas';architectureAtlas.generateMipmaps=true;
architectureAtlas.minFilter=THREE.LinearMipmapLinearFilter;architectureAtlas.magFilter=THREE.LinearFilter;architectureAtlas.needsUpdate=true;
const size={value:new THREE.Vector2(fallback.width,fallback.height)},tile={value:new THREE.Vector2(16,2)};
let loading:Promise<boolean>|null=null;
export function loadArchitectureAtlas(){
 return loading??=(async()=>{try{
  const base=import.meta.env.BASE_URL+'materials/architecture/',r=await fetch(base+'catalog.json');if(!r.ok)throw Error('Architecture catalog missing');const m=await r.json();
  if(m.schema!==ARCHITECTURE_ATLAS_VERSION||m.width!==864||m.height!==576||m.tile!==256||m.gutter!==16)throw Error('Invalid architecture atlas');
  const response=await fetch(base+'atlas.png');if(!response.ok)throw Error('Architecture atlas missing');const bytes=await response.arrayBuffer();
  const hash=async(b:BufferSource)=>Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',b))).map(x=>x.toString(16).padStart(2,'0')).join('');
  if(bytes.byteLength>1500000||await hash(bytes)!==m.sha256)throw Error('Architecture atlas checksum');
  const bitmap=await createImageBitmap(new Blob([bytes],{type:'image/png'}),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
  try{if(bitmap.width!==864||bitmap.height!==576)throw Error('Architecture image dimensions');const canvas=new OffscreenCanvas(864,576),context=canvas.getContext('2d')!;context.drawImage(bitmap,0,0);const pixels=new Uint8Array(context.getImageData(0,0,864,576).data);if(await hash(pixels)!==m.rawSha256)throw Error('Architecture decoded pixels');
   architectureAtlas.image={data:pixels,width:864,height:576};size.value.set(864,576);tile.value.set(256,16);architectureAtlas.needsUpdate=true;
  }finally{bitmap.close()}
  return true;
 }catch(error){console.warn('Architecture atlas unavailable; deterministic compact material fallback retained',error);return false}})();
}
const prelude=`uniform float worldWet,worldDew;uniform vec2 architectureAtlasSize,architectureTile;varying float vArchitectureMaterial;varying vec2 m13WallUV;
vec4 architectureSample(vec2 uv,float kind){vec2 cell=vec2(mod(kind,3.),floor(kind/3.));vec2 scale=architectureTile.xx/architectureAtlasSize;return textureGrad(map,(cell*(architectureTile.x+architectureTile.y*2.)+fract(uv)*architectureTile.x+architectureTile.y)/architectureAtlasSize,dFdx(uv)*scale,dFdy(uv)*scale);}
vec3 architectureBump(vec3 n,vec3 eye,float h){vec3 dx=dFdx(eye),dy=dFdy(eye),a=cross(dy,n),b=cross(n,dx);float d=dot(dx,a);return normalize(abs(d)*n-sign(d)*(dFdx(h)*a+dFdy(h)*b));}
`;
export function architectureMaterial(heritage=false){
 const art=ART_DNA.architecture;
 const m=new THREE.MeshLambertMaterial({vertexColors:!heritage,color:heritage?0xc7bda5:0xffffff,map:architectureAtlas,side:heritage?THREE.FrontSide:THREE.DoubleSide});m.userData.architectureShared=true;(m as any).defaultAttributeValues={...(m as any).defaultAttributeValues,windowSeed:[1]};
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,sensitiveUniforms,worldMaterialUniforms,lifeUniforms,{architectureAtlasSize:size,architectureTile:tile});
  s.vertexShader='attribute float windowSeed;varying float vWindowSeed;\n'+s.vertexShader;
  s.vertexShader=(heritage?'varying vec2 vHeritageUV;':'attribute float architectureMaterial;')+'varying float vArchitectureMaterial;varying vec2 m13WallUV;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>\nvWindowSeed=windowSeed;vec3 m13P=(modelMatrix*vec4(position,1.)).xyz;vec3 m13N=normalize(mat3(modelMatrix)*normal);m13WallUV=vec2(dot(m13P.xz,normalize(vec2(m13N.z,-m13N.x)+vec2(1e-8))),m13P.y);\n${heritage?'vArchitectureMaterial=0.;vec3 heritageP=(modelMatrix*vec4(position,1.)).xyz;vHeritageUV=vec2(abs(normal.x)>abs(normal.z)?heritageP.z:heritageP.x,heritageP.y)/vec2(4.,2.4);':'vArchitectureMaterial=architectureMaterial;'}`);
  // map is declared by Three's map_pars_fragment, before our sampling functions.
  s.fragmentShader=s.fragmentShader.replace('#include <map_pars_fragment>','#include <map_pars_fragment>\n'+prelude+worldMaterialPrelude+windowFragment+(heritage?'varying vec2 vHeritageUV;':''));
  s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`
   float architectureHeight=0.;float architectureSource=floor(vArchitectureMaterial+.5);float architectureKind=architectureSource>7.5?0.:architectureSource;
   float architectureFade=1.-smoothstep(${glsl(art.detailM[0])},${glsl(art.detailM[1])},length(vViewPosition));
   vec2 m13ArchitectureUV=${heritage?'vHeritageUV':'vMapUv'};
   ${worldArchitectureColor}
   if(architectureKind<5.5&&architectureFade>.001){
    vec4 art=architectureSample(${heritage?'vHeritageUV':'vMapUv'},architectureKind);
    diffuseColor.rgb*=mix(vec3(${glsl(art.meanTone)}),vec3(${glsl(art.toneFloor)}+art.r*${glsl(art.toneRange)}),architectureFade)*(vec3(1.)+vec3(.06,0.,-.045)*(art.b-.5));
    #if LIFE_ARCH_DETAIL == 1
    float relief=architectureKind<.5?${glsl(art.stoneRelief)}:architectureKind<1.5?${glsl(art.plasterRelief)}:architectureKind<2.5?${glsl(art.tileRelief)}:architectureKind<3.5?${glsl(art.slateRelief)}:${glsl(art.woodRelief)};
    architectureHeight=(art.g-.5)*relief*(1.-smoothstep(12.,85.,length(vViewPosition)));
    #endif
   }
   else if(architectureKind<5.5)diffuseColor.rgb*=${glsl(art.meanTone)};
   // Porous materials remain damp after showers; roofs dry with the shared state.
   float wallBase=1.-smoothstep(.03,.22,abs(sin(m13WallUV.y*.17+m13WallUV.x*.09)));
   float wetSurface=worldWet*(architectureKind<1.5?.10:architectureKind<3.5?.16:.04);
   diffuseColor.rgb*=1.-wetSurface-worldDew*.035;
   if(architectureKind<1.5&&architectureFade>.01){float patina=sin(m13WallUV.x*1.7+sin(m13WallUV.y*3.1))*sin(m13WallUV.y*2.3);diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(.84,.91,.80),wallBase*max(0.,patina)*(.12+worldWet*.12)*architectureFade);}
  `);
  s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n#if LIFE_ARCH_DETAIL == 1\nif(architectureKind<5.5)normal=architectureBump(normal,-vViewPosition,architectureHeight);\n#endif');
  s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`if(architectureKind>6.5){float viewAngle=1.-abs(dot(normal,normalize(vViewPosition)));outgoingLight=mix(outgoingLight,lifeHorizon*.28+diffuseColor.rgb*.15,.35+viewAngle*.35)+vec3(.85,.39,.115)*warmWindow();}\n#include <opaque_fragment>`);
 };
 m.userData.snowGlass=true;
 m.customProgramCacheKey=()=> 'regional-architecture-weather-v20-'+heritage;registerWorldMaterial(m);cloudReceiver(m,{architecture:true});return m;
}
export const architectureMaterials={stone:architectureMaterial(),plaster:architectureMaterial(),tile:architectureMaterial(),plain:architectureMaterial()};
export const heritageMaterial=architectureMaterial(true);
