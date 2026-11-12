import {registerLifeMaterial} from './capabilities.mjs';
import {lightingReceiver} from '../lighting/state.mjs';
import {snowReceiver} from '../nature/snow-state.mjs';
import * as THREE from 'three';
// @ts-ignore Pure deterministic models also tested in Node.
import {windGLSL,windTemporal,windAtWorld} from './wind.mjs';
// @ts-ignore One cloud field for sky and shadows.
import {cloudGLSL,cloudMorph} from './clouds.mjs';
export const lifeUniforms={lifeHour:{value:12},lifeTime:{value:0},lifeCloudDrift:{value:new THREE.Vector2()},lifeLocalWind:{value:new THREE.Vector2()},lifeTemporal:{value:new THREE.Vector4()},lifeMeanWind:{value:.35},lifeVegetation:{value:1},lifeFine:{value:.45},lifeWater:{value:.8},lifeCloudCover:{value:.16},lifeShadow:{value:.10},lifeSun:{value:new THREE.Vector3(0,1,0)}};
Object.assign(lifeUniforms,{lifeRain:{value:0},lifeDay:{value:1},lifeHorizon:{value:new THREE.Color()},lifeZenith:{value:new THREE.Color()},lifeSunColor:{value:new THREE.Color()},lifeSunIntensity:{value:0},lifeCloudMorph:{value:new THREE.Vector3()}});
export const lifePrelude='uniform float lifeTime,lifeMeanWind,lifeVegetation,lifeFine,lifeWater,lifeCloudCover,lifeShadow,lifeRain,lifeDay,lifeSunIntensity; uniform vec3 lifeSun,lifeHorizon,lifeZenith,lifeSunColor;\n'+windGLSL+cloudGLSL;
// Compose with each owner's existing shader customization; no extra material or draw.
const receivers=new WeakSet(),temporal={},localWind={};
export function updateLifeTime(time,wind,x=0,z=0,out=localWind){
 const dt=Math.max(0,time-lifeUniforms.lifeTime.value);if(time<lifeUniforms.lifeTime.value)lifeUniforms.lifeCloudDrift.value.set(0,0);
 windAtWorld(x,z,time,wind,9,out);lifeUniforms.lifeLocalWind.value.set(out.x,out.z);
 // The upper layer keeps a small background drift; gusts and turns use the
 // same local carrier as precipitation, nearby foliage and its recorded bed.
 lifeUniforms.lifeCloudDrift.value.x+=dt*(.88+out.x*5);lifeUniforms.lifeCloudDrift.value.y+=dt*(-.475+out.z*5);
 cloudMorph(time,lifeUniforms.lifeCloudMorph.value);
 lifeUniforms.lifeTime.value=time;lifeUniforms.lifeMeanWind.value=wind;windTemporal(time,temporal);lifeUniforms.lifeTemporal.value.set(temporal.slow,temporal.gust,temporal.turn,temporal.water);return out;
}
updateLifeTime(0,.35);
export function cloudReceiver(material,role={}){
 registerLifeMaterial(material,role);
 if(receivers.has(material))return;receivers.add(material);
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();
 material.onBeforeCompile=function(s,r){previous.call(this,s,r);Object.assign(s.uniforms,lifeUniforms);
 s.uniforms.lifeShadowTime=lifeUniforms.lifeTime;s.uniforms.lifeShadowCover=lifeUniforms.lifeCloudCover;s.uniforms.lifeShadowAmount=lifeUniforms.lifeShadow;s.uniforms.lifeShadowSun=lifeUniforms.lifeSun;
 s.vertexShader='#if LIFE_SHADOWS == 1\nuniform float lifeShadowTime,lifeShadowCover,lifeShadowAmount;uniform vec3 lifeShadowSun;varying float lifeCloudShade;\n'+cloudGLSL+'#endif\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#if LIFE_SHADOWS == 1
 lifeCloudShade=-1.;
 if(lifeShadowAmount>0.&&lifeShadowSun.y>.08){
 vec4 lifeWorld=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 lifeWorld=instanceMatrix*lifeWorld;
 #endif
 vec3 lifeWorldPosition=(modelMatrix*lifeWorld).xyz;
 vec2 projection=lifeWorldPosition.xz-(230.-lifeWorldPosition.y)*lifeShadowSun.xz/max(.2,lifeShadowSun.y);
 lifeCloudShade=lifeCloudField(projection,lifeShadowTime);
 }
 #endif
 #include <project_vertex>`);
 s.fragmentShader=lifePrelude+'#if LIFE_SHADOWS == 1\nvarying float lifeCloudShade;\n#endif\n'+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <opaque_fragment>','#if LIFE_SHADOWS == 1\nif(lifeShadow>0.)outgoingLight*=1.-smoothstep(.84-lifeCloudCover*.53,1.-lifeCloudCover*.53,lifeCloudShade)*lifeShadow*clamp((lifeSun.y-.08)/.2,0.,1.);\n#endif\n#include <opaque_fragment>');
 };material.customProgramCacheKey=()=>key+'-earthlife-cloud-specialized-v4';lightingReceiver(material);snowReceiver(material);
}
