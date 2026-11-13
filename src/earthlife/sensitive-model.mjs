const clamp=x=>Math.max(0,Math.min(1,x));
export const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t)};
export const noise=n=>{const x=Math.sin(n*127.1+311.7)*43758.5453;return x-Math.floor(x)};
/** Artistic humidity and valley mist; input date/weather/solar all belong to M11. */
export function sensitiveConditions({day,hour,month,rain,cloud,wind,altitude,bankDistance,dayKey,wetness=0}){
 const morning=smooth(3.5,5,hour)*(1-smooth(8,10.5,hour)),cool=month<=4||month>=9?1:.5;
 const humidity=clamp(wetness*.55+cloud*.28+morning*.42+cool*.12);
 const occasion=smooth(.38,.70,noise(dayKey+17));
 const calm=1-smooth(.18,.65,wind),river=1-smooth(20,160,bankDistance);
 const low=1-smooth(18,55,altitude);
 return {humidity,dew:morning*humidity*calm*(1-rain)*(1-.55*day),mist:morning*humidity*calm*occasion*river*low*.30};
}
export function insectEvent(time,seed,c){
 const epoch=Math.floor(time/210),r=noise(epoch+seed*37),start=epoch*210+35+noise(epoch*7+seed)*100,age=time-start;
 const wet=['riparian','water'].includes(c.habitat),meadow=['grass','meadow','garden','scrub'].includes(c.habitat);
 const eligible=(wet||meadow)&&c.month>=4&&c.month<=9&&c.day>.65&&c.rain<.08&&c.wind<.45;
 return {active:eligible&&r>.65&&age>=0&&age<22,age,kind:wet?'dragonfly':'butterfly',epoch,fade:Math.max(0,Math.min(1,age/3,(22-age)/4))};
}
