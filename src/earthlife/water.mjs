import {ART_DNA,glsl} from '../art/dna.mjs';
// Analytic sky reflection and oscillating surface normals, not scene reflections,
// measured flow, a depth estimate or a hydrological current direction.
export const waterPrelude=`uniform sampler2D riverField;uniform vec4 riverBounds;uniform vec2 riverScale;uniform float riverReady;`;
export function applyWaterLighting(shader){
 shader.fragmentShader=shader.fragmentShader.replace('void main() {','void main() {\nvec3 waterRadiance=vec3(0.);float waterMask=0.;');
 shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','outgoingLight=mix(outgoingLight,waterRadiance,waterMask);\n#include <opaque_fragment>');
}
export function waterColor(position,shore='16.'){return `
 vec2 waterP=${position}.xz;
 vec4 flow=texture2D(riverField,(waterP-riverBounds.xy)/riverBounds.zw);
 float flowAngle=riverScale.x+(flow.r-.5)*6.2831853;
 vec2 downstream=vec2(cos(flowAngle),sin(flowAngle));
 float riverAlong=(flow.b*65280.+flow.a*255.)/65535.*riverScale.y;
 float turbulence=flow.g*riverReady;
 float carrier=mix(waterP.x*.3+waterP.y*.2,riverAlong,riverReady);
 float crossing=dot(waterP,vec2(-downstream.y,downstream.x));
 #if LIFE_WATER_MODE <= 1
 vec3 waterV=inverseTransformDirection(normalize(vViewPosition),viewMatrix);
 float grazing=1.-abs(waterV.y),g2=grazing*grazing;
 float fresnel=.025+.66*g2*g2*grazing;
 float ripple=0.;
 #if LIFE_WATER_MODE == 1
 ripple=sin(carrier*1.8+sin(crossing*.7)*.7-lifeTime*.9)*(.005+lifeRain*.006)*lifeWater*(1.-smoothstep(35.,150.,length(vViewPosition)));
 #endif
 vec3 skyReflection=mix(lifeHorizon,lifeZenith,smoothstep(0.,.8,abs(waterV.y)+ripple));
 vec3 body=vec3(.054,.112,.096)*(.12+lifeDay*.84);
 float moonGlint=0.;if(lifeMoonlight>.001&&lifeMoon.y>0.)moonGlint=pow(max(0.,dot(vec3(0.,1.,0.),normalize(waterV+lifeMoon))),180.);
 waterRadiance=mix(body,skyReflection,clamp(fresnel+ripple,0.,1.))+vec3(.30,.40,.58)*lifeMoonlight*moonGlint*.65;
 if(lifeIce>.001){float iceMask=lifeIce*(1.-smoothstep(.35,3.,${shore}))*(1.-turbulence);waterRadiance=mix(waterRadiance,vec3(.12,.19,.23)*(.15+lifeDay*.6),iceMask);}waterMask=1.;diffuseColor.rgb=body;
 #else
 float distanceFade=1.-smoothstep(35.,200.,length(vViewPosition));
 vec2 rippleSlope=vec2(0.);
 #if LIFE_WATER_MODE > 0
 float waveA=carrier*1.8+sin(crossing*.7)*.7-lifeTime*.9;
 float waveB=carrier*3.4+sin(crossing*1.3)*1.3-lifeTime*1.7;
 float amplitude=(1.-lifeIce*.75)*(.012+lifeMeanWind*.020+turbulence*.026)*lifeWater*(.55+.45*pow(sin(waterP.x*.14+waterP.y*.07),2.));
 rippleSlope=(downstream*1.8*cos(waveA)+vec2(-downstream.y,downstream.x)*cos(waveB)*.55)*amplitude;
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
 // Reflect the common moving cloud carrier; no second sky or render target.
 float reflectedCloud=lifeCloudField(waterP+reflected.xz*230./max(.12,reflected.y),lifeTime);
 float cloudAmount=smoothstep(.84-lifeCloudCover*.53,1.-lifeCloudCover*.53,reflectedCloud);
 skyReflection=mix(skyReflection,lifeHorizon*(.84+lifeDay*.12),cloudAmount*.48);
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
 if(lifeMoonlight>.001&&lifeMoon.y>0.){
 float moonRoughness=mix(250.,60.,clamp(lifeMeanWind*.5+lifeRain*.5,0.,1.));
 float moonGlint=pow(max(0.,dot(waterN,normalize(waterV+lifeMoon))),moonRoughness);
 waterRadiance+=vec3(.36,.46,.66)*lifeMoonlight*moonGlint*(.48+.52*sin(carrier*3.1-lifeTime*.7)*sin(carrier*3.1-lifeTime*.7));
 }
 if(lifeIce>.001){
 float iceGrain=.5+.5*sin(waterP.x*.61+sin(waterP.y*.43))*sin(waterP.y*.79-waterP.x*.21);
 float iceMask=smoothstep(.18,.72,lifeIce*2.6-iceGrain*.20)*(1.-smoothstep(.25,3.2,${shore}))*(1.-turbulence*.95);
 waterRadiance=mix(waterRadiance,vec3(.18,.26,.29)*(.13+lifeDay*.70)+skyReflection*.16,iceMask*.78);
 }
 if(lifeLightning>.001)waterRadiance+=vec3(.16,.20,.28)*lifeLightning*pow(max(0.,dot(waterN,normalize(waterV+lifeLightningDirection))),55.);
 float foam=turbulence*turbulence*smoothstep(.90,.995,sin(carrier*5.-lifeTime*1.3)*sin(crossing*3.7+sin(carrier*.5)))*.14*lifeDay;
 waterRadiance=mix(waterRadiance,vec3(.65,.70,.65),foam);
 waterMask=1.;diffuseColor.rgb=body;
 #endif
 `}
