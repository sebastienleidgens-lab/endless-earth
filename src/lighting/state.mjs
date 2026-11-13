import * as THREE from 'three';
// Appearance only. The solar/weather clock remains owned by Mission 11.
const white=new THREE.DataTexture(new Uint8Array([255,255,255,255]),1,1);white.needsUpdate=true;
export const lightingUniforms={m14AOAmount:{value:0},m14LeafRetention:{value:1},m14Shadow:{value:white},m14ShadowMatrix:{value:new THREE.Matrix4()},m14ShadowCenter:{value:new THREE.Vector3()},m14ShadowSize:{value:new THREE.Vector2(1,1)},m14ShadowRadius:{value:64},m14ShadowActive:{value:0},m14ShadowSun:{value:new THREE.Vector3(0,1,0)}};
Object.assign(lightingUniforms,{m18WalkerShadow:{value:white},m18WalkerMatrix:{value:new THREE.Matrix4()},m18WalkerSize:{value:new THREE.Vector2(1,1)},m18WalkerActive:{value:0}});
const receivers=new Set();let shadowMode=1;
export function lightingCapabilities(enabled){const mode=Number(enabled);if(mode===shadowMode)return;shadowMode=mode;for(const m of receivers){m.defines.M14_LOCAL_SHADOW=mode;m.needsUpdate=true}}
export function lightingReceiver(material){
 if(receivers.has(material))return;receivers.add(material);material.addEventListener('dispose',()=>receivers.delete(material));material.defines??={};material.defines.M14_LOCAL_SHADOW=shadowMode;material.defaultAttributeValues={...material.defaultAttributeValues,m14Occlusion:[1,1,1]};
 material.defines.M14_SOLAR_RECEIVER=Number(!material.userData.coarseSolarReceiver);
 material.defines.M19_WALKER_RECEIVER=Number(!material.userData.excludeWalkerShadow);
 const previous=material.onBeforeCompile,key=material.customProgramCacheKey();material.onBeforeCompile=function(s,r){previous.call(this,s,r);Object.assign(s.uniforms,lightingUniforms);
 s.vertexShader='attribute vec3 m14Occlusion;varying vec3 vM14Occlusion;\n#if M14_LOCAL_SHADOW == 1 && M14_SOLAR_RECEIVER == 1\nuniform mat4 m14ShadowMatrix,m18WalkerMatrix;uniform vec3 m14ShadowSun;varying vec4 vM14Shadow,vM18Walker;varying vec2 vM14WorldXZ;\n#endif\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`vM14Occlusion=m14Occlusion;
 #if M14_LOCAL_SHADOW == 1 && M14_SOLAR_RECEIVER == 1
 vec4 m14World=vec4(transformed,1.);vec3 m14Normal=inverseTransformDirection(transformedNormal,viewMatrix);
 #ifdef USE_INSTANCING
 m14World=instanceMatrix*m14World;
 #endif
 m14World=modelMatrix*m14World;vM14WorldXZ=m14World.xz;
 float m14Bias=.008+(1.-max(0.,dot(m14Normal,m14ShadowSun)))*.025;
 vM14Shadow=m14ShadowMatrix*vec4(m14World.xyz+m14Normal*m14Bias,1.);
 vM18Walker=m18WalkerMatrix*vec4(m14World.xyz+m14Normal*.012,1.);
 #endif
 #include <project_vertex>`);
 s.fragmentShader=`uniform float m14AOAmount,m14LeafRetention;varying vec3 vM14Occlusion;
 #if M14_LOCAL_SHADOW == 1 && M14_SOLAR_RECEIVER == 1
 uniform sampler2D m14Shadow,m18WalkerShadow;uniform vec2 m14ShadowSize,m18WalkerSize;uniform vec3 m14ShadowCenter;uniform float m14ShadowRadius,m14ShadowActive,m18WalkerActive;varying vec4 vM14Shadow,vM18Walker;varying vec2 vM14WorldXZ;
 float m18WalkerVisibility(){
 #if M19_WALKER_RECEIVER == 0
 return 1.;
 #else
 if(m18WalkerActive<.001)return 1.;vec3 q=vM18Walker.xyz/vM18Walker.w;
 if(any(lessThan(q,vec3(.002)))||any(greaterThan(q,vec3(.998))))return 1.;
 vec3 dx=dFdx(q),dy=dFdy(q);float determinant=dx.x*dy.y-dx.y*dy.x;
 vec2 slope=abs(determinant)>1e-10?vec2(dy.y*dx.z-dx.y*dy.z,dx.x*dy.z-dy.x*dx.z)/determinant:vec2(0.);
 vec2 pixel=q.xy/m18WalkerSize-.5,base=floor(pixel),fraction=fract(pixel);float visible=0.;
 for(int x=0;x<2;x++)for(int y=0;y<2;y++){
 vec2 corner=vec2(float(x),float(y)),uv=(base+corner+.5)*m18WalkerSize;
 float weight=(x==0?1.-fraction.x:fraction.x)*(y==0?1.-fraction.y:fraction.y);
 visible+=step(q.z+dot(slope,uv-q.xy)-.00008,texture2D(m18WalkerShadow,uv).r)*weight;
 }
 return mix(1.,visible,m18WalkerActive);
 #endif
 }
 float m14Visibility(){
 if(m14ShadowActive<.001)return 1.;vec3 q=vM14Shadow.xyz/vM14Shadow.w;
 vec3 dx=dFdx(q),dy=dFdy(q);float determinant=dx.x*dy.y-dx.y*dy.x;
 vec2 slope=abs(determinant)>1e-10?vec2(dy.y*dx.z-dx.y*dy.z,dx.x*dy.z-dy.x*dx.z)/determinant:vec2(0.);
 if(any(lessThan(q,vec3(.002)))||any(greaterThan(q,vec3(.998))))return 1.;
 float fade=1.-smoothstep(m14ShadowRadius*.78,m14ShadowRadius,length(vM14WorldXZ-m14ShadowCenter.xz));
 fade*=smoothstep(.002,.05,min(min(q.x,1.-q.x),min(q.y,1.-q.y)));if(fade<.001)return 1.;float visible=0.;vec2 pixel=q.xy/m14ShadowSize-.5,base=floor(pixel),fraction=fract(pixel);
 for(int x=0;x<2;x++)for(int y=0;y<2;y++){
 vec2 corner=vec2(float(x),float(y)),uv=(base+corner+.5)*m14ShadowSize;
 float planeDepth=q.z+dot(slope,uv-q.xy)-.000008;
 float weight=(x==0?1.-fraction.x:fraction.x)*(y==0?1.-fraction.y:fraction.y);
 visible+=step(planeDepth,texture2D(m14Shadow,uv).r)*weight;
 }
 return mix(1.,visible,fade*m14ShadowActive);
 }
 #endif
 `+s.fragmentShader;
 s.fragmentShader=s.fragmentShader.replace('#include <aomap_fragment>',`#include <aomap_fragment>
 float m14Ambient=vM14Occlusion.r*mix(1.,vM14Occlusion.g,m14LeafRetention)*vM14Occlusion.b;
 reflectedLight.indirectDiffuse*=mix(1.,max(.42,m14Ambient),m14AOAmount);
 float m14SunVisibility=1.;
 #if M14_LOCAL_SHADOW == 1 && M14_SOLAR_RECEIVER == 1
 if(max(max(reflectedLight.directDiffuse.r,reflectedLight.directDiffuse.g),reflectedLight.directDiffuse.b)>.0001)m14SunVisibility=min(m14Visibility(),m18WalkerVisibility());reflectedLight.directDiffuse*=m14SunVisibility;
 #endif`);
 s.fragmentShader=s.fragmentShader.replace('outgoingLight=mix(outgoingLight,waterRadiance,waterMask);','outgoingLight=mix(outgoingLight,waterRadiance*mix(1.,max(.6,m14Ambient),.4*m14AOAmount)*mix(.72,1.,m14SunVisibility),waterMask);');
 };material.customProgramCacheKey=()=>key+'-bounded-landscape-light-v19-'+material.defines.M19_WALKER_RECEIVER;
}

export function resetLighting(){lightingUniforms.m14AOAmount.value=0;lightingUniforms.m14ShadowActive.value=0;lightingUniforms.m14Shadow.value=white;lightingCapabilities(false)}
