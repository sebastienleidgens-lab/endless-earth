const clamp=x=>Math.max(0,Math.min(1,x));
function tip(out){const x=out.side*1.12,cx=Math.cos(out.rx),sx=Math.sin(out.rx),cy=Math.cos(out.ry),sy=Math.sin(out.ry),cz=Math.cos(out.rz),sz=Math.sin(out.rz);out.tipX=out.x+x*cy*cz;out.tipY=out.y+x*(cx*sz+sx*sy*cz);out.tipZ=out.z+x*(sx*sz-cx*sy*cz);return out;}
/** Shared authored paddle pose and blade immersion relative to water. Neither
 * thrust nor a splash is produced merely because a clock tick occurred. */
export function paddlePose(phase,out={}){const v=Math.sin(phase),c=Math.cos(phase);out.phase=phase;out.x=out.authoredX=v*.18;out.y=.68-Math.abs(v)*.18;out.z=.33+c*.16;out.rx=c*.18;out.ry=v*.25;out.rz=out.authoredRz=v*.62;out.side=v>0?-1:1;tip(out);out.authoredTipY=out.tipY;out.authoredTipX=out.tipX;out.contact=clamp(-out.tipY/.08);return out;}
/** Articulate the existing rigid shaft around the hands toward the LOCAL
 * rendered water, not an assumed horizontal infinite plane. The authored
 * recovery/catch timing stays intact. A bounded wrist angle cannot reach an
 * arbitrary drop; actual immersion and all hull tests still gate propulsion. */
export function fitPaddleToWater(out,relativeWaterY){const v=clamp(Math.abs(out.authoredX)/.18),weight=v*v*v*(10+v*(-15+v*6)),x=out.side*1.12,a=Math.cos(out.rx),b=Math.sin(out.rx)*Math.sin(out.ry),r=Math.hypot(a,b),target=(out.authoredTipY+relativeWaterY*weight-out.y)/x,angle=Math.asin(Math.max(-1,Math.min(1,target/r)))-Math.atan2(b,a);out.rz=out.authoredRz+Math.max(-.4,Math.min(.4,angle-out.authoredRz));out.x=out.authoredX;tip(out);out.x+=out.authoredTipX-out.tipX;return tip(out);}
