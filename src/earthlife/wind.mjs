// Normalized simulated wind on a continuous local metric chart, not measured m/s.
// Coordinates are never rounded to cells. Origin permits another geographic chart.
export const WIND_DIRECTION=Object.freeze({x:.88,z:-.475});
const fade=t=>t*t*t*(t*(t*6-15)+10);
function noise(t,seed){const i=Math.floor(t),f=fade(t-i),a=Math.sin(i*127.1+seed*311.7)*43758.5453,b=Math.sin((i+1)*127.1+seed*311.7)*43758.5453;return (a-Math.floor(a))*(1-f)+(b-Math.floor(b))*f;}
export function windAtWorld(x,z,t,mean=.35,seed=9,out={}){
 const temporal=windTemporal(t,out,seed),slow=temporal.slow;
 const front=Math.sin(x*.0031+z*.0023-t*.11+seed);
 const gust=Math.pow(Math.max(0,front),12)*temporal.gust;
 const speed=Math.max(0,mean*(slow+gust*.65));
 const turn=temporal.turn+.035*Math.sin(x*.007-z*.005+t*.18);
 out.x=(WIND_DIRECTION.x-turn*WIND_DIRECTION.z)*speed;
 out.z=(WIND_DIRECTION.z+turn*WIND_DIRECTION.x)*speed;
 out.speed=speed;out.gust=gust;return out;
}
// Convert a world-horizontal displacement to the instance frame while retaining
// a geometric-mean size response. Rotated/scaled instances keep the same axis.
export function windToInstance(w,x,z){const det=x.x*z.z-x.z*z.x,a=Math.sign(det)/Math.sqrt(Math.max(.0001,Math.abs(det)));return {x:(w.x*z.z-w.z*z.x)*a,z:(w.z*x.x-w.x*x.z)*a};}
// Time-only terms, evaluated once per frame and shared by all shader owners.
export function windTemporal(t,out={},seed=9){out.slow=.12+.85*noise(t/73,seed)+.25*noise(t/3200,seed+1)+.09*noise(t/3.7,seed+2);out.gust=.2+.8*noise(t/91,seed+3);out.turn=.28*(noise(t/4100,seed+4)-.5)+.16*(noise(t/137,seed+5)-.5);out.water=Math.sin(t*.27);return out;}
// Equivalent carrier used by vegetation, water and particles on the GPU.
export const windGLSL=`
uniform vec4 lifeTemporal;
uniform vec2 lifeLocalWind;
vec2 lifeInstanceWind(vec2 w,vec2 x,vec2 z){
 float det=x.x*z.y-x.y*z.x;
 float area=sign(det)*inversesqrt(max(.0001,abs(det)));
 return vec2(w.x*z.y-w.y*z.x,w.y*x.x-w.x*x.y)*area;
}

vec2 lifeWind(vec2 p,float t,float mean){
 float slow=lifeTemporal.x;
 float front=max(0.,sin(p.x*.0031+p.y*.0023-t*.11+9.));float f2=front*front,f4=f2*f2;float gust=f4*f4*f4*lifeTemporal.y;
 float turn=lifeTemporal.z+.035*sin(p.x*.007-p.y*.005+t*.18);
 return vec2(.88+turn*.475,-.475+turn*.88)*max(0.,mean*(slow+gust*.65));
}
`;
