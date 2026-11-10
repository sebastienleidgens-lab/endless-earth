import * as THREE from 'three';
// @ts-ignore Pure deterministic models also tested in Node.
import {windGLSL} from './wind.mjs';
// @ts-ignore One cloud field for sky and shadows.
import {cloudGLSL} from './clouds.mjs';
export const lifeUniforms={lifeTime:{value:0},lifeMeanWind:{value:.35},lifeVegetation:{value:1},lifeFine:{value:.45},lifeWater:{value:.8},lifeCloudCover:{value:.16},lifeShadow:{value:.10},lifeSun:{value:new THREE.Vector3(0,1,0)}};
export const lifePrelude='uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine,lifeWater,lifeCloudCover,lifeShadow; uniform vec3 lifeSun;\n'+windGLSL+cloudGLSL;
// Compose with each owner's existing shader customization; no extra material or draw.
const receivers=new WeakSet();
export function cloudReceiver(material){
 if(receivers.has(material))return;receivers.add(material);
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(s,r){previous.call(this,s,r);Object.assign(s.uniforms,lifeUniforms);
 s.vertexShader='varying vec3 lifeWorldPosition;\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`vec4 lifeWorld=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 lifeWorld=instanceMatrix*lifeWorld;
 #endif
 lifeWorldPosition=(modelMatrix*lifeWorld).xyz;
 #include <project_vertex>`);
 s.fragmentShader=lifePrelude+'varying vec3 lifeWorldPosition;\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>',`if(lifeShadow>0.&&lifeSun.y>.08){
 vec2 projection=lifeWorldPosition.xz-(230.-lifeWorldPosition.y)*lifeSun.xz/max(.2,lifeSun.y);
 float shade=lifeCloud(projection,lifeTime,lifeCloudCover)*clamp((lifeSun.y-.08)/.2,0.,1.);
 outgoingLight*=1.-shade*lifeShadow;
 }\n#include <opaque_fragment>`);
 };material.customProgramCacheKey=()=>key+'-earthlife-cloud-v1';
}
