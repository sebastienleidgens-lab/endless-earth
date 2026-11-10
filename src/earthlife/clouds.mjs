export const CLOUD_HEIGHT=230;
export function cloudField(x,z,time,cover){const a=x-time*1.32,b=z+time*.7125;const field=.5+.24*Math.sin(a*.009+Math.sin(b*.007))+.16*Math.sin(b*.013-a*.004)+.10*Math.sin(a*.023+b*.016);const edge=.84-cover*.53;const v=Math.max(0,Math.min(1,(field-edge)/.16));return v*v*(3-2*v);}
export function cloudShadow(x,z,y,time,cover,sun){if(sun.y<=.08)return 0;return cloudField(x-(CLOUD_HEIGHT-y)*sun.x/Math.max(.2,sun.y),z-(CLOUD_HEIGHT-y)*sun.z/Math.max(.2,sun.y),time,cover)*Math.min(1,(sun.y-.08)/.2);}
// Shared verbatim by the visible cloud sheet and every shadow receiver.
export const cloudGLSL=`
float lifeCloud(vec2 p,float t,float cover){
 p-=vec2(1.32,-.7125)*t;
 float field=.5+.24*sin(p.x*.009+sin(p.y*.007))+.16*sin(p.y*.013-p.x*.004)+.10*sin(p.x*.023+p.y*.016);
 return smoothstep(.84-cover*.53,1.-cover*.53,field);
}
`;
