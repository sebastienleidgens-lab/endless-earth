import {riverUniforms} from '../earthlife/river-flow';
import {worldMaterialUniforms,registerWorldMaterial} from '../materials/world';
// @ts-ignore Shared artistic contract.
import {ART_DNA} from '../art/dna.mjs';
// @ts-ignore Shared shader module.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Shared shader module.
import {waterPrelude,waterColor,applyWaterLighting} from '../earthlife/water.mjs';
import {roadUniforms,roadShaderPrelude,roadColorShader,roadNormalShader,type RoadEdges} from '../world/road-material';
import {surfacePrelude,surfaceColorFor,surfaceNormalShader,type SurfaceAppearance} from '../world/surface-material';
import * as THREE from 'three';
export const environmentalTime={value:0},environmentalWind={value:.35};
// Shared original 64² noise atlas: fixed CPU generation, mipmapped on the GPU.
const pixels=new Uint8Array(64*64*4);
for(let z=0;z<64;z++)for(let x=0;x<64;x++){const i=(z*64+x)*4,n=Math.sin(x*127.1+z*311.7)*43758.5453;pixels[i]=Math.floor((n-Math.floor(n))*255);pixels[i+1]=Math.floor(128+Math.sin(x*.37+Math.sin(z*.23))*40+Math.cos(z*.31-x*.12)*30);pixels[i+2]=pixels[i];pixels[i+3]=255;}
const soilTexture=new THREE.DataTexture(pixels,64,64);soilTexture.wrapS=soilTexture.wrapT=THREE.RepeatWrapping;soilTexture.minFilter=THREE.LinearMipmapLinearFilter;soilTexture.magFilter=THREE.LinearFilter;soilTexture.generateMipmaps=true;soilTexture.needsUpdate=true;
export function groundDetail(material:THREE.MeshLambertMaterial,roads=false,edges:RoadEdges|null=null,water=false,appearance:SurfaceAppearance|null=null,groundArt=ART_DNA.surfaces){
 const art=roads&&!!appearance;
 material.onBeforeCompile=s=>{
  s.uniforms.natureSoil={value:soilTexture};Object.assign(s.uniforms,riverUniforms,lifeUniforms,worldMaterialUniforms);
  if(water){s.uniforms.natureTime=environmentalTime;s.uniforms.natureWind=environmentalWind;}
  if(roads){Object.assign(s.uniforms,roadUniforms);if(edges){
   s.uniforms.roadEdges={value:edges.texture};s.uniforms.roadEdgeOrigin={value:new THREE.Vector2(...edges.manifest.origin)};
   s.uniforms.roadEdgeExtent={value:new THREE.Vector2(...edges.manifest.extent)};s.uniforms.roadEdgeRange={value:edges.manifest.range};
  }}
  if(art){s.uniforms.surfaceAtlas={value:appearance!.atlas};s.uniforms.surfaceField={value:appearance!.field};s.uniforms.surfaceOrigin={value:new THREE.Vector2(...appearance!.manifest.origin)};s.uniforms.surfaceExtent={value:new THREE.Vector2(...appearance!.manifest.extent)};}
  s.vertexShader=(roads?'attribute float earthRoad; varying float earthRoadType;\n':'')+'varying vec3 naturePosition;\n'+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nnaturePosition=position;'+(roads?'earthRoadType=earthRoad;':''));
  if(art){s.vertexShader='varying vec3 surfaceNormal;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('naturePosition=position;','naturePosition=position;surfaceNormal=normalize(mat3(modelMatrix)*normal);');}
  if(water){s.vertexShader='attribute float earthWater;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('earthRoadType=earthRoad;','earthRoadType=earthWater>.5?7.:earthRoad;');}
  s.fragmentShader=(roads?'varying float earthRoadType;\n'+roadShaderPrelude+(edges?'#define ROAD_EDGES\nuniform sampler2D roadEdges;uniform vec2 roadEdgeOrigin;uniform vec2 roadEdgeExtent;uniform float roadEdgeRange;\n':''):'')+'uniform sampler2D natureSoil; varying vec3 naturePosition;\n'+s.fragmentShader;
  if(water)s.fragmentShader=waterPrelude+s.fragmentShader;
  if(art)s.fragmentShader=surfacePrelude+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   vec2 p=naturePosition.xz;
   float artHeight=0.;float artDetail=0.;float waterShore=16.;
   ${art?`vec4 surfaceClass=vec4(0.,0.,0.,1.);
   if(earthRoadType<.5)surfaceClass=texture2D(surfaceField,(p-surfaceOrigin)/surfaceExtent);
   #ifdef LIFE_WATER_MODE
   #if LIFE_WATER_MODE == 2
   else if(earthRoadType>6.5)surfaceClass=texture2D(surfaceField,(p-surfaceOrigin)/surfaceExtent);
   #endif
   #endif
   waterShore=surfaceClass.a*16.;`:''}
   ${water?`float mineralHeight=0.;float mineralDetail=0.;
   if(earthRoadType>6.5){
    ${waterColor('naturePosition','waterShore')}
   }else{`:''}
   vec4 soilA=texture2D(natureSoil,p*.017);
   vec4 soilB=soilA;
   ${art?'':'soilB=texture2D(natureSoil,mat2(.8,.6,-.6,.8)*p*.0113+vec2(.37,.13));'}
   float groundPatch=(soilA.g+soilB.g)*.5-.5;
   float groundMineral=(soilA.r+soilB.r)*.5-.5;
   float nearDetail=1.0-smoothstep(8.0,65.0,length(vViewPosition));
   float grain=0.0; ${art?'':`if(nearDetail>.001${roads?'&&earthRoadType<.5':''})grain=texture2D(natureSoil,p*1.7).r-.5;`}
   diffuseColor.rgb *= .98+groundPatch*mix(.17,.42,nearDetail)+groundMineral*.08*nearDetail+grain*.13*nearDetail;
   ${art?surfaceColorFor(groundArt):''}
   ${roads?(water?roadColorShader.replace('float mineralHeight=0.;','').replace('float mineralDetail=0.;',''):roadColorShader):''}
   ${water?'}':''}`);
  if(roads)s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>','#include <normal_fragment_maps>\n'+roadNormalShader+(art?surfaceNormalShader:''));
  if(water)applyWaterLighting(s);
 };
 material.customProgramCacheKey=()=> roads?'nature-ground-landscape-v12-'+!!edges+'-'+water+'-'+art+'-'+groundArt.id:'nature-ground-atlas-v5';
 material.userData.snowIntegratedWater=roads&&water;
 if(roads)registerWorldMaterial(material);cloudReceiver(material,{water,surface:art});
}
export function waterMaterial(){
 const material=new THREE.MeshLambertMaterial({color:0x608884,side:THREE.DoubleSide});material.userData.natureShared=true;material.userData.snowExcluded=true;
 material.onBeforeCompile=s=>{Object.assign(s.uniforms,riverUniforms,lifeUniforms);s.vertexShader='varying vec3 waterPosition;\n'+s.vertexShader;s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\nwaterPosition=(modelMatrix*vec4(position,1.)).xyz;');s.fragmentShader=waterPrelude+'varying vec3 waterPosition;\n'+s.fragmentShader;s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>','#include <color_fragment>\n'+waterColor('waterPosition'));applyWaterLighting(s)};
 material.customProgramCacheKey=()=> 'earthlife-river-sky-v12';cloudReceiver(material,{water:true});return material;
}
