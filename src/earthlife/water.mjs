// This direction is a visual approximation in the local chart, not hydrology.
// Uniform declarations are installed by the composed cloudReceiver.
export const waterPrelude='';
export function waterColor(position){return `
 vec2 waterP=${position}.xz;
 vec2 current=vec2(.38,-.925); // unverified artistic current
 vec2 advect=waterP-current*lifeTime*.65;
 float distanceFade=1.-smoothstep(25.,150.,length(vViewPosition));
 float ribbon=sin(dot(advect,current)*1.1+sin(dot(advect,vec2(.925,.38))*.48)*1.4);
 vec2 windWave=waterP-lifeWind(waterP,lifeTime,lifeMeanWind)*lifeTime;
 float shimmer=sin(windWave.x*2.1+windWave.y*1.6+sin(lifeTime*.27));
 float slow=.5+.5*sin(waterP.x*.025+waterP.y*.018);
 float ripple=(ribbon*.55+shimmer*.25)*(.03+lifeMeanWind*.045)*lifeWater*distanceFade;
 float grazing=1.-abs(dot(normalize(vViewPosition),viewMatrix[1].xyz));
 grazing=grazing*grazing*grazing;
 diffuseColor.rgb=mix(vec3(.092,.168,.145)*(.94+ripple+slow*.045),vec3(.32,.43,.45),grazing*.38);
 `}
