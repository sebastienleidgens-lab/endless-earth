// Artistic snow, never a local weather observation, forecast or measured depth.
export const SNOW_VERSION='surface-snow-v1';
export const SNOW_EXPOSURE_VERSION='top-exposure-v1';
export const SNOW_PROFILES=Object.freeze({eco:{flakes:240,range:22},balanced:{flakes:680,range:30},quality:{flakes:1100,range:36}});
const clamp=n=>Math.max(0,Math.min(1,Number.isFinite(n)?n:0));
export function snowTemperature(date,day,snow=0,latitude=46){
 const d=new Date(date),month=((Number.isFinite(+d)?d.getUTCMonth():0)+(latitude<0?6:0))%12;
 // A selected snow mode supplies a simulated cold air mass even outside the
 // normal season. The calendar itself is never changed to manufacture winter.
 const coldAir=clamp(snow*12);
 return (1-coldAir)*([2,3,6,10,14,17,19,19,15,10,6,3][month]+(day-.5)*5)+coldAir*-3;
}
export function snowStep(state,dt,{snow=0,rain=0,temperature=2,day=1}={}){
 const seconds=Math.max(0,Math.min(1,Number.isFinite(dt)?dt:0));
 const fall=clamp(snow),cold=clamp((2-temperature)/5);
 const deposited=fall*cold*seconds/210;
 const melt=(Math.max(0,temperature)*.000035+clamp(rain)*.0015+Math.max(0,day)*Math.max(0,temperature+1)*.000008)*seconds;
 state.cover=clamp((state.cover??0)+deposited-melt);
 state.temperature=temperature;state.falling=fall;
 state.phase=fall>.005?(state.cover<.01?'beginning':state.cover<.75?'accumulating':'covered'):state.cover>.0005?'melting':'bare';
 return state;
}
export function surfaceSnowMask(normalY,cover,exposure=1,variation=.5,retention=1){
 const slope=clamp((Math.max(0,normalY)-.18)/.64),support=slope*slope*(3-2*slope);
 return clamp(cover)*clamp(exposure)*support*clamp(retention)*(.65+.35*clamp(variation));
}
export function validateSnowExposure(m,bytes,bindings){
 if(m?.schema!==SNOW_EXPOSURE_VERSION||!Number.isInteger(m.size)||m.size<128||m.size>1024||m.size&(m.size-1)||bytes.byteLength!==m.size*m.size*2||m.rawBytes!==bytes.byteLength||!Array.isArray(m.origin)||m.origin.length!==2||!m.origin.every(Number.isFinite)||!Array.isArray(m.extent)||m.extent.length!==2||m.extent.some(v=>!Number.isFinite(v)||v<=0)||Object.entries(bindings).some(([k,v])=>!v||m.bindings?.[k]!==v)||m.scale!==64||m.offset!==256)throw Error('Invalid or stale snow exposure');
 return m;
}
export function exposureHeight(bytes,m,x,z){
 const u=(x-m.origin[0])/m.extent[0],v=(z-m.origin[1])/m.extent[1];if(u<0||u>=1||v<0||v>=1)return null;
 const i=(Math.floor(v*m.size)*m.size+Math.floor(u*m.size))*2,q=bytes[i]*256+bytes[i+1];return q?q/64-256:null;
}
