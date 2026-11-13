import * as THREE from 'three';
// @ts-ignore Existing climate owner and material lifecycle.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Same continuous weather field, no second simulation.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Structural profile switches only.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';

// Shared exactly by colour and solar proxy shaders. Whole-position deformation
// preserves the branch-rooted sprays, including their bases.
export const forestGLSL=`
vec3 forestShape(vec3 p,vec4 traits,vec4 form,vec3 data){
 float gain=clamp(p.y/3.,0.,1.);
 p.y+=form.x*data.x*smoothstep(.8,data.x*.45,p.y)*(1.-smoothstep(data.x*.65,data.x,p.y));
 p.xz*=mix(form.y,1.,smoothstep(.36,4.,dot(p.xz,p.xz)));
 float h=clamp(p.y/max(1.,data.x),0.,1.),turn=form.z*h;
 p.xz=vec2(p.x-turn*p.z,p.z+turn*p.x);
 p.x+=(traits.y-.5)*.7*h*h*gain;
 p.z+=(traits.x-.5)*.6*h*(1.2-h)*gain;
 return p;
}
vec2 forestSway(vec3 p,vec3 data,vec4 basis,vec2 anchor){
 #if LIFE_WIND_MODE == 0
 return vec2(0.);
 #else
 vec2 wind=lifeLocalWind;
 #if LIFE_WIND_MODE == 2
 wind=lifeWind(anchor,lifeTime,lifeMeanWind);
 #endif
 wind=vec2(dot(basis.xy,wind),dot(basis.zw,wind));
 float phase=anchor.x*.17+anchor.y*.13;
 float sway=.65+.24*sin(lifeTime*.57+phase)+.11*sin(lifeTime*.31+phase*.73);
 float h=max(0.,p.y/max(1.,data.x));
 return wind*data.y*(h*h*.17+length(p.xz)*.012*clamp(p.y,0.,1.))*sway*lifeVegetation;
 #endif
}
`;
export function forestMaterial(calendar:{value:THREE.Vector4},atlas:THREE.Texture|null,far=false){
 const leaf=!!atlas,m=new THREE.MeshLambertMaterial({vertexColors:true,side:leaf?THREE.DoubleSide:THREE.FrontSide,map:atlas,alphaTest:leaf?.38:0});
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,{forestCalendar:calendar});
  s.vertexShader='attribute vec4 natureTraits,lifeBasis,forestForm;attribute vec2 lifeAnchor;attribute float natureCluster;attribute vec3 forestData;varying vec4 vForestTraits;varying float vForestCluster;varying vec3 vForestPosition;uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+forestGLSL+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vForestTraits=natureTraits;vForestCluster=natureCluster;vForestPosition=position;
   transformed=forestShape(position,natureTraits,forestForm,forestData);
   transformed.xz+=forestSway(transformed,forestData,lifeBasis,lifeAnchor)*forestForm.w;`);
  s.fragmentShader='uniform vec4 forestCalendar;varying vec4 vForestTraits;varying float vForestCluster;varying vec3 vForestPosition;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   ${leaf?`if(vForestTraits.z<.5){
    float retained=clamp(forestCalendar.x*(.94+vForestTraits.y*.12),0.,1.)*vForestTraits.w;
    if(vForestCluster>retained)discard;
    float warm=clamp(forestCalendar.z*(.55+vForestTraits.y*.65),0.,1.);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.6,.88,.36),warm);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.08,1.10,.87),forestCalendar.y);
   }`:`float grain=sin(vForestPosition.y*3.+sin(vForestPosition.x*43.+vForestPosition.z*39.)*1.8);diffuseColor.rgb*=.93+.07*grain;`}`);
  if(leaf)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*lifeDay*.12;\n#include <opaque_fragment>');
 };
 m.userData.coarseSolarReceiver=far;m.customProgramCacheKey=()=>`forest-17b-${leaf}-${far}`;cloudReceiver(m);registerLifeMaterial(m,{foliage:true,stationary:far});return m;
}
