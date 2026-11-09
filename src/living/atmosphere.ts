import * as THREE from 'three';
import {environmentalWind} from '../nature/surfaces';
export const windUniform={value:0};
export const seasonUniform={value:0};
export function animateFoliage(material:THREE.MeshLambertMaterial,season=false,grounded=false){
 material.onBeforeCompile=shader=>{
  shader.uniforms.livingTime=windUniform;shader.uniforms.natureWind=environmentalWind;shader.uniforms.natureSeason=seasonUniform;
  shader.vertexShader=(grounded?'attribute float natureBend;\n':'')+'uniform float livingTime; uniform float natureWind;\n'+shader.vertexShader;
  shader.vertexShader=shader.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
    float phase=0.0;
    #ifdef USE_INSTANCING
    phase=instanceMatrix[3].x*.17+instanceMatrix[3].z*.13;
    #endif
    transformed.x += sin(livingTime*.8+phase+position.y*.7)*.035*max(0.0,position.y+.5)*natureWind;
    transformed.z += sin(livingTime*.53+phase+position.x)*.025*max(0.0,position.y+.5)*natureWind;`);
  if(grounded)shader.vertexShader=shader.vertexShader.replaceAll('max(0.0,position.y+.5)','natureBend');
  if(season){shader.fragmentShader='uniform float natureSeason;\n'+shader.fragmentShader;shader.fragmentShader=shader.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.32,.86,.48),natureSeason);`)}
 };
 material.customProgramCacheKey=()=> 'living-foliage-v3-'+season+'-'+grounded;
}
