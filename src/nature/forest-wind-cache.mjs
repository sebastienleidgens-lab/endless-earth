// Sample the exact half-float bank already uploaded by the M11-driven owner.
// One sample per individual replaces the identical sample at every coarse vertex.
export function cachedForestWind(bank,size,origin,extent,x,z,flex,basis,out){
 const u=Math.max(0,Math.min(1,(x-origin[0])/extent))*(size-1),v=Math.max(0,Math.min(1,(z-origin[1])/extent))*(size-1),a=Math.min(size-2,Math.floor(u)),b=Math.min(size-2,Math.floor(v)),fx=u-a,fz=v-b,t=Math.max(0,Math.min(1,.52+flex*.2));
 const sample=c=>{const i=(b*size+a)*4+c,j=i+size*4;return (bank[i]*(1-fx)+bank[i+4]*fx)*(1-fz)+(bank[j]*(1-fx)+bank[j+4]*fx)*fz};
 const wx=sample(0)*(1-t)+sample(2)*t,wz=sample(1)*(1-t)+sample(3)*t;
 out[0]=basis[0]*wx+basis[1]*wz;out[1]=basis[2]*wx+basis[3]*wz;return out;
}
