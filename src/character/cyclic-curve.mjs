const cache=new WeakMap();
/** Periodic monotone cubic Hermite curves. Intermediate authored keys are
 * crossed with a shared tangent, rather than stopping every limb at every key. */
export function cyclicCurve(keys,phase,channel){
 let slopes=cache.get(keys);
 const count=keys.length-1;
 if(!slopes){
  slopes=Array.from({length:count},()=>[]);
  for(let i=0;i<count;i++)for(let c=1;c<keys[0].length;c++){
   const prev=(i+count-1)%count,next=(i+1)%count;
   const hp=i===0?1-keys[prev][0]:keys[i][0]-keys[prev][0];
   const hn=i===count-1?1-keys[i][0]:keys[next][0]-keys[i][0];
   const a=(keys[i][c]-keys[prev][c])/hp,b=(keys[next][c]-keys[i][c])/hn;
   slopes[i][c]=a*b<=0?0:((2*hn+hp)+(hn+2*hp))/((2*hn+hp)/a+(hn+2*hp)/b);
  }
  cache.set(keys,slopes);
 }
 const q=((phase%1)+1)%1;let i=0;while(i<count-1&&q>keys[i+1][0])i++;
 const a=keys[i],b=keys[i+1],h=b[0]-a[0],t=(q-a[0])/h,t2=t*t,t3=t2*t;
 return (2*t3-3*t2+1)*a[channel]+(t3-2*t2+t)*h*slopes[i][channel]+(-2*t3+3*t2)*b[channel]+(t3-t2)*h*slopes[(i+1)%count][channel];
}
export const softMinimum=(a,b,width=.012)=>(a+b-Math.hypot(a-b,width))*.5;
