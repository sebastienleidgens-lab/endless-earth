import {hash} from './plan.mjs';
const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)},fract=x=>x-Math.floor(x);
export const windowIdentity=(buildingId,center)=>hash(String(buildingId)+':window:'+center.map(v=>v.toFixed(2)).join(':'))/4294967296;
export function windowSchedule(seed,hour,solarAltitude,time=0){
 if(seed>=.58)return 0;
 const late=hour<12?hour+24:hour,on=17+fract(seed*37.7)*3,off=22+fract(seed*91.3)*5;
 const evening=smooth(on,on+.7,late)*(1-smooth(off,off+.08,late));
 const morning=seed<.12?smooth(5.2,6.2,hour)*(1-smooth(7,8,hour))*.4:0;
 const phase=((time+seed*9307)%900+900)%900,pause=seed<.16?smooth(28,38,phase)*(1-smooth(74,86,phase)):0;
 return (1-pause)*Math.max(evening,morning)*(1-smooth(-.1,.12,solarAltitude))*(.16+fract(seed*17.3)*.65);
}
export const windowPrelude=`uniform float lifeHour;attribute float windowSeed;varying float vWindowSeed;`;
export const windowFragment=`uniform float lifeHour;varying float vWindowSeed;
float warmWindow(){float seed=vWindowSeed;if(seed>=.58)return 0.;float h=lifeHour<12.?lifeHour+24.:lifeHour,on=17.+fract(seed*37.7)*3.,off=22.+fract(seed*91.3)*5.;float evening=smoothstep(on,on+.7,h)*(1.-smoothstep(off,off+.08,h));float morning=seed<.12?smoothstep(5.2,6.2,lifeHour)*(1.-smoothstep(7.,8.,lifeHour))*.4:0.;float phase=mod(lifeTime+seed*9307.,900.);float pause=seed<.16?smoothstep(28.,38.,phase)*(1.-smoothstep(74.,86.,phase)):0.;return (1.-pause)*max(evening,morning)*(1.-smoothstep(-.1,.12,lifeSun.y))*(.16+fract(seed*17.3)*.65);}`;
