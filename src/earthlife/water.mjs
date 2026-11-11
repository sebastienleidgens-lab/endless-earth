import {ART_DNA,glsl} from '../art/dna.mjs';
// Analytic sky reflection and oscillating surface normals, not scene reflections,
// measured flow, a depth estimate or a hydrological current direction.
export const waterPrelude='';
export function applyWaterLighting(shader){
 shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\nvec3 waterRadiance=vec3(0.);float waterMask=0.;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,waterRadiance,waterMask);\n#include <opaque_fragment>');
}
export function waterColor(position,shore='16.'){return `
 vec2 waterP=${position}.xz;
 #if LIFE_WATER_MODE <= 1
 vec3 waterV=inverseTransformDirection(normalize(vViewPosition),viewMatrix);
 float grazing=1.-abs(waterV.y),g2=grazing*grazing;
 float fresnel=.025+.66*g2*g2*grazing;
 float ripple=0.;
 #if LIFE_WATER_MODE == 1
 ripple=sin(waterP.x*1.7+waterP.y*.73+sin(waterP.y*.31)*1.8-lifeTime*.82)*(.005+lifeRain*.006)*lifeWater*(1.-smoothstep(35.,150.,length(vViewPosition)));
 #endif
 vec3 skyReflection=mix(lifeHorizon,lifeZenith,smoothstep(0.,.8,abs(waterV.y)+ripple));
 vec3 body=vec3(.054,.112,.096)*(.12+lifeDay*.84);
 waterRadiance=mix(body,skyReflection,clamp(fresnel+ripple,0.,1.));waterMask=1.;diffuseColor.rgb=body;
 #else
 float distanceFade=1.-smoothstep(35.,200.,length(vViewPosition));
 vec2 rippleSlope=vec2(0.);
 #if LIFE_WATER_MODE > 0
 float waveA=dot(waterP,vec2(1.7,.73))+sin(waterP.y*.31+sin(waterP.x*.19))*1.8-lifeTime*.82;
 float waveB=dot(waterP,vec2(-.64,2.12))+sin(waterP.x*.27-waterP.y*.21)*1.3+lifeTime*.56;
 float amplitude=(.008+lifeMeanWind*.020)*lifeWater*(.55+.45*pow(sin(waterP.x*.14+waterP.y*.07),2.));
 rippleSlope=(vec2(1.7,.73)*cos(waveA)+vec2(-.64,2.12)*cos(waveB)*.55)*amplitude;
 #if LIFE_WATER_MODE == 2
 float waveC=dot(waterP,vec2(6.1,-4.3))+sin(waterP.x*.13)*1.2+lifeTime*1.7;
 rippleSlope+=vec2(1.,-.7)*cos(waveC)*(.009+lifeRain*.027)*lifeWater;
 #endif
 rippleSlope*=distanceFade;
 #endif
 vec3 waterN=normalize(vec3(-rippleSlope.x,1.,-rippleSlope.y));
 vec3 waterV=inverseTransformDirection(normalize(vViewPosition),viewMatrix);
 float fresnel=.025+.66*pow(1.-max(0.,dot(waterN,waterV)),5.);
 vec3 reflected=reflect(-waterV,waterN);
 vec3 skyReflection=mix(lifeHorizon,lifeZenith,smoothstep(0.,.8,reflected.y));
 float shoreTint=1.-smoothstep(.5,3.,${shore});
 float variation=sin(waterP.x*.037+sin(waterP.y*.019))*.035;
 vec3 body=mix(vec3(.054,.112,.096),vec3(.12,.145,.102),shoreTint*.42)*(1.+variation);
 body*=.12+lifeDay*.84;
 float sunGlint=0.;
 #if LIFE_WATER_MODE > 0
 if(lifeSun.y>0.){
  float roughness=clamp(lifeMeanWind*.6+lifeRain*.5,0.,1.);
  sunGlint=pow(max(0.,dot(waterN,normalize(waterV+lifeSun))),mix(240.,65.,roughness));
 }
 #endif
 waterRadiance=mix(body,skyReflection,fresnel)+lifeSunColor*lifeSunIntensity*sunGlint*${glsl(ART_DNA.water.sunGlint)}*(1.-lifeRain*.45);
 waterMask=1.;diffuseColor.rgb=body;
 #endif
 `}
