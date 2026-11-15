const clamp=x=>Math.max(0,Math.min(1,x));
/** Shared authored paddle pose and blade immersion relative to water. Neither
 * thrust nor a splash is produced merely because a clock tick occurred. */
export function paddlePose(phase,out={}){const v=Math.sin(phase),c=Math.cos(phase);out.x=v*.18;out.y=.68-Math.abs(v)*.18;out.z=.33+c*.16;out.rx=c*.18;out.ry=v*.25;out.rz=v*.62;out.side=v>0?-1:1;
 const x=out.side*1.12,cx=Math.cos(out.rx),sx=Math.sin(out.rx),cy=Math.cos(out.ry),sy=Math.sin(out.ry),cz=Math.cos(out.rz),sz=Math.sin(out.rz);
 out.tipX=out.x+x*cy*cz;out.tipY=out.y+x*(cx*sz+sx*sy*cz);out.tipZ=out.z+x*(sx*sz-cx*sy*cz);out.contact=clamp(-out.tipY/.08);return out;}
