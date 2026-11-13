import * as THREE from 'three';
// Shared appearance only. The weather/calendar owner stays naturalSky.
const blank=new THREE.DataTexture(new Uint8Array([0,0]),1,1,THREE.RGFormat);blank.needsUpdate=true;
const noise=new Uint8Array(64*64);for(let z=0;z<64;z++)for(let x=0;x<64;x++){const n=Math.sin(x*127.1+z*311.7)*43758.5453;noise[z*64+x]=Math.round((n-Math.floor(n))*255)}
const grain=new THREE.DataTexture(noise,64,64,THREE.RedFormat);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.minFilter=THREE.LinearMipmapLinearFilter;grain.magFilter=THREE.LinearFilter;grain.generateMipmaps=true;grain.needsUpdate=true;
export const snowUniforms={earthSnowCover:{value:0},earthSnowReady:{value:0},earthSnowTop:{value:blank},earthSnowField:{value:new THREE.Vector4(-1000,-1000,2000,2000)},earthSnowGrain:{value:grain},earthSnowDetail:{value:1}};
const receivers=new Set();let enabled=false;
export const snowExposureGLSL=`
uniform sampler2D earthSnowTop;
uniform vec4 earthSnowField;
float snowTopAt(vec2 p){
 vec2 uv=(p-earthSnowField.xy)/earthSnowField.zw;
 if(any(lessThan(uv,vec2(0.)))||any(greaterThanEqual(uv,vec2(1.))))return -10000.;
 vec2 rg=texture2D(earthSnowTop,uv).rg;float q=dot(rg*255.,vec2(256.,1.));
 return q>.5?q/64.-256.:-10000.;
}
`;
export function setSnowAppearance(active){if(enabled===active)return;enabled=active;for(const m of receivers){m.defines.EARTH_SNOW=Number(active&&!m.userData.snowExcluded);m.needsUpdate=true}}
export function resetSnowAppearance(){snowUniforms.earthSnowCover.value=0;snowUniforms.earthSnowReady.value=0;snowUniforms.earthSnowTop.value=blank;setSnowAppearance(false)}
export function snowReceiver(material){
 if(receivers.has(material))return;receivers.add(material);material.addEventListener('dispose',()=>receivers.delete(material));material.defines??={};material.defines.EARTH_SNOW=Number(enabled&&!material.userData.snowExcluded);
 const forest=!!material.userData.forestSnow;const previous=material.onBeforeCompile,key=material.customProgramCacheKey();material.onBeforeCompile=function(s,r){previous.call(this,s,r);Object.assign(s.uniforms,snowUniforms);
 s.vertexShader='#if EARTH_SNOW == 1\nvarying vec3 vSnowPosition,vSnowNormal;\n#endif\n'+s.vertexShader;
 s.vertexShader=s.vertexShader.replace('#include <project_vertex>',`#if EARTH_SNOW == 1
 vec4 snowWorld=vec4(transformed,1.);
 #ifdef USE_INSTANCING
 snowWorld=instanceMatrix*snowWorld;
 #endif
 vSnowPosition=(modelMatrix*snowWorld).xyz;
 vSnowNormal=inverseTransformDirection(transformedNormal,viewMatrix);
 #endif
 #include <project_vertex>`);
 s.fragmentShader=(forest?'varying vec2 vForestSnow;\n':'')+'#if EARTH_SNOW == 1\nvarying vec3 vSnowPosition,vSnowNormal;uniform float earthSnowCover,earthSnowReady,earthSnowDetail;uniform sampler2D earthSnowGrain;\n'+snowExposureGLSL+'#endif\n'+s.fragmentShader;
 // Keep normal maps, material ownership and existing lighting. This is a thin
 // artistic coating, not vertex displacement, collision depth or river ice.
 const water=material.userData.snowIntegratedWater?'earthRoadType>6.5':material.userData.snowGlass?'architectureKind>6.5':'false';
 s.fragmentShader=s.fragmentShader.replace('#include <normal_fragment_maps>',`#include <normal_fragment_maps>
 #if EARTH_SNOW == 1
 if(!(${water})&&earthSnowCover>.0005){
  vec3 snowNormal=normalize(vSnowNormal);
  #ifdef DOUBLE_SIDED
  snowNormal*=gl_FrontFacing?1.:-1.;
  #endif
  float up=max(0.,snowNormal.y);
  float slope=smoothstep(.18,.82,up);
  float top=snowTopAt(vSnowPosition.xz);
  float exposed=top < -9999.?0.:smoothstep(top-2.2,top-.7,vSnowPosition.y);
  float powderPattern=texture2D(earthSnowGrain,${forest?'vForestPosition.xz*.055+vForestTraits.x*.3':'vSnowPosition.xz*.014+vSnowPosition.y*.001'}).r;
  float fine=earthSnowDetail>.5?texture2D(earthSnowGrain,${forest?'vForestPosition.xz*1.4':'vSnowPosition.xz*.7'}).r:.5;
  float deposited=earthSnowCover*1.8${forest?'*vForestSnow.y':''}-(1.-slope)*.42-(1.-powderPattern)*.35;
  float coat=smoothstep(.025,.48,deposited)*slope*exposed*earthSnowReady${forest?'*vForestSnow.x':''};
  vec3 snowColor=mix(vec3(.78,.83,.87),vec3(.96,.97,.98),powderPattern*.45+fine*.25);
  diffuseColor.rgb=mix(diffuseColor.rgb,snowColor,coat);
 }
 #endif`);
 };material.customProgramCacheKey=()=>key+'-surface-snow-v1';
}
export function snowReceiverCount(){return receivers.size}
