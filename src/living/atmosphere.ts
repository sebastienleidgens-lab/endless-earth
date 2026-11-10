import * as THREE from 'three';
import {environmentalWind} from '../nature/surfaces';
// @ts-ignore Shared shader module.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Pure GPU carrier shared with deterministic CPU wind.
import {windGLSL} from '../earthlife/wind.mjs';
export const windUniform={value:0};
export const seasonUniform={value:0};
export function animateFoliage(material:THREE.MeshLambertMaterial,season=false,grounded=false,stationary=false,trunk=false){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,lifeUniforms);shader.uniforms.livingTime=windUniform;shader.uniforms.natureWind=environmentalWind;shader.uniforms.natureSeason=seasonUniform;
  shader.vertexShader=(grounded?'attribute float natureBend;\n':'')+'uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    if(lifeVegetation>0.${stationary||trunk?'&&lifeFine>.01':''}){
    vec4 anchor=vec4(position,1.);
    #ifdef USE_INSTANCING
    anchor=instanceMatrix*vec4(0.,0.,0.,1.);
    #endif
    vec2 worldAnchor=(modelMatrix*anchor).xz;
    vec2 wind=vec2(.88,-.475)*lifeMeanWind;
    float phase=worldAnchor.x*.17+worldAnchor.y*.13;
    float inertia=${grounded?'(1.7-step(.04,color.g-color.r))':trunk?'.43':stationary?'.45':'.72'};
    float sway=sin(lifeTime*inertia+phase);
    ${stationary?'':`if(lifeFine>.01){wind=lifeWind(worldAnchor,lifeTime,lifeMeanWind);sway=sway*.65+sin(lifeTime*inertia*.53+phase*.73)*.35;}`}
    float bend=${grounded?'natureBend':trunk?'pow(clamp((position.y+2.25)/4.5,0.,1.),2.)*.025':'(.10+clamp((position.y+2.4)/5.1,0.,1.)*.16)'};
    float fine=${stationary||trunk?'0.':'sin(lifeTime*2.3+phase+position.x*1.7+position.z)*lifeFine*.08'};
    #ifdef USE_INSTANCING
    wind=lifeInstanceWind(wind,(modelMatrix*instanceMatrix[0]).xz,(modelMatrix*instanceMatrix[2]).xz);
    #endif
    transformed.xz+=wind*bend*(sway+fine)*lifeVegetation*${grounded?'1.1':'1.'};
    }`);
  if(season){shader.fragmentShader='uniform float natureSeason;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.32,.86,.48),natureSeason);`)}
 };
 material.customProgramCacheKey=()=> 'living-foliage-v5-'+season+'-'+grounded+'-'+stationary+'-'+trunk;
 cloudReceiver(material);
}
