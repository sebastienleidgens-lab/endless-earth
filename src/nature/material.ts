// @ts-ignore Shared artistic contract.
import {ART_DNA,glsl} from '../art/dna.mjs';
import * as THREE from 'three';
// @ts-ignore Shared Mission 11 climate and shader budgets.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Existing continuous wind, not a second simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Structural quality modes remain bounded.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';
// @ts-ignore Common crown deformation for colour and local solar casters.
import {canopyGLSL} from './canopy.mjs';
export function natureArtMaterial(season:{value:THREE.Vector4},texture:THREE.Texture|null,grounded=false,far=false,perforated=false){
 const m=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide,map:texture});
 (m as any).defaultAttributeValues={...(m as any).defaultAttributeValues,natureFringe:[0]};
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,{natureCalendar:season});
  const attrs=grounded?'attribute float natureBend,natureKind;varying float vNatureKind;':'attribute vec4 natureTraits;attribute float natureCluster,natureFringe;attribute vec4 lifeBasis;attribute vec2 lifeAnchor;varying vec4 vNatureTraits;varying float vNatureCluster,vNatureFringe;';
  s.vertexShader=attrs+'uniform vec4 natureCalendar;uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+(grounded?'':canopyGLSL)+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   ${grounded?`vNatureKind=natureKind;
   float growing=1.;if(natureKind<1.5||natureKind>5.5)growing=.25+.75*natureCalendar.x;
   transformed.y-=natureBend*(1.-growing);
   vec2 worldAnchor=(modelMatrix*vec4(position,1.)).xz;
   float bend=natureBend*growing*.75;`:`vNatureTraits=natureTraits;vNatureCluster=natureCluster;vNatureFringe=natureFringe;
   transformed=canopyShape(transformed,natureTraits);
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
   ${grounded?'transformed.xz+=wind*bend*sway*lifeVegetation;':`transformed.xz+=canopySway(position,lifeBasis,lifeAnchor,natureCluster,${far?'0.':'natureFringe'});`}
   #endif`);
  s.fragmentShader='uniform vec4 natureCalendar;'+(grounded?'varying float vNatureKind;':'varying vec4 vNatureTraits;varying float vNatureCluster,vNatureFringe;')+'\n'+s.fragmentShader;
  if(texture)s.fragmentShader=s.fragmentShader.replace('#include <map_fragment>',`if(vNatureTraits.z<.5){vec4 spray=texture2D(map,vMapUv);if(${perforated?'spray.a<(vNatureFringe>.5?.32:.12)':'vNatureFringe>.5&&spray.a<.32'})discard;diffuseColor.rgb*=mix(vec3(.94),spray.rgb,vNatureFringe>.5?1.:.8);}`);
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${grounded?`if(vNatureKind>1.5&&vNatureKind<2.5&&natureCalendar.z<.12)discard;
   if(vNatureKind>2.5&&vNatureKind<3.5&&natureCalendar.x+natureCalendar.y<.25)discard;
   if(vNatureKind<1.5||vNatureKind>5.5){diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.16,.96,.67),max(natureCalendar.w,(1.-natureCalendar.x)*.7));}`:`
   if(vNatureTraits.z<.5){
    float retained=clamp(natureCalendar.x*(1.+(vNatureTraits.y-.5)*.14),0.,1.)*vNatureTraits.w;
    if(vNatureCluster>retained)discard;
    float warm=natureCalendar.z*(.28+vNatureTraits.y*.72);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.5,.91,.42),warm);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.04,1.13,.84),natureCalendar.y);
   }`}`);
  // A restrained transmission cue for thin leaves under the existing daylight.
  if(!grounded)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`outgoingLight+=diffuseColor.rgb*lifeDay*${glsl(ART_DNA.lighting.leafTransmission)};\n#include <opaque_fragment>`);
 };
 // Far cells keep cloud illumination and keep casting solar shadows, but
 // bypass fine local-map reception outside their useful detail range.
 m.userData.coarseSolarReceiver=far;
 m.customProgramCacheKey=()=>`nature-art-v2-${grounded}-${far}-${!!texture}-${perforated}`;cloudReceiver(m);registerLifeMaterial(m,{foliage:true,stationary:far});return m;
}
