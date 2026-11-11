import * as THREE from 'three';
// @ts-ignore Shared Mission 11 climate and shader budgets.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Existing continuous wind, not a second simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Structural quality modes remain bounded.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';
export function natureArtMaterial(season:{value:THREE.Vector4},texture:THREE.Texture|null,grounded=false,far=false){
 const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,map:texture});
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,{natureCalendar:season});
  const attrs=grounded?'attribute float natureBend,natureKind;varying float vNatureKind;':'attribute vec4 natureTraits;attribute float natureCluster;attribute vec4 lifeBasis;attribute vec2 lifeAnchor;varying vec4 vNatureTraits;varying float vNatureCluster;';
  s.vertexShader=attrs+'uniform vec4 natureCalendar;uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   ${grounded?`vNatureKind=natureKind;
   float growing=1.;if(natureKind<1.5||natureKind>5.5)growing=.25+.75*natureCalendar.x;
   transformed.y-=natureBend*(1.-growing);
   vec2 worldAnchor=(modelMatrix*vec4(position,1.)).xz;
   float bend=natureBend*growing*.75;`:`vNatureTraits=natureTraits;vNatureCluster=natureCluster;
   transformed.x*=.84+.16*abs(sin(natureTraits.x*6.283));
   transformed.z*=.85+.15*abs(cos(natureTraits.x*6.283));
   vec2 worldAnchor=lifeAnchor;
   float bend=${far?'.18':'.20+clamp((position.y+2.4)/5.1,0.,1.)*.26'};`}
   #if LIFE_WIND_MODE > 0
   vec2 wind=lifeLocalWind;float phase=worldAnchor.x*.17+worldAnchor.y*.13;
   float sway=.25+sin(lifeTime*${grounded?'1.4':'.65'}+phase)*.75;
   #if LIFE_WIND_MODE == 2
   wind=lifeWind(worldAnchor,lifeTime,lifeMeanWind);
   sway=.25+sin(lifeTime*${grounded?'1.4':'.65'}+phase)*.5+sin(lifeTime*.37+phase*.73)*.25;
   ${!grounded&&!far?'sway+=sin(lifeTime*2.4+phase+natureCluster*19.)*lifeFine*.16;':''}
   #endif
   ${grounded?'':'wind=vec2(dot(lifeBasis.xy,wind),dot(lifeBasis.zw,wind));'}
   transformed.xz+=wind*bend*sway*lifeVegetation;
   #endif`);
  s.fragmentShader='uniform vec4 natureCalendar;'+(grounded?'varying float vNatureKind;':'varying vec4 vNatureTraits;varying float vNatureCluster;')+'\n'+s.fragmentShader;
  if(texture)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`if(vNatureTraits.z<.5){vec4 spray=texture2D(map,vMapUv);if(spray.a<.32)discard;diffuseColor.rgb*=spray.rgb;}`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${grounded?`if(vNatureKind<1.5||vNatureKind>5.5){diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.16,.96,.67),max(natureCalendar.w,(1.-natureCalendar.x)*.7));}`:`
   if(vNatureTraits.z<.5){
    float retained=clamp(natureCalendar.x*(1.+(vNatureTraits.y-.5)*.14),0.,1.)*vNatureTraits.w;
    if(vNatureCluster>retained)discard;
    float warm=natureCalendar.z*(.28+vNatureTraits.y*.72);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.5,.91,.42),warm);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.04,1.13,.84),natureCalendar.y);
   }`}`);
  // A restrained transmission cue for thin leaves under the existing daylight.
  if(!grounded)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*lifeDay*.025;\n#include <opaque_fragment>');
 };
 m.customProgramCacheKey=()=>`nature-art-v1-${grounded}-${far}-${!!texture}`;cloudReceiver(m);registerLifeMaterial(m,{foliage:true,stationary:far});return m;
}
