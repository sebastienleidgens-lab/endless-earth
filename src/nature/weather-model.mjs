/** M21 regional interpretation. No clock, network observation or forecast here.
 * Inputs come exclusively from naturalSky's M11 calendar and advected wind.
 * Fractions 0..1; temperature degC, humidity %, wind m/s (artistic conversion),
 * direction radians clockwise from north, visibility metres, cold degree-hours.
 */
export const clamp=x=>Math.max(0,Math.min(1,Number.isFinite(x)?x:0));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export const noise=x=>{const a=Math.sin(x*127.1+43.7)*43758.5453;return a-Math.floor(a)};
const blendNoise=d=>{const i=Math.floor(d/4),f=smooth(0,1,d/4-i);return noise(i)*(1-f)+noise(i+1)*f};
export function regionalTemperature(time,day=.5,snow=0,latitude=46){
 const d=new Date(time),month=(d.getUTCMonth()+(latitude<0?6:0))%12;
 const seasonal=[3,4,7,10,14,18,20,20,16,11,7,4][month];
 const synoptic=(blendNoise(+d/86400000)-.54)*19;
 const regular=seasonal+synoptic+(day-.5)*5;
 return regular*(1-clamp(snow*12))-3*clamp(snow*12);
}
export function coldHistory(time,latitude=46){
 // Fixed six-day reconstruction when choosing a date. Never manufactures cold
 // history from a manual weather command. River speeds/depths are unknown.
 let degreeHours=0;for(let h=144;h>0;h-=6){const t=regionalTemperature(time-h*3600000,.35,0,latitude);degreeHours=Math.max(0,degreeHours+(-t-.5)*6)}
 return degreeHours;
}
export function icePotential(cold,temperature,sun){return .46*smooth(140,330,cold)*(1-smooth(-1,5,temperature))*(1-sun*.35)}
export function weatherMetrics({time,day,state,wind,wetness=0,cold=0,ice=0,latitude=46}){
 const temperatureC=regionalTemperature(time,day,state.snow,latitude),humidityPct=100*clamp(.44+state.cloud*.28+state.rain*.23+(1-day)*.12-state.wind*.10);
 const stormRisk=clamp((state.electric??0)*smooth(.68,.97,state.cloud));
 return {temperatureC,humidityPct,cloudCover:state.cloud,cloudDensity:clamp(state.cloud*.7+state.rain*.3),rainIntensity:state.rain,snowIntensity:state.snow,windDirectionRad:(Math.atan2(wind.x,-wind.z)+Math.PI*2)%(Math.PI*2),meanWindMps:state.wind*15,gustWindMps:Math.max(state.wind,wind.speed)*15,fog:state.mist,visibilityM:Math.max(90,18000*(1-state.mist*.9)*(1-state.rain*.72)),stormRisk,electricalActivity:stormRisk,groundWetness:wetness,coldDegreeHours:cold,iceFraction:ice,sunshine:day*(1-state.cloud*.86)*(1-state.rain*.55),simulation:true};
}
export function stormEnvelope(age,seed=0){
 const entry=smooth(4,65,age),phase=Math.max(0,age-65),cycle=phase/(240+noise(seed)*150);
 const pulse=.65+.35*Math.sin(cycle*6.28318+1.2);
 return {rain:entry*(.65+.35*pulse),wind:entry*(.72+.28*Math.sin(cycle*6.28318+.5)**2),electric:entry*(.35+.65*Math.sin(cycle*6.28318-1.1)**2),phase:age<22?'approach':age<65?'intensifying':pulse>.78?'active':pulse<.43?'receding':'showers'};
}
export function naturalChoice(month,slot,previous='clear'){
 const cold=month<=2||month===12,autumn=month>=9||month<=3,summer=month>=5&&month<=9,r=noise(slot+month*31);
 const choices=previous==='storm'?['rain','cloudy','overcast']:previous==='rain'?['cloudy','clear','overcast','rain']:previous==='clear'?['clear','cloudy','cloudy','overcast']:['clear','cloudy','overcast','rain'];
 if(cold&&r<.055)return 'snow';if(autumn&&r>.91)return 'mist';if(summer&&previous!=='clear'&&r>.85)return 'storm';
 return choices[Math.floor(noise(slot*7+month)*choices.length)];
}
/** Single non-repeating envelope; min 12s between events, no strobe train. */
export function lightningEnvelope(age,duration=.65){return age<0||age>duration?0:Math.sin(Math.PI*age/duration)**2}
