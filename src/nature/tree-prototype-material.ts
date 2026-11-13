import * as THREE from 'three';
// @ts-ignore Existing shared climate and receivers, no new wind simulation.
import {lifeUniforms,cloudReceiver} from '../earthlife/state.mjs';
// @ts-ignore Same continuous field as Mission 11.
import {windGLSL} from '../earthlife/wind.mjs';
// @ts-ignore Structural profile specialization and disposal tracking.
import {registerLifeMaterial} from '../earthlife/capabilities.mjs';

export const prototypeDeformation=`
attribute vec3 treeAttachment;
attribute float treeLeaf,treePhase,treeKeep;
uniform vec4 treeCalendar;
uniform vec3 treeAnchor;
uniform float treeHeight,treeFlex;
uniform vec2 treeYaw;
varying float vTreeLeaf,vTreePhase,vTreeKeep;
varying vec3 vTreeLocal;
vec3 treeMotion(vec3 p){
 #if LIFE_WIND_MODE > 0
 vec2 wind=lifeLocalWind;
 #if LIFE_WIND_MODE == 2
 wind=lifeWind(treeAnchor.xz,lifeTime,lifeMeanWind);
 #endif
 wind=vec2(treeYaw.x*wind.x-treeYaw.y*wind.y,treeYaw.y*wind.x+treeYaw.x*wind.y);
 float h=max(0.,p.y/treeHeight);
 float sway=.65+.24*sin(lifeTime*.57+treeAnchor.x*.17)+.11*sin(lifeTime*.31+treeAnchor.z*.13);
 p.xz+=wind*treeFlex*(h*h*.18+length(p.xz)*.018)*sway*lifeVegetation;
 #endif
 return p;
}
vec3 attachedTreePosition(vec3 p){
 vec3 q=treeMotion(p);
 #if LIFE_WIND_MODE == 2
 if(treeLeaf>.5){
  // Rotate the blade around its actual attachment; basal vertices stay welded.
  vec3 offset=p-treeAttachment;
  float a=sin(lifeTime*3.4+treePhase*6.283+treeAnchor.x*.1)*.15*lifeMeanWind*lifeFine*lifeVegetation;
  vec3 flutter=vec3(offset.x,offset.y*cos(a)-offset.z*sin(a),offset.y*sin(a)+offset.z*cos(a));
  q=treeMotion(treeAttachment+flutter);
 }
 #endif
 return q;
}
`;

export function prototypeMaterial(calendar:{value:THREE.Vector4},height:number,flex:number,anchor:THREE.Vector3,leaf=false,yaw=0){
 const m=new THREE.MeshLambertMaterial({vertexColors:true,side:leaf?THREE.DoubleSide:THREE.FrontSide});
 m.onBeforeCompile=s=>{
  Object.assign(s.uniforms,lifeUniforms,{treeCalendar:calendar,treeHeight:{value:height},treeFlex:{value:flex},treeAnchor:{value:anchor},treeYaw:{value:new THREE.Vector2(Math.cos(yaw),Math.sin(yaw))}});
  s.vertexShader='uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine;\n'+windGLSL+prototypeDeformation+s.vertexShader;
  s.vertexShader=s.vertexShader.replace('#include <begin_vertex>',`#include <begin_vertex>
   vTreeLeaf=treeLeaf;vTreePhase=treePhase;vTreeKeep=treeKeep;vTreeLocal=position;
   transformed=attachedTreePosition(position);`);
  s.fragmentShader='uniform vec4 treeCalendar;varying float vTreeLeaf,vTreePhase,vTreeKeep;varying vec3 vTreeLocal;\n'+s.fragmentShader;
  s.fragmentShader=s.fragmentShader.replace('#include <color_fragment>',`#include <color_fragment>
   if(vTreeLeaf>.5){
    float retained=clamp(treeCalendar.x*(.94+vTreePhase*.12),0.,1.);
    if(vTreeKeep>retained)discard;
    float warm=clamp(treeCalendar.z*(.65+vTreePhase*.55),0.,1.);
    diffuseColor.rgb=mix(diffuseColor.rgb,diffuseColor.rgb*vec3(1.65,.85,.32),warm);
    diffuseColor.rgb*=mix(vec3(1.),vec3(1.08,1.1,.88),treeCalendar.y);
   }else{
    float furrow=sin(vTreeLocal.y*2.+sin(vTreeLocal.x*47.+vTreeLocal.z*39.)*1.8);
    diffuseColor.rgb*=.91+.09*furrow;
   }`);
  if(leaf)s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','outgoingLight+=diffuseColor.rgb*lifeDay*.12;\n#include <opaque_fragment>');
 };
 m.customProgramCacheKey=()=>`tree17-attached-${leaf}`;
 cloudReceiver(m);registerLifeMaterial(m,{foliage:true});return m;
}
