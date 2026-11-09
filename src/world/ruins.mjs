// Illustrative surviving wall heights, not measured castle elevations.
// A spatially continuous profile avoids unrelated 17 m spikes every 5 m.
export function ruinHeight(x,z,castle=false){
 const wave=Math.sin(x*.055+z*.031)*.5+Math.sin(z*.073-x*.019)*.5;
 return castle?6.8+wave*2.6:3.4+wave*1.1;
}
